'use client';

import { Instagram } from 'lucide-react';
import { useEffect } from 'react';

// Add Instagram post URLs here - update these to show different posts
const INSTAGRAM_POSTS = [
  'https://www.instagram.com/p/DSuvqk2DFsU/',
  'https://www.instagram.com/p/DS3PG80joao/',
  'https://www.instagram.com/p/DSyDj4CDtcN/',
];

export default function InstagramFeed() {
  useEffect(() => {
    // Load Instagram embed script only for desktop
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
        }
      };

      return () => {
        const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
        if (existingScript) {
          existingScript.remove();
        }
      };
    }
  }, []);

  return (
    <section className="py-12 md:py-24 bg-[#fdfcfb]">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Mobile - Clean minimal grid */}
        <div className="md:hidden">
          <div className="text-center mb-6">
            <a 
              href="https://www.instagram.com/klomit/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 group"
            >
              <Instagram size={22} className="text-[#E1306C]" />
              <span className="text-lg font-light luxury-font text-[#1a1a1a]">
                @klomit
              </span>
            </a>
          </div>
          
          {/* 3 Square thumbnails */}
          <div className="grid grid-cols-3 gap-1">
            {INSTAGRAM_POSTS.map((postUrl, index) => (
              <a
                key={index}
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#833AB4]/10 via-[#E1306C]/10 to-[#F77737]/10 group-hover:from-[#833AB4]/20 group-hover:via-[#E1306C]/20 group-hover:to-[#F77737]/20 transition-all" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Instagram size={24} className="text-[#E1306C]" />
                </div>
                <div className="absolute bottom-1 right-1">
                  <Instagram size={14} className="text-white/70" />
                </div>
              </a>
            ))}
          </div>
          
          <div className="text-center mt-4">
            <a
              href="https://www.instagram.com/klomit/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#E1306C] text-sm font-light"
            >
              עקבו אחרינו באינסטגרם
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Desktop - Full embeds */}
        <div className="hidden md:block">
          <div className="text-center mb-12">
            <a 
              href="https://www.instagram.com/klomit/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 group"
            >
              <Instagram size={28} className="text-[#E1306C] group-hover:scale-110 transition-transform" />
              <span className="text-3xl font-light luxury-font text-[#1a1a1a]">
                עקבו אחרינו באינסטגרם
              </span>
            </a>
            <p className="text-gray-500 font-light mt-3">
              @klomit
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 justify-items-center">
            {INSTAGRAM_POSTS.map((postUrl, index) => (
              <div 
                key={index} 
                className="w-full max-w-[328px] bg-white rounded-lg overflow-hidden shadow-sm"
              >
                <blockquote
                  className="instagram-media"
                  data-instgrm-captioned
                  data-instgrm-permalink={postUrl}
                  data-instgrm-version="14"
                  style={{
                    background: '#FFF',
                    border: 0,
                    borderRadius: '3px',
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

          <div className="text-center mt-10">
            <a
              href="https://www.instagram.com/klomit/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white px-8 py-3 text-sm tracking-luxury uppercase font-light hover:opacity-90 transition-opacity rounded-sm"
            >
              <Instagram size={18} />
              לפרופיל המלא
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
