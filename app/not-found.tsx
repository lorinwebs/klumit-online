import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-8xl md:text-9xl font-light luxury-font text-[#1a1a1a] mb-4">
            404
          </h1>
          <div className="w-16 h-px bg-[#1a1a1a] mx-auto mb-6" />
          <h2 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a] mb-4">
            הדף לא נמצא
          </h2>
          <p className="text-sm font-light text-gray-600 mb-8 leading-relaxed">
            מצטערים, הדף שחיפשת לא קיים או שהועבר למקום אחר.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-[#1a1a1a] text-white text-sm font-light tracking-wider hover:bg-[#2a2a2a] transition-all duration-300"
          >
            חזרה לדף הבית
          </Link>
          <div className="mt-12">
            <Link
              href="/products"
              className="text-sm font-light text-gray-500 hover:text-[#1a1a1a] transition-colors underline underline-offset-4"
            >
              או עברו לצפייה במוצרים
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

