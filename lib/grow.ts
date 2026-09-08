import 'server-only';

/**
 * Grow (Meshulam) Light API integration.
 *
 * Official reference: https://developers.grow.business/reference/the-process
 *
 * Rules that matter (and that break integrations when ignored):
 * - Every request is multipart/form-data, never JSON.
 * - Every response is HTTP 200; success is `status: 1`, failure is `status: 0` + `err`.
 * - All calls are server-side only (Grow sends no CORS headers).
 * - After a successful payment Grow POSTs a "server update" to `notifyUrl`; we must
 *   reply 200 and then call `approveTransaction` with the data we received.
 *
 * Required environment variables (issued by Grow during onboarding):
 *   GROW_USER_ID      – business identifier (16 hex chars)
 *   GROW_PAGE_CODE    – payment page identifier (12 hex chars)
 *   GROW_ENVIRONMENT  – "sandbox" | "production" (default: production)
 * Optional:
 *   GROW_APPLE_PAGE_CODE  – Apple Pay page (sandbox demo: 9eeea7787d67)
 *   GROW_GOOGLE_PAGE_CODE – Google Pay page (sandbox demo: 77a2993849cd)
 *   GROW_MAX_PAYMENTS – if > 1, lets the customer choose up to N installments
 */

const GROW_ENVIRONMENT = process.env.GROW_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';

/** Grow docs demo wallet pages — only used automatically in sandbox. */
const SANDBOX_APPLE_PAGE_CODE = '9eeea7787d67';
const SANDBOX_GOOGLE_PAGE_CODE = '77a2993849cd';

const GROW_BASE_URL =
  GROW_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox.meshulam.co.il/api/light/server/1.0'
    : 'https://secure.meshulam.co.il/api/light/server/1.0';

const REQUEST_TIMEOUT_MS = 20_000;

/** Grow payment page links stop working after roughly 10 minutes. */
export const GROW_PAYMENT_URL_TTL_MS = 10 * 60 * 1000;

export type GrowPaymentMethod = 'card' | 'apple' | 'google';

/** transactionTypeId values reported by Grow. */
export const GROW_TRANSACTION_TYPES: Record<number, string> = {
  1: 'כרטיס אשראי',
  6: 'bit',
  13: 'Apple Pay',
  14: 'Google Pay',
};

export function getGrowConfig() {
  const explicitApple = process.env.GROW_APPLE_PAGE_CODE?.trim() || '';
  const explicitGoogle = process.env.GROW_GOOGLE_PAGE_CODE?.trim() || '';
  return {
    userId: process.env.GROW_USER_ID?.trim() || '',
    pageCode: process.env.GROW_PAGE_CODE?.trim() || '',
    applePageCode:
      explicitApple || (GROW_ENVIRONMENT === 'sandbox' ? SANDBOX_APPLE_PAGE_CODE : ''),
    googlePageCode:
      explicitGoogle || (GROW_ENVIRONMENT === 'sandbox' ? SANDBOX_GOOGLE_PAGE_CODE : ''),
    environment: GROW_ENVIRONMENT,
    baseUrl: GROW_BASE_URL,
    maxPayments: Math.max(1, Number(process.env.GROW_MAX_PAYMENTS || 1) || 1),
  };
}

export function isGrowConfigured(): boolean {
  const { userId, pageCode } = getGrowConfig();
  return Boolean(userId && pageCode);
}

export function isApplePayConfigured(): boolean {
  const { userId, applePageCode } = getGrowConfig();
  return Boolean(userId && applePageCode);
}

export function isGooglePayConfigured(): boolean {
  const { userId, googlePageCode } = getGrowConfig();
  return Boolean(userId && googlePageCode);
}

