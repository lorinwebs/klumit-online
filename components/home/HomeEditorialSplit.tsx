'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { homeImages } from '@/lib/home-images';

export default function HomeEditorialSplit() {
  const { t } = useLanguage();
  const src = homeImages.editorial;
  const has = Boolean(src?.trim());

  return (
    <section className="grid grid-cols-1 bg-white md:grid-cols-2 md:items-stretch border-t border-black/10">
      <div className="relative aspect-[4/5] w-full min-h-[280px] border-b border-black/10 sm:aspect-[16/10] sm:min-h-[220px] md:aspect-auto md:min-h-[min(70vh,560px)] md:h-full md:border-b-0 md:border-e">
        {has ? (
          <Image
            src={src}
            alt={t('home.editorialImageAlt')}
            fill
            className="object-cover object-[center_40%] sm:object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[#f5f5f5]" role="img" aria-label="" />
        )}
      </div>
      <div className="flex flex-col justify-center px-5 py-12 text-center md:px-14 md:text-start lg:px-16">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-black/50 md:mx-0">
          {t('home.editorialEyebrow')}
        </p>
        <h2 className="mx-auto mb-5 max-w-xl font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-tight text-black font-light md:mx-0 md:max-w-none">
          {t('home.editorialTitle')}
        </h2>
        <p className="mx-auto max-w-prose text-[15px] leading-relaxed text-black/60 md:mx-0">
          {t('home.editorialBody')}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 md:items-start md:gap-6 md:self-stretch md:flex-row md:justify-start">
          <Link
            href="/about"
            className="inline-flex w-full max-w-xs justify-center bg-black px-7 py-3.5 text-[12px] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-80 md:w-auto md:max-w-none"
          >
            {t('home.editorialCta')}
          </Link>
          <Link
            href="/blog"
            className="inline-flex justify-center text-[12px] uppercase tracking-[0.15em] text-black/55 underline-offset-4 hover:text-black hover:underline md:inline-flex md:justify-start"
          >
            {t('home.editorialCtaBlog')}
          </Link>
        </div>
      </div>
    </section>
  );
}
