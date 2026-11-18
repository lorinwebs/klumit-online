import 'server-only';
import { timingSafeEqual } from 'crypto';

/**
 * Grow (Meshulam) payments through the **Grow app for Make**.
 *
 * Reference: https://developers.grow.business/docs/grow-app-for-make
 *
 * The site never calls Grow directly (no userId / pageCode needed). Make holds the Grow
 * connection (business ID + phone OTP) and we talk to two Make scenarios:
 *
 *   1. "KLUMIT · Grow payment link" – Custom webhook → Router (by `event`):
 *        create_payment_link   → Grow › Create Payment Link → Webhook response
 *                                { url, paymentLinkProcessId, paymentLinkProcessToken }
 *        get_payment_link_info → Grow › Get Payment Link Info → JSON → Webhook response
 *                                (used by /api/grow/webhook to verify a payment before fulfilling)
 *      Both routes are guarded by a filter on the `secret` body field.
 *   2. "KLUMIT · Grow notify"       – Grow › Notify URL Webhook → JSON → HTTP POST /api/grow/webhook
 *                                     (header X-Klumit-Secret) → [status code = 200] → Grow › Approve Transaction
 *
 * Scenario layout, field mapping and Make resource ids: see GROW_INTEGRATION.md.
 *
 * Environment variables:
 *   MAKE_GROW_CREATE_LINK_WEBHOOK_URL – scenario 1 webhook URL (required)
 *   MAKE_WEBHOOK_SECRET               – shared secret sent in X-Klumit-Secret both ways (required)
 *   MAKE_GROW_LINK_INFO_WEBHOOK_URL   – webhook URL for the verification route (optional, recommended;
 *                                       same address as scenario 1 – the router picks the route by `event`)
 *   MAKE_GROW_NOTIFY_WEBHOOK_URL      – scenario 2 "Notify URL Webhook" address (optional – the
 *                                       Create Payment Link module has it hard-coded as a fallback)
 *   GROW_OPEN_MODE                    – "redirect" (default) | "iframe". Grow payment pages
 *                                       (pay.grow.link) send CSP frame-ancestors grow.website only,
 *                                       so they cannot be embedded on our domain
 *   GROW_MAX_PAYMENTS                 – sent to Make as `maxPayments`; the Create Payment Link module is
 *                                       currently fixed to a single payment (see GROW_INTEGRATION.md)
 */

const REQUEST_TIMEOUT_MS = 35_000; // Make holds a webhook response open for up to 40s.

/** Re-open a fresh link after this long on the payment page (payment links themselves live longer). */
export const GROW_PAYMENT_URL_TTL_MS = 60 * 60 * 1000;

export type GrowOpenMode = 'iframe' | 'redirect';

/** transactionTypeId values reported by Grow. */
export const GROW_TRANSACTION_TYPES: Record<number, string> = {
  1: 'כרטיס אשראי',
  6: 'bit',
  13: 'Apple Pay',
  14: 'Google Pay',
};

const SECRET_HEADER = 'x-klumit-secret';

export function getGrowConfig() {
  const openMode: GrowOpenMode = process.env.GROW_OPEN_MODE?.trim() === 'iframe' ? 'iframe' : 'redirect';
  return {
    createLinkWebhookUrl: process.env.MAKE_GROW_CREATE_LINK_WEBHOOK_URL?.trim() || '',
    notifyWebhookUrl: process.env.MAKE_GROW_NOTIFY_WEBHOOK_URL?.trim() || '',
    linkInfoWebhookUrl: process.env.MAKE_GROW_LINK_INFO_WEBHOOK_URL?.trim() || '',
    secret: process.env.MAKE_WEBHOOK_SECRET?.trim() || '',
    openMode,
    // Grow allows 1 (single payment) or a maximum of 2–12 installments.
    maxPayments: Math.min(12, Math.max(1, Math.floor(Number(process.env.GROW_MAX_PAYMENTS || 1) || 1))),
  };
}

export function isGrowConfigured(): boolean {
  const { createLinkWebhookUrl, secret } = getGrowConfig();
  return Boolean(createLinkWebhookUrl && secret);
}

export function isLinkInfoConfigured(): boolean {
  return Boolean(getGrowConfig().linkInfoWebhookUrl);
}

