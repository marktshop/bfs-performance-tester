import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  Page,
  Card,
  IndexTable,
  TextContainer,
  Spinner,
  Button,
} from '@shopify/polaris';
import { authenticate, shopifyAdminRequest } from '../shopify.server';
import { useState } from 'react';

export async function loader({ request }) {
  // Authenticate the session
  const { session } = await authenticate.admin(request);
  // Fetch products from Shopify Admin API
  const data = await shopifyAdminRequest(session, 'products.json?limit=50');
  // data.products is the array of products
  return json({ products: data.products });
}

export default function Products() {
  const { products } = useLoaderData();
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  return (
    <Page title="Product List">
      <Card>
        <TextContainer>
          {products.length === 0 ? (
            <Spinner accessibilityLabel="Loading products" size="large" />
          ) : (
            <IndexTable
              resourceName={{ singular: 'product', plural: 'products' }}
              itemCount={products.length}
              selectedItemsCount={selected.length}
              onSelectionChange={setSelected}
              headings={[
                { title: 'Title' },
                { title: 'Actions' },
              ]}
              selectable={false}
            >
              {products.map((product, index) => (
                <IndexTable.Row
                  id={product.id.toString()}
                  key={product.id}
                  position={index}
                >
                  <IndexTable.Cell>{product.title}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <Button onClick={() => {
                      const url = `/app/products/${product.id}`;
                      console.log("Product:", product);
                      console.log("Product ID:", product.id);
                      console.log("Navigating to:", url);
                      
                      try {
                        navigate(url);
                      } catch (error) {
                        console.error("Navigation error:", error);
                      }
                    }}>
                      Edit Fields
                    </Button>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
        </TextContainer>
      </Card>
    </Page>
  );
} 