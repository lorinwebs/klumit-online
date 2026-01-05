'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { X, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
        <Header />
        <main id="main-content" className="flex-grow max-w-md mx-auto px-4 py-20 w-full" role="main">
          <div className="bg-white border border-gray-200 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1a1a]"></div>
            </div>
            <h1 className="text-2xl font-light luxury-font mb-2">
              טוען...
            </h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow max-w-md mx-auto px-4 py-20 w-full" role="main">
        <div className="bg-white border border-gray-200 p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-light luxury-font mb-2">
            התשלום בוטל
          </h1>
          <p className="text-sm font-light text-gray-600 mb-6">
            התשלום בוטל ולא בוצע. ההזמנה שלך נשמרה וניתן להשלים את התשלום מאוחר יותר.
          </p>
          {reference && (
            <p className="text-xs font-light text-gray-500 mb-6">
              מספר הזמנה: {reference}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-3 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury"
            >
              חזור לתשלום
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/cart"
              className="inline-block border border-gray-300 text-gray-700 py-3 px-6 text-sm tracking-luxury uppercase font-light hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-luxury"
            >
              חזור לעגלה
            </Link>
            <Link
              href="/"
              className="inline-block text-gray-500 py-2 px-4 text-sm font-light hover:text-[#1a1a1a] transition-colors"
            >
              חזור לדף הבית
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
        <Header />
        <main id="main-content" className="flex-grow max-w-md mx-auto px-4 py-20 w-full" role="main">
          <div className="bg-white border border-gray-200 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1a1a]"></div>
            </div>
            <h1 className="text-2xl font-light luxury-font mb-2">
              טוען...
            </h1>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}
