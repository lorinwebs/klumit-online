'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getSaleInfo } from '@/lib/product-sale';
import type { CatalogProduct } from '@/lib/products-server';

interface ProductGridCardProps {
  product: CatalogProduct;
  /** Eager-load the first image (above-the-fold cards) */
  priority?: boolean;
  /** Hide the "new" tag where the surrounding section already says so */
  showNewBadge?: boolean;
  className?: string;
}

/** Minimum horizontal travel (px) before a touch counts as a swipe between photos */
const SWIPE_DISTANCE = 36;

function getSizeOptions(product: CatalogProduct) {
  const sizes: string[] = [];
  const seen = new Set<string>();
  for (const edge of product.variants?.edges || []) {
    const sizeOpt = edge.node.selectedOptions?.find((o) =>
      /size|מידה|מידת|pointure|taille/i.test(o.name)
    );
    const value = sizeOpt?.value || (edge.node.title !== 'Default Title' ? edge.node.title : null);
    if (!value || seen.has(value) || !edge.node.availableForSale) continue;
    seen.add(value);
    sizes.push(value);
  }
  return sizes.slice(0, 8);
}

function formatPrice(amount: string | number) {
  return Math.round(Number(amount)).toLocaleString('he-IL');
}

/**
 * Catalog card shared by the homepage and the product listing.
 * Photos flip by swipe on touch screens and by arrows on hover with a mouse.
 */
export default function ProductGridCard({
  product,
  priority = false,
  showNewBadge = true,
  className = '',
}: ProductGridCardProps) {
  const { t, language } = useLanguage();
  const isRtl = language === 'he';
  const images = product.images.edges;
  const href = `/products/${product.handle}`;
  const sale = getSaleInfo(product);
  const sizes = getSizeOptions(product);
  const isNew = showNewBadge && product.tags?.some((tag) => tag.toLowerCase() === 'new_arrival');

  const [imageIndex, setImageIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  // Fetch the alternate photos only once the shopper shows interest (keeps first paint fast)
  useEffect(() => {
    if (!engaged || images.length < 2) return;
    images.slice(1, 3).forEach((edge) => {
      const img = new window.Image();
      img.src = edge.node.url;
    });
  }, [engaged, images]);

  const step = (delta: number) => {
    setImageIndex((i) => (i + delta + images.length) % images.length);
  };

  const onArrow = (delta: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    step(delta);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    swiped.current = false;
    setEngaged(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || images.length < 2) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    swiped.current = true;
    // The next photo sits on the "end" side: left in Hebrew, right in English/Russian
    const towardsNext = isRtl ? dx > 0 : dx < 0;
    step(towardsNext ? 1 : -1);
  };

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const arrowClass =
    'absolute top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream-warm/95 text-espresso opacity-0 shadow-sm transition-opacity duration-300 hover:bg-white focus-visible:opacity-100 group-hover/card:opacity-100 md:flex';

  const current = images[imageIndex];

  return (
    <article className={`group/card relative ${className}`}>
      <div
        className="relative aspect-[4/5] touch-pan-y overflow-hidden bg-white"
        onMouseEnter={() => setEngaged(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Link
          href={href}
          className="absolute inset-0 z-0 block"
          tabIndex={-1}
          aria-hidden
          onClick={(e) => {
            // A swipe between photos must not open the product
            if (swiped.current) {
              e.preventDefault();
              swiped.current = false;
            }
          }}
        >
          {current ? (
            <Image
              key={imageIndex}
              src={current.node.url}
              alt={current.node.altText || product.title}
              fill
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              quality={70}
              decoding={priority ? 'sync' : 'async'}
              className="studio-photo object-contain object-center p-2 transition-transform duration-700 ease-luxury group-hover/card:scale-[1.04] md:p-3"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-sm text-stone-light">
              —
            </span>
          )}
        </Link>

        {sale && (
          <span className="pointer-events-none absolute start-2.5 top-2.5 z-20 bg-sale px-2 py-1 text-[11px] font-semibold leading-none text-white md:text-xs">
            <span dir="ltr">-{sale.percent}%</span>
          </span>
        )}

        {isNew && (
          <span className="pointer-events-none absolute end-2.5 top-2.5 z-20 bg-cream-deep px-2 py-1 text-[11px] font-medium leading-none text-espresso md:text-xs">
            {t('products.newTag')}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={onArrow(-1)}
              className={`${arrowClass} start-2`}
              aria-label={t('products.previousImage')}
            >
              <PrevIcon size={18} strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onArrow(1)}
              className={`${arrowClass} end-2`}
              aria-label={t('products.nextImage')}
            >
              <NextIcon size={18} strokeWidth={1.5} aria-hidden />
            </button>

            <div
              className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex items-center justify-center gap-1.5"
              aria-hidden
            >
              {images.slice(0, 6).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === imageIndex ? 'w-4 bg-espresso/70' : 'w-1 bg-espresso/20'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Available sizes — shown on hover with a mouse; each opens the product page */}
        {sizes.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 hidden items-center gap-2 bg-cream-warm/95 px-3 py-2 opacity-0 transition-opacity duration-300 group-hover/card:pointer-events-auto group-hover/card:opacity-100 md:flex">
            <span className="shrink-0 text-xs text-stone">{t('products.size')}</span>
            <div className="flex flex-1 flex-wrap justify-end gap-1">
              {sizes.map((size) => (
                <Link
                  key={size}
                  href={href}
                  tabIndex={-1}
                  className="flex h-7 min-w-[28px] items-center justify-center border border-sand-dark bg-white px-1.5 text-xs text-espresso transition-colors hover:border-espresso"
                >
                  {size}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link href={href} className="block pt-3 text-start">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone md:text-xs">
          {product.vendor || 'KLUMIT'}
        </p>
        <h3 className="product-grid-title mt-1 line-clamp-2 min-h-[2.7em] break-words text-sm font-normal leading-snug text-espresso [overflow-wrap:anywhere] md:text-[15px]">
          {product.title}
        </h3>
        <p className="mt-1.5 flex items-baseline gap-2 text-sm md:text-[15px]">
          {sale ? (
            <>
              <span className="font-semibold text-sale">{formatPrice(sale.price)} ₪</span>
              <span className="text-[13px] text-stone line-through">{formatPrice(sale.original)} ₪</span>
            </>
          ) : (
            <span className="font-medium text-espresso">
              {formatPrice(product.priceRange.minVariantPrice.amount)} ₪
            </span>
          )}
        </p>
      </Link>
    </article>
  );
}
