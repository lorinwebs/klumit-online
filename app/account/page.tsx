import { redirect } from 'next/navigation';
import AccountClient from './AccountClient';
import type { User } from '@/lib/supabase';
import { GraphQLClient } from 'graphql-request';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const GET_USER_ORDERS_QUERY = `
  query getUserOrders($query: String!) {
    orders(first: 50, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 5) {
            edges {
              node {
                id
                title
                quantity
                image {
                  url
                  altText
                }
                discountedTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface Order {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        quantity: number;
        image: { url: string; altText: string | null } | null;
        discountedTotalSet: { shopMoney: { amount: string; currencyCode: string } };
      };
    }>;
  };
}

async function getOrdersByCustomerId(shopifyCustomerId: string): Promise<Order[]> {
  const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!adminApiToken) {
    console.warn('⚠️ Shopify Admin API Token not found');
    return [];
  }

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) {
    console.warn('⚠️ Shopify Store Domain not found');
    return [];
  }

  const storeDomain = domain.includes('.myshopify.com') 
    ? domain 
    : `${domain}.myshopify.com`;

  const client = new GraphQLClient(
    `https://${storeDomain}/admin/api/2024-01/graphql.json`,
    {
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json',
      },
    }
  );

  try {
    // חיפוש לפי Shopify Customer ID
    const query = `customer_id:${shopifyCustomerId}`;
    
    const result = await client.request<{
      orders: {
        edges: Array<{
          node: Order;
        }>;
      };
    }>(GET_USER_ORDERS_QUERY, { query });

    const orders = result.orders.edges.map(edge => edge.node);
    return orders;
  } catch (error: any) {
    // אם יש שגיאות על PII, נחזיר רשימה ריקה
    if (error.response?.errors?.some((e: any) => e.extensions?.code === 'ACCESS_DENIED')) {
      return [];
    }
    
    return [];
  }
}

// Fallback: חיפוש לפי email (אם אין Shopify Customer ID)
async function getOrdersByEmail(email: string): Promise<Order[]> {
  const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!adminApiToken) {
    console.warn('⚠️ Shopify Admin API Token not found');
    return [];
  }

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) {
    console.warn('⚠️ Shopify Store Domain not found');
    return [];
  }

  const storeDomain = domain.includes('.myshopify.com') 
    ? domain 
    : `${domain}.myshopify.com`;

  const client = new GraphQLClient(
    `https://${storeDomain}/admin/api/2024-01/graphql.json`,
    {
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json',
      },
    }
  );

  try {
    const query = `email:${email}`;
    
    const result = await client.request<{
      orders: {
        edges: Array<{
          node: Order;
        }>;
      };
    }>(GET_USER_ORDERS_QUERY, { query });

    const orders = result.orders.edges.map(edge => edge.node);
    return orders;
  } catch (error: any) {
    // אם יש שגיאות על PII, נחזיר רשימה ריקה
    if (error.response?.errors?.some((e: any) => e.extensions?.code === 'ACCESS_DENIED')) {
      return [];
    }
    
    return [];
  }
}

export default async function AccountPage() {
  const supabase = await createClient();

  // 1. קבלת משתמש בשרת
  // חשוב: קריאה ל-getSession לפני getUser כדי לוודא שה-session פעיל ל-RLS
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  // 2. קבלת Shopify Customer ID בשרת - ישירות מה-DB
  let shopifyCustomerId: string | null = null;
  try {
    // נסה למצוא לפי user_id קודם
    let { data, error } = await supabase
      .from('user_shopify_sync')
      .select('shopify_customer_id, phone, user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // אם לא נמצא לפי user_id, נסה למצוא לפי phone עם service role key (עוקף RLS)
    if (!data && !error) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const adminSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
        
        // נסה למצוא לפי phone אם יש
        if (user.phone) {
          const phoneResult = await adminSupabase
            .from('user_shopify_sync')
            .select('shopify_customer_id, phone, user_id')
            .eq('phone', user.phone)
            .maybeSingle();
          
          if (phoneResult.data) {
            data = phoneResult.data;
            error = phoneResult.error;
          }
        }
        
        // אם עדיין לא נמצא, נסה למצוא לפי shopify_customer_id אם יש דרך אחרת
        // או פשוט נסה למצוא כל רשומה שיש לה shopify_customer_id
        if (!data && !error) {
          const allResult = await adminSupabase
            .from('user_shopify_sync')
            .select('shopify_customer_id, phone, user_id')
            .limit(10);
          
          if (allResult.data && allResult.data.length > 0) {
            // נסה למצוא התאמה לפי phone או email
            const matchingRecord = allResult.data.find(
              (record) => record.phone === user.phone || record.user_id === user.id
            );
            
            if (matchingRecord) {
              data = matchingRecord;
            }
          }
        }
      }
    }
    
    if (!error && data) {
      shopifyCustomerId = data.shopify_customer_id;
    }
  } catch (err: any) {
    // שגיאה בקבלת Shopify Customer ID - נמשיך בלי
  }

  // 3. הבאת הזמנות בשרת - רק לפי Shopify Customer ID
  let orders: Order[] = [];
  if (shopifyCustomerId) {
    orders = await getOrdersByCustomerId(shopifyCustomerId);
  }

  // 4. החזרת הקומפוננטה עם הנתונים מוכנים
  return (
    <AccountClient 
      initialUser={user as User}
      initialOrders={orders}
      initialShopifyCustomerId={shopifyCustomerId}
    />
  );
}
