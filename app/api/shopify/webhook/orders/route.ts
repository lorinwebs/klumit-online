import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { notifyNewOrder } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

// Shopify webhook secret for HMAC verification
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

function verifyShopifyWebhook(body: string, signature: string | null): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.warn('SHOPIFY_WEBHOOK_SECRET not configured - skipping verification');
    return true;
  }
  
  if (!signature) {
    console.warn('No signature in request - skipping verification');
    return true;
  }

  try {
    const hmac = crypto
      .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
      .update(body, 'utf8')
      .digest('base64');

    const hmacBuffer = Buffer.from(hmac);
    const signatureBuffer = Buffer.from(signature);
    
    if (hmacBuffer.length !== signatureBuffer.length) {
      console.error('Signature length mismatch');
      return false;
    }
    
    return crypto.timingSafeEqual(hmacBuffer, signatureBuffer);
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return true; // Allow on error to not block webhooks
  }
}

/**
 * Shopify Orders Webhook - orders/create event
 * 
 * Configure in Shopify Admin:
 * Settings → Notifications → Webhooks → Create webhook
 * Event: Order creation
 * URL: https://your-domain.com/api/shopify/webhook/orders
 * Format: JSON
 */
export async function POST(request: NextRequest) {
  console.log('🔔 Shopify webhook received!');
  
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');
    
    console.log('📝 Webhook signature present:', !!signature);
    console.log('📝 Body length:', rawBody.length);

    // Verify webhook authenticity
    if (!verifyShopifyWebhook(rawBody, signature)) {
      console.error('❌ Invalid Shopify webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const order = JSON.parse(rawBody);

    console.log('📦 Shopify Order Webhook received:', {
      id: order.id,
      name: order.name,
      email: order.email,
      total_price: order.total_price,
    });

    // Extract customer info
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

    console.log('📱 Sending Telegram notification...');
    
    // Send Telegram notification
    const telegramResult = await notifyNewOrder({
      orderNumber: order.name || `#${order.order_number}`,
      customerName,
      customerPhone,
      customerEmail: order.email,
      totalPrice: order.total_price,
      currency: order.currency,
      itemsCount: order.line_items?.length || 0,
    });
    
    console.log('✅ Telegram notification result:', telegramResult);

    return NextResponse.json({ success: true, message: 'Order notification sent', telegramResult });
  } catch (error) {
    console.error('❌ Error processing Shopify order webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    message: 'Shopify Orders Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

