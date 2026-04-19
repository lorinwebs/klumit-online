'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { homeImages } from '@/lib/home-images';

export default function HomeHero() {
  const { t, language } = useLanguage();
  const heroSrc = homeImages.hero;
  const hasImage = Boolean(heroSrc?.trim());
  return (
    <section
      className="relative min-h-[min(88dvh,720px)] h-[min(90dvh,calc(100dvh-88px))] max-h-[960px] overflow-hidden bg-biasia-bg md:min-h-[560px] md:h-[min(88vh,900px)]"
      aria-label="Hero"
    >
      {/* Media — cover on mobile for full-bleed (like desktop); dvh avoids mobile browser chrome issues */}
      <div className="absolute inset-0 bg-biasia-bg">
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
          <div
            className="absolute inset-0 bg-biasia-bg-alt border-b border-biasia-line"
            role="img"
            aria-label=""
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/10 pointer-events-none" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-end px-5 pb-[max(2.25rem,env(safe-area-inset-bottom,0px))] pt-24 text-center text-[#fbf6ee] sm:px-6 sm:pb-[10%]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl space-y-5"
        >
          <p className="text-[11px] tracking-[0.35em] uppercase opacity-90">
            {t('home.heroEyebrow')}
          </p>
          <h1
            className="font-display font-light text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] tracking-tight"
            style={{ textShadow: '0 2px 30px rgba(0,0,0,0.25)' }}
          >
            {t('home.heroTitle')}{' '}
            <em className="italic text-[#fbf6ee]">{t('home.heroTitleItalic')}</em>
          </h1>
          <p
            className={`mx-auto max-w-lg text-sm md:text-[15px] leading-relaxed opacity-95 ${
              language === 'he' ? 'text-balance' : ''
            }`}
          >
            {t('home.heroDescription')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/products"
              className="inline-block border border-[rgba(251,246,238,0.75)] px-7 py-3.5 text-[12px] tracking-[0.22em] uppercase text-[#fbf6ee] transition-colors hover:bg-[#fbf6ee] hover:text-biasia-ink"
            >
              {t('home.heroCta')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
