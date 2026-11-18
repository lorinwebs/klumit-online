import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MytheresaGrid from '@/components/MytheresaGrid';
import JsonLd from '@/components/seo/JsonLd';
import SeoGuide, { siteGuideLinks } from '@/components/seo/SeoGuide';
import { CATEGORY_PAGES } from '@/lib/category-pages';
import type { ProductCategory } from '@/lib/product-search';
import { fetchCatalogProducts } from '@/lib/products-server';
import {
  SITE_URL,
  generateBreadcrumbJsonLd,
  generateCollectionJsonLd,
  generateFaqJsonLd,
} from '@/lib/seo';

export function categoryMetadata(category: ProductCategory): Metadata {
  const page = CATEGORY_PAGES[category];
  const url = `${SITE_URL}${page.path}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} | קלומית`,
      description: page.description,
      url,
      type: 'website',
      locale: 'he_IL',
      siteName: 'Klumit - קלומית',
      images: ['/og-image.png'],
    },
  };
}

export default async function CategoryLandingPage({ category }: { category: ProductCategory }) {
  const page = CATEGORY_PAGES[category];
  const url = `${SITE_URL}${page.path}`;
  const products = await fetchCatalogProducts(category);

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd
        data={generateCollectionJsonLd({
          name: page.title,
          description: page.description,
          url,
          products,
        })}
      />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'בית', url: SITE_URL },
          { name: page.name, url },
        ])}
      />
      <JsonLd data={generateFaqJsonLd(page.faq)} />
      <Header />
      <main id="main-content" className="flex-grow" role="main">
        <MytheresaGrid category={category} showViewAll={false} initialProducts={products} />
        <SeoGuide
          title={page.guideTitle}
          sections={page.sections}
          faq={page.faq}
          links={siteGuideLinks(page.path)}
        />
      </main>
      <Footer />
    </div>
  );
}
