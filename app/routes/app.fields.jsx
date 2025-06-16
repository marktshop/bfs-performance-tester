import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { Page, Layout, Card, Button, TextField, Select } from "@shopify/polaris";
import { authenticate } from "../shopify.server"; // Assuming this path is correct

// Basic loader (required because useLoaderData is imported)
export async function loader({ request }) {
  await authenticate.admin(request);
  return json({});
}

export default function Fields() {
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const fieldTypeOptions = [
    { label: "Text", value: "text" },
    { label: "Number", value: "number" },
    { label: "Dropdown", value: "dropdown" },
    { label: "Checkbox", value: "checkbox" }
  ];

  const handleCreateField = () => {
    console.log("Creating field:", fieldName, fieldType);
  };

  return (
    <Page title="Custom Fields Manager">
      <Layout>
        <Layout.Section>
          <Card title="Create New Field">
            <div style={{ padding: "16px" }}>
              <TextField
                label="Field Name"
                value={fieldName}
                onChange={setFieldName}
                placeholder="Enter field name"
              />
              <br />
              <Select
                label="Field Type"
                options={fieldTypeOptions}
                value={fieldType}
                onChange={setFieldType}
              />
              <br />
              <Button onClick={handleCreateField} primary>Create Field</Button>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}