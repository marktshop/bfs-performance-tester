import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { performanceTester } from "../utils/performance-tester.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const url = new URL(request.url);
  const testId = url.searchParams.get('testId');
  
  if (testId) {
    // Get specific test results
    const test = await performanceTester.getPerformanceTestResults(testId);
    return json({ test });
  }
  
  // Get all tests for the shop
  const tests = await performanceTester.getPerformanceTestsByShop(shop);
  return json({ tests });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "start_test") {
    const appId = formData.get("appId");
    const appName = formData.get("appName");
    const testStoreUrl = formData.get("testStoreUrl");
    
    try {
      // Create the test record first
      const performanceTest = await performanceTester.createPerformanceTest(
        shop,
        appId,
        appName,
        testStoreUrl
      );
      
      // Start the test in the background (don't await)
      performanceTester.runFullPerformanceTest(shop, appId, appName, testStoreUrl)
        .then(result => {
          console.log(`Performance test ${performanceTest.id} completed:`, result);
        })
        .catch(error => {
          console.error(`Performance test ${performanceTest.id} failed:`, error);
        });
      
      return json({
        success: true,
        message: "Performance test started successfully",
        testId: performanceTest.id,
      });
    } catch (error) {
      return json({
        success: false,
        message: "Failed to start performance test: " + error.message,
      }, { status: 500 });
    }
  }
  
  if (action === "cancel_test") {
    const testId = formData.get("testId");
    
    try {
      await performanceTester.updatePerformanceTest(testId, {
        status: 'cancelled',
      });
      
      return json({
        success: true,
        message: "Performance test cancelled successfully",
      });
    } catch (error) {
      return json({
        success: false,
        message: "Failed to cancel performance test: " + error.message,
      }, { status: 500 });
    }
  }
  
  return json({ success: false, message: "Invalid action" }, { status: 400 });
}; 