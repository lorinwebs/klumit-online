'use client';

import { getImageProps } from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { homeImages } from '@/lib/home-images';
import { resizedSrcSet } from '@/lib/image-loader';
import AmbientLoop from './AmbientLoop';

/**
 * Mobile: full-bleed tall photo with the copy over a dark gradient at the bottom.
 * Desktop: two halves — copy on an ivory panel, photo beside it (the photo is portrait,
 * so a half-width frame shows it sharp and uncropped instead of stretching it across the screen).
 * The two layouts use different crops of the same scene (see lib/home-images.ts).
 * A short silent loop of the same scene (curtain in the breeze, light on the water) fades
 * in over the still — see AmbientLoop.
 */
// Same crop for the still and the loop, so they sit exactly on top of each other
const PHOTO_FIT = 'absolute inset-0 h-full w-full object-cover object-top md:object-[center_75%]';

export default function HomeHero() {
  const { t, language } = useLanguage();
  const { video: desktopVideo, ...desktopStill } = homeImages.hero;
  const { video: mobileVideo, ...mobileStill } = homeImages.heroMobile;
  // Listed by hand rather than by next/image, whose sizes stop at 1200px: the desktop
  // photo fills half the screen, and large retina screens need the bigger copies.
  const desktopSrcSet = resizedSrcSet(desktopStill.src);
  const {
    // `style` and `loading` are set on the <img> below
    props: { style: _style, loading: _loading, ...mobileImg },
  } = getImageProps({ ...mobileStill, alt: '', sizes: '100vw' });

  const isHe = language === 'he';
  const eyebrowText = isHe ? 'text-sm' : 'text-xs uppercase tracking-[0.2em]';
  const ctaText = isHe ? 'text-base' : 'text-[13px] uppercase tracking-[0.14em]';

  return (
    <section
      className="relative bg-cream-deep md:grid md:h-[calc(100svh-106px)] md:max-h-[600px] md:min-h-[560px] md:grid-cols-2 lg:max-h-[820px]"
      aria-label="Hero"
    >
      {/* Copy — over the photo on mobile, its own panel from md up */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-8 text-white md:static md:flex md:items-center md:px-12 md:pb-0 md:text-espresso lg:px-20">
        <div className="max-w-xl">
          <p className={`mb-3 font-medium text-white/90 md:mb-5 md:text-terracotta ${eyebrowText}`}>
            {t('home.heroEyebrow')}
          </p>
          <h1 className="text-balance font-display text-[2.6rem] font-normal leading-[1.08] md:text-[clamp(3rem,5.2vw,4.75rem)] md:leading-[1.04]">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 max-w-md text-balance text-base leading-relaxed text-white/90 md:mt-6 md:text-lg md:text-stone-dark">
            {t('home.heroDescription')}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4 md:mt-10">
            <Link
              href="/products"
              className={`inline-flex min-h-[52px] items-center justify-center bg-cream px-9 font-medium text-espresso transition-colors duration-300 hover:bg-cream-deep md:bg-espresso md:text-cream md:hover:bg-espresso-light ${ctaText}`}
            >
              {t('home.heroCta')}
            </Link>
            <Link
              href="/about"
              className={`editorial-link text-white transition-opacity hover:opacity-80 md:text-espresso ${ctaText}`}
            >
              {t('home.heroCtaSecondary')}
            </Link>
          </div>
        </div>
      </div>

      {/* Photo */}
      <div className="relative h-[calc(100svh-150px)] max-h-[700px] min-h-[540px] md:h-auto md:max-h-none md:min-h-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes="50vw" />
          {/* Art direction needs <picture>; the sources still come from next/image */}
          <img
            {...mobileImg}
            alt={t('hero.title')}
            loading="eager"
            fetchPriority="high"
            // Phone crop keeps the bags above the copy; desktop crop keeps bags and bridge in frame
            className={PHOTO_FIT}
          />
        </picture>
        <AmbientLoop src={mobileVideo} desktopSrc={desktopVideo} className={PHOTO_FIT} />
        {/* Legibility gradient for the mobile copy */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/45 via-[38%] to-transparent to-[62%] md:hidden"
          aria-hidden
        />
      </div>
    </section>
  );
}
