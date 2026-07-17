'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { homeImages } from '@/lib/home-images';

const tabs = [
  { href: '/products?tab=bags', labelKey: 'header.bags' as const, src: () => homeImages.categoryBags },
  { href: '/products?tab=belts', labelKey: 'header.belts' as const, src: () => homeImages.categoryBelts },
  { href: '/products?tab=wallets', labelKey: 'header.wallets' as const, src: () => homeImages.categoryWallets },
];

export default function HomeCategoryGrid() {
  const { t } = useLanguage();
  const em = t('home.categoryTitleEm');

  return (
    <section className="bg-white px-5 py-16 md:py-24 md:px-7 border-t border-black/10">
      <div className="mx-auto max-w-[1320px] text-center mb-10 md:mb-12">
        <p className="text-[11px] tracking-[0.3em] uppercase text-black/50 mb-3">
          {t('home.categoryEyebrow')}
        </p>
        <h2 className="font-display text-[clamp(1.75rem,4vw,3.25rem)] leading-tight text-black font-light">
          {t('home.categoryTitle')}
          {em ? (
            <>
              {' '}
              <em className="italic">{em}</em>
            </>
          ) : null}
        </h2>
      </div>

      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {tabs.map((cat) => {
          const src = cat.src();
          const has = Boolean(src?.trim());
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className="group relative aspect-[3/4] overflow-hidden bg-[#f5f5f5] sm:aspect-[4/5]"
            >
              {has ? (
                <div className="absolute inset-0">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-[#f0f0f0]" aria-hidden />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-5 z-[1] px-4 text-center text-white md:start-6 md:inset-x-auto md:px-0 md:text-start">
                <div className="font-display text-2xl tracking-wide font-light">{t(cat.labelKey)}</div>
                <div className="mt-1.5 inline-block border-b border-white/70 pb-0.5 text-[11px] tracking-[0.24em] uppercase">
                  {t('home.categoryShop')}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
