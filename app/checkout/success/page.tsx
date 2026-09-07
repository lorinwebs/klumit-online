'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail, MessageCircle, Truck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import { useCartStore } from '@/store/cartStore';
import { breakOutOfIframe, clearCheckoutSession, loadCheckoutSession } from '@/lib/checkout-session';

interface StatusResponse {
  state: 'paid' | 'pending' | 'not_found' | 'error';
  draftName?: string;
  orderName?: string | null;
  total?: number;
  currency?: string;
  items?: Array<{ title: string; variantTitle: string | null; quantity: number; unitPrice: number; image: string | null }>;
  customer?: { fullName: string; email: string; addressLine: string; city: string };
}

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 90_000;
const WHATSAPP = 'https://wa.me/972542600177';

const formatPrice = (amount: number) => Math.round(amount).toLocaleString('he-IL');

function SuccessPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [phase, setPhase] = useState<'verifying' | 'paid' | 'delayed' | 'invalid'>('verifying');
  const startedAt = useRef<number | null>(null);
  const cleared = useRef(false);

  const ref = searchParams.get('ref') || '';
  const sig = searchParams.get('sig') || '';

  useEffect(() => {
    if (breakOutOfIframe()) return;

    let activeRef = ref;
    let activeSig = sig;
    if (!activeRef || !activeSig) {
      const stored = loadCheckoutSession();
      if (stored) {
        activeRef = stored.ref;
        activeSig = stored.sig;
        router.replace(`/checkout/success?ref=${activeRef}&sig=${activeSig}`);
        return;
      }
      setPhase('invalid');
      return;
    }

    // Grow only sends customers here after a successful charge – the cart is done.
    if (!cleared.current) {
      cleared.current = true;
      clearCart();
      clearCheckoutSession();
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (startedAt.current === null) startedAt.current = Date.now();
    const pollingStarted = startedAt.current;

    const poll = async () => {
      try {
        const response = await fetch(`/api/checkout/status?ref=${activeRef}&sig=${activeSig}`, { cache: 'no-store' });
        const data = (await response.json()) as StatusResponse;
        if (cancelled) return;

        if (response.status === 403 || data.state === 'not_found') {
          setPhase('invalid');
          return;
        }

        setStatus(data);
        if (data.state === 'paid') {
          setPhase('paid');
          return;
        }
      } catch {
        // transient – keep polling
      }

      if (Date.now() - pollingStarted > POLL_TIMEOUT_MS) {
        setPhase('delayed');
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ref, sig, router, clearCart]);

  const orderLabel = status?.orderName || (status?.draftName ? status.draftName : null);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow w-full" role="main">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="mb-6">
            <CheckoutSteps current={3} />
          </div>

          {phase === 'invalid' && (
            <div className="bg-white border border-gray-200 p-8 text-center">
              <h1 className="text-xl font-light luxury-font mb-3">לא נמצאה הזמנה לאישור</h1>
              <p className="text-sm font-light text-black/60 mb-6">
                אם ביצעת תשלום, המייל עם פרטי ההזמנה בדרך. אפשר גם לכתוב לנו בווטסאפ ונבדוק מיד.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border border-black px-6 py-3 text-xs tracking-luxury uppercase font-light hover:bg-black hover:text-white transition-luxury">
                  <MessageCircle size={14} aria-hidden /> ווטסאפ
                </a>
                <Link href="/products" className="inline-flex items-center justify-center bg-[#1a1a1a] text-white px-6 py-3 text-xs tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury">
                  המשך לקנייה
                </Link>
              </div>
            </div>
          )}

          {phase !== 'invalid' && (
            <div className="bg-white border border-gray-200">
              <div className="px-6 md:px-10 py-8 md:py-10 text-center border-b border-gray-100">
                {phase === 'verifying' ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a] mx-auto mb-5" aria-hidden />
                    <h1 className="text-xl md:text-2xl font-light luxury-font mb-2">מאמתים את התשלום...</h1>
                    <p className="text-sm font-light text-black/60">זה לוקח כמה שניות. אין צורך לרענן את הדף.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={44} strokeWidth={1.2} className="mx-auto mb-4 text-black" aria-hidden />
                    <h1 className="text-xl md:text-2xl font-light luxury-font mb-2">
                      {phase === 'paid' ? 'תודה! ההזמנה התקבלה' : 'התשלום התקבל'}
                    </h1>
                    {orderLabel && (
                      <p className="text-sm font-light text-black/70">
                        מספר הזמנה <span className="font-medium text-black">{orderLabel}</span>
                      </p>
                    )}
                    {phase === 'delayed' && (
                      <p className="text-sm font-light text-black/60 mt-2 max-w-md mx-auto">
                        אישור ההזמנה עדיין מתעדכן במערכת. המייל עם כל הפרטים יישלח בדקות הקרובות, ואם משהו לא ברור נשמח לעזור בווטסאפ.
                      </p>
                    )}
                  </>
                )}
              </div>

              {status?.items && status.items.length > 0 && (
                <div className="px-6 md:px-10 py-6 border-b border-gray-100">
                  <ul className="space-y-3">
                    {status.items.map((item, index) => (
                      <li key={`${item.title}-${index}`} className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-[#f3efe8]">
                          {item.image ? <Image src={item.image} alt={item.title} fill sizes="56px" className="object-cover" /> : null}
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-light">{item.title}</p>
                          <p className="text-xs text-black/50">
                            {item.variantTitle ? `${item.variantTitle} · ` : ''}כמות {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-light">₪{formatPrice(item.unitPrice * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  {typeof status.total === 'number' && (
                    <div className="flex justify-between text-base font-light border-t border-gray-200 mt-4 pt-3">
                      <span>סה״כ ששולם</span>
                      <span>₪{formatPrice(status.total)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="px-6 md:px-10 py-6 grid grid-cols-1 sm:grid-cols-3 gap-5 text-right">
                <div className="flex gap-3">
                  <Mail size={18} strokeWidth={1.5} className="shrink-0 text-black/50 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-light">מייל אישור</p>
                    <p className="text-xs font-light text-black/55 mt-0.5">
                      {status?.customer?.email ? `נשלח אל ${status.customer.email}` : 'נשלח לכתובת שהזנת'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Truck size={18} strokeWidth={1.5} className="shrink-0 text-black/50 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-light">משלוח עד הבית</p>
                    <p className="text-xs font-light text-black/55 mt-0.5">
                      {status?.customer?.addressLine
                        ? `${status.customer.addressLine}${status.customer.city ? `, ${status.customer.city}` : ''} · 2–5 ימי עסקים`
                        : 'תוך 2–5 ימי עסקים, עם מספר מעקב במייל'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MessageCircle size={18} strokeWidth={1.5} className="shrink-0 text-black/50 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-light">שאלות?</p>
                    <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-xs font-light text-black underline hover:no-underline mt-0.5 inline-block">
                      ווטסאפ 054-2600177
                    </a>
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-10 pb-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/products" className="inline-flex items-center justify-center bg-[#1a1a1a] text-white px-6 py-3 text-xs tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury">
                  המשך לקנייה
                </Link>
                <Link href="/account" className="inline-flex items-center justify-center border border-black px-6 py-3 text-xs tracking-luxury uppercase font-light hover:bg-black hover:text-white transition-luxury">
                  ההזמנות שלי
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessPageInner />
    </Suspense>
  );
}
