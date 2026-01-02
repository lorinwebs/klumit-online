import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <FeaturedProducts />
        {/* Terms Link Section */}
        <div className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-xs font-light text-gray-500 mb-2">
              על ידי שימוש באתר זה, אתה מסכים ל
            </p>
            <Link 
              href="/terms" 
              className="text-xs font-light text-[#1a1a1a] underline hover:no-underline transition-colors"
            >
              תנאי השימוש והתקנון
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}




