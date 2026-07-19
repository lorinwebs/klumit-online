import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomeHero from '@/components/home/HomeHero';
import HomeProductSection from '@/components/home/HomeProductSection';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const HomeEditorialSplit = dynamic(() => import('@/components/home/HomeEditorialSplit'));
const HomeCategoryGrid = dynamic(() => import('@/components/home/HomeCategoryGrid'));
const HomeNewsletter = dynamic(() => import('@/components/home/HomeNewsletter'));

export const metadata: Metadata = {
  title: 'תיקי עור יוקרתיים מאיטליה',
  description:
    'קלומית - יבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP. תיקי עור איטלקי יוקרתיים, חגורות וארנקים היישר מאיטליה. משלוח חינם מעל 500₪.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
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
