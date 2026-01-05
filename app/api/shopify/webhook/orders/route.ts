import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { notifyNewOrder } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

function verifyShopifyWebhook(body: string, signature: string | null): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    return true;
  }
  if (!signature) {
    return false;
  }

  const hmac = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  const isVerified = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  return isVerified;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');

    if (!verifyShopifyWebhook(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const order = JSON.parse(rawBody);

    const customerName = order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      : order.shipping_address
        ? `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim()
        : 'לא ידוע';

    const customerPhone =
      order.customer?.phone ||
      order.shipping_address?.phone ||
      order.billing_address?.phone ||
      undefined;

    const telegramResult = await notifyNewOrder({
      orderNumber: order.name || `#${order.order_number}`,
      customerName,
      customerPhone,
      customerEmail: order.email,
      totalPrice: order.total_price,
      currency: order.currency,
      itemsCount: order.line_items?.length || 0,
    });

    return NextResponse.json({ success: true, telegramResult });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Shopify Orders Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
