import { NextRequest, NextResponse } from 'next/server';
import {
  approveTransaction,
  getPaymentProcessInfo,
  isGrowConfigured,
  parseGrowServerUpdate,
  GROW_TRANSACTION_TYPES,
  GrowApiError,
} from '@/lib/grow';
import {
  completeDraftOrderAsPaid,
  getDraftOrderSummary,
  refToDraftGid,
} from '@/lib/checkout-orders';
import { sendCriticalTelegramMessage, escapeHtml } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * Grow "server update" (notifyUrl) endpoint.
 *
 * Flow:
 *   1. Parse the FormData / JSON payload Grow sends.
 *   2. Verify the payment server-to-server with getPaymentProcessInfo (never trust the body).
 *   3. Check the paid amount against our draft order.
 *   4. Complete the Shopify draft order and mark it paid (idempotent).
 *   5. Call approveTransaction – mandatory acknowledgement for Grow.
 *
 * Always answer 200 once the payload is understood, otherwise Grow keeps retrying.
 */

async function readPayload(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return (await request.json()) as Record<string, unknown>;
  }

  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData();
    const out: Record<string, unknown> = {};
    form.forEach((value, key) => {
      out[key] = typeof value === 'string' ? value : value.name;
    });
    return out;
  }

  // Unknown content type: try JSON, then urlencoded.
  const text = await request.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const out: Record<string, unknown> = {};
    new URLSearchParams(text).forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
}

async function alert(text: string) {
  try {
    const store = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
    const shopDomain = store.includes('.myshopify.com') ? store : `${store}.myshopify.com`;
    await sendCriticalTelegramMessage(text, { kind: 'shopifyOrder', shopDomain });
  } catch {
    // alerts are best-effort
  }
}

export async function POST(request: NextRequest) {
  if (!isGrowConfigured()) {
    return NextResponse.json({ ok: false, reason: 'grow_not_configured' }, { status: 503 });
  }

  let update;
  try {
    update = parseGrowServerUpdate(await readPayload(request));
  } catch (error) {
    console.error('Grow webhook: unreadable payload', error);
    return NextResponse.json({ ok: false, reason: 'unreadable_payload' }, { status: 400 });
  }

  if (!update.processId || !update.processToken) {
    console.warn('Grow webhook: missing process identifiers', update.raw);
    return NextResponse.json({ ok: false, reason: 'missing_process_identifiers' }, { status: 400 });
  }

  // 1. Authoritative verification with Grow.
  let info;
  try {
    info = await getPaymentProcessInfo(update.processId, update.processToken);
  } catch (error) {
    console.error('Grow webhook: getPaymentProcessInfo failed', error);
    // Let Grow retry later.
    return NextResponse.json({ ok: false, reason: 'verification_failed' }, { status: 502 });
  }

  const statusCode = info.statusCode ?? update.statusCode;
  if (statusCode !== 2) {
    // Not a completed payment (pending / failed / cancelled). Nothing to fulfil.
    return NextResponse.json({ ok: true, ignored: 'not_paid', statusCode });
  }

  const ref = info.customFields.cField1 || update.customFields.cField1 || '';
  if (!/^\d+$/.test(ref)) {
    console.error('Grow webhook: paid transaction without draft reference', { processId: update.processId });
    await alert(
      `⚠️ <b>Grow: תשלום בלי הזמנה מקושרת</b>\nעסקה ${escapeHtml(info.transactionId || update.transactionId)} · ₪${info.sum}`
    );
    return NextResponse.json({ ok: true, ignored: 'missing_reference' });
  }

  const draftGid = refToDraftGid(ref);
  const draft = await getDraftOrderSummary(draftGid).catch(() => null);
  if (!draft) {
    await alert(`⚠️ <b>Grow: הזמנה לא נמצאה</b>\nטיוטה ${ref} · עסקה ${escapeHtml(info.transactionId)}`);
    return NextResponse.json({ ok: true, ignored: 'draft_not_found' });
  }

  // 2. Amount check – a mismatch must never fulfil.
  const paidAmount = info.sum || update.sum;
  if (Math.abs(paidAmount - draft.total) > 0.01) {
    console.error('Grow webhook: amount mismatch', { ref, paidAmount, expected: draft.total });
    await alert(
      `🚨 <b>Grow: סכום לא תואם</b>\nהזמנה ${escapeHtml(draft.name)} · שולם ₪${paidAmount} · צפוי ₪${draft.total}\nההזמנה לא הושלמה אוטומטית.`
    );
    return NextResponse.json({ ok: false, reason: 'amount_mismatch' });
  }

  // 3. Complete the order (idempotent).
  let orderName = draft.order?.name ?? null;
  if (!draft.order) {
    try {
      const result = await completeDraftOrderAsPaid(draftGid, {
        provider: 'grow',
        transactionId: info.transactionId || update.transactionId,
        asmachta: info.asmachta || update.asmachta,
        method: GROW_TRANSACTION_TYPES[info.transactionTypeId ?? update.transactionTypeId ?? 0] || 'Grow',
        cardBrand: info.cardBrand || update.cardBrand,
        cardSuffix: info.cardSuffix || update.cardSuffix,
        installments: update.allPaymentsNum,
        amount: paidAmount,
      });
      orderName = result.orderName;
    } catch (error) {
      console.error('Grow webhook: completing draft order failed', error);
      await alert(
        `🚨 <b>Grow: התשלום עבר אבל ההזמנה לא הושלמה ב-Shopify</b>\nטיוטה ${escapeHtml(draft.name)} · עסקה ${escapeHtml(
          info.transactionId
        )} · ₪${paidAmount}\n${escapeHtml(error instanceof Error ? error.message : String(error))}`
      );
      // Ask Grow to retry – the payment is real and we still owe an order.
      return NextResponse.json({ ok: false, reason: 'order_completion_failed' }, { status: 502 });
    }
  }

  // 4. Acknowledge to Grow.
  const approvable = {
    ...update,
    transactionId: update.transactionId || info.transactionId,
    transactionToken: update.transactionToken || info.transactionToken,
    transactionTypeId: update.transactionTypeId ?? info.transactionTypeId,
  };
  let approved = false;
  if (approvable.transactionId && approvable.transactionToken) {
    try {
      approved = await approveTransaction(approvable);
    } catch (error) {
      const detail = error instanceof GrowApiError ? error.message : String(error);
      console.error('Grow webhook: approveTransaction failed', detail);
    }
  }

  return NextResponse.json({ ok: true, orderName, approved });
}

// Health check
export async function GET() {
  return NextResponse.json({
    message: 'Grow webhook endpoint is active',
    configured: isGrowConfigured(),
    timestamp: new Date().toISOString(),
  });
}
