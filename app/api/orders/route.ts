import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  try {
    if (!shopifyAdminClient) {
      return NextResponse.json(
        { error: 'Admin API לא מוגדר' },
        { status: 500 }
      );
    }

    // קבל את האימייל מה-query params (נשלח מה-client)
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      // נסה לקבל מה-session (fallback)
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ 
        cookies: () => cookieStore 
      });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('❌ Session error:', sessionError);
        return NextResponse.json(
          { error: 'לא מחובר', details: 'Auth session missing!' },
          { status: 401 }
        );
      }

      const userEmail = session.user.email || session.user.user_metadata?.email;
      if (!userEmail) {
        return NextResponse.json(
          { orders: [] },
          { status: 200 }
        );
      }
      
      // השתמש באימייל מה-session
      const query = `email:${userEmail}`;
      
      const result = await shopifyAdminClient.request<{
        orders: {
          edges: Array<{
            node: {
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
            };
          }>;
        };
      }>(GET_USER_ORDERS_QUERY, { query });

      const orders = result.orders.edges.map(edge => edge.node);
      return NextResponse.json({ orders });
    }

    // חפש הזמנות לפי email
    const query = `email:${email}`;
    
    const result = await shopifyAdminClient.request<{
      orders: {
        edges: Array<{
          node: {
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
          };
        }>;
      };
    }>(GET_USER_ORDERS_QUERY, { query });

    const orders = result.orders.edges.map(edge => edge.node);

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('❌ Error fetching user orders:', error);
    
    // אם יש שגיאות על PII, נחזיר רשימה ריקה
    if (error.response?.errors?.some((e: any) => e.extensions?.code === 'ACCESS_DENIED')) {
      console.warn('⚠️ Access denied for PII - returning empty orders list');
      return NextResponse.json({ orders: [] });
    }
    
    return NextResponse.json(
      { error: 'שגיאה בטעינת ההזמנות' },
      { status: 500 }
    );
  }
}

