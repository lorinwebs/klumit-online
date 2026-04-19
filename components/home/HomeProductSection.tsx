'use client';

import MytheresaGrid from '@/components/MytheresaGrid';
import { useLanguage } from '@/lib/LanguageContext';

export default function HomeProductSection() {
  const { t } = useLanguage();

  return (
    <section id="products" className="bg-biasia-bg scroll-mt-28">
      <div className="mx-auto max-w-[1320px] px-5 pt-14 pb-4 text-center md:px-7 md:pt-20">
        <p className="text-[11px] tracking-[0.3em] uppercase text-biasia-muted mb-3">
          {t('home.productsEyebrow')}
        </p>
        <h2 className="font-display text-[clamp(1.75rem,4vw,3.25rem)] leading-tight text-biasia-ink">
          {t('home.productsTitle')}{' '}
          <em className="italic text-biasia-accent">{t('home.productsTitleEm')}</em>
        </h2>
      </div>
      <MytheresaGrid category="bags" maxProducts={8} showViewAll={true} embedOnHome />
    </section>
  );
}
