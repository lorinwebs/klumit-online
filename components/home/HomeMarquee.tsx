'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function HomeMarquee() {
  const { t } = useLanguage();
  const items = [t('home.marquee1'), t('home.marquee2'), t('home.marquee3'), t('home.marquee4')];

  const segment = (
    <div className="flex shrink-0 items-center gap-[60px] px-3">
      {items.map((label, i) => (
        <span key={i} className="inline-flex items-center gap-[60px] shrink-0">
          <span>{label}</span>
          <span className="text-biasia-accent">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="border-y border-biasia-line overflow-hidden bg-biasia-bg-alt" aria-hidden="true">
      <div
        dir="ltr"
        className="home-marquee-track flex w-max animate-marquee-slide py-3.5 text-[11px] tracking-[0.3em] uppercase text-biasia-muted"
      >
        {segment}
        {segment}
      </div>
    </div>
  );
}
