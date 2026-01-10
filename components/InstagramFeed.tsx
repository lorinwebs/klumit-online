'use client';

import { Instagram } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const INSTAGRAM_POSTS = [
  'https://www.instagram.com/p/DSuvqk2DFsU/',
  'https://www.instagram.com/p/DS3PG80joao/',
  'https://www.instagram.com/p/DSyDj4CDtcN/',
];

export default function InstagramFeed() {
  const [active, setActive] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const processEmbeds = () => {
    if ((window as any).instgrm?.Embeds) {
      (window as any).instgrm.Embeds.process();
      // Add title to Instagram iframes for accessibility
      setTimeout(() => {
        document.querySelectorAll('iframe.instagram-media-rendered').forEach((iframe, i) => {
          if (!iframe.getAttribute('title')) {
            iframe.setAttribute('title', `Instagram post ${i + 1}`);
          }
        });
      }, 1000);
    }
  };

  // Lazy load: detect when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load slightly before visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load Instagram embed script only when visible
  useEffect(() => {
    if (!isVisible) return;

    const existing = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    if (existing) {
      processEmbeds();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => processEmbeds();
  }, [isVisible]);

  // Re-process embeds when active slide changes
  useEffect(() => {
    if (!isVisible) return;
    const timeout = setTimeout(() => processEmbeds(), 100);
    return () => clearTimeout(timeout);
  }, [active, isVisible]);

  return (
    <section ref={sectionRef} className="py-8 md:py-12 bg-[#fdfcfb]">
      {/* Divider */}
      <div className="flex items-center justify-center mb-8 md:mb-12 px-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <span className="px-6 text-xs tracking-[0.3em] uppercase text-gray-400">◆</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>
      
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

        {/* Mobile - Single post with navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-center gap-2">
            {/* Right arrow (RTL) */}
            <button
              onClick={() => setActive((prev) => (prev > 0 ? prev - 1 : INSTAGRAM_POSTS.length - 1))}
              className="p-3 text-gray-500 active:text-black"
              aria-label="Previous post"
            >
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 6l8 10-8 10" />
              </svg>
            </button>

            <div className="relative" style={{ maxWidth: '300px', width: '100%' }}>
              {INSTAGRAM_POSTS.map((postUrl, index) => (
              <div
                key={index}
                className={`${active === index ? 'block' : 'hidden'}`}
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
                    margin: '0 auto',
                    maxWidth: '300px',
                    padding: 0,
                    width: '100%',
                  }}
                />
              </div>
            ))}
            </div>

            {/* Left arrow (RTL) */}
            <button
              onClick={() => setActive((prev) => (prev < INSTAGRAM_POSTS.length - 1 ? prev + 1 : 0))}
              className="p-3 text-gray-500 active:text-black"
              aria-label="Next post"
            >
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6l-8 10 8 10" />
              </svg>
            </button>
          </div>

          {/* Dots */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {INSTAGRAM_POSTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
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

      </div>
    </section>
  );
}