export class GrowApiError extends Error {
  readonly code: number | null;
  readonly method: string;
  readonly raw: unknown;

  constructor(method: string, message: string, code: number | null, raw: unknown) {
    super(`Grow ${method}: ${message}${code !== null ? ` (err ${code})` : ''}`);
    this.name = 'GrowApiError';
    this.method = method;
    this.code = code;
    this.raw = raw;
  }
}

/**
 * Grow rejects "special characters" in free-text fields. Keep letters (any script),
 * digits, spaces and a few safe punctuation marks.
 */
export function sanitizeGrowText(value: string, maxLength = 120): string {
  return value
    .replace(/[^\p{L}\p{N}\s.,:()\-\/]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Grow wants an Israeli mobile number in local format: 05XXXXXXXX. */
export function toIsraeliMobile(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return `0${digits.slice(3)}`;
  if (digits.startsWith('0')) return digits;
  return `0${digits}`;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Authenticates a call from Make (scenario 2 → /api/grow/webhook).
 * Accepts the secret in `X-Klumit-Secret`, `Authorization: Bearer …` or a `secret` body field.
 */
export function verifyMakeSecret(request: Request, body?: Record<string, unknown>): boolean {
  const { secret } = getGrowConfig();
  if (!secret) return false;
  const header =
    request.headers.get(SECRET_HEADER) ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  if (header && safeEqual(header, secret)) return true;
  const fromBody = typeof body?.secret === 'string' ? body.secret : '';
  return Boolean(fromBody) && safeEqual(fromBody, secret);
}

function normalizeError(err: unknown): { code: number | null; message: string } {
  if (typeof err === 'string') return { code: null, message: err || 'Unknown error' };
  if (err && typeof err === 'object') {
    const e = err as { id?: unknown; message?: unknown };
    let code: number | null = null;
    let message = typeof e.message === 'string' ? e.message : '';
    if (typeof e.id === 'number') code = e.id;
    else if (typeof e.id === 'string' && /^\d+$/.test(e.id)) code = Number(e.id);
    else if (e.id && typeof e.id === 'object') {
      const nested = e.id as { id?: unknown; content?: unknown };
      if (typeof nested.id === 'number') code = nested.id;
      if (typeof nested.content === 'string' && nested.content) message = nested.content;
    }
    return { code, message: message || 'Unknown error' };
  }
  return { code: null, message: 'Unknown error' };
}

/**
 * POSTs JSON to a Make custom webhook and returns the parsed "Webhook response" body.
 * Make answers the literal text "Accepted" when the scenario has no Webhook response module.
 */
async function makeRequest(method: string, url: string, payload: Record<string, unknown>): Promise<unknown> {
  const { secret } = getGrowConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        [SECRET_HEADER]: secret,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network error';
    throw new GrowApiError(method, `Make request failed (${reason})`, null, error);
  } finally {
    clearTimeout(timeout);
  }

  const text = (await response.text()).trim();

  if (!response.ok) {
    // e.g. 400 "There is no scenario listening for this webhook", 410 when the webhook was deleted.
    throw new GrowApiError(method, `Make responded HTTP ${response.status}: ${text.slice(0, 200)}`, null, text);
  }

  if (!text || /^accepted$/i.test(text)) {
    throw new GrowApiError(
      method,
      'Make scenario ended without a "Webhook response" – the module is missing or the scenario failed before reaching it (check the scenario history in Make)',
      null,
      text
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new GrowApiError(method, 'Make returned a non-JSON response', null, text.slice(0, 300));
  }

  // If the scenario forwarded Grow's raw response, surface Grow's own error.
  if (json && typeof json === 'object') {
    const { status, err } = json as { status?: unknown; err?: unknown };
    if ((status === 0 || status === '0' || status === false) && err) {
      const { code, message } = normalizeError(err);
      throw new GrowApiError(method, message, code, json);
    }
  }

  return json;
}

const str = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  return String(value).trim();
};

// ---------------------------------------------------------------------------
// createPaymentLink (Make scenario 1 → Grow › Create Payment Link)
// ---------------------------------------------------------------------------

export interface GrowProductLine {
  productName: string;
  quantity: number;
  /** Unit price in ILS, VAT included. */
  price: number;
  catalogNumber?: string;
}

export interface CreatePaymentLinkInput {
  /** Order reference (Shopify draft id) – echoed back as custom field 1. */
  reference: string;
  /** Title shown to the customer on the payment page. */
  title: string;
  description?: string;
  /** Total in ILS – must equal the sum of the product lines. */
  sum: number;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  products: GrowProductLine[];
  customField2?: string;
}

export interface GrowPaymentLink {
  url: string;
  paymentLinkProcessId: string;
  paymentLinkProcessToken: string;
}

/**
 * Payload posted to the Make "payment link" webhook (route `create_payment_link`).
 *
 * `products[]` is mapped wholesale onto the Grow › Create Payment Link module's
 * `products.data[]`, so its item keys are exactly the module's: catalogNumber, name, price,
 * quantity, minQuantity, vatType (1 = regular VAT, 3 = VAT exempt). Sending mode (none),
 * charge type (regular) and the invoice settings are hard-coded in the Make module.
 */
export function buildCreatePaymentLinkPayload(input: CreatePaymentLinkInput): Record<string, unknown> {
  const { maxPayments, notifyWebhookUrl, secret } = getGrowConfig();

  return {
    event: 'create_payment_link',
    secret,
    reference: input.reference,
    title: sanitizeGrowText(input.title, 80),
    description: input.description ? sanitizeGrowText(input.description, 120) : '',
    sum: Number(input.sum.toFixed(2)),
    maxPayments,
    fullName: sanitizeGrowText(input.fullName, 60),
    firstName: sanitizeGrowText(input.firstName, 30),
    lastName: sanitizeGrowText(input.lastName, 30),
    phone: toIsraeliMobile(input.phone),
    email: input.email || '',
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    notifyUrl: notifyWebhookUrl,
    customField1: input.reference,
    customField2: input.customField2 ? sanitizeGrowText(input.customField2, 60) : '',
    products: input.products.map((line) => ({
      ...(line.catalogNumber ? { catalogNumber: sanitizeGrowText(line.catalogNumber, 40) } : {}),
      name: sanitizeGrowText(line.productName, 80),
      price: Number(line.price.toFixed(2)),
      quantity: line.quantity,
      minQuantity: line.quantity,
      vatType: 1,
    })),
  };
}

/** Finds { url, paymentLinkProcessId, paymentLinkProcessToken } anywhere in the Make response. */
function extractPaymentLink(json: unknown): GrowPaymentLink | null {
  const candidates: Record<string, unknown>[] = [];
  const visit = (value: unknown, depth: number) => {
    if (!value || typeof value !== 'object' || depth > 3) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    candidates.push(value as Record<string, unknown>);
    Object.values(value as Record<string, unknown>).forEach((nested) => visit(nested, depth + 1));
  };
  visit(json, 0);

  for (const o of candidates) {
    const url = str(o.url ?? o.paymentUrl ?? o.payment_url ?? o.link ?? o.paymentLink).replace(/\\\//g, '/');
    if (!/^https?:\/\//i.test(url)) continue;
    return {
      url,
      paymentLinkProcessId: str(o.paymentLinkProcessId ?? o.payment_link_process_id ?? o.processId),
      paymentLinkProcessToken: str(o.paymentLinkProcessToken ?? o.payment_link_process_token ?? o.processToken),
    };
  }
  return null;
}

export async function createPaymentLink(input: CreatePaymentLinkInput): Promise<GrowPaymentLink> {
  const { createLinkWebhookUrl } = getGrowConfig();
  if (!isGrowConfigured()) {
    throw new GrowApiError(
      'createPaymentLink',
      'MAKE_GROW_CREATE_LINK_WEBHOOK_URL / MAKE_WEBHOOK_SECRET are not configured',
      null,
      null
    );
  }

  const json = await makeRequest('createPaymentLink', createLinkWebhookUrl, buildCreatePaymentLinkPayload(input));
  const link = extractPaymentLink(json);
  if (!link) {
    throw new GrowApiError(
      'createPaymentLink',
      'Make response is missing the payment url (expected url, paymentLinkProcessId, paymentLinkProcessToken)',
      null,
      json
    );
  }
  return link;
}

// ---------------------------------------------------------------------------
// Server update parsing (Grow › Notify URL Webhook payload, forwarded by Make)
// ---------------------------------------------------------------------------

export interface GrowServerUpdate {
  transactionId: string;
  transactionToken: string;
  paymentLinkProcessId: string;
  paymentLinkProcessToken: string;
  processId: string;
  processToken: string;
  statusCode: number | null;
  status: string;
  sum: number;
  transactionTypeId: number | null;
  paymentType: number | null;
  paymentsNum: number | null;
  allPaymentsNum: number | null;
  firstPaymentSum: number;
  periodicalPaymentSum: number;
  paymentDate: string;
  asmachta: string;
  description: string;
  fullName: string;
  payerPhone: string;
  payerEmail: string;
  cardSuffix: string;
  cardType: string;
  cardTypeCode: number | null;
  cardBrand: string;
  cardBrandCode: number | null;
  cardExp: string;
  /** Normalised to cField1…cField9 regardless of how the field was named upstream. */
  customFields: Record<string, string>;
  /** Every field received, flattened to bracket keys. */
  raw: Record<string, string>;
}

function flattenGrowPayload(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};

  const visit = (value: unknown, prefix: string) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, prefix ? `${prefix}[${index}]` : String(index)));
      return;
    }
    if (typeof value === 'object') {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        visit(nested, prefix ? `${prefix}[${key}]` : key);
      }
      return;
    }
    out[prefix] = String(value);
  };

  for (const [key, value] of Object.entries(input)) {
    // Grow (and Make) may send the payload nested under "data" (object or JSON string).
    if (key === 'data') {
      let data: unknown = value;
      if (typeof value === 'string') {
        try {
          data = JSON.parse(value);
        } catch {
          data = value;
        }
      }
      if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data as Record<string, unknown>)) visit(v, k);
        continue;
      }
    }
    if (typeof value === 'string') {
      const match = key.match(/^data\[(.+)\]$/);
      if (match) {
        out[match[1]] = value;
        continue;
      }
    }
    visit(value, key);
  }

  return out;
}

