import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MytheresaGrid from '@/components/MytheresaGrid';
import { fetchCatalogProducts } from '@/lib/products-server';
import type { CatalogCategory } from '@/lib/product-search';
import type { Metadata } from 'next';

const VALID_TABS = ['all', 'bags', 'belts', 'wallets', 'ss26', 'sale'] as const;
type TabType = (typeof VALID_TABS)[number];

const TAB_META: Record<
  TabType,
  { title: string; description: string; canonical: string }
> = {
  all: {
    title: 'קטלוג מוצרים | קלומית - Klumit',
    description:
      'כל הקולקציה של קלומית — תיקים, חגורות וארנקים מאיטליה. Renato Angi מעור אמיתי; מותגים נוספים לפי המצוין בכל מוצר.',
    canonical: 'https://www.klumit-online.co.il/products',
  },
  bags: {
    title: 'תיקים | קלומית - Klumit',
    description: 'תיקים יוקרתיים מאיטליה — קולקציית Renato Angi מעור אמיתי ומותגים נוספים.',
    canonical: 'https://www.klumit-online.co.il/products?tab=bags',
  },
  belts: {
    title: 'חגורות | קלומית - Klumit',
    description: 'חגורות איטלקיות מקלומית — עיצוב קלאסי ואיכות פרימיום.',
    canonical: 'https://www.klumit-online.co.il/products?tab=belts',
  },
  wallets: {
    title: 'ארנקים | קלומית - Klumit',
    description: 'ארנקים מעור עם מפרט ומידות מלאים — קלומית.',
    canonical: 'https://www.klumit-online.co.il/products?tab=wallets',
  },
  ss26: {
    title: 'אביב-קיץ 2026 | קלומית - Klumit',
    description: 'קולקציית האביב-קיץ 2026 — עיצובים חדשים מאיטליה.',
    canonical: 'https://www.klumit-online.co.il/products?tab=ss26',
  },
  sale: {
    title: 'סייל | קלומית - Klumit',
    description: 'מבצעים והנחות על תיקים ופריטי אופנה נבחרים בקלומית.',
    canonical: 'https://www.klumit-online.co.il/products?tab=sale',
  },
};

interface PageProps {
  searchParams: Promise<{ tab?: string; category?: string; vendor?: string; q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const raw = (params.category || params.tab || 'all').toLowerCase();
  const tab: TabType = VALID_TABS.includes(raw as TabType) ? (raw as TabType) : 'all';
  const meta = TAB_META[tab];
  const q = params.q?.trim();
  return {
    title: { absolute: q ? `חיפוש: ${q} | קלומית - Klumit` : meta.title },
    description: meta.description,
    alternates: { canonical: meta.canonical },
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = (params.category || params.tab || 'all').toLowerCase();
  const activeTab: TabType = VALID_TABS.includes(raw as TabType) ? (raw as TabType) : 'all';
  const vendor = params.vendor?.toLowerCase() || undefined;
  const query = params.q?.trim() || undefined;

  const initialProducts = await fetchCatalogProducts(activeTab as CatalogCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-grow" role="main">
        <MytheresaGrid
          category={activeTab}
          showViewAll={false}
          initialVendor={vendor}
          searchQuery={query}
          initialProducts={initialProducts}
        />
      </main>
      <Footer />
    </div>
  );
}
