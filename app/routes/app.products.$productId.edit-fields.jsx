import { useLoaderData, useActionData, Form } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { Page, Card, TextContainer, TextField, Button, Banner } from '@shopify/polaris';
import { authenticate, shopifyAdminRequest } from '../shopify.server';
import { useState } from 'react';

// Loader to fetch product metafields
export async function loader({ params, request }) {
  //console.log("loader");
  const { session } = await authenticate.admin(request);
  const productId = params.productId;
  // Fetch product metafields
  const data = await shopifyAdminRequest(
    session,
    `products/${productId}/metafields.json`
  );
  return json({ metafields: data.metafields, productId });
}

// Action to update metafields
export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const productId = params.productId;
  const formData = await request.formData();
  const metafields = JSON.parse(formData.get('metafields'));

  // Update each metafield
  const results = [];
  for (const metafield of metafields) {
    const res = await shopifyAdminRequest(
      session,
      `metafields/${metafield.id}.json`,
      {
        method: 'PUT',
        body: JSON.stringify({ metafield }),
      }
    );
    results.push(res);
  }
  return json({ success: true, results });
}

export default function EditProductFields() {
  const { metafields, productId } = useLoaderData();
  const actionData = useActionData();
  const [fields, setFields] = useState(metafields);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (id, value) => {
    setFields(fields.map(mf => mf.id === id ? { ...mf, value } : mf));
  };

  return (
    <Page title={`Edit Fields for Product ${productId}`}>
      <Card>
        <TextContainer>
          <h2>Custom Fields (Metafields)</h2>
          {actionData?.success && (
            <Banner status="success">Metafields updated successfully!</Banner>
          )}
          <Form method="post" onSubmit={() => setSubmitting(true)}>
            {fields.map((mf) => (
              <TextField
                key={mf.id}
                label={`${mf.namespace}.${mf.key}`}
                value={mf.value || ''}
                onChange={(value) => handleChange(mf.id, value)}
                autoComplete="off"
                name={`metafield_${mf.id}`}
              />
            ))}
            <input type="hidden" name="metafields" value={JSON.stringify(fields)} />
            <Button submit primary loading={submitting}>
              Save
            </Button>
          </Form>
        </TextContainer>
      </Card>
    </Page>
  );
} 