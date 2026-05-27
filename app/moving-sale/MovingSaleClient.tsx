'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  MOVING_SALE_CONTACT,
  MOVING_SALE_ITEMS,
  itemGalleryImages,
  itemWhatsAppText,
  whatsAppLink,
  type MovingSaleItem,
} from '@/lib/moving-sale-items';

const STATUS_LABELS_LIGHT: Record<MovingSaleItem['status'], { text: string; className: string }> = {
  available: { text: 'זמין', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  reserved: { text: 'שמור', className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' },
  sold: { text: 'נמכר', className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 line-through' },
};

function formatPrice(n: number) {
  return `₪${n.toLocaleString('he-IL')}`;
}

export default function MovingSaleClient() {
  const categories = useMemo(
    () => ['הכל', ...Array.from(new Set(MOVING_SALE_ITEMS.map((i) => i.category)))],
    [],
  );
  const [category, setCategory] = useState('הכל');
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; name: string } | null>(
    null,
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft') {
        setLightbox((p) => (p ? { ...p, index: (p.index + 1) % p.images.length } : null));
      }
      if (e.key === 'ArrowRight') {
        setLightbox((p) =>
          p ? { ...p, index: (p.index - 1 + p.images.length) % p.images.length } : null,
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const filtered = useMemo(
    () =>
      category === 'הכל'
        ? MOVING_SALE_ITEMS
        : MOVING_SALE_ITEMS.filter((i) => i.category === category),
    [category],
  );

  const generalWhatsApp = whatsAppLink(
    MOVING_SALE_CONTACT.phone,
    'היי! ראיתי את דף המכירה לקראת המעבר דירה — אשמח לפרטים',
  );

  return (
    <div className="min-h-screen bg-[#F6F1EA] text-[#13122B] antialiased selection:bg-[#13122B] selection:text-[#FCE3C9]">
      {/* ──────────── HERO ──────────── */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-20"
          style={{
            background:
              'radial-gradient(130% 95% at 15% 0%, #2B1B57 0%, #3B1F6B 22%, #6B2E6E 42%, #A0436A 62%, #C75A6A 80%, #D86A5E 100%)',
          }}
        />
        <CloudBlob className="left-[-12%] top-[8%] h-72 w-[28rem] opacity-70" delay="0s" />
        <CloudBlob className="right-[-8%] top-[20%] h-56 w-[22rem] opacity-50" delay="-6s" />
        <CloudBlob className="left-[15%] bottom-[-6%] h-64 w-[30rem] opacity-60" delay="-12s" />
        <CloudBlob className="right-[10%] bottom-[10%] h-44 w-[18rem] opacity-40" delay="-3s" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '3px 3px',
          }}
        />

        <div className="mx-auto max-w-5xl px-5 pt-10 pb-12 text-center sm:px-8 sm:pt-14 sm:pb-16">
          <h1 className="mx-auto max-w-3xl text-[1.85rem] font-light leading-[1.1] text-white sm:text-[2.4rem] lg:text-[2.9rem]">
            אנחנו עוברים דירה{' '}
            <span className="font-serif italic text-[#FCE3C9]">ומוכרים הכל!</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            אם משהו מעניין אתכם — בואו לוואטסאפ.{' '}
            <span className="text-[#FCE3C9]">הנחה למי שיקח כמה דברים</span> :)
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/90">
            <a
              href={`tel:+${MOVING_SALE_CONTACT.primary.phone}`}
              className="group inline-flex items-center gap-2 transition hover:text-[#FCE3C9]"
              dir="ltr"
            >
              <span className="font-serif text-[11px] uppercase tracking-[0.25em] text-[#FCE3C9]/80">
                {MOVING_SALE_CONTACT.primary.name}
              </span>
              <span className="font-medium tabular-nums underline decoration-[#FCE3C9]/40 decoration-1 underline-offset-4 group-hover:decoration-[#FCE3C9]">
                {MOVING_SALE_CONTACT.primary.display}
              </span>
            </a>
            <span aria-hidden className="text-white/30">·</span>
            <a
              href={`tel:+${MOVING_SALE_CONTACT.secondary.phone}`}
              className="group inline-flex items-center gap-2 transition hover:text-[#FCE3C9]"
              dir="ltr"
            >
              <span className="font-serif text-[11px] uppercase tracking-[0.25em] text-[#FCE3C9]/80">
                {MOVING_SALE_CONTACT.secondary.name}
              </span>
              <span className="font-medium tabular-nums underline decoration-[#FCE3C9]/40 decoration-1 underline-offset-4 group-hover:decoration-[#FCE3C9]">
                {MOVING_SALE_CONTACT.secondary.display}
              </span>
            </a>
            <span aria-hidden className="text-white/30">·</span>
            <span className="text-white/80">📍 איסוף עצמי מ{MOVING_SALE_CONTACT.location}</span>
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href={generalWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3 text-[15px] font-medium text-[#13122B] shadow-[0_18px_45px_-15px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-15px_rgba(0,0,0,0.45)]"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-[#25D366]" />
              כתבו לנו בוואטסאפ
            </a>
          </div>
        </div>

        <svg
          className="absolute bottom-[-1px] left-0 right-0 h-16 w-full text-[#F6F1EA] sm:h-24"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,64 C240,112 480,16 720,40 C960,64 1200,112 1440,72 L1440,120 L0,120 Z"
          />
        </svg>
      </section>

      {/* ──────────── CATALOG ──────────── */}
      <main id="items" className="relative">
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-14 sm:pb-24">
          <div className="mb-10 flex items-end justify-between gap-4 sm:mb-14">
            <div>
              <p className="font-serif text-xs uppercase tracking-[0.4em] text-[#6B2E6E]">
                The Collection
              </p>
              <h2 className="mt-3 text-3xl font-light text-[#13122B] sm:text-5xl">
                <span className="font-serif italic">כל</span> הפריטים
              </h2>
            </div>
            {categories.length > 1 ? (
              <div className="hidden flex-wrap justify-end gap-2 sm:flex">
                {categories.map((cat) => (
                  <CategoryPill key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                    {cat}
                  </CategoryPill>
                ))}
              </div>
            ) : null}
          </div>

          {categories.length > 1 ? (
            <div className="mb-6 flex flex-wrap gap-2 sm:hidden">
              {categories.map((cat) => (
                <CategoryPill key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                  {cat}
                </CategoryPill>
              ))}
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <ul className="grid gap-6 sm:gap-8 lg:grid-cols-6">
              {filtered.map((item, idx) => {
                const total = filtered.length;
                let span = 'lg:col-span-2';
                if (total === 1) span = 'lg:col-span-6';
                else if (total === 2) span = 'lg:col-span-3';
                else if (total === 4) span = 'lg:col-span-3';
                else if (total === 5) span = idx < 2 ? 'lg:col-span-3' : 'lg:col-span-2';

                return (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    span={span}
                    onOpenLightbox={(images, index) =>
                      setLightbox({ images, index, name: item.name })
                    }
                  />
                );
              })}
            </ul>
          ) : (
            <p className="py-16 text-center font-serif text-lg italic text-[#13122B]/50">
              אין פריטים בקטגוריה הזו
            </p>
          )}

          <section className="mt-24 overflow-hidden rounded-[32px] bg-[#13122B] text-white shadow-[0_40px_100px_-40px_rgba(43,27,87,0.6)]">
            <div className="grid items-start gap-10 p-8 sm:p-12 lg:grid-cols-5 lg:p-16">
              <div className="lg:col-span-3">
                <p className="font-serif text-xs uppercase tracking-[0.4em] text-[#FCE3C9]/80">
                  Get in touch
                </p>
                <h3 className="mt-4 text-3xl font-light leading-tight sm:text-4xl">
                  ראיתם משהו שמדבר אליכם?
                  <br />
                  <span className="font-serif italic text-[#FCE3C9]">בואו נדבר.</span>
                </h3>
                <p className="mt-4 max-w-md text-sm text-white/70 sm:text-base">
                  {MOVING_SALE_CONTACT.location} · {MOVING_SALE_CONTACT.note}
                </p>
              </div>
              <div className="flex flex-col gap-2.5 lg:col-span-2">
                <ContactRow
                  contact={MOVING_SALE_CONTACT.primary}
                  message="היי לורין! ראיתי את דף המכירה — אשמח לפרטים"
                  primary
                />
                <ContactRow
                  contact={MOVING_SALE_CONTACT.secondary}
                  message="היי מור! ראיתי את דף המכירה — אשמח לפרטים"
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t border-[#13122B]/10 bg-[#F6F1EA] py-10 text-center">
        <p className="font-serif text-sm italic text-[#13122B]/60">
          תודה שעוזרים לנו לעבור דירה בקלות
        </p>
      </footer>

      {/* ──────────── FLOATING CTA ──────────── */}
      <a
        href={generalWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 end-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#13122B] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_-10px_rgba(43,27,87,0.6)] ring-1 ring-white/10 backdrop-blur-md transition hover:bg-[#2B1B57] sm:hidden"
        aria-label="צרו קשר בוואטסאפ"
      >
        <WhatsAppIcon className="h-4 w-4 text-[#FCE3C9]" />
        כתבו לנו
      </a>

      {/* ──────────── LIGHTBOX ──────────── */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#13122B]/95 p-4 backdrop-blur-xl"
          role="dialog"
          aria-modal
          aria-label={lightbox.name}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute end-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="סגור"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          {lightbox.images.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute start-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 sm:start-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((prev) =>
                    prev
                      ? {
                          ...prev,
                          index: (prev.index - 1 + prev.images.length) % prev.images.length,
                        }
                      : null,
                  );
                }}
                aria-label="הקודם"
              >
                <svg className="h-5 w-5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="absolute end-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 sm:end-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((prev) =>
                    prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null,
                  );
                }}
                aria-label="הבא"
              >
                <svg className="h-5 w-5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </>
          ) : null}
          <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox.images[lightbox.index]}
              alt={`${lightbox.name} — תמונה ${lightbox.index + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
            <p className="font-serif text-sm italic text-white/90">
              {lightbox.name}
              {lightbox.images.length > 1
                ? ` · ${lightbox.index + 1}/${lightbox.images.length}`
                : ''}
            </p>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function CatalogCard({
  item,
  span,
  onOpenLightbox,
}: {
  item: MovingSaleItem;
  span: string;
  onOpenLightbox: (images: string[], index: number) => void;
}) {
  const images = itemGalleryImages(item);
  const discountPct =
    item.originalPrice && item.price && item.originalPrice > item.price
      ? Math.round((1 - item.price / item.originalPrice) * 100)
      : null;

  return (
    <li
      className={`${span} group relative overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-40px_rgba(43,27,87,0.45)] ring-1 ring-black/[0.04] transition duration-500 hover:shadow-[0_40px_100px_-30px_rgba(43,27,87,0.55)] ${
        item.status === 'sold' ? 'opacity-70' : ''
      }`}
    >
      <div className="relative">
        <ProductImageCarousel
          item={item}
          onZoom={(startIndex) => onOpenLightbox(images, startIndex)}
          aspectClassName="aspect-[4/3]"
          imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <span
          className={`pointer-events-none absolute start-4 top-4 z-20 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide backdrop-blur-md ${STATUS_LABELS_LIGHT[item.status].className}`}
        >
          {STATUS_LABELS_LIGHT[item.status].text}
        </span>

        {discountPct ? (
          <span className="pointer-events-none absolute end-4 top-4 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#13122B] font-serif text-sm italic text-[#FCE3C9] shadow-lg ring-4 ring-white/40">
            −{discountPct}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-col p-6 sm:p-8">
        <p className="font-serif text-[11px] uppercase tracking-[0.35em] text-[#8C6B91]">
          {item.category}
        </p>
        <h3 className="mt-3 text-xl font-light leading-tight text-[#13122B] sm:text-2xl">
          {item.name}
        </h3>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-[#4A4663] sm:text-[15px]">
          {item.description}
        </p>

        {item.referenceUrl ? (
          <a
            href={item.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-[#6B2E6E] transition hover:text-[#13122B]"
          >
            צפו במוצר המקורי
            <svg className="h-3.5 w-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </a>
        ) : null}

        <div className="mt-8 flex items-end justify-between gap-4 border-t border-[#13122B]/10 pt-6">
          <div>
            {item.originalPrice ? (
              <p className="font-serif text-sm italic text-[#13122B]/40 line-through">
                {formatPrice(item.originalPrice)}
              </p>
            ) : null}
            {item.price ? (
              <p className="font-serif text-3xl font-light leading-none text-[#13122B] sm:text-4xl">
                {formatPrice(item.price)}
              </p>
            ) : (
              <p className="font-serif text-lg font-light italic leading-tight text-[#13122B] sm:text-xl">
                מחיר לבירור
              </p>
            )}
          </div>

          {item.status === 'available' ? (
            <a
              href={whatsAppLink(MOVING_SALE_CONTACT.phone, itemWhatsAppText(item))}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn inline-flex shrink-0 items-center gap-2 rounded-full bg-[#13122B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2B1B57]"
            >
              מעוניין/ת
              <svg
                className="h-4 w-4 transition-transform group-hover/btn:translate-x-[-3px] rtl:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </a>
          ) : (
            <span className="font-serif text-sm italic text-[#13122B]/50">
              {item.status === 'reserved' ? 'שמור עבור לקוח' : 'נמכר'}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function ProductImageCarousel({
  item,
  onZoom,
  aspectClassName = 'aspect-[4/3]',
  imageSizes,
  priorityFirst = false,
}: {
  item: MovingSaleItem;
  onZoom: (startIndex: number) => void;
  aspectClassName?: string;
  imageSizes?: string;
  priorityFirst?: boolean;
}) {
  const images = itemGalleryImages(item);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [item.id]);

  if (images.length === 0) {
    return (
      <div
        className={`relative w-full overflow-hidden bg-gradient-to-br from-[#EFE7DC] to-[#FCE3C9] ${aspectClassName}`}
      >
        <span
          className="absolute inset-0 flex items-center justify-center text-7xl opacity-50"
          aria-hidden
        >
          {item.emoji ?? '✦'}
        </span>
      </div>
    );
  }

  const safeIdx = Math.min(idx, images.length - 1);
  const src = images[safeIdx]!;

  const stop = <T extends React.SyntheticEvent>(e: T) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const goPrev = (e: React.MouseEvent) => {
    stop(e);
    setIdx((i) => (i - 1 + images.length) % images.length);
  };
  const goNext = (e: React.MouseEvent) => {
    stop(e);
    setIdx((i) => (i + 1) % images.length);
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br from-[#EFE7DC] to-[#FCE3C9] ${aspectClassName}`}
    >
      <Image
        key={src}
        src={src}
        alt={`${item.name} — תמונה ${safeIdx + 1}`}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes={imageSizes}
        priority={priorityFirst && safeIdx === 0}
      />

      {/* zoom overlay */}
      <button
        type="button"
        aria-label={`הגדל תמונה — ${item.name}`}
        onClick={() => onZoom(safeIdx)}
        className="absolute inset-0 cursor-zoom-in"
      />

      {/* arrows */}
      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="תמונה הקודמת"
            className="absolute start-2.5 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#13122B] shadow-md ring-1 ring-black/5 backdrop-blur-md transition hover:bg-white sm:start-3 sm:h-10 sm:w-10"
          >
            <svg className="h-4 w-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="תמונה הבאה"
            className="absolute end-2.5 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#13122B] shadow-md ring-1 ring-black/5 backdrop-blur-md transition hover:bg-white sm:end-3 sm:h-10 sm:w-10"
          >
            <svg className="h-4 w-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </>
      ) : null}

      {/* dots */}
      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
          {images.map((thumb, i) => (
            <button
              key={thumb}
              type="button"
              onClick={(e) => {
                stop(e);
                setIdx(i);
              }}
              aria-label={`תמונה ${i + 1}`}
              aria-current={i === safeIdx}
              className={`h-1.5 rounded-full ring-1 ring-black/10 transition-all duration-300 ${
                i === safeIdx ? 'w-6 bg-white shadow' : 'w-1.5 bg-white/75 hover:bg-white'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CloudBlob({ className = '', delay = '0s' }: { className?: string; delay?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -z-10 rounded-full bg-white blur-3xl ${className}`}
      style={{ animation: `drift 18s ease-in-out ${delay} infinite` }}
    />
  );
}

function ContactRow({
  contact,
  message,
  primary = false,
}: {
  contact: { name: string; phone: string; display: string };
  message: string;
  primary?: boolean;
}) {
  const wa = whatsAppLink(contact.phone, message);
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-3 ring-1 ring-inset ${
        primary
          ? 'bg-[#FCE3C9] text-[#13122B] ring-transparent'
          : 'bg-white/5 text-white ring-white/15'
      }`}
    >
      <div className="flex flex-col">
        <span
          className={`font-serif text-[10px] uppercase tracking-[0.3em] ${
            primary ? 'text-[#6B2E6E]' : 'text-[#FCE3C9]/70'
          }`}
        >
          {contact.name}
        </span>
        <a
          href={`tel:+${contact.phone}`}
          dir="ltr"
          className="mt-0.5 text-base font-semibold tabular-nums underline-offset-4 hover:underline sm:text-lg"
        >
          {contact.display}
        </a>
      </div>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`וואטסאפ — ${contact.name}`}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
          primary
            ? 'bg-[#13122B] text-[#FCE3C9] hover:bg-[#2B1B57]'
            : 'bg-[#FCE3C9] text-[#13122B] hover:bg-white'
        }`}
      >
        <WhatsAppIcon className="h-5 w-5" />
      </a>
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-[#13122B] text-white shadow-sm'
          : 'bg-white text-[#13122B]/70 ring-1 ring-[#13122B]/10 hover:bg-[#FCE3C9] hover:text-[#13122B]'
      }`}
    >
      {children}
    </button>
  );
}

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
