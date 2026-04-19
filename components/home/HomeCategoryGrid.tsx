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

  return (
    <section className="bg-biasia-bg px-5 py-16 md:py-24 md:px-7">
      <div className="mx-auto max-w-[1320px] text-center mb-10 md:mb-12">
        <p className="text-[11px] tracking-[0.3em] uppercase text-biasia-muted mb-3">
          {t('home.categoryEyebrow')}
        </p>
        <h2 className="font-display text-[clamp(1.75rem,4vw,3.25rem)] leading-tight text-biasia-ink">
          {t('home.categoryTitle')} <em className="italic text-biasia-accent">{t('home.categoryTitleEm')}</em>
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
              className="group relative aspect-[3/4] overflow-hidden border border-biasia-line bg-biasia-bg sm:aspect-[4/5]"
            >
              {has ? (
                <div className="absolute inset-0 isolate bg-biasia-bg">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover object-center mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-biasia-bg-alt" aria-hidden />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-5 start-6 z-[1] text-start text-[#fbf6ee]">
                <div className="font-display text-2xl tracking-wide">{t(cat.labelKey)}</div>
                <div className="mt-1.5 inline-block border-b border-[rgba(251,246,238,0.55)] pb-0.5 text-[11px] tracking-[0.24em] uppercase">
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
