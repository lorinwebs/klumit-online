import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

const SAVE_CART_ID_MUTATION = `
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_CUSTOMER_QUERY = `
  query getCustomer($id: ID!) {
    customer(id: $id) {
      id
      metafields(first: 250) {
        edges {
          node {
            key
            value
            namespace
          }
        }
      }
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    if (!shopifyAdminClient) {
      return NextResponse.json(
        { error: 'Admin API לא מוגדר' },
        { status: 500 }
      );
    }

    let { customerId, cartId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId נדרש' },
        { status: 400 }
      );
    }

    // אם זה GID, נחלץ רק את ה-ID (החלק האחרון אחרי ה-/)
    const originalCustomerId = customerId;
    if (customerId.startsWith('gid://')) {
      const parts = customerId.split('/');
      customerId = parts[parts.length - 1];
    }

    // נבנה את ה-GID המלא ל-Shopify
    const customerGid = `gid://shopify/Customer/${customerId}`;

    // אם cartId הוא null, מחק את ה-metafield (על ידי הגדרת value ל-"" או null)
    // שמור cart ID ב-metafields של הלקוח
    const result = await shopifyAdminClient.request(SAVE_CART_ID_MUTATION, {
      metafields: [
        {
          ownerId: customerGid,
          namespace: 'cart',
          key: 'current_cart_id',
          value: cartId || '', // אם null, מחק על ידי הגדרת value ל-string ריק
          type: 'single_line_text_field',
        },
      ],
    }) as {
      metafieldsSet?: {
        metafields?: Array<{ id: string; key: string; value: string }>;
        userErrors?: Array<{ field: string[]; message: string }>;
      };
    };

    if (result.metafieldsSet?.userErrors && result.metafieldsSet.userErrors.length > 0) {
      return NextResponse.json(
        { error: result.metafieldsSet.userErrors.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'שגיאה בשמירת cart ID' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!shopifyAdminClient) {
      return NextResponse.json(
        { error: 'Admin API לא מוגדר' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    let customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId נדרש' },
        { status: 400 }
      );
    }

    // אם זה GID, נחלץ רק את ה-ID (החלק האחרון אחרי ה-/)
    const originalCustomerId = customerId;
    if (customerId.startsWith('gid://')) {
      const parts = customerId.split('/');
      customerId = parts[parts.length - 1];
    }

    // נבנה את ה-GID המלא ל-Shopify
    const customerGid = `gid://shopify/Customer/${customerId}`;

    // טען cart ID מ-metafields של הלקוח - עם retry במקרה של eventual consistency
    let result: any = null;
    let cartId: string | null = null;
    const maxRetries = 3;
    const retryDelay = 500; // 500ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      result = await shopifyAdminClient.request(GET_CUSTOMER_QUERY, {
        id: customerGid,
      }) as {
        customer?: {
          id: string;
          metafields?: {
            edges?: Array<{
              node?: {
                key: string;
                value: string;
                namespace: string;
              };
            }>;
          };
        };
      };

      const cartIdMetafield = result.customer?.metafields?.edges?.find(
        (edge: { node?: { key?: string; value?: string; namespace?: string } }) => 
          edge.node?.namespace === 'cart' && edge.node?.key === 'current_cart_id'
      );

      cartId = cartIdMetafield?.node?.value || null;

      // אם מצאנו את ה-cartId או שזה הניסיון האחרון, נצא מהלולאה
      if (cartId || attempt === maxRetries) {
        break;
      }

      // אם לא מצאנו, נחכה קצת וננסה שוב (eventual consistency)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return NextResponse.json({
      cartId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'שגיאה בטעינת cart ID' },
      { status: 500 }
    );
  }
}

