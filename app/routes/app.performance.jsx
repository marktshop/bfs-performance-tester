import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useFetcher } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  TextField,
  Badge,
  DataTable,
  Text,
  BlockStack,
  InlineStack,
  Spinner,
  Banner,
  Modal,
  TextContainer,
  ProgressBar,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { performanceTester } from "../utils/performance-tester.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const tests = await performanceTester.getPerformanceTestsByShop(shop);
  
  return json({
    tests,
    shop,
  });
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
  
  return json({ success: false, message: "Invalid action" }, { status: 400 });
};

export default function PerformancePage() {
  const { tests: initialTests, shop } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const isLoading = navigation.state === "submitting";
  
  const [appId, setAppId] = useState("");
  const [appName, setAppName] = useState("");
  const [testStoreUrl, setTestStoreUrl] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tests, setTests] = useState(initialTests);

  // Poll for test updates when there are running tests
  useEffect(() => {
    const runningTests = tests.filter(test => test.status === 'running');
    
    if (runningTests.length > 0) {
      const interval = setInterval(() => {
        fetcher.load('/api/performance/test');
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [tests, fetcher]);

  // Update tests when fetcher returns data
  useEffect(() => {
    if (fetcher.data && fetcher.data.tests) {
      setTests(fetcher.data.tests);
    }
  }, [fetcher.data]);

  // Reset form after successful submission
  useEffect(() => {
    if (actionData?.success) {
      setAppId("");
      setAppName("");
      setTestStoreUrl("");
      
      // Refresh the test list
      fetcher.load('/api/performance/test');
    }
  }, [actionData, fetcher]);

  const handleStartTest = useCallback(() => {
    if (!appId || !appName || !testStoreUrl) {
      return;
    }
    // Form submission is handled automatically by Remix
  }, [appId, appName, testStoreUrl]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <Badge status="info">Running</Badge>;
      case 'completed':
        return <Badge status="success">Completed</Badge>;
      case 'failed':
        return <Badge status="critical">Failed</Badge>;
      case 'cancelled':
        return <Badge status="warning">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getPassStatusBadge = (passStatus) => {
    switch (passStatus) {
      case 'pass':
        return <Badge status="success">Pass</Badge>;
      case 'fail':
        return <Badge status="critical">Fail</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  const getTestProgress = (test) => {
    if (test.status === 'completed') return 100;
    if (test.status === 'failed' || test.status === 'cancelled') return 0;
    if (test.status === 'running') {
      // Estimate progress based on test results
      const totalExpectedResults = 6; // 3 baseline + 3 post-install
      const currentResults = test.results?.length || 0;
      return Math.min((currentResults / totalExpectedResults) * 100, 90); // Cap at 90% until completion
    }
    return 0;
  };

  const tableRows = tests.map((test) => [
    test.appName || test.appId,
    formatDate(test.createdAt),
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {getStatusBadge(test.status)}
      {test.status === 'running' && (
        <div style={{ width: '100px' }}>
          <ProgressBar 
            progress={getTestProgress(test)} 
            size="small" 
          />
        </div>
      )}
    </div>,
    test.baselineScore ? test.baselineScore.toFixed(1) : '-',
    test.postInstallScore ? test.postInstallScore.toFixed(1) : '-',
    test.scoreDelta ? (test.scoreDelta > 0 ? '+' : '') + test.scoreDelta.toFixed(1) : '-',
    test.passStatus ? getPassStatusBadge(test.passStatus) : '-',
    <Button
      size="slim"
      onClick={() => {
        setSelectedTest(test);
        setShowModal(true);
      }}
      disabled={test.status === 'running'}
    >
      View Details
    </Button>,
  ]);

  return (
    <Page
      title="Storefront Performance Testing"
      subtitle="Test how your app affects storefront loading performance"
    >
      <BlockStack gap="500">
        {actionData?.success === false && (
          <Banner status="critical">
            <p>{actionData.message}</p>
          </Banner>
        )}
        
        {actionData?.success === true && (
          <Banner status="success">
            <p>{actionData.message}</p>
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Start New Performance Test</Text>
            
            <Text variant="bodyMd" color="subdued">
              This test will measure your app's impact on storefront performance using Google Lighthouse. 
              The test runs 3 measurements before and after app installation, then calculates the average score difference.
            </Text>
            
            <Form method="post">
              <input type="hidden" name="action" value="start_test" />
              
              <BlockStack gap="400">
                <TextField
                  label="App ID"
                  value={appId}
                  onChange={setAppId}
                  name="appId"
                  placeholder="Enter the app ID to test"
                  helpText="The Shopify app ID you want to test"
                />
                
                <TextField
                  label="App Name"
                  value={appName}
                  onChange={setAppName}
                  name="appName"
                  placeholder="Enter the app name"
                  helpText="Friendly name for the app being tested"
                />
                
                <TextField
                  label="Test Store URL"
                  value={testStoreUrl}
                  onChange={setTestStoreUrl}
                  name="testStoreUrl"
                  placeholder="https://test-store.myshopify.com"
                  helpText="The URL of the test store to use for performance testing"
                />
                
                <InlineStack align="end">
                  <Button
                    submit
                    primary
                    loading={isLoading}
                    disabled={!appId || !appName || !testStoreUrl}
                  >
                    {isLoading ? "Starting Test..." : "Start Performance Test"}
                  </Button>
                </InlineStack>
              </BlockStack>
            </Form>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd">Performance Test Results</Text>
              {tests.some(test => test.status === 'running') && (
                <InlineStack gap="200">
                  <Spinner size="small" />
                  <Text variant="bodyMd">Tests running...</Text>
                </InlineStack>
              )}
            </InlineStack>
            
            {tests.length === 0 ? (
              <Text>No performance tests have been run yet.</Text>
            ) : (
              <DataTable
                columnContentTypes={[
                  'text',
                  'text',
                  'text',
                  'numeric',
                  'numeric',
                  'numeric',
                  'text',
                  'text',
                ]}
                headings={[
                  'App Name',
                  'Test Date',
                  'Status',
                  'Baseline Score',
                  'Post-Install Score',
                  'Score Delta',
                  'Pass/Fail',
                  'Actions',
                ]}
                rows={tableRows}
              />
            )}
          </BlockStack>
        </Card>

        {selectedTest && (
          <Modal
            open={showModal}
            onClose={() => setShowModal(false)}
            title={`Performance Test Details - ${selectedTest.appName}`}
            primaryAction={{
              content: 'Close',
              onAction: () => setShowModal(false),
            }}
          >
            <Modal.Section>
              <BlockStack gap="400">
                <InlineStack gap="400">
                  <Text variant="headingMd">Test Summary</Text>
                  {selectedTest.passStatus && getPassStatusBadge(selectedTest.passStatus)}
                </InlineStack>
                
                <BlockStack gap="200">
                  <Text><strong>App:</strong> {selectedTest.appName} ({selectedTest.appId})</Text>
                  <Text><strong>Test Store:</strong> {selectedTest.testStoreUrl}</Text>
                  <Text><strong>Test Date:</strong> {formatDate(selectedTest.createdAt)}</Text>
                  <Text><strong>Status:</strong> {selectedTest.status}</Text>
                </BlockStack>

                {selectedTest.status === 'completed' && (
                  <BlockStack gap="200">
                    <Text variant="headingMd">Performance Scores</Text>
                    <Text><strong>Baseline Score:</strong> {selectedTest.baselineScore?.toFixed(1)} points</Text>
                    <Text><strong>Post-Install Score:</strong> {selectedTest.postInstallScore?.toFixed(1)} points</Text>
                    <Text><strong>Score Change:</strong> {selectedTest.scoreDelta > 0 ? '+' : ''}{selectedTest.scoreDelta?.toFixed(1)} points</Text>
                    <Text><strong>Result:</strong> {selectedTest.scoreDelta >= -10 ? 'PASS' : 'FAIL'} (threshold: -10 points)</Text>
                    
                    <Banner status={selectedTest.passStatus === 'pass' ? 'success' : 'critical'}>
                      <p>
                        <strong>{selectedTest.passStatus === 'pass' ? 'PASS' : 'FAIL'}</strong>
                        {selectedTest.passStatus === 'pass' 
                          ? ': Your app has minimal impact on storefront performance.' 
                          : ': Your app significantly impacts storefront performance and should be optimized.'}
                      </p>
                    </Banner>
                  </BlockStack>
                )}

                {selectedTest.results && selectedTest.results.length > 0 && (
                  <BlockStack gap="200">
                    <Text variant="headingMd">Individual Test Runs</Text>
                    {['baseline', 'post_install'].map((testType) => {
                      const typeResults = selectedTest.results.filter(r => r.testType === testType);
                      return (
                        <div key={testType}>
                          <Text><strong>{testType === 'baseline' ? 'Baseline Tests' : 'Post-Install Tests'}:</strong></Text>
                          {typeResults.map((result) => (
                            <Text key={result.id}>
                              Run {result.runNumber}: {result.lighthouseScore.toFixed(1)} points
                              {result.testDuration && ` (${(result.testDuration / 1000).toFixed(1)}s)`}
                            </Text>
                          ))}
                        </div>
                      );
                    })}
                  </BlockStack>
                )}
              </BlockStack>
            </Modal.Section>
          </Modal>
        )}
      </BlockStack>
    </Page>
  );
} 