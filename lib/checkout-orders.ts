import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Shopify Admin API helpers for the two-step checkout:
 *   1. /checkout          – customer details → draft order (inventory reserved)
 *   2. /checkout/payment  – Grow payment (embedded)
 *   → webhook completes the draft order and marks it paid.
 */

const ADMIN_API_VERSION = '2026-07';

/**
 * Inventory is deliberately NOT reserved while the customer pays: a product must keep
 * showing as available to everyone until a payment is actually confirmed. Stock is
 * committed only when the Grow webhook completes the draft order.
 */

/** Fallback shipping rule (matches the store's terms) if Shopify returns no rates. */
const FREE_SHIPPING_THRESHOLD = 500;
const STANDARD_SHIPPING_PRICE = 39;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.klumit-online.co.il').replace(/\/$/, '');

function getStoreDomain(): string {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
  return domain.includes('.myshopify.com') ? domain : `${domain}.myshopify.com`;
}

async function adminGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!token) throw new Error('SHOPIFY_ADMIN_API_TOKEN is not configured');

  const response = await fetch(`https://${getStoreDomain()}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!response.ok || json.errors?.length) {
    const message = json.errors?.map((e) => e.message).join('; ') || `HTTP ${response.status}`;
    throw new Error(`Shopify Admin API: ${message}`);
  }
  if (!json.data) throw new Error('Shopify Admin API: empty response');
  return json.data;
}

// ---------------------------------------------------------------------------
// Signed references (protect /api/checkout/status and payment-session)
// ---------------------------------------------------------------------------

function signingSecret(): string {
  const secret =
    process.env.CHECKOUT_SIGNING_SECRET ||
    process.env.SHOPIFY_WEBHOOK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!secret) throw new Error('No secret available for checkout reference signing');
  return secret;
}

export function draftIdToRef(draftGid: string): string {
  return draftGid.replace('gid://shopify/DraftOrder/', '');
}

export function refToDraftGid(ref: string): string {
  return ref.startsWith('gid://') ? ref : `gid://shopify/DraftOrder/${ref}`;
}

export function signRef(ref: string): string {
  return createHmac('sha256', signingSecret()).update(ref).digest('hex').slice(0, 24);
}

export function verifyRef(ref: string, sig: string | null | undefined): boolean {
  if (!ref || !sig || !/^\d+$/.test(ref)) return false;
  const expected = Buffer.from(signRef(ref));
  const provided = Buffer.from(sig);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckoutCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  /** E.164, e.g. +972501234567 */
  phone: string;
  address: string;
  city: string;
  zipCode?: string;
  apartment?: string;
  floor?: string;
  notes?: string;
}

export interface CheckoutLineInput {
  variantId: string;
  quantity: number;
}

export interface OrderSummaryItem {
  title: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  image: string | null;
}

export interface DraftOrderSummary {
  id: string;
  ref: string;
  sig: string;
  name: string;
  status: 'OPEN' | 'INVOICE_SENT' | 'COMPLETED';
  currency: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderSummaryItem[];
  customer: {
    fullName: string;
    email: string;
    phone: string;
    addressLine: string;
    city: string;
  };
  order: { id: string; name: string; financialStatus: string } | null;
}

const MONEY = `{ shopMoney { amount currencyCode } }`;

/**
 * Note: on the Basic Shopify plan custom apps may not READ customer PII (email, phone,
 * addresses) back from the API, even though writing it on the draft order works. We
 * therefore mirror the few details the checkout needs into customAttributes.
 */
const CUSTOMER_ATTRIBUTE_KEYS = {
  fullName: 'customer_name',
  phone: 'customer_phone',
  email: 'customer_email',
  addressLine: 'shipping_address',
  city: 'shipping_city',
} as const;

const DRAFT_ORDER_FIELDS = `
  id
  name
  status
  subtotalPriceSet ${MONEY}
  totalShippingPriceSet ${MONEY}
  totalDiscountsSet ${MONEY}
  totalPriceSet ${MONEY}
  customAttributes { key value }
  order { id name displayFinancialStatus }
  lineItems(first: 50) {
    edges {
      node {
        title
        quantity
        variantTitle
        originalUnitPriceSet ${MONEY}
        image { url }
      }
    }
  }
`;

