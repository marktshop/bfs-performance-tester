# Storefront Loading Speed Performance Check

A comprehensive performance testing feature for Shopify apps that measures the impact of your app on storefront loading speeds using Google Lighthouse.

## Overview

This feature automatically tests your app's impact on storefront performance by:
1. Running baseline performance tests on a clean test store
2. Installing your app on the test store
3. Running post-installation performance tests
4. Comparing the results and providing a Pass/Fail status

## Features

- **Automated Testing**: Complete end-to-end performance testing workflow
- **Google Lighthouse Integration**: Uses industry-standard Lighthouse performance scoring
- **Statistical Accuracy**: Runs 3 tests for each measurement and calculates averages
- **Real-time Updates**: Live progress tracking and status updates
- **Detailed Results**: Comprehensive reporting with individual test run data
- **Pass/Fail Criteria**: Clear 10-point threshold for performance impact assessment

## How It Works

### Test Process
1. **Baseline Measurement**: 3 Lighthouse tests run on the test store before app installation
2. **App Installation**: Your app is automatically installed on the test store
3. **Post-Installation Measurement**: 3 Lighthouse tests run on the same store after installation
4. **Score Calculation**: Average scores are calculated and compared
5. **Result Evaluation**: Pass/Fail status based on 10-point threshold

### Scoring Criteria
- **Pass**: Performance score drops by 10 points or less
- **Fail**: Performance score drops by more than 10 points

## Getting Started

### Prerequisites
- Node.js 18.20+ or 20.10+
- Chrome/Chromium browser (automatically installed with Puppeteer)
- Shopify development store for testing

### Installation
The feature is automatically available once you install the required dependencies:

```bash
npm install
```

### Usage

1. **Navigate to Performance Testing**
   - Go to your app's admin interface
   - Click "Performance Testing" in the navigation menu

2. **Start a New Test**
   - Enter your App ID
   - Provide a friendly app name
   - Enter your test store URL (e.g., https://test-store.myshopify.com)
   - Click "Start Performance Test"

3. **Monitor Progress**
   - Tests run in the background and update automatically
   - Progress bars show estimated completion
   - Real-time status updates every 5 seconds

4. **View Results**
   - Click "View Details" on completed tests
   - See baseline and post-installation scores
   - Review individual test run data
   - Check Pass/Fail status with clear explanations

## Technical Details

### Database Schema
The feature uses two main database models:

#### PerformanceTest
- Stores main test information and results
- Tracks test status and scores
- Links to individual test runs

#### PerformanceTestResult
- Stores individual Lighthouse test results
- Maintains full Lighthouse reports
- Tracks test timing and metadata

### API Endpoints

#### `/app/performance`
- Main performance testing interface
- Handles test creation and result display

#### `/api/performance/test`
- Background API for test management
- Supports real-time status updates
- Handles test cancellation

### Testing Configuration
Lighthouse tests use standardized settings:
- **Form Factor**: Desktop
- **Throttling**: Optimized for consistent results
- **Screen Resolution**: 1350x940
- **User Agent**: Standardized Chrome user agent

## Customization

### Test Store Setup
For best results, your test store should:
- Use the default Shopify theme
- Have minimal products and content
- Be free of other third-party apps
- Have a clean, representative homepage

### Performance Thresholds
The 10-point threshold can be customized in the performance tester:

```javascript
// In app/utils/performance-tester.server.js
const passStatus = scoreDelta >= -10 ? 'pass' : 'fail'; // Adjust threshold here
```

### Test Configuration
Lighthouse settings can be modified in the PerformanceTester class:

```javascript
// In app/utils/performance-tester.server.js
this.lighthouseOptions = {
  // Customize Lighthouse configuration
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop', // or 'mobile'
    throttling: {
      // Adjust throttling settings
    },
  },
};
```

## Troubleshooting

### Common Issues

#### Puppeteer/Chromium Issues
```bash
# Install Chromium manually if needed
npm install -g puppeteer

# Or on macOS
brew install chromium
```

#### Test Failures
- Ensure test store URL is accessible
- Check network connectivity
- Verify Shopify store is properly configured
- Review console logs for detailed error messages

#### Performance Issues
- Tests may take 2-5 minutes to complete
- Running multiple tests simultaneously may affect results
- Ensure adequate system resources

### Test Verification
Run the included test script to verify functionality:

```bash
node scripts/test-performance.js
```

## Best Practices

### Test Store Management
1. Use dedicated test stores for performance testing
2. Keep test stores clean and minimal
3. Use consistent test store configurations
4. Regularly update test store themes

### Performance Optimization
1. Monitor test results regularly
2. Investigate failing tests immediately
3. Optimize app code based on performance insights
4. Test performance impact of new features

### Result Interpretation
1. Focus on consistent patterns, not single test anomalies
2. Compare results across different time periods
3. Consider external factors (network, server load)
4. Use results to guide optimization efforts

## Integration with Shopify Partner Dashboard

The performance testing feature is designed to integrate with your Shopify Partner Dashboard workflow:

1. **Development Testing**: Test during development to catch performance issues early
2. **Pre-submission Testing**: Verify performance before app store submission
3. **Ongoing Monitoring**: Regular testing to ensure continued performance
4. **Performance Reporting**: Clear Pass/Fail status for stakeholders

## Support

For issues related to the performance testing feature:
1. Check the troubleshooting section above
2. Review console logs for detailed error messages
3. Verify test store configuration and accessibility
4. Ensure all dependencies are properly installed

## Future Enhancements

Potential improvements for future versions:
- Mobile performance testing
- Multiple test store support
- Performance trend analysis
- Automated testing schedules
- Integration with CI/CD pipelines
- Performance regression detection 