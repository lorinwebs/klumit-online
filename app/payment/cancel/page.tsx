'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-4">
              התשלום בוטל
            </h1>
            <p className="text-gray-600 mb-2">
              התשלום בוטל ולא בוצע.
            </p>
            {reference && (
              <p className="text-sm text-gray-500">
                מספר הזמנה: {reference}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              אתה יכול לנסות שוב או לחזור לעגלה.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cart"
                className="bg-[#1a1a1a] text-white px-8 py-3 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury text-center"
              >
                חזרה לעגלה
              </Link>
              <Link
                href="/products"
                className="border border-[#1a1a1a] text-[#1a1a1a] px-8 py-3 text-sm tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury text-center"
              >
                המשך לקניות
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

