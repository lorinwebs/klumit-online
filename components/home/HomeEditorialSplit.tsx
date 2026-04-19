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
    <section className="grid grid-cols-1 bg-biasia-bg-alt md:grid-cols-2 md:items-stretch">
      <div className="relative aspect-[4/5] w-full min-h-[280px] border-b border-biasia-line sm:aspect-[16/10] sm:min-h-[220px] md:aspect-auto md:min-h-[min(70vh,560px)] md:h-full md:border-b-0 md:border-e">
        {has ? (
          <Image
            src={src}
            alt={t('home.editorialImageAlt')}
            fill
            className="object-cover object-[center_40%] sm:object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-sand" role="img" aria-label="" />
        )}
      </div>
      <div className="flex flex-col justify-center px-6 py-12 md:px-14 lg:px-16">
        <p className="text-[11px] tracking-[0.3em] uppercase text-biasia-muted mb-3">
          {t('home.editorialEyebrow')}
        </p>
        <h2 className="font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-tight text-biasia-ink mb-5">
          {t('home.editorialTitle')}
        </h2>
        <p className="max-w-prose text-[15px] leading-relaxed text-biasia-muted">
          {t('home.editorialBody')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link
            href="/about"
            className="inline-flex w-fit border border-biasia-ink px-7 py-3.5 text-[12px] tracking-[0.2em] uppercase text-biasia-ink transition-colors hover:bg-biasia-ink hover:text-biasia-bg"
          >
            {t('home.editorialCta')}
          </Link>
          <Link
            href="/blog"
            className="inline-flex w-fit text-[12px] tracking-[0.15em] uppercase text-biasia-muted underline-offset-4 hover:text-biasia-ink hover:underline"
          >
            {t('home.editorialCtaBlog')}
          </Link>
        </div>
      </div>
    </section>
  );
}