export function pageCodeForMethod(method: GrowPaymentMethod = 'card'): string {
  const { pageCode, applePageCode, googlePageCode } = getGrowConfig();
  if (method === 'apple') {
    if (!applePageCode) {
      throw new GrowApiError('createPaymentProcess', 'GROW_APPLE_PAGE_CODE is not configured', null, null);
    }
    return applePageCode;
  }
  if (method === 'google') {
    if (!googlePageCode) {
      throw new GrowApiError('createPaymentProcess', 'GROW_GOOGLE_PAGE_CODE is not configured', null, null);
    }
    return googlePageCode;
  }
  return pageCode;
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

type FormValue = string | number | boolean | null | undefined;

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

async function growRequest<T>(method: string, fields: Record<string, FormValue>): Promise<T> {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    body.append(key, String(value));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${GROW_BASE_URL}/${method}`, {
      method: 'POST',
      body,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network error';
    throw new GrowApiError(method, `request failed (${reason})`, null, error);
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let json: { status?: unknown; err?: unknown; data?: unknown };
  try {
    json = JSON.parse(text);
  } catch {
    throw new GrowApiError(method, `non-JSON response (HTTP ${response.status})`, null, text.slice(0, 300));
  }

  if (Number(json.status) !== 1) {
    const { code, message } = normalizeError(json.err);
    throw new GrowApiError(method, message, code, json);
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// createPaymentProcess
// ---------------------------------------------------------------------------

export interface GrowProductLine {
  description: string;
  quantity: number;
  price: number;
}

export interface CreatePaymentProcessInput {
  /** Total amount in ILS. */
  sum: number;
  description: string;
  fullName: string;
  phone: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  /** card (default GROW_PAGE_CODE), apple, or google wallet pages. */
  method?: GrowPaymentMethod;
  /** Up to 9 custom fields echoed back in the server update. */
  customFields?: Partial<Record<'cField1' | 'cField2' | 'cField3' | 'cField4' | 'cField5', string>>;
  /** Optional invoice lines. */
  products?: GrowProductLine[];
  invoiceName?: string;
}

export interface GrowPaymentProcess {
  processId: string;
  processToken: string;
  url: string;
}

function buildCreateFields(input: CreatePaymentProcessInput, withProducts: boolean): Record<string, FormValue> {
  const { userId, maxPayments } = getGrowConfig();
  const pageCode = pageCodeForMethod(input.method || 'card');

  const fields: Record<string, FormValue> = {
    userId,
    pageCode,
    chargeType: 1,
    sum: input.sum.toFixed(2),
    description: sanitizeGrowText(input.description),
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    notifyUrl: input.notifyUrl,
    'pageField[fullName]': sanitizeGrowText(input.fullName, 60),
    'pageField[phone]': toIsraeliMobile(input.phone),
    'pageField[email]': input.email,
    'pageField[invoiceName]': input.invoiceName ? sanitizeGrowText(input.invoiceName, 60) : undefined,
  };

  // paymentNum and maxPaymentNum are mutually exclusive (err 736).
  if (maxPayments > 1) fields.maxPaymentNum = maxPayments;
  else fields.paymentNum = 1;

  for (const [key, value] of Object.entries(input.customFields || {})) {
    if (value) fields[key] = sanitizeGrowText(value, 60);
  }

  if (withProducts && input.products?.length) {
    input.products.forEach((line, index) => {
      fields[`productData[${index}][itemDescription]`] = sanitizeGrowText(line.description, 80);
      fields[`productData[${index}][quantity]`] = line.quantity;
      fields[`productData[${index}][price]`] = line.price.toFixed(2);
    });
  }

  return fields;
}

export async function createPaymentProcess(input: CreatePaymentProcessInput): Promise<GrowPaymentProcess> {
  if (!isGrowConfigured()) {
    throw new GrowApiError('createPaymentProcess', 'GROW_USER_ID / GROW_PAGE_CODE are not configured', null, null);
  }

  const parse = (data: unknown): GrowPaymentProcess => {
    const d = (data || {}) as { processId?: unknown; processToken?: unknown; url?: unknown };
    if (!d.url || !d.processId || !d.processToken) {
      throw new GrowApiError('createPaymentProcess', 'response is missing url/processId/processToken', null, data);
    }
    return {
      processId: String(d.processId),
      processToken: String(d.processToken),
      url: String(d.url).replace(/\\\//g, '/'),
    };
  };

  try {
    return parse(await growRequest('createPaymentProcess', buildCreateFields(input, true)));
  } catch (error) {
    // Invoice lines are optional; if Grow rejects them, retry with the bare request.
    if (error instanceof GrowApiError && error.code !== null && input.products?.length) {
      return parse(await growRequest('createPaymentProcess', buildCreateFields(input, false)));
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Server update (notifyUrl) parsing
// ---------------------------------------------------------------------------

export interface GrowServerUpdate {
  transactionId: string;
  transactionToken: string;
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
  customFields: Record<string, string>;
  /** Every field Grow sent, flattened, for approveTransaction passthrough. */
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
    // Grow may send the payload nested under "data" (as an object or as a JSON string).
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
      // Bracket-style keys: data[transactionId]
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
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export function parseGrowServerUpdate(payload: Record<string, unknown>): GrowServerUpdate {
  const raw = flattenGrowPayload(payload);

  const customFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const direct = key.match(/^cField(\d)$/);
    const nested = key.match(/^customFields?\[(cField\d)\]$/);
    if (direct) customFields[`cField${direct[1]}`] = value;
    else if (nested) customFields[nested[1]] = value;
  }

  return {
    transactionId: raw.transactionId || '',
    transactionToken: raw.transactionToken || '',
    processId: raw.processId || '',
    processToken: raw.processToken || '',
    statusCode: num(raw.statusCode),
    status: raw.status || '',
    sum: num(raw.sum) ?? 0,
    transactionTypeId: num(raw.transactionTypeId ?? raw.TransactionTypeId),
    paymentType: num(raw.paymentType),
    paymentsNum: num(raw.paymentsNum),
    allPaymentsNum: num(raw.allPaymentsNum),
    firstPaymentSum: num(raw.firstPaymentSum) ?? 0,
    periodicalPaymentSum: num(raw.periodicalPaymentSum) ?? 0,
    paymentDate: raw.paymentDate || '',
    asmachta: raw.asmachta || '',
    description: raw.description || '',
    fullName: raw.fullName || '',
    payerPhone: raw.payerPhone || '',
    payerEmail: raw.payerEmail || '',
    cardSuffix: raw.cardSuffix || '',
    cardType: raw.cardType || '',
    cardTypeCode: num(raw.cardTypeCode),
    cardBrand: raw.cardBrand || '',
    cardBrandCode: num(raw.cardBrandCode),
    cardExp: raw.cardExp || '',
    customFields,
    raw,
  };
}

// ---------------------------------------------------------------------------
// getPaymentProcessInfo – authoritative status check (server to server)
// ---------------------------------------------------------------------------

export interface GrowProcessInfo {
  statusCode: number | null;
  status: string;
  sum: number;
  transactionId: string;
  transactionToken: string;
  transactionTypeId: number | null;
  asmachta: string;
  cardSuffix: string;
  cardBrand: string;
  fullName: string;
  payerPhone: string;
  payerEmail: string;
  customFields: Record<string, string>;
  raw: Record<string, string>;
}

export async function getPaymentProcessInfo(processId: string, processToken: string): Promise<GrowProcessInfo> {
  const { pageCode } = getGrowConfig();
  const data = await growRequest<Record<string, unknown>>('getPaymentProcessInfo', {
    pageCode,
    processId,
    processToken,
  });
  const parsed = parseGrowServerUpdate(data || {});
  return {
    statusCode: parsed.statusCode,
    status: parsed.status,
    sum: parsed.sum,
    transactionId: parsed.transactionId,
    transactionToken: parsed.transactionToken,
    transactionTypeId: parsed.transactionTypeId,
    asmachta: parsed.asmachta,
    cardSuffix: parsed.cardSuffix,
    cardBrand: parsed.cardBrand,
    fullName: parsed.fullName,
    payerPhone: parsed.payerPhone,
    payerEmail: parsed.payerEmail,
    customFields: parsed.customFields,
    raw: parsed.raw,
  };
}

// ---------------------------------------------------------------------------
// approveTransaction – mandatory acknowledgement after a successful payment
// ---------------------------------------------------------------------------

const APPROVE_PASSTHROUGH_FIELDS = [
  'transactionId',
  'transactionToken',
  'transactionTypeId',
  'paymentType',
  'sum',
  'firstPaymentSum',
  'periodicalPaymentSum',
  'paymentsNum',
  'allPaymentsNum',
  'paymentDate',
  'asmachta',
  'description',
  'fullName',
  'payerPhone',
  'payerEmail',
  'cardSuffix',
  'cardType',
  'cardTypeCode',
  'cardBrand',
  'cardBrandCode',
  'cardExp',
  'processId',
  'processToken',
  'paymentLinkProcessId',
  'paymentLinkProcessToken',
] as const;

/**
 * Returns true when Grow acknowledged the approval (or had already done so).
 * Throws GrowApiError on a hard failure so callers can log/alert.
 */
export async function approveTransaction(update: GrowServerUpdate): Promise<boolean> {
  const { pageCode } = getGrowConfig();
  const fields: Record<string, FormValue> = { pageCode };

  for (const key of APPROVE_PASSTHROUGH_FIELDS) {
    const value = update.raw[key];
    if (value !== undefined && value !== '') fields[key] = value;
  }
  // Ensure the essentials are present even if the raw payload used odd casing.
  fields.transactionId = update.transactionId;
  fields.transactionToken = update.transactionToken;
  fields.processId = update.processId;
  fields.processToken = update.processToken;
  if (update.transactionTypeId !== null) fields.transactionTypeId = update.transactionTypeId;

  try {
    await growRequest('approveTransaction', fields);
    return true;
  } catch (error) {
    // 712 = transaction already processed/approved – treat as success.
    if (error instanceof GrowApiError && error.code === 712) return true;
    throw error;
  }
}
