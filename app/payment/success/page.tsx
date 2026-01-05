'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCartStore } from '@/store/cartStore';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const { clearCart } = useCartStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // נקה את העגלה אחרי תשלום מוצלח
    if (reference) {
      clearCart();
      setLoading(false);
    }
  }, [reference, clearCart]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow container mx-auto px-4 py-12" role="main">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-4">
              התשלום בוצע בהצלחה
            </h1>
            <p className="text-gray-600 mb-2">
              תודה על הקנייה שלך!
            </p>
            {reference && (
              <p className="text-sm text-gray-500">
                מספר הזמנה: {reference}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              תקבל אישור תשלום במייל עם פרטי ההזמנה.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-[#1a1a1a] text-white px-8 py-3 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury text-center"
              >
                המשך לקניות
              </Link>
              <Link
                href="/account"
                className="border border-[#1a1a1a] text-[#1a1a1a] px-8 py-3 text-sm tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury text-center"
              >
                צפה בהזמנות שלי
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a] mx-auto"></div>
        </main>
        <Footer />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

