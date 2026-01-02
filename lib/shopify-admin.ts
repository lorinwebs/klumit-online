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

// פונקציה לקבלת Admin API token (ב-runtime)
function getAdminApiToken(): string | undefined {
  // ב-Next.js, משתני סביבה נטענים רק ב-runtime של השרת
  // לכן נשתמש בפונקציה במקום משתנה 
  
  // בדיקה אם זה רץ ב-server-side
  if (typeof window !== 'undefined') {
    return undefined;
  }
  
  // בדיקה אם process.env קיים
  if (!process || !process.env) {
    return undefined;
  }
  
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  
  return token;
}

// בדיקה אם משתמשים ב-Storefront token במקום Admin token
function validateAdminToken(token: string | undefined): void {
  // Token validation - will fail gracefully if invalid
}

// בדיקה ראשונית (רק ב-server-side runtime)
// הערה: זה רץ ב-module load time, אז process.env יכול להיות ריק
// הבדיקה האמיתית תתבצע ב-runtime כשהפונקציה נקראת

const storeDomain = domain.includes('.myshopify.com') 
  ? domain 
  : `${domain}.myshopify.com`;

// פונקציה ליצירת Admin API client (ב-runtime, רק server-side)
function createAdminClient(): GraphQLClient | null {
  // חשוב: Admin API token לא אמור להיות זמין ב-client-side!
  if (typeof window !== 'undefined') {
    // זה לא אמור לקרות - Admin API צריך להיות רק ב-server-side

    return null;
  }
  
  const adminApiToken = getAdminApiToken();
  
  // בדיקה ראשונית (רק ב-server-side runtime)
  if (adminApiToken) {
    validateAdminToken(adminApiToken);
  }
  
  if (!adminApiToken) {
    return null;
  }
  
  return new GraphQLClient(
    `https://${storeDomain}/admin/api/2024-01/graphql.json`,
    {
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json',
      },
    }
  );
}

// Admin API client (lazy initialization - נוצר ב-runtime)
// חשוב: זה צריך להיות null ב-client-side (רק server-side)
// ב-Next.js, זה רץ גם ב-client-side ב-build time, אז נבדוק ב-runtime
export const shopifyAdminClient = typeof window === 'undefined' 
  ? createAdminClient() 
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

/**
 * עדכון כתובת לקוח ב-Shopify (Admin API)
 */
export interface UpdateCustomerAddressOptions {
  address1: string;
  city: string;
  zip: string;
  country?: string;
  province?: string;
}

export async function updateCustomerAddress(
  customerId: string,
  addressOptions: UpdateCustomerAddressOptions
): Promise<void> {
  if (!shopifyAdminClient) {

    return;
  }

  // חיפוש הלקוח
  const findCustomerQuery = `
    query getCustomer($id: ID!) {
      customer(id: $id) {
        id
        defaultAddress {
          id
        }
        addresses(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    }
  `;

  try {
    const customerResult = await shopifyAdminClient.request<{
      customer: {
        id: string;
        defaultAddress: { id: string } | null;
        addresses: { edges: Array<{ node: { id: string } }> };
      } | null;
    }>(findCustomerQuery, { id: customerId });

    if (!customerResult.customer) {

      return;
    }

    const addressId = customerResult.customer.defaultAddress?.id || 
                      customerResult.customer.addresses.edges[0]?.node.id;

    if (addressId) {
      // עדכן כתובת קיימת
      const updateAddressMutation = `
        mutation customerAddressUpdate($address: MailingAddressInput!, $id: ID!) {
          customerAddressUpdate(address: $address, id: $id) {
            customerAddress {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const updateResult = await shopifyAdminClient.request<{
        customerAddressUpdate: {
          customerAddress: { id: string } | null;
          userErrors: Array<{ field: string[]; message: string }>;
        };
      }>(updateAddressMutation, {
        id: addressId,
        address: {
          address1: addressOptions.address1,
          city: addressOptions.city,
          zip: addressOptions.zip,
          country: addressOptions.country || 'IL',
          province: addressOptions.province || '',
        },
      });

      if (updateResult.customerAddressUpdate.userErrors.length > 0) {

      }
    } else {
      // צור כתובת חדשה
      const createAddressMutation = `
        mutation customerAddressCreate($address: MailingAddressInput!, $customerId: ID!) {
          customerAddressCreate(address: $address, customerId: $customerId) {
            customerAddress {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const createResult = await shopifyAdminClient.request<{
        customerAddressCreate: {
          customerAddress: { id: string } | null;
          userErrors: Array<{ field: string[]; message: string }>;
        };
      }>(createAddressMutation, {
        customerId: customerId,
        address: {
          address1: addressOptions.address1,
          city: addressOptions.city,
          zip: addressOptions.zip,
          country: addressOptions.country || 'IL',
          province: addressOptions.province || '',
        },
      });

      if (createResult.customerAddressCreate.userErrors.length > 0) {

      }
    }
  } catch (error: any) {

  }
}