const num = (value: string | undefined): number | null => {
  if (value === undefined || value === '') return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
};

const text = (value: string | undefined): string => (value ?? '').trim();

/** cField1 · customField1 · custom_field_1 · customFields[cField1] · customFields[customField1] … */
const CUSTOM_FIELD_KEY = /(?:^|\[)(?:c|custom_?)field_?(\d)(?:\]|$)/i;

export function parseGrowServerUpdate(payload: Record<string, unknown>): GrowServerUpdate {
  const raw = flattenGrowPayload(payload);

  const customFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const match = key.match(CUSTOM_FIELD_KEY);
    if (match && value !== '') customFields[`cField${match[1]}`] = value.trim();
  }

  return {
    transactionId: text(raw.transactionId ?? raw.transaction_id),
    transactionToken: text(raw.transactionToken ?? raw.transaction_token),
    paymentLinkProcessId: text(raw.paymentLinkProcessId ?? raw.payment_link_process_id),
    paymentLinkProcessToken: text(raw.paymentLinkProcessToken ?? raw.payment_link_process_token),
    processId: text(raw.processId ?? raw.process_id),
    processToken: text(raw.processToken ?? raw.process_token),
    statusCode: num(raw.statusCode ?? raw.status_code),
    status: text(raw.status),
    sum: num(raw.sum ?? raw.paymentSum) ?? 0,
    transactionTypeId: num(raw.transactionTypeId ?? raw.TransactionTypeId),
    paymentType: num(raw.paymentType),
    paymentsNum: num(raw.paymentsNum),
    allPaymentsNum: num(raw.allPaymentsNum ?? raw.allPaymentNum),
    firstPaymentSum: num(raw.firstPaymentSum) ?? 0,
    periodicalPaymentSum: num(raw.periodicalPaymentSum) ?? 0,
    paymentDate: text(raw.paymentDate),
    asmachta: text(raw.asmachta),
    description: text(raw.description ?? raw.paymentDesc),
    fullName: text(raw.fullName),
    payerPhone: text(raw.payerPhone),
    payerEmail: text(raw.payerEmail),
    cardSuffix: text(raw.cardSuffix),
    cardType: text(raw.cardType),
    cardTypeCode: num(raw.cardTypeCode),
    cardBrand: text(raw.cardBrand),
    cardBrandCode: num(raw.cardBrandCode),
    cardExp: text(raw.cardExp),
    customFields,
    raw,
  };
}

