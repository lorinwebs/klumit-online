import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MytheresaGrid from '@/components/MytheresaGrid';
import ValuePropsBar from '@/components/ValuePropsBar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'קטלוג מוצרים',
  description: 'קולקציית תיקים יוקרתיים מאיטליה - RENTAO ANGI ו-CARLINO GROUP. תיקי עור איכותיים, תיקי גב, תיקי צד וחגורות. משלוח חינם מעל 500₪.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/products',
  },
};

type TabType = 'bags' | 'belts' | 'wallets';

interface PageProps {
  searchParams: Promise<{ tab?: string; category?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Support both 'tab' and 'category' parameters
  const activeTab = ((params.category || params.tab) as TabType) || 'bags';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ValuePropsBar />
      <main id="main-content" className="flex-grow" role="main">
        <MytheresaGrid category={activeTab} showViewAll={false} />
      </main>
      <Footer />
    </div>
  );
}
