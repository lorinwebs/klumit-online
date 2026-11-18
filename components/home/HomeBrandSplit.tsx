'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import type { Translations } from '@/lib/translations';

export interface BrandTileImage {
  url: string;
  alt: string;
}

interface BrandTile {
  href: string;
  eyebrow: keyof Translations;
  title: keyof Translations;
  body: keyof Translations;
  cta: keyof Translations;
  image?: BrandTileImage;
}

/**
 * Two brand entry points. Each tile shows a product photo from that brand
 * (picked on the server from the homepage collection); without one it falls back to text only.
 */
export default function HomeBrandSplit({
  leatherImage,
  otherImage,
}: {
  leatherImage?: BrandTileImage;
  otherImage?: BrandTileImage;
}) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const labelText = isHe ? 'text-sm' : 'text-xs uppercase tracking-[0.2em]';

  const tiles: BrandTile[] = [
    {
      href: '/brands/renato-angi',
      eyebrow: 'home.brandLeatherEyebrow',
      title: 'home.brandLeatherTitle',
      body: 'home.brandLeatherBody',
      cta: 'home.brandLeatherCta',
      image: leatherImage,
    },
    {
      href: '/brands/mario-valentino',
      eyebrow: 'home.brandOtherEyebrow',
      title: 'home.brandOtherTitle',
      body: 'home.brandOtherBody',
      cta: 'home.brandOtherCta',
      image: otherImage,
    },
  ];

  return (
    <section className="bg-cream px-4 py-14 md:px-8 md:py-24" aria-label="Brand collections">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group flex min-h-[220px] items-stretch overflow-hidden border border-sand bg-white transition-colors duration-300 hover:border-sand-dark md:min-h-[320px]"
          >
            <div className="flex flex-1 flex-col justify-center px-5 py-7 md:px-10 md:py-10">
              <p className={`mb-2 font-medium text-terracotta ${labelText}`}>{t(tile.eyebrow)}</p>
              <h2 className="font-display text-[1.6rem] leading-tight text-espresso md:text-[2.1rem]">
                {t(tile.title)}
              </h2>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-stone-dark md:text-base">
                {t(tile.body)}
              </p>
              <span
                className={`editorial-link mt-5 self-start font-medium text-espresso ${
                  isHe ? 'text-[15px]' : 'text-xs uppercase tracking-[0.14em]'
                }`}
              >
                {t(tile.cta)}
              </span>
            </div>

            {tile.image && (
              <div className="relative w-[40%] shrink-0 md:w-[44%]">
                <Image
                  src={tile.image.url}
                  alt={tile.image.alt}
                  fill
                  className="studio-photo object-contain p-3 transition-transform duration-700 ease-luxury group-hover:scale-[1.04] md:p-6"
                  sizes="(max-width: 768px) 40vw, 22vw"
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
