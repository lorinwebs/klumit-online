import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isGrowConfigured, GrowApiError } from '@/lib/grow';
import { createCheckoutDraftOrder, findUnavailableLines } from '@/lib/checkout-orders';
import { createPaymentSessionForDraft } from '@/lib/checkout-payment';

export const dynamic = 'force-dynamic';

/**
 * Step 1 → 2 of the checkout.
 * Creates a Shopify draft order (inventory reserved) and opens a Grow payment process.
 * Returns everything /checkout/payment needs to render the embedded payment form.
 *
 * If Grow is not configured yet, responds 503 with { fallback: "shopify" } so the
 * client can keep using Shopify Checkout until the Grow identifiers are in place.
 */

const bodySchema = z.object({
  customer: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().email().max(120),
    phone: z.string().trim().min(9).max(20),
    address: z.string().trim().min(2).max(200),
    city: z.string().trim().min(2).max(80),
    zipCode: z.string().trim().max(10).optional().default(''),
    apartment: z.string().trim().max(20).optional().default(''),
    floor: z.string().trim().max(20).optional().default(''),
    notes: z.string().trim().max(500).optional().default(''),
  }),
  lines: z
    .array(
      z.object({
        variantId: z.string().startsWith('gid://shopify/ProductVariant/'),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(50),
  discountCode: z.string().trim().max(60).nullable().optional(),
  subtotalHint: z.number().nonnegative().optional(),
});

function toE164(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+972')) return cleaned;
  if (cleaned.startsWith('972')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+972${cleaned.slice(1)}`;
  return `+972${cleaned}`;
}

export async function POST(request: NextRequest) {
  if (!isGrowConfigured()) {
    return NextResponse.json(
      { error: 'grow_not_configured', fallback: 'shopify', message: 'התשלום המוטמע אינו מוגדר עדיין' },
      { status: 503 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'פרטי ההזמנה אינם תקינים', details: error instanceof Error ? error.message : undefined },
      { status: 400 }
    );
  }

  // Stock is not reserved during payment, so make sure the items are still available
  // right before opening the payment form.
  try {
    const unavailable = await findUnavailableLines(body.lines);
    if (unavailable.length) {
      const names = unavailable.map((u) => u.title).join(', ');
      return NextResponse.json(
        {
          error: 'out_of_stock',
          unavailable,
          message: `${names} — אזל מהמלאי בזמן שמילאת את הפרטים. אפשר להזמין מאיטליה בוואטסאפ 054-2600177.`,
        },
        { status: 409 }
      );
    }
  } catch (error) {
    // Availability check is best-effort; Shopify will still validate the draft order.
    console.warn('availability check failed:', error);
  }

  try {
    const draft = await createCheckoutDraftOrder({
      customer: { ...body.customer, phone: toE164(body.customer.phone) },
      lines: body.lines,
      discountCode: body.discountCode || null,
      subtotalHint: body.subtotalHint,
    });

    const session = await createPaymentSessionForDraft(draft);
    return NextResponse.json(session);
  } catch (error) {
    console.error('create-and-pay failed:', error);
    const isGrow = error instanceof GrowApiError;
    return NextResponse.json(
      {
        error: isGrow ? 'grow_error' : 'order_error',
        message: isGrow
          ? 'לא ניתן לפתוח את דף התשלום כרגע. נסו שוב בעוד רגע.'
          : 'לא ניתן ליצור את ההזמנה כרגע. נסו שוב בעוד רגע.',
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 502 }
    );
  }
}
