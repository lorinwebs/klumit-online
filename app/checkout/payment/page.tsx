'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Pencil, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import TrustStrip from '@/components/checkout/TrustStrip';
import {
  breakOutOfIframe,
  loadCheckoutSession,
  saveCheckoutSession,
  type CheckoutSession,
} from '@/lib/checkout-session';

const formatPrice = (amount: number) => Math.round(amount).toLocaleString('he-IL');

function PaymentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('response') === 'cancel';

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const refreshedForCancel = useRef(false);

  // Grow redirects to cancelUrl *inside* the iframe – move the whole window.
  useEffect(() => {
    if (breakOutOfIframe()) return;
    const stored = loadCheckoutSession();
    if (!stored) {
      router.replace('/checkout');
      return;
    }
    setSession(stored);
    setReady(true);
  }, [router]);

  const requestFreshSession = useCallback(
    async (current: CheckoutSession) => {
      setRefreshing(true);
      setRefreshError(null);
      try {
        const response = await fetch('/api/checkout/payment-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref: current.ref, sig: current.sig }),
        });
        const data = (await response.json().catch(() => null)) as
          | (CheckoutSession & { error?: string; orderName?: string; message?: string })
          | null;

        if (response.status === 409) {
          // Already paid – go to the confirmation page.
          router.replace(`/checkout/success?ref=${current.ref}&sig=${current.sig}`);
          return;
        }
        if (!response.ok || !data?.paymentUrl) {
          throw new Error(data?.message || 'לא ניתן לפתוח את טופס התשלום כרגע. נסו שוב בעוד רגע.');
        }
        saveCheckoutSession(data);
        setSession(data);
        setExpired(false);
        setFrameLoaded(false);
      } catch (error) {
        setRefreshError(error instanceof Error ? error.message : 'שגיאה בפתיחת טופס התשלום');
      } finally {
        setRefreshing(false);
      }
    },
    [router]
  );

  // After a cancel inside the form, open a fresh payment form once and explain what happened.
  useEffect(() => {
    if (!ready || !session || !cancelled || refreshedForCancel.current) return;
    refreshedForCancel.current = true;
    setNotice('התשלום לא הושלם. אפשר לנסות שוב או לבחור אמצעי תשלום אחר — הפרטים שלך נשמרו.');
    requestFreshSession(session);
    router.replace('/checkout/payment');
  }, [ready, session, cancelled, requestFreshSession, router]);

  // Grow links are short-lived; refresh automatically when they expire.
  useEffect(() => {
    if (!session) return;
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      setExpired(true);
      return;
    }
    const timer = setTimeout(() => setExpired(true), remaining);
    return () => clearTimeout(timer);
  }, [session]);

  const summary = session?.summary;
  const itemCount = useMemo(() => summary?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0, [summary]);

  if (!ready || !session || !summary) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
        <Header />
        <main className="flex-grow max-w-4xl mx-auto px-4 py-12 md:py-20 w-full">
          <div className="text-center" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a] mx-auto" aria-hidden="true" />
            <p className="text-sm font-light text-gray-600 mt-4">מעביר לתשלום מאובטח...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-1" role="main">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="mb-4 md:mb-5">
            <CheckoutSteps current={2} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg md:text-xl font-light luxury-font text-right flex items-center gap-2">
              <Lock size={16} strokeWidth={1.5} className="text-black/60" aria-hidden />
              תשלום מאובטח
            </h1>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 text-xs font-light text-black/60 hover:text-black transition-colors"
            >
              <Pencil size={12} strokeWidth={1.5} aria-hidden />
              עריכת פרטים
            </Link>
          </div>

          {notice && (
            <div role="status" className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm font-light text-right">
              {notice}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-5">
            {/* Order summary – first in RTL reading order */}
            <aside className="md:col-span-2 order-2 md:order-1">
              <div className="bg-white border border-gray-200 p-5 md:p-6">
                <h2 className="text-base md:text-lg font-light luxury-font mb-4 text-right">
                  סיכום הזמנה <span className="text-black/40 text-sm">({itemCount} פריטים)</span>
                </h2>

                <ul className="space-y-3 mb-4">
                  {summary.items.map((item, index) => (
                    <li key={`${item.title}-${index}`} className="flex items-center gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-[#f3efe8]">
                        {item.image ? (
                          <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                        ) : null}
                        <span className="absolute -top-1 -start-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-light text-black leading-tight">{item.title}</p>
                        {item.variantTitle && <p className="text-xs text-black/50 mt-0.5">{item.variantTitle}</p>}
                      </div>
                      <span className="text-sm font-light">₪{formatPrice(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm font-light">
                  <div className="flex justify-between text-gray-600">
                    <span>סה״כ ביניים</span>
                    <span>₪{formatPrice(summary.subtotal)}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>הנחה</span>
                      <span>-₪{formatPrice(summary.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>משלוח</span>
                    <span>{summary.shipping > 0 ? `₪${formatPrice(summary.shipping)}` : 'חינם'}</span>
                  </div>
                  <div className="flex justify-between text-base pt-3 border-t border-gray-200">
                    <span>לתשלום עכשיו</span>
                    <span className="text-[#1a1a1a]">₪{formatPrice(summary.total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">כולל מע״מ</p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4 text-right">
                  <h3 className="text-xs font-light text-gray-600 mb-1">משלוח אל</h3>
                  <p className="text-sm font-light text-black">{summary.customer.fullName}</p>
                  <p className="text-sm font-light text-black/70">
                    {summary.customer.addressLine}
                    {summary.customer.city ? `, ${summary.customer.city}` : ''}
                  </p>
                  <p className="text-xs font-light text-black/50 mt-1">
                    {summary.customer.phone}
                    {summary.customer.email ? ` · ${summary.customer.email}` : ''}
                  </p>
                  <p className="text-[11px] text-green-700 mt-2">הפרטים נשמרו — לא צריך להזין אותם שוב.</p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <TrustStrip compact />
                </div>
              </div>
            </aside>

            {/* Embedded Grow payment form */}
            <section className="md:col-span-3 order-1 md:order-2" aria-label="טופס תשלום">
              <div className="bg-white border border-gray-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-light text-right">
                    הזמנה {session.draftName.replace(/^#/, '')} · ₪{formatPrice(summary.total)}
                  </p>
                  <p className="text-[11px] font-light text-black/50 flex items-center gap-1.5">
                    <Lock size={11} strokeWidth={1.5} aria-hidden />
                    מאובטח על ידי Grow · PCI DSS
                  </p>
                </div>

                <div className="relative min-h-[560px] md:min-h-[680px]">
                  {expired ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                      <p className="text-sm font-light text-black/70">
                        טופס התשלום פג תוקף מטעמי אבטחה. הפרטים שלך נשמרו — אפשר לפתוח אותו מחדש.
                      </p>
                      <button
                        type="button"
                        onClick={() => requestFreshSession(session)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 text-xs tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:opacity-60"
                      >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden />
                        {refreshing ? 'פותח מחדש...' : 'פתיחת טופס תשלום'}
                      </button>
                      {refreshError && <p className="text-xs text-red-600">{refreshError}</p>}
                    </div>
                  ) : (
                    <>
                      {(!frameLoaded || refreshing) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white" aria-hidden>
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a1a1a]" />
                        </div>
                      )}
                      {!refreshing && (
                        <iframe
                          key={session.processId}
                          src={session.paymentUrl}
                          title="טופס תשלום מאובטח – Grow"
                          allow="payment *"
                          className={`block w-full h-[560px] md:h-[680px] border-0 transition-opacity duration-300 ${
                            frameLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={() => setFrameLoaded(true)}
                        />
                      )}
                      {refreshError && (
                        <div className="absolute bottom-0 inset-x-0 bg-red-50 border-t border-red-200 text-red-700 px-4 py-2 text-xs font-light text-right">
                          {refreshError}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <p className="mt-3 text-[11px] font-light text-black/50 text-right leading-relaxed">
                לאחר אישור התשלום תועברו לעמוד אישור ההזמנה ותקבלו מייל עם פרטי ההזמנה. שאלות? ווטסאפ 054-2600177.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentPageInner />
    </Suspense>
  );
}
