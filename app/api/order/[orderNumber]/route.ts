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
  { params }: { params: { orderNumber: string } }
) {
  try {
    if (!shopifyAdminClient) {
      console.error('❌ Shopify Admin API לא מוגדר');
      console.error('נסה להגדיר ב-.env.local:');
      console.error('  SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx');
      console.error('  (לא NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN - זה לא יעבוד)');
      return NextResponse.json(
        { 
          error: 'Admin API לא מוגדר. נדרש SHOPIFY_ADMIN_API_TOKEN (מתחיל ב-shpat_) עם הרשאה read_orders',
          hint: 'Storefront API לא יכול לקרוא הזמנות - צריך Admin API token'
        },
        { status: 500 }
      );
    }
    
    // בדיקה שהטוקן תקין
    const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
    if (token && !token.startsWith('shpat_')) {
      console.error('❌ Token לא נראה כמו Admin API token (חייב להתחיל ב-shpat_)');
      console.error('Token מתחיל ב:', token.substring(0, 5));
    } else if (token) {
      console.log('✅ Admin API token נמצא ומתחיל ב-shpat_');
    }

    const { orderNumber } = params;
    
    // הסרת # אם קיים
    const cleanOrderNumber = orderNumber.replace('#', '').trim();
    
    console.log('🔍 Searching for order:', cleanOrderNumber);
    console.log('🔍 Domain:', process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN);
    console.log('🔍 Token exists:', !!process.env.SHOPIFY_ADMIN_API_TOKEN);
    console.log('🔍 Token starts with shpat_:', process.env.SHOPIFY_ADMIN_API_TOKEN?.startsWith('shpat_'));
    
    // חיפוש הזמנה לפי מספר הזמנה
    // Shopify משתמש בפורמט: name:1001 או name:#1001
    const query = `name:${cleanOrderNumber}`;
    
    console.log('📝 Query:', query);
    
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
      
      console.log('✅ Query successful, found orders:', result.orders.edges.length);
      
      const order = result.orders.edges[0]?.node;

      // Shopify מחזיר שגיאות על PII ב-Basic plan, אבל גם data עם null values
      // נשתמש ב-data אם קיים, גם אם יש שגיאות חלקיות
      if (order) {
        console.log('✅ Order found:', order.name);
        // Shopify מחזיר data גם עם שגיאות - נשתמש בו
        return NextResponse.json({ order });
      }

      // אם אין order, ננסה עם #
      console.error('❌ Order not found:', cleanOrderNumber);
      console.error('Query result:', JSON.stringify(result, null, 2));
      
      // נסה גם עם # לפני המספר
      const queryWithHash = `name:#${cleanOrderNumber}`;
      console.log('🔄 Trying with hash:', queryWithHash);
      
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
          console.log('✅ Order found with hash:', orderWithHash.name);
          return NextResponse.json({ order: orderWithHash });
        }
      } catch (hashError) {
        console.error('Error with hash query:', hashError);
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
      console.error('❌ GraphQL Query Error:', queryError);
      console.error('Error message:', queryError.message);
      console.error('Error response:', queryError.response);
      
      // Shopify מחזיר שגיאות על PII, אבל גם data
      // נבדוק אם יש data למרות השגיאות
      if (queryError.response?.data?.orders?.edges?.[0]?.node) {
        const order = queryError.response.data.orders.edges[0].node;
        console.log('✅ Order found despite errors (PII restrictions):', order.name);
        return NextResponse.json({ order });
      }
      
      // אם זו שגיאת GraphQL ללא data, נזרוק אותה הלאה
      throw queryError;
    }
  } catch (error: any) {
    console.error('❌ Error fetching order:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    
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

