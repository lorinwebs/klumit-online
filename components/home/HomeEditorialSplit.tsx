'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { homeImages } from '@/lib/home-images';
import AmbientLoop from './AmbientLoop';

const FOUNDED = 1983;
const REWIND_MS = 2200;

/**
 * The year rewinds from today back to 1983 the first time the number scrolls into view.
 * Before that (and without JavaScript, or with reduced motion) it simply reads 1983.
 */
function useRewindingYear() {
  const ref = useRef<HTMLSpanElement>(null);
  const [year, setYear] = useState(FOUNDED);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Already on screen when the page opened: leave it as it is rather than make it jump
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    const from = new Date().getFullYear();
    let frame = 0;
    setYear(from);
    setWaiting(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setWaiting(false);
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / REWIND_MS);
          // Slow start (so today's year is seen), fast through the decades, settling on 1983
          const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          setYear(Math.round(from - (from - FOUNDED) * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, year, waiting };
}

/** Heritage: a dark band with the archive photo brought to life and the founding year. */
export default function HomeEditorialSplit() {
  const { t, language } = useLanguage();
  const { src, video } = homeImages.editorial;
  const { ref: yearRef, year, waiting } = useRewindingYear();
  const isHe = language === 'he';
  const labelText = isHe ? 'text-sm' : 'text-xs uppercase tracking-[0.2em]';
  const ctaText = isHe ? 'text-base' : 'text-[13px] uppercase tracking-[0.14em]';

  return (
    <section className="bg-espresso px-4 py-16 text-cream md:px-8 md:py-28">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* The archive photo is 16:9 and modest in resolution — framed at its own ratio, never stretched */}
        <figure className="lg:col-span-7">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-espresso-light ring-1 ring-cream/15">
            <Image
              src={src}
              alt={t('home.editorialImageAlt')}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
            <AmbientLoop src={video} className="absolute inset-0 h-full w-full object-cover" />
            {/* Soft darkening at the edges, like an old print */}
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(43,33,27,0.45)_100%)]"
              aria-hidden
            />
          </div>
          <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-[13px] text-stone-light">
            <span>{t('home.editorialImageCaption')}</span>
            <span className={isHe ? '' : 'uppercase tracking-[0.18em]'}>{t('home.editorialArchive')}</span>
          </figcaption>
        </figure>

        <div className="lg:col-span-5">
          <p className={`mb-4 font-medium text-terracotta-light ${labelText}`}>
            {t('home.editorialEyebrow')}
          </p>
          <h2 className="font-display text-cream">
            <span className="block text-xl md:text-2xl">{t('home.editorialSince')}</span>
            {/* Screen readers get the real year; the rewinding digits are decoration */}
            <span className="sr-only">{FOUNDED}</span>
            <span
              ref={yearRef}
              aria-hidden
              className={`block text-[clamp(5.5rem,12vw,9.5rem)] leading-[0.95] tabular-nums text-terracotta-light transition-opacity duration-500 ${
                waiting ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {year}
            </span>
            <span className="mt-3 block text-balance text-[1.75rem] leading-[1.2] md:text-[2.25rem]">
              {t('home.editorialTagline')}
            </span>
          </h2>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-cream/80 md:text-[17px]">
            {t('home.editorialBody')}
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-x-6 border-t border-cream/15 pt-6">
            <li>
              <p className="font-display text-[1.75rem] leading-none text-cream">40+</p>
              <p className="mt-2 text-sm text-stone-light">{t('home.editorialYearsLabel')}</p>
            </li>
            <li>
              <p className="font-display text-[1.05rem] leading-snug text-cream">
                <span className="block">Renato Angi</span>
                <span className="block">Carlino Group</span>
              </p>
              <p className="mt-2 text-sm text-stone-light">{t('home.editorialExclusiveLabel')}</p>
            </li>
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            {/* Outlined, with an arrow that leans forward on hover — quieter than a solid block on the dark band */}
            <Link
              href="/about"
              className={`group inline-flex min-h-[52px] items-center gap-3.5 border border-cream/45 px-7 font-medium text-cream transition-colors duration-300 hover:border-cream hover:bg-cream hover:text-espresso ${ctaText}`}
            >
              {t('home.editorialCta')}
              <svg
                width="22"
                height="10"
                viewBox="0 0 22 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden
                className={`shrink-0 transition-transform duration-300 ${
                  isHe ? '-scale-x-100 group-hover:-translate-x-1.5' : 'group-hover:translate-x-1.5'
                }`}
              >
                <path d="M0 5h21M16.5 1l4.5 4-4.5 4" />
              </svg>
            </Link>
            <Link
              href="/blog"
              className={`inline-flex min-h-[44px] items-center text-cream/85 underline decoration-cream/35 decoration-1 underline-offset-[7px] transition-colors duration-300 hover:text-cream hover:decoration-cream ${ctaText}`}
            >
              {t('home.editorialCtaBlog')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
