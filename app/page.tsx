import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomeHero from '@/components/home/HomeHero';
import HomeCategoryGrid from '@/components/home/HomeCategoryGrid';
import HomeEditorialSplit from '@/components/home/HomeEditorialSplit';
import HomeProductSection from '@/components/home/HomeProductSection';
import HomeNewsletter from '@/components/home/HomeNewsletter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תיקים יוקרתיים | KLUMIT',
  description:
    'יבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP. תיקים יוקרתיים מעור איטלקי איכותי, חגורות ואביזרי אופנה היישר מאיטליה.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <HomeHero />
      <main id="main-content" className="flex-grow" role="main">
        <HomeProductSection />
      </main>
      <HomeEditorialSplit />
      <HomeCategoryGrid />
      <HomeNewsletter />
      <Footer />
    </div>
  );
}