interface DraftOrderNode {
  id: string;
  name: string;
  status: 'OPEN' | 'INVOICE_SENT' | 'COMPLETED';
  subtotalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  totalShippingPriceSet: { shopMoney: { amount: string } };
  totalDiscountsSet: { shopMoney: { amount: string } };
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  customAttributes: Array<{ key: string; value: string | null }>;
  order: { id: string; name: string; displayFinancialStatus: string } | null;
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variantTitle: string | null;
        originalUnitPriceSet: { shopMoney: { amount: string } };
        image: { url: string } | null;
      };
    }>;
  };
}

function toSummary(node: DraftOrderNode): DraftOrderSummary {
  const ref = draftIdToRef(node.id);
  const attr = (key: string) => node.customAttributes.find((a) => a.key === key)?.value || '';
  return {
    id: node.id,
    ref,
    sig: signRef(ref),
    name: node.name,
    status: node.status,
    currency: node.totalPriceSet.shopMoney.currencyCode,
    subtotal: Number(node.subtotalPriceSet.shopMoney.amount),
    shipping: Number(node.totalShippingPriceSet.shopMoney.amount),
    discount: Number(node.totalDiscountsSet.shopMoney.amount),
    total: Number(node.totalPriceSet.shopMoney.amount),
    items: node.lineItems.edges.map(({ node: line }) => ({
      title: line.title,
      variantTitle: line.variantTitle && line.variantTitle !== 'Default Title' ? line.variantTitle : null,
      quantity: line.quantity,
      unitPrice: Number(line.originalUnitPriceSet.shopMoney.amount),
      image: line.image?.url ?? null,
    })),
    customer: {
      fullName: attr(CUSTOMER_ATTRIBUTE_KEYS.fullName),
      email: attr(CUSTOMER_ATTRIBUTE_KEYS.email),
      phone: attr(CUSTOMER_ATTRIBUTE_KEYS.phone),
      addressLine: attr(CUSTOMER_ATTRIBUTE_KEYS.addressLine),
      city: attr(CUSTOMER_ATTRIBUTE_KEYS.city),
    },
    order: node.order
      ? { id: node.order.id, name: node.order.name, financialStatus: node.order.displayFinancialStatus }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Availability check (right before opening the payment form)
// ---------------------------------------------------------------------------

export interface UnavailableLine {
  variantId: string;
  title: string;
  requested: number;
  available: number;
}

/**
 * Confirms every requested variant can still be sold, using the Storefront API
 * (the customer-facing truth, no PII involved). Returns the lines that can't be fulfilled.
 */
export async function findUnavailableLines(lines: CheckoutLineInput[]): Promise<UnavailableLine[]> {
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!token) return [];

  const response = await fetch(`https://${getStoreDomain()}/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({
      query: `query variants($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on ProductVariant { id title availableForSale quantityAvailable product { title } }
        }
      }`,
      variables: { ids: lines.map((l) => l.variantId) },
    }),
    cache: 'no-store',
  });

  const json = (await response.json()) as {
    data?: {
      nodes: Array<{
        id: string;
        title: string;
        availableForSale: boolean;
        quantityAvailable: number | null;
        product: { title: string };
      } | null>;
    };
  };

  const byId = new Map((json.data?.nodes ?? []).filter(Boolean).map((n) => [n!.id, n!]));
  const unavailable: UnavailableLine[] = [];

  for (const line of lines) {
    const node = byId.get(line.variantId);
    if (!node) continue; // unknown variant – let Shopify decide at draft creation
    const available = node.quantityAvailable ?? (node.availableForSale ? line.quantity : 0);
    if (!node.availableForSale || available < line.quantity) {
      unavailable.push({
        variantId: line.variantId,
        title: node.title && node.title !== 'Default Title' ? `${node.product.title} – ${node.title}` : node.product.title,
        requested: line.quantity,
        available: Math.max(0, available),
      });
    }
  }
  return unavailable;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

async function findCustomerIdByEmail(email: string): Promise<string | null> {
  try {
    const data = await adminGraphQL<{ customers: { edges: Array<{ node: { id: string } }> } }>(
      `query findCustomer($query: String!) { customers(first: 1, query: $query) { edges { node { id } } } }`,
      { query: `email:${email}` }
    );
    return data.customers.edges[0]?.node.id ?? null;
  } catch {
    return null;
  }
}

interface ShippingRate {
  handle: string;
  title: string;
  price: { amount: string };
}

async function pickShippingLine(baseInput: Record<string, unknown>, subtotalHint: number) {
  const data = await adminGraphQL<{
    draftOrderCalculate: {
      calculatedDraftOrder: {
        subtotalPriceSet: { shopMoney: { amount: string } };
        availableShippingRates: ShippingRate[];
      } | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>(
    `mutation calc($input: DraftOrderInput!) {
      draftOrderCalculate(input: $input) {
        calculatedDraftOrder {
          subtotalPriceSet ${MONEY}
          availableShippingRates { handle title price { amount } }
        }
        userErrors { field message }
      }
    }`,
    { input: baseInput }
  );

  const result = data.draftOrderCalculate;
  if (result.userErrors.length) {
    throw new Error(result.userErrors.map((e) => e.message).join('; '));
  }

  const rates = result.calculatedDraftOrder?.availableShippingRates ?? [];
  if (rates.length) {
    const cheapest = [...rates].sort((a, b) => Number(a.price.amount) - Number(b.price.amount))[0];
    return { shippingRateHandle: cheapest.handle };
  }

  const subtotal = Number(result.calculatedDraftOrder?.subtotalPriceSet.shopMoney.amount ?? subtotalHint);
  return {
    title: 'משלוח עד הבית',
    priceWithCurrency: {
      amount: subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_PRICE,
      currencyCode: 'ILS',
    },
  };
}

export async function createCheckoutDraftOrder(params: {
  customer: CheckoutCustomerInput;
  lines: CheckoutLineInput[];
  discountCode?: string | null;
  subtotalHint?: number;
}): Promise<DraftOrderSummary> {
  const { customer, lines, discountCode } = params;

  const address2 = [
    customer.apartment ? `דירה ${customer.apartment}` : '',
    customer.floor ? `קומה ${customer.floor}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const mailingAddress = {
    firstName: customer.firstName,
    lastName: customer.lastName,
    address1: customer.address,
    address2: address2 || undefined,
    city: customer.city,
    zip: customer.zipCode || undefined,
    countryCode: 'IL',
    phone: customer.phone,
  };

  const baseInput: Record<string, unknown> = {
    lineItems: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    email: customer.email,
    phone: customer.phone,
    shippingAddress: mailingAddress,
    billingAddress: mailingAddress,
    acceptAutomaticDiscounts: true,
    ...(discountCode ? { discountCodes: [discountCode] } : {}),
  };

  const [shippingLine, customerId] = await Promise.all([
    pickShippingLine(baseInput, params.subtotalHint ?? 0),
    findCustomerIdByEmail(customer.email),
  ]);

  const input: Record<string, unknown> = {
    ...baseInput,
    shippingLine,
    tags: ['klumit-web', 'grow', 'awaiting-payment'],
    note: customer.notes ? `הערות לקוח: ${customer.notes}` : undefined,
    customAttributes: [
      { key: 'source', value: 'klumit-online.co.il' },
      { key: 'payment_provider', value: 'grow' },
      { key: CUSTOMER_ATTRIBUTE_KEYS.fullName, value: `${customer.firstName} ${customer.lastName}`.trim() },
      { key: CUSTOMER_ATTRIBUTE_KEYS.phone, value: customer.phone },
      { key: CUSTOMER_ATTRIBUTE_KEYS.email, value: customer.email },
      { key: CUSTOMER_ATTRIBUTE_KEYS.addressLine, value: [customer.address, address2].filter(Boolean).join(', ') },
      { key: CUSTOMER_ATTRIBUTE_KEYS.city, value: customer.city },
      ...(customer.notes ? [{ key: 'הערות משלוח', value: customer.notes }] : []),
    ],
    ...(customerId ? { purchasingEntity: { customerId } } : {}),
  };

  const data = await adminGraphQL<{
    draftOrderCreate: {
      draftOrder: DraftOrderNode | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>(
    `mutation createDraft($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { ${DRAFT_ORDER_FIELDS} }
        userErrors { field message }
      }
    }`,
    { input }
  );

  const result = data.draftOrderCreate;
  if (result.userErrors.length || !result.draftOrder) {
    throw new Error(result.userErrors.map((e) => e.message).join('; ') || 'draftOrderCreate returned no draft order');
  }

  return toSummary(result.draftOrder);
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getDraftOrderSummary(draftGid: string): Promise<DraftOrderSummary | null> {
  const data = await adminGraphQL<{ draftOrder: DraftOrderNode | null }>(
    `query getDraft($id: ID!) { draftOrder(id: $id) { ${DRAFT_ORDER_FIELDS} } }`,
    { id: draftGid }
  );
  return data.draftOrder ? toSummary(data.draftOrder) : null;
}

// ---------------------------------------------------------------------------
// Complete + mark paid (called from the Grow webhook)
// ---------------------------------------------------------------------------

export interface PaymentRecord {
  provider: 'grow';
  transactionId: string;
  asmachta: string;
  method: string;
  cardBrand: string;
  cardSuffix: string;
  installments: number | null;
  amount: number;
}

export async function completeDraftOrderAsPaid(
  draftGid: string,
  payment: PaymentRecord
): Promise<{ orderId: string; orderName: string }> {
  const completion = await adminGraphQL<{
    draftOrderComplete: {
      draftOrder: { id: string; order: { id: string; name: string; displayFinancialStatus: string } | null } | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>(
    `mutation completeDraft($id: ID!) {
      draftOrderComplete(id: $id, sourceName: "web") {
        draftOrder { id order { id name displayFinancialStatus } }
        userErrors { field message }
      }
    }`,
    { id: draftGid }
  );

  const result = completion.draftOrderComplete;
  const order = result.draftOrder?.order;
  if (result.userErrors.length || !order) {
    throw new Error(result.userErrors.map((e) => e.message).join('; ') || 'draftOrderComplete returned no order');
  }

  if (order.displayFinancialStatus !== 'PAID') {
    const paid = await adminGraphQL<{
      orderMarkAsPaid: { order: { id: string } | null; userErrors: Array<{ message: string }> };
    }>(
      `mutation markPaid($input: OrderMarkAsPaidInput!) {
        orderMarkAsPaid(input: $input) { order { id } userErrors { message } }
      }`,
      { input: { id: order.id } }
    );
    if (paid.orderMarkAsPaid.userErrors.length) {
      // Not fatal: the order exists; surface in the note below and let the merchant see it.
      console.error('orderMarkAsPaid failed:', paid.orderMarkAsPaid.userErrors.map((e) => e.message).join('; '));
    }
  }

  const methodLabel = [payment.method, payment.cardBrand, payment.cardSuffix ? `****${payment.cardSuffix}` : '']
    .filter(Boolean)
    .join(' ');
  const installments = payment.installments && payment.installments > 1 ? ` · ${payment.installments} תשלומים` : '';
  const note =
    `תשלום אושר דרך Grow · ${methodLabel}${installments} · אסמכתא ${payment.asmachta || '-'} · ` +
    `עסקה ${payment.transactionId} · ₪${payment.amount.toFixed(2)} · ${new Date().toLocaleString('he-IL')}`;

  await adminGraphQL<{ orderUpdate: { userErrors: Array<{ message: string }> } }>(
    `mutation noteOrder($input: OrderInput!) {
      orderUpdate(input: $input) { userErrors { message } }
    }`,
    {
      input: {
        id: order.id,
        tags: ['klumit-web', 'grow', 'Paid via Grow'],
        note,
        customAttributes: [
          { key: 'payment_provider', value: 'grow' },
          { key: 'grow_transaction_id', value: payment.transactionId },
          { key: 'grow_asmachta', value: payment.asmachta || '' },
          { key: 'payment_method', value: methodLabel },
        ],
      },
    }
  ).catch((error) => console.error('orderUpdate (payment note) failed:', error));

  return { orderId: order.id, orderName: order.name };
}
