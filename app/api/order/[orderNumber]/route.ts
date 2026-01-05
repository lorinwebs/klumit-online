import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

const GET_ORDER_QUERY = `
  query getOrder($query: String!) {
    orders(first: 1, query: $query) {
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
          subtotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalShippingPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalTaxSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalDiscountsSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                image {
                  url
                  altText
                }
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
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
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
            phone
          }
          billingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
            phone
          }
        }
      }
    }
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    if (!shopifyAdminClient) {
      return NextResponse.json(
        { 
          error: 'Admin API לא מוגדר. נדרש SHOPIFY_ADMIN_API_TOKEN (מתחיל ב-shpat_) עם הרשאה read_orders',
          hint: 'Storefront API לא יכול לקרוא הזמנות - צריך Admin API token'
        },
        { status: 500 }
      );
    }
    
    const { orderNumber } = await params;
    
    // הסרת # אם קיים
    const cleanOrderNumber = orderNumber.replace('#', '').trim();
    
    // חיפוש הזמנה לפי מספר הזמנה
    // Shopify משתמש בפורמט: name:1001 או name:#1001
    const query = `name:${cleanOrderNumber}`;
    
    try {
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
            subtotalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
            totalShippingPriceSet: { shopMoney: { amount: string; currencyCode: string } };
            totalTaxSet: { shopMoney: { amount: string; currencyCode: string } };
            totalDiscountsSet: { shopMoney: { amount: string; currencyCode: string } };
            lineItems: {
              edges: Array<{
                  node: {
                    id: string;
                    title: string;
                    quantity: number;
                    image: { url: string; altText: string | null } | null;
                    originalUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } };
                    discountedTotalSet: { shopMoney: { amount: string; currencyCode: string } };
                  };
              }>;
            };
            shippingAddress: {
              firstName: string | null;
              lastName: string | null;
              address1: string | null;
              address2: string | null;
              city: string | null;
              province: string | null;
              zip: string | null;
              country: string | null;
              phone: string | null;
            } | null;
            billingAddress: {
              firstName: string | null;
              lastName: string | null;
              address1: string | null;
              address2: string | null;
              city: string | null;
              province: string | null;
              zip: string | null;
              country: string | null;
              phone: string | null;
            } | null;
          };
        }>;
      };
      }>(GET_ORDER_QUERY, { query });
      
      const order = result.orders.edges[0]?.node;

      // Shopify מחזיר שגיאות על PII ב-Basic plan, אבל גם data עם null values
      // נשתמש ב-data אם קיים, גם אם יש שגיאות חלקיות
      if (order) {
        // Shopify מחזיר data גם עם שגיאות - נשתמש בו
        return NextResponse.json({ order });
      }

      // אם אין order, ננסה עם #
      // נסה גם עם # לפני המספר
      const queryWithHash = `name:#${cleanOrderNumber}`;
      
      try {
        const resultWithHash = await shopifyAdminClient.request<{
          orders: {
            edges: Array<{
              node: {
                id: string;
                name: string;
                createdAt: string;
                displayFinancialStatus: string;
                displayFulfillmentStatus: string;
                totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
                subtotalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
                totalShippingPriceSet: { shopMoney: { amount: string; currencyCode: string } };
                totalTaxSet: { shopMoney: { amount: string; currencyCode: string } };
                totalDiscountsSet: { shopMoney: { amount: string; currencyCode: string } };
                lineItems: {
                  edges: Array<{
                  node: {
                    id: string;
                    title: string;
                    quantity: number;
                    image: { url: string; altText: string | null } | null;
                    originalUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } };
                    discountedTotalSet: { shopMoney: { amount: string; currencyCode: string } };
                  };
                  }>;
                };
                shippingAddress: {
                  city: string;
                  country: string;
                } | null;
                billingAddress: {
                  city: string;
                  country: string;
                } | null;
              };
            }>;
          };
        }>(GET_ORDER_QUERY, { query: queryWithHash });
        
        const orderWithHash = resultWithHash.orders.edges[0]?.node;
        if (orderWithHash) {
          return NextResponse.json({ order: orderWithHash });
        }
      } catch (hashError) {
        // ignore
      }
      
      return NextResponse.json(
        { 
          error: `הזמנה #${cleanOrderNumber} לא נמצאה. ודאי שמספר ההזמנה נכון ושההזמנה קיימת ב-Shopify.`,
          debug: {
            searchedFor: cleanOrderNumber,
            query: query,
            resultCount: result.orders.edges.length
          }
        },
        { status: 404 }
      );
    } catch (queryError: any) {
      // Shopify מחזיר שגיאות על PII, אבל גם data
      // נבדוק אם יש data למרות השגיאות
      if (queryError.response?.data?.orders?.edges?.[0]?.node) {
        const order = queryError.response.data.orders.edges[0].node;
        return NextResponse.json({ order });
      }
      
      // אם זו שגיאת GraphQL ללא data, נזרוק אותה הלאה
      throw queryError;
    }
  } catch (error: any) {
    // אם זו שגיאת 401/403, זה אומר שה-token לא תקין או אין הרשאות
    if (error.response?.status === 401 || error.response?.status === 403) {
      return NextResponse.json(
        { 
          error: 'אין הרשאה לגשת להזמנות. ודאי ש-SHOPIFY_ADMIN_API_TOKEN מוגדר עם הרשאה read_orders',
          details: 'Storefront API לא יכול לקרוא הזמנות - צריך Admin API token (מתחיל ב-shpat_)'
        },
        { status: 401 }
      );
    }
    
    // אם זו שגיאת 404, זה אומר שההזמנה לא נמצאה
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'הזמנה לא נמצאה' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'שגיאה בטעינת ההזמנה',
        details: error.message || 'Unknown error',
        hint: 'ודאי ש-SHOPIFY_ADMIN_API_TOKEN מוגדר ב-.env.local עם הרשאה read_orders'
      },
      { status: 500 }
    );
  }
}

