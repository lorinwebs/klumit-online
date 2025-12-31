import { GraphQLClient } from 'graphql-request';
import { shopifyClient } from './shopify';

/**
 * Shopify Admin API - לעדכון הזמנות
 * 
 * נדרש Admin API token לעדכון הזמנות:
 * 1. ב-Shopify Admin: Settings > Apps and sales channels > Develop apps
 * 2. צור אפליקציה חדשה והפעל Admin API
 * 3. הפעל הרשאות: write_orders, read_orders
 * 4. העתק את ה-Admin API access token
 * 5. הוסף ל-.env.local:
 *    SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx
 */

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

const storeDomain = domain.includes('.myshopify.com') 
  ? domain 
  : `${domain}.myshopify.com`;

// Admin API client (רק אם יש token)
export const shopifyAdminClient = adminApiToken 
  ? new GraphQLClient(
      `https://${storeDomain}/admin/api/2024-01/graphql.json`,
      {
        headers: {
          'X-Shopify-Access-Token': adminApiToken,
          'Content-Type': 'application/json',
        },
      }
    )
  : null;

// Storefront API client (לקריאות לקוחות)
export const shopifyStorefrontClient = shopifyClient;

// Mutation ליצירת לקוח (Storefront API)
export const CREATE_CUSTOMER_MUTATION = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        firstName
        lastName
        email
        phone
        acceptsMarketing
      }
      customerUserErrors {
        field
        message
        code
      }
    }
  }
`;

// Query לחיפוש לקוח לפי טלפון (Storefront API)
// הערה: Storefront API לא תומך בחיפוש לקוחות - נשתמש ב-Admin API או נצטרך לבדוק אחרת
export const FIND_CUSTOMER_BY_PHONE_QUERY = `
  query getCustomers($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          firstName
          lastName
          email
          phone
        }
      }
    }
  }
`;

// Query לקבלת לקוח לפי ID (Storefront API)
export const GET_CUSTOMER_QUERY = `
  query getCustomer($id: ID!) {
    customer(id: $id) {
      id
      firstName
      lastName
      email
      phone
      createdAt
    }
  }
`;

/**
 * עדכון הזמנה ב-Shopify (Admin API)
 */
export interface UpdateOrderOptions {
  tags?: string[];
  note?: string;
  financialStatus?: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillmentStatus?: 'unfulfilled' | 'partial' | 'fulfilled' | 'restocked';
}

export async function updateShopifyOrder(
  orderReference: string,
  options: UpdateOrderOptions
): Promise<void> {
  if (!shopifyAdminClient) {
    throw new Error('SHOPIFY_ADMIN_API_TOKEN לא מוגדר - לא ניתן לעדכן הזמנות');
  }

  // חיפוש הזמנה לפי מספר הזמנה או ID
  // orderReference יכול להיות מספר הזמנה (#1234) או order ID
  const orderNumber = orderReference.replace('#', '');
  
  // חיפוש הזמנה
  const findOrderQuery = `
    query getOrder($query: String!) {
      orders(first: 1, query: $query) {
        edges {
          node {
            id
            name
            tags
            note
            financialStatus
            fulfillmentStatus
          }
        }
      }
    }
  `;

  const searchQuery = orderReference.startsWith('gid://') 
    ? `id:${orderReference}`
    : `name:${orderNumber}`;

  const orderResult = await shopifyAdminClient.request<{
    orders: { edges: Array<{ node: { id: string; name: string; tags: string[]; note: string | null } }> };
  }>(findOrderQuery, { query: searchQuery });

  const order = orderResult.orders.edges[0]?.node;
  
  if (!order) {
    throw new Error(`הזמנה לא נמצאה: ${orderReference}`);
  }

  // עדכון ההזמנה
  const updateOrderMutation = `
    mutation orderUpdate($input: OrderInput!) {
      orderUpdate(input: $input) {
        order {
          id
          name
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const updateInput: any = {
    id: order.id,
  };

  if (options.tags) {
    // שילוב תגיות קיימות עם חדשות
    const existingTags = order.tags || [];
    const newTags = [...new Set([...existingTags, ...options.tags])];
    updateInput.tags = newTags;
  }

  if (options.note !== undefined) {
    const existingNote = order.note || '';
    updateInput.note = existingNote 
      ? `${existingNote}\n\n${options.note}`
      : options.note;
  }

  if (options.financialStatus) {
    updateInput.financialStatus = options.financialStatus;
  }

  if (options.fulfillmentStatus) {
    updateInput.fulfillmentStatus = options.fulfillmentStatus;
  }

  const updateResult = await shopifyAdminClient.request<{
    orderUpdate: {
      order: { id: string; name: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(updateOrderMutation, { input: updateInput });

  if (updateResult.orderUpdate.userErrors.length > 0) {
    throw new Error(
      `שגיאה בעדכון הזמנה: ${updateResult.orderUpdate.userErrors.map(e => e.message).join(', ')}`
    );
  }

  if (!updateResult.orderUpdate.order) {
    throw new Error('הזמנה לא עודכנה');
  }
}

