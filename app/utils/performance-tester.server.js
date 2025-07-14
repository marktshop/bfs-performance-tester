import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import db from '../db.server.js';

export class PerformanceTester {
  constructor() {
    this.lighthouseOptions = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    };
  }

  async runLighthouseTest(url, userAgent = null) {
    let browser;
    let result;
    const startTime = Date.now();

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      if (userAgent) {
        await page.setUserAgent(userAgent);
      }

      // Run Lighthouse
      result = await lighthouse(url, {
        port: (new URL(browser.wsEndpoint())).port,
        output: 'json',
        logLevel: 'info',
      }, this.lighthouseOptions);

      const endTime = Date.now();
      const testDuration = endTime - startTime;

      return {
        score: result.lhr.categories.performance.score * 100,
        report: JSON.stringify(result.lhr),
        testDuration,
        userAgent: userAgent || result.lhr.userAgent,
      };
    } catch (error) {
      console.error('Lighthouse test failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async runMultipleTests(url, testType, performanceTestId, runs = 3) {
    const results = [];
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

    for (let i = 1; i <= runs; i++) {
      console.log(`Running ${testType} test ${i}/${runs} for ${url}`);
      
      try {
        const testResult = await this.runLighthouseTest(url, userAgent);
        
        // Save individual test result to database
        const dbResult = await db.performanceTestResult.create({
          data: {
            performanceTestId,
            testType,
            runNumber: i,
            lighthouseScore: testResult.score,
            lighthouseReport: testResult.report,
            testUrl: url,
            userAgent: testResult.userAgent,
            testDuration: testResult.testDuration,
          },
        });

        results.push(testResult);
        console.log(`Test ${i} completed: ${testResult.score} points`);
      } catch (error) {
        console.error(`Test ${i} failed:`, error);
        throw error;
      }
    }

    // Calculate average score
    const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    console.log(`Average ${testType} score: ${averageScore}`);

    return {
      averageScore,
      results,
    };
  }

  async createPerformanceTest(shop, appId, appName, testStoreUrl) {
    return await db.performanceTest.create({
      data: {
        shop,
        appId,
        appName,
        testStoreUrl,
        status: 'running',
      },
    });
  }

  async updatePerformanceTest(testId, data) {
    return await db.performanceTest.update({
      where: { id: testId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async runFullPerformanceTest(shop, appId, appName, testStoreUrl) {
    const performanceTest = await this.createPerformanceTest(shop, appId, appName, testStoreUrl);
    
    try {
      console.log(`Starting performance test for ${appName} on ${testStoreUrl}`);

      // Step 1: Run baseline tests (before app installation)
      console.log('Running baseline tests...');
      const baselineResults = await this.runMultipleTests(testStoreUrl, 'baseline', performanceTest.id);
      
      await this.updatePerformanceTest(performanceTest.id, {
        baselineScore: baselineResults.averageScore,
      });

      // Step 2: Install app (this would need to be implemented based on your app installation logic)
      console.log('Installing app...');
      // TODO: Implement app installation logic
      await this.simulateAppInstallation(testStoreUrl, appId);

      // Step 3: Run post-installation tests
      console.log('Running post-installation tests...');
      const postInstallResults = await this.runMultipleTests(testStoreUrl, 'post_install', performanceTest.id);

      // Step 4: Calculate results
      const scoreDelta = postInstallResults.averageScore - baselineResults.averageScore;
      const passStatus = scoreDelta >= -10 ? 'pass' : 'fail';

      await this.updatePerformanceTest(performanceTest.id, {
        postInstallScore: postInstallResults.averageScore,
        scoreDelta,
        passStatus,
        status: 'completed',
      });

      console.log(`Performance test completed:
        Baseline: ${baselineResults.averageScore}
        Post-install: ${postInstallResults.averageScore}
        Delta: ${scoreDelta}
        Status: ${passStatus}
      `);

      return {
        id: performanceTest.id,
        baselineScore: baselineResults.averageScore,
        postInstallScore: postInstallResults.averageScore,
        scoreDelta,
        passStatus,
        status: 'completed',
      };

    } catch (error) {
      console.error('Performance test failed:', error);
      
      await this.updatePerformanceTest(performanceTest.id, {
        status: 'failed',
      });

      throw error;
    }
  }

  async simulateAppInstallation(testStoreUrl, appId) {
    // This is a placeholder for app installation logic
    // In a real implementation, you would use Shopify's APIs to install the app
    console.log(`Simulating installation of app ${appId} on ${testStoreUrl}`);
    
    // Wait for installation to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('App installation completed');
  }

  async getPerformanceTestResults(testId) {
    return await db.performanceTest.findUnique({
      where: { id: testId },
      include: {
        results: {
          orderBy: [
            { testType: 'asc' },
            { runNumber: 'asc' },
          ],
        },
      },
    });
  }

  async getPerformanceTestsByShop(shop) {
    return await db.performanceTest.findMany({
      where: { shop },
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          orderBy: [
            { testType: 'asc' },
            { runNumber: 'asc' },
          ],
        },
      },
    });
  }
}

export const performanceTester = new PerformanceTester(); 