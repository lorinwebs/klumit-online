import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomeHero from '@/components/home/HomeHero';
import HomeProductSection from '@/components/home/HomeProductSection';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { fetchCollectionProducts } from '@/lib/products-server';
import { SHOPIFY_COLLECTION_HOME_HANDLE } from '@/lib/shopify';

const HomeEditorialSplit = dynamic(() => import('@/components/home/HomeEditorialSplit'));
const HomeBrandSplit = dynamic(() => import('@/components/home/HomeBrandSplit'));
const HomeCategoryGrid = dynamic(() => import('@/components/home/HomeCategoryGrid'));
const HomeNewsletter = dynamic(() => import('@/components/home/HomeNewsletter'));

export const metadata: Metadata = {
  title: {
    absolute: 'תיקים יוקרתיים מאיטליה | קלומית - Klumit',
  },
  description:
    'קלומית - יבואן בלעדי בישראל לתיקי RENATO ANGI ו-CARLINO GROUP. קולקציית Renato Angi מעור אמיתי; מותגים נוספים לפי המצוין בכל מוצר. משלוח חינם מעל 500₪.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il',
  },
};

export default async function Home() {
  const initialProducts = await fetchCollectionProducts(SHOPIFY_COLLECTION_HOME_HANDLE);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <HomeHero />
      <main id="main-content" className="flex-grow" role="main">
        <HomeProductSection initialProducts={initialProducts} />
      </main>
      <HomeEditorialSplit />
      <HomeBrandSplit />
      <HomeCategoryGrid />
      <HomeNewsletter />
      <Footer />
    </div>
  );
}
