'use client';

import MytheresaGrid from '@/components/MytheresaGrid';
import { useLanguage } from '@/lib/LanguageContext';

export default function HomeProductSection() {
  const { t } = useLanguage();
  const em = t('home.productsTitleEm');

  return (
    <section id="products" className="bg-white scroll-mt-28">
      <div className="mx-auto max-w-[1320px] px-5 pt-14 pb-2 text-center md:px-7 md:pt-20">
        <p className="text-[11px] tracking-[0.3em] uppercase text-black/50 mb-3">
          {t('home.productsEyebrow')}
        </p>
        <h2 className="font-display text-[clamp(1.75rem,4vw,3.25rem)] leading-tight text-black font-light">
          {t('home.productsTitle')}
          {em ? (
            <>
              {' '}
              <em className="italic">{em}</em>
            </>
          ) : null}
        </h2>
      </div>
      <MytheresaGrid category="bags" maxProducts={8} showViewAll={true} embedOnHome />
    </section>
  );
}
