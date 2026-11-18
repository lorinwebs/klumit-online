'use client';

import Link from 'next/link';
import ProductGridCard from '@/components/catalog/ProductGridCard';
import { useLanguage } from '@/lib/LanguageContext';
import type { CatalogProduct } from '@/lib/products-server';

/** Three full rows on desktop (4 columns) and four on tablet (3 columns) */
const MAX_VISIBLE = 12;
/** Four rows of two on mobile */
const MAX_VISIBLE_MOBILE = 8;

/**
 * Curated products from the homepage collection, in its Shopify admin order.
 * No filters or sorting here — the full catalog page owns those.
 */
export default function HomeProductSection({
  initialProducts = [],
}: {
  initialProducts?: CatalogProduct[];
}) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const visible = initialProducts.slice(0, MAX_VISIBLE);
  const rest = initialProducts.slice(MAX_VISIBLE);

  if (visible.length === 0) return null;

  return (
    <section id="products" className="scroll-mt-32 bg-cream px-4 py-14 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <header className="mb-8 text-center md:mb-12">
          <p
            className={`mb-2 font-medium text-terracotta ${
              isHe ? 'text-sm' : 'text-xs uppercase tracking-[0.2em]'
            }`}
          >
            {t('home.productsEyebrow')}
          </p>
          <h2 className="font-display text-[2rem] leading-tight text-espresso md:text-[2.75rem]">
            {t('home.productsTitle')}
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 md:gap-x-5 md:gap-y-12 lg:grid-cols-4">
          {visible.map((product, index) => (
            <ProductGridCard
              key={product.id}
              product={product}
              priority={index < 4}
              // The section title already says these are new
              showNewBadge={false}
              className={index >= MAX_VISIBLE_MOBILE ? 'hidden md:block' : ''}
            />
          ))}
        </div>

        {/* Keeps the remaining collection products crawlable from the homepage */}
        {rest.length > 0 && (
          <nav className="sr-only" aria-label={t('home.productsTitle')}>
            {rest.map((product) => (
              <Link key={product.id} href={`/products/${product.handle}`}>
                {product.title}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-10 text-center md:mt-14">
          <Link
            href="/products?tab=all"
            className={`inline-flex min-h-[52px] w-full items-center justify-center border border-espresso px-10 font-medium text-espresso transition-colors duration-300 hover:bg-espresso hover:text-cream sm:w-auto ${
              isHe ? 'text-base' : 'text-[13px] uppercase tracking-[0.14em]'
            }`}
          >
            {t('home.heroCta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
