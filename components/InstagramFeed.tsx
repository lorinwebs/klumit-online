'use client';

import { Instagram } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const INSTAGRAM_POSTS = [
  'https://www.instagram.com/p/DSuvqk2DFsU/',
  'https://www.instagram.com/p/DS3PG80joao/',
  'https://www.instagram.com/p/DSyDj4CDtcN/',
];

export default function InstagramFeed() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const processEmbeds = () => {
    if ((window as any).instgrm?.Embeds) {
      (window as any).instgrm.Embeds.process();
    }
  };

  useEffect(() => {
    // Load Instagram embed script (only once)
    const existing = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    if (existing) {
      // script already on page
      processEmbeds();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => processEmbeds();
  }, []);

  // Track which slide is active (for dots)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let raf = 0;

    const updateActive = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slides = Array.from(el.querySelectorAll('[data-slide]')) as HTMLDivElement[];
        const center = el.scrollLeft + el.clientWidth / 2;

        let bestIndex = 0;
        let bestDist = Infinity;

        slides.forEach((s, i) => {
          const slideCenter = s.offsetLeft + s.clientWidth / 2;
          const dist = Math.abs(center - slideCenter);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
          }
        });

        setActive(bestIndex);
      });
    };

    el.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    return () => {
      el.removeEventListener('scroll', updateActive);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelector(`[data-slide="${i}"]`) as HTMLElement | null;
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <section className="py-12 md:py-24 bg-[#fdfcfb]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <a
            href="https://www.instagram.com/klomit/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 md:gap-3 group"
          >
            <Instagram size={22} className="text-[#E1306C] group-hover:scale-110 transition-transform md:w-7 md:h-7" />
            <span className="text-lg md:text-3xl font-light luxury-font text-[#1a1a1a]">
              עקבו אחרינו באינסטגרם
            </span>
          </a>
          <p className="text-gray-500 font-light mt-1 md:mt-3 text-sm md:text-base">@klomit</p>
        </div>

        {/* Mobile - Carousel (horizontal scroll + snap) */}
        <div className="md:hidden">
          <div
            ref={scrollerRef}
            className="
              flex gap-4 overflow-x-auto snap-x snap-mandatory
              px-4 -mx-4 pb-3
              scroll-smooth
              touch-pan-x
              scrollbar-hide
            "
          >
            {INSTAGRAM_POSTS.map((postUrl, index) => (
              <div
                key={index}
                data-slide={index}
                className="snap-center shrink-0 w-[85vw] max-w-[350px]"
              >
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={postUrl}
                  data-instgrm-version="14"
                  style={{
                    background: '#FFF',
                    border: '1px solid #dbdbdb',
                    borderRadius: '4px',
                    boxShadow: 'none',
                    margin: '0',
                    maxWidth: '350px',
                    padding: 0,
                    width: '100%',
                    minHeight: 480,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {INSTAGRAM_POSTS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                aria-label={`Instagram post ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-opacity ${
                  active === i ? 'opacity-100 bg-black' : 'opacity-30 bg-black'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop - Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 justify-items-center">
          {INSTAGRAM_POSTS.map((postUrl, index) => (
            <div key={index} className="w-full max-w-[328px]">
              <blockquote
                className="instagram-media"
                data-instgrm-captioned
                data-instgrm-permalink={postUrl}
                data-instgrm-version="14"
                style={{
                  background: '#FFF',
                  border: '1px solid #dbdbdb',
                  borderRadius: '4px',
                  boxShadow: 'none',
                  margin: '0',
                  maxWidth: '100%',
                  minWidth: '280px',
                  padding: 0,
                  width: '100%',
                }}
              />
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-6 md:mt-10">
          <a
            href="https://www.instagram.com/klomit/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white px-6 md:px-8 py-2.5 md:py-3 text-sm tracking-luxury uppercase font-light hover:opacity-90 transition-opacity rounded-sm"
          >
            <Instagram size={18} />
            לפרופיל המלא
          </a>
        </div>
      </div>
    </section>
  );
}
