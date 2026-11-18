'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import type { ProductCategory } from '@/lib/product-search';
import type { ProductBounds } from '@/lib/image-bounds';

export interface CategoryTileImage {
  url: string;
  alt: string;
  /** Where the product sits in the photo; without it the photo is shown as-is */
  bounds?: ProductBounds | null;
}

const categories: Array<{
  category: ProductCategory;
  href: string;
  labelKey: 'header.bags' | 'header.belts' | 'header.wallets';
}> = [
  { category: 'bags', href: '/bags', labelKey: 'header.bags' },
  { category: 'belts', href: '/belts', labelKey: 'header.belts' },
  { category: 'wallets', href: '/wallets', labelKey: 'header.wallets' },
];

/** Tile width ÷ height — keep in sync with the `aspect-[4/5]` class below */
const TILE_ASPECT = 4 / 5;
/** The product is scaled to fit this share of the tile, so every tile carries the same visual weight */
const MAX_PRODUCT_WIDTH = 0.7;
const MAX_PRODUCT_HEIGHT = 0.6;

/**
 * Places the photo so the product itself (not the photo frame) is centred in the tile
 * and scaled to a common size. Studio photos frame products very differently, so
 * centring the raw photos leaves the products at different heights.
 */
function productPlacement(bounds: ProductBounds): CSSProperties {
  // A product that runs off both sides of the photo (a belt strap) can't be shrunk
  // without showing its cut ends, so the photo fills the tile width instead.
  const bleedsOffSides = bounds.x <= 0.02 && bounds.x + bounds.width >= 0.98;
  // Photo width as a share of the tile width
  const scale = bleedsOffSides
    ? 1
    : Math.min(
        MAX_PRODUCT_WIDTH / bounds.width,
        (MAX_PRODUCT_HEIGHT * bounds.aspect) / (TILE_ASPECT * bounds.height)
      );
  // Photo height as a share of the tile height
  const scaleY = (scale * TILE_ASPECT) / bounds.aspect;

  return {
    position: 'absolute',
    width: `${scale * 100}%`,
    height: 'auto',
    maxWidth: 'none',
    left: `${(0.5 - (bounds.x + bounds.width / 2) * scale) * 100}%`,
    top: `${(0.5 - (bounds.y + bounds.height / 2) * scaleY) * 100}%`,
  };
}

/**
 * Three category entry points. Each tile shows a real product photo from that category
 * (picked and measured on the server), on the same white as the rest of the page.
 */
export default function HomeCategoryGrid({
  images,
}: {
  images: Partial<Record<ProductCategory, CategoryTileImage>>;
}) {
  const { t } = useLanguage();

  return (
    <section className="bg-cream px-4 pb-16 md:px-8 md:pb-28">
      <div className="mx-auto max-w-[1080px]">
        <h2 className="mb-8 text-center font-display text-[2rem] leading-tight text-espresso md:mb-12 md:text-[2.75rem]">
          {t('home.categoryEyebrow')}
        </h2>

        {/* Three across at every width, so all categories are visible together */}
        <div className="grid grid-cols-3 gap-2.5 md:gap-6">
          {categories.map((cat) => {
            const image = images[cat.category];
            return (
              <Link key={cat.href} href={cat.href} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden border border-sand bg-white transition-colors duration-300 group-hover:border-sand-dark">
                  {image && (
                    <div className="absolute inset-0 transition-transform duration-700 ease-luxury group-hover:scale-[1.04]">
                      {image.bounds ? (
                        <Image
                          src={image.url}
                          alt=""
                          width={600}
                          height={Math.round(600 / image.bounds.aspect)}
                          className="studio-photo"
                          style={productPlacement(image.bounds)}
                          sizes="(max-width: 768px) 33vw, 350px"
                        />
                      ) : (
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          className="studio-photo object-contain"
                          sizes="(max-width: 768px) 33vw, 350px"
                        />
                      )}
                    </div>
                  )}
                </div>
                <span className="mt-3 block text-center font-display text-lg text-espresso decoration-1 underline-offset-[6px] group-hover:underline md:mt-4 md:text-2xl">
                  {t(cat.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
