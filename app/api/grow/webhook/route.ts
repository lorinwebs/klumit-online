import { NextRequest, NextResponse } from 'next/server';
import {
  getPaymentLinkInfo,
  isGrowConfigured,
  isLinkInfoConfigured,
  isPaidStatus,
  parseGrowServerUpdate,
  verifyMakeSecret,
  GROW_TRANSACTION_TYPES,
  type GrowServerUpdate,
} from '@/lib/grow';
import {
  completeDraftOrderAsPaid,
  getDraftOrderSummary,
  refToDraftGid,
} from '@/lib/checkout-orders';
import { sendCriticalTelegramMessage, escapeHtml } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Payment notification endpoint – called by the Make scenario that owns the
 * Grow › Notify URL Webhook (see GROW_INTEGRATION.md):
 *
 *   Grow ──► Make (Notify URL Webhook) ──► POST here (X-Klumit-Secret) ──► Grow › Approve Transaction
 *
 * Flow:
 *   1. Authenticate the call (shared secret) and parse the forwarded Grow payload.
 *   2. If the "Get Payment Link Info" scenario is configured, verify the payment with Grow
 *      instead of trusting the forwarded body.
 *   3. Check the paid amount against our draft order.
 *   4. Complete the Shopify draft order and mark it paid (idempotent).
 *
 * Response contract with Make:
 *   - HTTP 200  → we are done with this notification; Make runs Approve Transaction.
 *   - non-200   → Make must NOT approve, so Grow retries the notification (≈10/20/30 min).
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

/** Prefer Grow's verified values; fall back to the forwarded payload for anything Grow left empty. */
function mergeUpdates(verified: GrowServerUpdate | null, forwarded: GrowServerUpdate): GrowServerUpdate {
  if (!verified) return forwarded;
  const merged: Record<string, unknown> = { ...forwarded };
  for (const [key, value] of Object.entries(verified)) {
    if (key === 'raw' || key === 'customFields') continue;
    if (value === '' || value === null || value === undefined) continue;
    if (key === 'sum' && value === 0) continue;
    merged[key] = value;
  }
  merged.customFields = { ...forwarded.customFields, ...verified.customFields };
  merged.raw = { ...forwarded.raw, ...verified.raw };
  return merged as unknown as GrowServerUpdate;
}

export async function POST(request: NextRequest) {
  if (!isGrowConfigured()) {
    return NextResponse.json({ ok: false, reason: 'grow_not_configured' }, { status: 503 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await readPayload(request);
  } catch (error) {
    console.error('Grow webhook: unreadable payload', error);
    return NextResponse.json({ ok: false, reason: 'unreadable_payload' }, { status: 400 });
  }

  if (!verifyMakeSecret(request, payload)) {
    console.warn('Grow webhook: rejected call without a valid X-Klumit-Secret');
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const forwarded = parseGrowServerUpdate(payload);
  if (!forwarded.transactionId && !forwarded.paymentLinkProcessId) {
    console.warn('Grow webhook: missing transaction identifiers', forwarded.raw);
    return NextResponse.json({ ok: false, reason: 'missing_identifiers' }, { status: 400 });
  }

  if (!isPaidStatus(forwarded)) {
    // Not a completed payment (pending / failed / cancelled). Nothing to fulfil, nothing to verify.
    return NextResponse.json({
      ok: true,
      ignored: 'not_paid',
      statusCode: forwarded.statusCode,
      status: forwarded.status,
    });
  }

  // 1. Authoritative verification with Grow (through Make) when available.
  let verified: GrowServerUpdate | null = null;
  if (isLinkInfoConfigured()) {
    if (!forwarded.paymentLinkProcessId || !forwarded.paymentLinkProcessToken) {
      console.warn('Grow webhook: cannot verify – missing paymentLinkProcessId/Token', forwarded.raw);
      return NextResponse.json({ ok: false, reason: 'missing_payment_link_identifiers' }, { status: 400 });
    }
    try {
      verified = await getPaymentLinkInfo(
        forwarded.paymentLinkProcessId,
        forwarded.paymentLinkProcessToken,
        forwarded.transactionId
      );
    } catch (error) {
      console.error('Grow webhook: getPaymentLinkInfo failed', error);
      await alert(
        `⚠️ <b>Grow: לא ניתן לאמת תשלום</b>\nעסקה ${escapeHtml(forwarded.transactionId)} · ₪${forwarded.sum} · הזמנה ${escapeHtml(
          forwarded.customFields.cField1 || '?'
        )}\n${escapeHtml(error instanceof Error ? error.message : String(error))}\nGrow ישלח את ההתראה שוב (10/20/30 דק').`
      );
      // Non-200 → Make does not approve → Grow retries later.
      return NextResponse.json({ ok: false, reason: 'verification_failed' }, { status: 502 });
    }
  }
  const info = mergeUpdates(verified, forwarded);

  if (!isPaidStatus(info)) {
    // Grow's own record says this transaction is not paid – do not fulfil.
    console.warn('Grow webhook: notification says paid but Grow does not', { transactionId: info.transactionId });
    return NextResponse.json({ ok: true, ignored: 'not_paid', statusCode: info.statusCode, status: info.status });
  }

  const ref = info.customFields.cField1 || '';
  if (!/^\d+$/.test(ref)) {
    console.error('Grow webhook: paid transaction without draft reference', {
      transactionId: info.transactionId,
      paymentLinkProcessId: info.paymentLinkProcessId,
      raw: info.raw,
    });
    await alert(
      `⚠️ <b>Grow: תשלום בלי הזמנה מקושרת</b>\nעסקה ${escapeHtml(info.transactionId)} · ₪${info.sum}\nבדקו שהשדה Custom Field 1 ממופה ב-Make ל-customField1.`
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
  const paidAmount = info.sum;
  if (Math.abs(paidAmount - draft.total) > 0.01) {
    console.error('Grow webhook: amount mismatch', { ref, paidAmount, expected: draft.total });
    await alert(
      `🚨 <b>Grow: סכום לא תואם</b>\nהזמנה ${escapeHtml(draft.name)} · שולם ₪${paidAmount} · צפוי ₪${draft.total}\nההזמנה לא הושלמה אוטומטית.`
    );
    return NextResponse.json({ ok: false, reason: 'amount_mismatch' });
  }

  // 3. Complete the order (idempotent – Grow may deliver the same notification more than once).
  let orderName = draft.order?.name ?? null;
  if (!draft.order) {
    try {
      const result = await completeDraftOrderAsPaid(draftGid, {
        provider: 'grow',
        transactionId: info.transactionId,
        asmachta: info.asmachta,
        method: GROW_TRANSACTION_TYPES[info.transactionTypeId ?? 0] || 'Grow',
        cardBrand: info.cardBrand,
        cardSuffix: info.cardSuffix,
        installments: info.allPaymentsNum,
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
      // Non-200 → Make does not approve → Grow retries; the payment is real and we still owe an order.
      return NextResponse.json({ ok: false, reason: 'order_completion_failed' }, { status: 502 });
    }
  }

  // 4. Make runs Grow › Approve Transaction once it sees this 200.
  return NextResponse.json({ ok: true, orderName, verified: verified !== null });
}

// Health check
export async function GET() {
  return NextResponse.json({
    message: 'Grow webhook endpoint is active',
    configured: isGrowConfigured(),
    verification: isLinkInfoConfigured() ? 'get_payment_link_info' : 'shared_secret_only',
    timestamp: new Date().toISOString(),
  });
}
