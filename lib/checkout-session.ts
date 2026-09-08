/**
 * Client-side hand-off between /checkout (details) and /checkout/payment.
 * Stored in sessionStorage so a refresh on the payment page keeps working.
 */

export interface CheckoutSessionItem {
  title: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  image: string | null;
}

export interface CheckoutSession {
  ref: string;
  sig: string;
  draftName: string;
  paymentUrl: string;
  processId: string;
  expiresAt: number;
  method?: 'card' | 'apple';
  openMode?: 'iframe' | 'redirect';
  applePayAvailable?: boolean;
  summary: {
    currency: string;
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    items: CheckoutSessionItem[];
    customer: {
      fullName: string;
      email: string;
      phone: string;
      addressLine: string;
      city: string;
    };
  };
}

const STORAGE_KEY = 'klumit.checkout.session';
const FORM_KEY = 'klumit.checkout.form';

export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  apartment: string;
  floor: string;
  notes: string;
}

/** Keep what the shopper typed so "edit details" from the payment page never empties the form. */
export function saveCheckoutForm(values: CheckoutFormValues): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(FORM_KEY, JSON.stringify(values));
  } catch {
    // ignore
  }
}

export function loadCheckoutForm(): Partial<CheckoutFormValues> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(FORM_KEY);
    return raw ? (JSON.parse(raw) as Partial<CheckoutFormValues>) : null;
  } catch {
    return null;
  }
}

export function clearCheckoutForm(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(FORM_KEY);
  } catch {
    // ignore
  }
}

export function saveCheckoutSession(session: CheckoutSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage may be unavailable (private mode) – the page will fall back to /checkout
  }
}

export function loadCheckoutSession(): CheckoutSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutSession;
    if (!parsed?.ref || !parsed?.paymentUrl || !parsed?.summary) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  clearCheckoutForm();
}

/** If Grow redirected inside our iframe, move the whole window to the same URL. */
export function breakOutOfIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.self !== window.top && window.top) {
      window.top.location.href = window.location.href;
      return true;
    }
  } catch {
    // cross-origin top – nothing we can do
  }
  return false;
}
