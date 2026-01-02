'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow max-w-md mx-auto px-4 py-20 w-full">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-light text-gray-600 hover:text-[#1a1a1a] mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          חזרה
        </Link>

        <div className="bg-white border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-light luxury-font mb-2 text-right">
            התחברות
          </h1>
          <p className="text-sm font-light text-gray-600 mb-8 text-right">
            הכנס את מספר הטלפון שלך לקבלת קוד אימות
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