/** Grow statusCode 2 = paid ("שולם"). */
export function isPaidStatus(update: Pick<GrowServerUpdate, 'statusCode' | 'status'>): boolean {
  if (update.statusCode !== null) return update.statusCode === 2;
  return /שולם|paid|success/i.test(update.status);
}

// ---------------------------------------------------------------------------
// getPaymentLinkInfo (Make scenario 1, route get_payment_link_info) – optional verification
// ---------------------------------------------------------------------------

type Rec = Record<string, unknown>;
const isRec = (value: unknown): value is Rec => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Grow › Get Payment Link Info returns
 *   { paymentLinkProcessId, paymentLinkProcessToken, paymentLinkType,
 *     paymentLinkTransactions: [{ processId, processToken, customField: { cField1… }, transactions: [{…}] }] }
 * (Make forwards it as-is, possibly wrapped in { status, err, data }). Pick the transaction we were
 * notified about and reshape it into the flat server-update form so one parser serves both paths.
 */
export function extractPaymentLinkTransaction(json: unknown, transactionId?: string): GrowServerUpdate | null {
  if (!isRec(json)) return null;
  const data = isRec(json.data) && Array.isArray(json.data.paymentLinkTransactions) ? json.data : json;
  const links = Array.isArray(data.paymentLinkTransactions) ? data.paymentLinkTransactions.filter(isRec) : null;

  // Not the payment-link shape – assume a flat server update.
  if (!links) return parseGrowServerUpdate(json);

  const wanted = (transactionId || '').trim();
  const candidates: Array<{ link: Rec; transaction: Rec }> = [];
  for (const link of links) {
    const transactions = Array.isArray(link.transactions) ? link.transactions.filter(isRec) : [];
    for (const transaction of transactions) candidates.push({ link, transaction });
  }
  if (!candidates.length) return null;

  const pick =
    (wanted && candidates.find((c) => str(c.transaction.transactionId) === wanted)) ||
    (!wanted && (candidates.find((c) => num(str(c.transaction.statusCode)) === 2) || candidates[candidates.length - 1])) ||
    null;
  if (!pick) return null;

  const customFields = isRec(pick.link.customField)
    ? pick.link.customField
    : isRec(pick.link.customFields)
      ? pick.link.customFields
      : {};

  return parseGrowServerUpdate({
    ...pick.transaction,
    processId: pick.transaction.processId ?? pick.link.processId,
    processToken: pick.transaction.processToken ?? pick.link.processToken,
    paymentLinkProcessId: pick.transaction.paymentLinkProcessId ?? data.paymentLinkProcessId,
    paymentLinkProcessToken: pick.transaction.paymentLinkProcessToken ?? data.paymentLinkProcessToken,
    customFields,
  });
}

