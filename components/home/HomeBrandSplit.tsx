'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function HomeBrandSplit() {
  const { t } = useLanguage();

  return (
    <section className="bg-cream px-5 py-12 md:py-16 md:px-7 border-t border-black/10" aria-label="Brand collections">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Link
          href="/products?vendor=renato"
          className="group border border-black/10 bg-white px-6 py-8 md:px-8 md:py-10 transition-colors hover:border-black/30"
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-black/50 mb-3">
            {t('home.brandLeatherEyebrow')}
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-light text-black mb-3">
            {t('home.brandLeatherTitle')}
          </h2>
          <p className="text-sm font-light text-black/70 leading-relaxed mb-5 max-w-md">
            {t('home.brandLeatherBody')}
          </p>
          <span className="inline-block border-b border-black pb-0.5 text-[11px] tracking-[0.2em] uppercase group-hover:opacity-70 transition-opacity">
            {t('home.brandLeatherCta')}
          </span>
        </Link>

        <Link
          href="/products?vendor=valentino"
          className="group border border-black/10 bg-[#f7f5f1] px-6 py-8 md:px-8 md:py-10 transition-colors hover:border-black/30"
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-black/50 mb-3">
            {t('home.brandOtherEyebrow')}
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-light text-black mb-3">
            {t('home.brandOtherTitle')}
          </h2>
          <p className="text-sm font-light text-black/70 leading-relaxed mb-5 max-w-md">
            {t('home.brandOtherBody')}
          </p>
          <span className="inline-block border-b border-black pb-0.5 text-[11px] tracking-[0.2em] uppercase group-hover:opacity-70 transition-opacity">
            {t('home.brandOtherCta')}
          </span>
        </Link>
      </div>
    </section>
  );
}
