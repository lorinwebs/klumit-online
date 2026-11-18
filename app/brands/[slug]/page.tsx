import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductGridCard from '@/components/catalog/ProductGridCard';
import JsonLd from '@/components/seo/JsonLd';
import SeoGuide, { siteGuideLinks } from '@/components/seo/SeoGuide';
import { BRAND_PAGES, brandPath, getBrandPage, type BrandPage } from '@/lib/brand-pages';
import { fetchCatalogProducts } from '@/lib/products-server';
import {
  SITE_URL,
  generateBreadcrumbJsonLd,
  generateCollectionJsonLd,
  generateFaqJsonLd,
} from '@/lib/seo';

// Must be a numeric literal for Next.js segment config static analysis
export const revalidate = 60;
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BRAND_PAGES.map((brand) => ({ slug: brand.slug }));
}

async function fetchBrandProducts(brand: BrandPage) {
  const products = await fetchCatalogProducts('all');
  return products.filter((product) => product.vendor?.toLowerCase().includes(brand.vendorMatch));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const brand = getBrandPage((await params).slug);
  if (!brand) return {};

  const url = `${SITE_URL}${brandPath(brand)}`;
  const image = (await fetchBrandProducts(brand))[0]?.images.edges[0]?.node.url;
  return {
    title: brand.title,
    description: brand.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${brand.title} | קלומית`,
      description: brand.description,
      url,
      type: 'website',
      locale: 'he_IL',
      siteName: 'Klumit - קלומית',
      images: [image || '/og-image.png'],
    },
  };
}

export default async function BrandLandingPage({ params }: PageProps) {
  const brand = getBrandPage((await params).slug);
  if (!brand) notFound();

  const url = `${SITE_URL}${brandPath(brand)}`;
  const products = await fetchBrandProducts(brand);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <JsonLd
        data={{
          ...generateCollectionJsonLd({ name: brand.title, description: brand.description, url, products }),
          about: { '@type': 'Brand', name: brand.name },
        }}
      />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'בית', url: SITE_URL },
          { name: brand.name, url },
        ])}
      />
      <JsonLd data={generateFaqJsonLd(brand.faq)} />
      <Header />
      <main id="main-content" className="flex-grow" role="main">
        <div className="mx-auto max-w-7xl px-4 pt-8 md:px-6 md:pt-10">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-stone">
              <li>
                <Link href="/" className="transition-colors hover:text-espresso">
                  בית
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-stone-dark">{brand.name}</li>
            </ol>
          </nav>
          <h1 className="font-display text-3xl font-light text-espresso md:text-4xl">{brand.name}</h1>
          <div className="mt-4 max-w-2xl space-y-3">
            {brand.intro.map((paragraph) => (
              <p key={paragraph} className="text-[15px] leading-relaxed text-stone-dark">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-black/40">
            {products.length} מוצרים
          </p>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-3 md:gap-x-3 md:gap-y-10 lg:grid-cols-4 lg:gap-x-4">
            {products.map((product, index) => (
              <ProductGridCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </div>

        <SeoGuide faq={brand.faq} links={siteGuideLinks(brandPath(brand))} />
      </main>
      <Footer />
    </div>
  );
}
