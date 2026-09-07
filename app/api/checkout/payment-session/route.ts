import { NextRequest, NextResponse } from 'next/server';
import { getDraftOrderSummary, refToDraftGid, verifyRef } from '@/lib/checkout-orders';
import { createPaymentSessionForDraft } from '@/lib/checkout-payment';
import { isGrowConfigured } from '@/lib/grow';

export const dynamic = 'force-dynamic';

/**
 * Re-opens a Grow payment process for an existing draft order.
 * Used when the customer cancels inside the payment form or the Grow link expired.
 */
export async function POST(request: NextRequest) {
  if (!isGrowConfigured()) {
    return NextResponse.json({ error: 'grow_not_configured' }, { status: 503 });
  }

  let ref = '';
  let sig = '';
  try {
    const body = (await request.json()) as { ref?: string; sig?: string };
    ref = String(body.ref || '');
    sig = String(body.sig || '');
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  if (!verifyRef(ref, sig)) {
    return NextResponse.json({ error: 'invalid_reference' }, { status: 403 });
  }

  try {
    const draft = await getDraftOrderSummary(refToDraftGid(ref));
    if (!draft) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (draft.status === 'COMPLETED' || draft.order) {
      return NextResponse.json({ error: 'already_paid', orderName: draft.order?.name ?? null }, { status: 409 });
    }

    const session = await createPaymentSessionForDraft(draft);
    return NextResponse.json(session);
  } catch (error) {
    console.error('payment-session failed:', error);
    return NextResponse.json(
      { error: 'grow_error', message: 'לא ניתן לפתוח את דף התשלום כרגע. נסו שוב בעוד רגע.' },
      { status: 502 }
    );
  }
}
