import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { Page, Layout, Card, Button, TextField, Select, Banner, IndexTable } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Loader to fetch existing fields (for now, we'll use static data)
export async function loader({ request }) {
  // Authenticate the session
  const { session } = await authenticate.admin(request);
  
  // In a real app, this would fetch from your database
  const existingFields = [
    { id: 1, name: "Express Shipping", type: "checkbox", created: "2024-01-15" },
    { id: 2, name: "Product Weight", type: "number", created: "2024-01-10" },
    { id: 3, name: "Category", type: "dropdown", created: "2024-01-05" }
  ];
  
  return json({ fields: existingFields });
}

// Action to handle field creation
export async function action({ request }) {
  // Authenticate the session
  const { session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const fieldName = formData.get("fieldName");
  const fieldType = formData.get("fieldType");
  
  // Validate input
  if (!fieldName || fieldName.trim() === "") {
    return json({ error: "Field name is required" }, { status: 400 });
  }
  
  // In a real app, this would save to your database
  console.log("Creating field:", { name: fieldName, type: fieldType });
  
  return json({ 
    success: true, 
    message: `Field "${fieldName}" created successfully!`,
    field: { name: fieldName, type: fieldType, created: new Date().toISOString() }
  });
}

export default function Fields() {
  const { fields } = useLoaderData();
  const actionData = useActionData();
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [submitting, setSubmitting] = useState(false);
  
  const fieldTypeOptions = [
    { label: "Text", value: "text" },
    { label: "Number", value: "number" },
    { label: "Dropdown", value: "dropdown" },
    { label: "Checkbox", value: "checkbox" }
  ];

  // Reset form after successful submission
  useEffect(() => {
    if (actionData?.success) {
      setFieldName("");
      setFieldType("text");
      setSubmitting(false);
    }
  }, [actionData?.success]);

  return (
    <Page title="Custom Fields Manager">
      <Layout>
        <Layout.Section>
          <Card title="Create New Field">
            <div style={{ padding: "16px" }}>
              {actionData?.success && (
                <Banner status="success" title="Success!">
                  {actionData.message}
                </Banner>
              )}
              {actionData?.error && (
                <Banner status="critical" title="Error">
                  {actionData.error}
                </Banner>
              )}
              
              <Form method="post" onSubmit={() => setSubmitting(true)}>
                <TextField
                  label="Field Name"
                  name="fieldName"
                  value={fieldName}
                  onChange={setFieldName}
                  placeholder="Enter field name"
                  required
                />
                <br />
                <Select
                  label="Field Type"
                  name="fieldType"
                  options={fieldTypeOptions}
                  value={fieldType}
                  onChange={setFieldType}
                />
                <br />
                <Button submit primary loading={submitting}>
                  Create Field
                </Button>
              </Form>
            </div>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card title="Existing Fields">
            <IndexTable
              resourceName={{ singular: 'field', plural: 'fields' }}
              itemCount={fields.length}
              headings={[
                { title: 'Field Name' },
                { title: 'Type' },
                { title: 'Created' },
                { title: 'Actions' }
              ]}
              selectable={false}
            >
              {fields.map((field, index) => (
                <IndexTable.Row
                  id={field.id.toString()}
                  key={field.id}
                  position={index}
                >
                  <IndexTable.Cell>{field.name}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <span style={{ textTransform: 'capitalize' }}>{field.type}</span>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{field.created}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <Button size="slim" outline>Edit</Button>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}