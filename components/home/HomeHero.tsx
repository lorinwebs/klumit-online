'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { homeImages } from '@/lib/home-images';

export default function HomeHero() {
  const { t, language } = useLanguage();
  const heroSrc = homeImages.hero;
  const hasImage = Boolean(heroSrc?.trim());
  const italic = t('home.heroTitleItalic');

  return (
    <section
      className="relative min-h-[min(88dvh,720px)] h-[min(90dvh,calc(100dvh-120px))] max-h-[960px] overflow-hidden bg-cream md:min-h-[560px] md:h-[min(88vh,900px)]"
      aria-label="Hero"
    >
      <div className="absolute inset-0 bg-cream">
        {hasImage ? (
          <div className="absolute inset-0">
            <div className="relative h-full w-full min-h-[260px]">
              <Image
                src={heroSrc}
                alt={t('hero.title')}
                fill
                className="object-cover object-[center_32%] md:object-cover md:object-center"
                priority
                sizes="100vw"
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#f5f5f5] border-b border-black/10" role="img" aria-label="" />
        )}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-center px-5 pb-16 pt-24 text-center text-white sm:px-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <p className="text-[11px] tracking-[0.35em] uppercase opacity-90">
            {t('home.heroEyebrow')}
          </p>
          <h1 className="font-display font-light text-[clamp(2.75rem,8vw,5.5rem)] leading-[1.05] tracking-tight">
            {t('home.heroTitle')}
            {italic ? (
              <>
                {' '}
                <em className="italic">{italic}</em>
              </>
            ) : null}
          </h1>
          <p
            className={`mx-auto max-w-lg text-sm md:text-[15px] leading-relaxed opacity-90 ${
              language === 'he' ? 'text-balance' : ''
            }`}
          >
            {t('home.heroDescription')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/products"
              className="inline-block border-b border-white pb-1 text-[12px] tracking-[0.22em] uppercase text-white transition-opacity hover:opacity-70"
            >
              {t('home.heroCta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
