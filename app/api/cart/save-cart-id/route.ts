import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';

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
      metafields(first: 10) {
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

    const { customerId, cartId } = await request.json();

    if (!customerId || !cartId) {
      return NextResponse.json(
        { error: 'customerId ו-cartId נדרשים' },
        { status: 400 }
      );
    }

    // שמור cart ID ב-metafields של הלקוח
    const result = await shopifyAdminClient.request(SAVE_CART_ID_MUTATION, {
      metafields: [
        {
          ownerId: customerId,
          namespace: 'cart',
          key: 'current_cart_id',
          value: cartId,
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
    console.error('Error saving cart ID:', error);
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
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId נדרש' },
        { status: 400 }
      );
    }

    // טען cart ID מ-metafields של הלקוח
    const result = await shopifyAdminClient.request(GET_CUSTOMER_QUERY, {
      id: customerId,
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
      edge => edge.node?.namespace === 'cart' && edge.node?.key === 'current_cart_id'
    );

    return NextResponse.json({
      cartId: cartIdMetafield?.node?.value || null,
    });
  } catch (error: any) {
    console.error('Error loading cart ID:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בטעינת cart ID' },
      { status: 500 }
    );
  }
}