/**
 * Returns Grow's authoritative record of the transaction we were notified about, or `null` when
 * the verification route is not configured. Throws GrowApiError when Make/Grow could not be
 * reached or when Grow has no such transaction on the payment link.
 */
export async function getPaymentLinkInfo(
  paymentLinkProcessId: string,
  paymentLinkProcessToken: string,
  transactionId = ''
): Promise<GrowServerUpdate | null> {
  const { linkInfoWebhookUrl, secret } = getGrowConfig();
  if (!linkInfoWebhookUrl) return null;

  const json = await makeRequest('getPaymentLinkInfo', linkInfoWebhookUrl, {
    event: 'get_payment_link_info',
    secret,
    paymentLinkProcessId,
    paymentLinkProcessToken,
    transactionId,
  });

  if (!isRec(json)) {
    throw new GrowApiError('getPaymentLinkInfo', 'Make returned an unexpected response', null, json);
  }
  const update = extractPaymentLinkTransaction(json, transactionId);
  if (!update || (!update.transactionId && !update.statusCode)) {
    throw new GrowApiError(
      'getPaymentLinkInfo',
      transactionId
        ? `transaction ${transactionId} is not listed on payment link ${paymentLinkProcessId}`
        : `payment link ${paymentLinkProcessId} has no transactions`,
      null,
      json
    );
  }
  return update;
}
