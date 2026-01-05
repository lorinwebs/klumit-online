import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';
import { createServerClient } from '@supabase/ssr';
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
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore errors in Server Components
              }
            },
          },
        }
      );
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
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
    // אם יש שגיאות על PII, נחזיר רשימה ריקה
    if (error.response?.errors?.some((e: any) => e.extensions?.code === 'ACCESS_DENIED')) {
      return NextResponse.json({ orders: [] });
    }
    
    return NextResponse.json(
      { error: 'שגיאה בטעינת ההזמנות' },
      { status: 500 }
    );
  }
}

