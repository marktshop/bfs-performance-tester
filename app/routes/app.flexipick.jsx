import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import {
  Box,
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  Button,
  TextField,
  Select,
  Banner,
  Divider,
  InlineStack,
  Icon
} from "@shopify/polaris";
import { TitleBar, SaveBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState, useEffect } from "react";
import { CheckIcon, PlusIcon, EditIcon } from "@shopify/polaris-icons";

// Loader for authentication
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  return json({});
}

// Action to handle form submissions
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const action = formData.get("_action");
  
  if (action === "create_pick") {
    const pickName = formData.get("pickName");
    const pickType = formData.get("pickType");
    const optionsJson = formData.get("options");
    
    let options = [];
    try {
      options = optionsJson ? JSON.parse(optionsJson) : [];
    } catch (e) {
      options = [];
    }
    
    if (!pickName || pickName.trim() === "") {
      return json({ error: "Pick name is required" }, { status: 400 });
    }
    
    if (options.length < 2) {
      return json({ error: "At least 2 options are required" }, { status: 400 });
    }
    
    // In a real app, this would save to your database
    console.log("Creating FlexiPick:", { name: pickName, type: pickType, options });
    
    return json({ 
      success: true, 
      message: `FlexiPick "${pickName}" created successfully with ${options.length} options!`,
      pick: { name: pickName, type: pickType, options, created: new Date().toISOString() }
    });
  }
  
  if (action === "update_pick") {
    const pickId = formData.get("pickId");
    const pickName = formData.get("editPickName");
    const pickType = formData.get("editPickType");
    
    if (!pickName || pickName.trim() === "") {
      return json({ error: "Pick name is required" }, { status: 400 });
    }
    
    // In a real app, this would update in your database
    console.log("Updating FlexiPick:", { id: pickId, name: pickName, type: pickType });
    
    return json({ 
      success: true, 
      message: `FlexiPick "${pickName}" updated successfully!`,
      updatedPick: { id: parseInt(pickId), name: pickName, type: pickType }
    });
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function FlexiPickPage() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  
  const [pickName, setPickName] = useState("");
  const [pickType, setPickType] = useState("product");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState("");
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editPickName, setEditPickName] = useState("");
  const [editPickType, setEditPickType] = useState("product");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Sample FlexiPicks for demonstration - now using state
  const [existingPicks, setExistingPicks] = useState([
    { 
      id: 1, 
      name: "Featured Products", 
      type: "product", 
      options: ["Best Sellers", "New Arrivals", "On Sale", "Editor's Choice"],
      status: "Active", 
      created: "2024-01-15" 
    },
    { 
      id: 2, 
      name: "Holiday Collection", 
      type: "collection", 
      options: ["Christmas", "New Year", "Winter Sale"],
      status: "Active", 
      created: "2024-01-10" 
    },
    { 
      id: 3, 
      name: "VIP Customers", 
      type: "customer", 
      options: ["Platinum", "Gold", "Silver"],
      status: "Draft", 
      created: "2024-01-05" 
    }
  ]);

  const pickTypeOptions = [
    { label: "Product Pick", value: "product" },
    { label: "Collection Pick", value: "collection" },
    { label: "Customer Pick", value: "customer" },
    { label: "Order Pick", value: "order" }
  ];

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  // Options handlers
  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddOption();
    }
  };

  // Edit handlers
  const handleEdit = (pick) => {
    setEditingId(pick.id);
    setEditPickName(pick.name);
    setEditPickType(pick.type);
    setHasUnsavedChanges(false);
  };

  const handleEditNameChange = (value) => {
    setEditPickName(value);
    setHasUnsavedChanges(true);
  };

  const handleEditTypeChange = (value) => {
    setEditPickType(value);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // The form submission will handle the actual save
    setHasUnsavedChanges(false);
  };

  const handleDiscard = () => {
    setEditingId(null);
    setEditPickName("");
    setEditPickType("product");
    setHasUnsavedChanges(false);
  };

  // Handle successful submission - reset form and add new pick to list
  useEffect(() => {
    if (actionData?.success && actionData?.pick) {
      // Reset form for new pick creation
      setPickName("");
      setPickType("product");
      setOptions([]);
      setNewOption("");
      setIsSubmitting(false);
      
      // Add new pick to the existing picks list
      const newPick = {
        id: Date.now(), // Simple ID generation for demo
        name: actionData.pick.name,
        type: actionData.pick.type,
        options: actionData.pick.options || [],
        status: "Active",
        created: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        })
      };
      
      setExistingPicks(prevPicks => [newPick, ...prevPicks]);
    } else if (actionData?.success && actionData?.updatedPick) {
      // Handle successful pick update
      const updatedPick = actionData.updatedPick;
      setExistingPicks(prevPicks => 
        prevPicks.map(pick => 
          pick.id === updatedPick.id 
            ? { ...pick, name: updatedPick.name, type: updatedPick.type }
            : pick
        )
      );
      
      // Reset editing state
      setEditingId(null);
      setEditPickName("");
      setEditPickType("product");
      setHasUnsavedChanges(false);
    } else if (actionData?.error) {
      // Reset loading state on error
      setIsSubmitting(false);
    }
  }, [actionData]);

  return (
    <Page>
      <TitleBar title="FlexiPick Manager" />
      {hasUnsavedChanges && (
        <SaveBar onSave={handleSave} onDiscard={handleDiscard} />
      )}
      <Layout>
        <Layout.Section>
          {actionData?.success && (
            <Banner status="success" onDismiss={() => {}}>
              {actionData.message}
            </Banner>
          )}
          
          {actionData?.error && (
            <Banner status="critical" onDismiss={() => {}}>
              {actionData.error}
            </Banner>
          )}

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Create New FlexiPick
              </Text>
              
              <Text as="p" variant="bodyMd" color="subdued">
                FlexiPick allows you to create dynamic, flexible selections of products, collections, customers, or orders 
                that can be easily managed and updated.
              </Text>

              <Form method="post" onSubmit={handleSubmit}>
                <BlockStack gap="400">
                  <input type="hidden" name="_action" value="create_pick" />
                  
                  <TextField
                    label="Pick Name"
                    name="pickName"
                    value={pickName}
                    onChange={setPickName}
                    placeholder="Enter a name for your FlexiPick"
                    required
                    helpText="Choose a descriptive name for your FlexiPick"
                  />
                  
                  <Select
                    label="Pick Type"
                    name="pickType"
                    options={pickTypeOptions}
                    value={pickType}
                    onChange={setPickType}
                    helpText="Select what type of items this FlexiPick will contain"
                  />
                  
                  <BlockStack gap="200">
                    <Text as="label" variant="bodyMd" fontWeight="medium">
                      Options
                    </Text>
                    <Text as="p" variant="bodyXs" color="subdued">
                      Add two or more choices for this FlexiPick
                    </Text>
                    
                    <InlineStack gap="200">
                      <div style={{ flexGrow: 1 }}>
                        <TextField
                          placeholder="Enter an option"
                          value={newOption}
                          onChange={setNewOption}
                          onKeyPress={handleKeyPress}
                          autoComplete="off"
                        />
                      </div>
                      <Button 
                        onClick={handleAddOption}
                        disabled={!newOption.trim()}
                      >
                        Add Option
                      </Button>
                    </InlineStack>
                    
                    {options.length > 0 && (
                      <BlockStack gap="100">
                        {options.map((option, index) => (
                          <InlineStack key={index} align="space-between" blockAlign="center">
                            <Text as="span" variant="bodyMd">
                              • {option}
                            </Text>
                            <Button 
                              size="micro" 
                              onClick={() => handleRemoveOption(index)}
                              variant="plain"
                            >
                              Remove
                            </Button>
                          </InlineStack>
                        ))}
                        <Text as="p" variant="bodyXs" color="subdued">
                          {options.length} option{options.length !== 1 ? 's' : ''} added
                        </Text>
                      </BlockStack>
                    )}
                    
                    {/* Hidden input to send options data */}
                    <input 
                      type="hidden" 
                      name="options" 
                      value={JSON.stringify(options)} 
                    />
                  </BlockStack>
                  
                  <InlineStack align="end">
                    <Button 
                      submit 
                      variant="primary" 
                      loading={isSubmitting}
                      icon={PlusIcon}
                    >
                      Create FlexiPick
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Existing FlexiPicks
              </Text>
              
              <BlockStack gap="300">
                {existingPicks.map((pick) => (
                  <Box key={pick.id} padding="300" background="bg-surface-secondary" borderRadius="200">
                    {editingId === pick.id ? (
                      <Form method="post">
                        <input type="hidden" name="_action" value="update_pick" />
                        <input type="hidden" name="pickId" value={pick.id} />
                        <BlockStack gap="300">
                          <TextField
                            label="Pick Name"
                            name="editPickName"
                            value={editPickName}
                            onChange={handleEditNameChange}
                            placeholder="Enter a name for your FlexiPick"
                          />
                          <Select
                            label="Pick Type"
                            name="editPickType"
                            options={pickTypeOptions}
                            value={editPickType}
                            onChange={handleEditTypeChange}
                          />
                          <InlineStack gap="200">
                            <Button submit variant="primary" size="slim">
                              Save
                            </Button>
                            <Button onClick={handleDiscard} size="slim">
                              Cancel
                            </Button>
                          </InlineStack>
                        </BlockStack>
                      </Form>
                    ) : (
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingSm">
                            {pick.name}
                          </Text>
                          <Text as="p" variant="bodyXs" color="subdued">
                            Type: {pick.type} • Created: {pick.created}
                          </Text>
                          {pick.options && pick.options.length > 0 && (
                            <BlockStack gap="100">
                              <Text as="p" variant="bodyXs" color="subdued">
                                Options ({pick.options.length}):
                              </Text>
                              <Text as="p" variant="bodyXs">
                                {pick.options.join(" • ")}
                              </Text>
                            </BlockStack>
                          )}
                        </BlockStack>
                        
                        <InlineStack gap="200">
                          <Text 
                            as="span" 
                            variant="bodySm" 
                            color={pick.status === "Active" ? "success" : "subdued"}
                          >
                            {pick.status === "Active" && <Icon source={CheckIcon} />}
                            {pick.status}
                          </Text>
                          <Button 
                            size="slim" 
                            icon={EditIcon}
                            onClick={() => handleEdit(pick)}
                          >
                            Edit
                          </Button>
                        </InlineStack>
                      </InlineStack>
                    )}
                  </Box>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                FlexiPick Features
              </Text>
              
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">Dynamic Selection:</Text> Create flexible rules for automatically including items
                </Text>
                
                <Text as="p" variant="bodyMd">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">Manual Override:</Text> Add or remove specific items as needed
                </Text>
                
                <Text as="p" variant="bodyMd">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">Real-time Updates:</Text> Picks update automatically based on your criteria
                </Text>
                
                <Text as="p" variant="bodyMd">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">Multi-type Support:</Text> Works with products, collections, customers, and orders
                </Text>
              </BlockStack>
              
              <Divider />
              
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Quick Actions
                </Text>
                <Button fullWidth outline>Import from CSV</Button>
                <Button fullWidth outline>Export All Picks</Button>
                <Button fullWidth outline>View Analytics</Button>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 