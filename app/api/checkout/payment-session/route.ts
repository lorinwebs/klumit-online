import { NextRequest, NextResponse } from 'next/server';
import { getDraftOrderSummary, refToDraftGid, verifyRef } from '@/lib/checkout-orders';
import { createPaymentSessionForDraft } from '@/lib/checkout-payment';
import {
  isApplePayConfigured,
  isGooglePayConfigured,
  isGrowConfigured,
  type GrowPaymentMethod,
} from '@/lib/grow';

export const dynamic = 'force-dynamic';

function parseMethod(value: unknown): GrowPaymentMethod {
  if (value === 'apple' || value === 'google') return value;
  return 'card';
}

/**
 * Re-opens a Grow payment process for an existing draft order.
 * Used when the customer cancels inside the payment form, the Grow link expired,
 * or they switch between card / Apple Pay / Google Pay.
 */
export async function POST(request: NextRequest) {
  if (!isGrowConfigured()) {
    return NextResponse.json({ error: 'grow_not_configured' }, { status: 503 });
  }

  let ref = '';
  let sig = '';
  let method: GrowPaymentMethod = 'card';
  try {
    const body = (await request.json()) as { ref?: string; sig?: string; method?: string };
    ref = String(body.ref || '');
    sig = String(body.sig || '');
    method = parseMethod(body.method);
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  if (!verifyRef(ref, sig)) {
    return NextResponse.json({ error: 'invalid_reference' }, { status: 403 });
  }

  if (method === 'apple' && !isApplePayConfigured()) {
    return NextResponse.json(
      { error: 'apple_not_configured', message: 'Apple Pay עדיין לא מופעל בחשבון הסליקה.' },
      { status: 503 }
    );
  }

  if (method === 'google' && !isGooglePayConfigured()) {
    return NextResponse.json(
      { error: 'google_not_configured', message: 'Google Pay עדיין לא מופעל בחשבון הסליקה.' },
      { status: 503 }
    );
  }

  try {
    const draft = await getDraftOrderSummary(refToDraftGid(ref));
    if (!draft) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (draft.status === 'COMPLETED' || draft.order) {
      return NextResponse.json({ error: 'already_paid', orderName: draft.order?.name ?? null }, { status: 409 });
    }

    const session = await createPaymentSessionForDraft(draft, method);
    return NextResponse.json(session);
  } catch (error) {
    console.error('payment-session failed:', error);
    return NextResponse.json(
      { error: 'grow_error', message: 'לא ניתן לפתוח את דף התשלום כרגע. נסו שוב בעוד רגע.' },
      { status: 502 }
    );
  }
}
