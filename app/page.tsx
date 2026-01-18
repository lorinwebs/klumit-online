import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import ValueProps from '@/components/ValueProps';
import FeaturedProducts from '@/components/FeaturedProducts';
import CustomerReviews from '@/components/CustomerReviews';
import InstagramFeed from '@/components/InstagramFeed';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'דף הבית',
  description: 'יבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP. תיקים יוקרתיים מעור איטלקי איכותי, חגורות ואביזרי אופנה היישר מאיטליה.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-grow" role="main">
        <Hero />
        <ValueProps />
        <FeaturedProducts />
        <CustomerReviews />
        <InstagramFeed />
      </main>
      <Footer />
    </div>
  );
}




