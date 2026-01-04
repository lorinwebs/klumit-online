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
    // Load Instagram embed script only on desktop
    if (window.innerWidth >= 768) {
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
        
        {/* Mobile - Minimal Design */}
        <div className="md:hidden">
          <a 
            href="https://www.instagram.com/klomit/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-8 border border-gray-200 rounded-lg bg-white hover:border-[#E1306C]/30 transition-colors"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] mb-4">
              <Instagram size={28} className="text-white" />
            </div>
            <p className="text-lg font-light luxury-font text-[#1a1a1a] mb-1">
              @klomit
            </p>
            <p className="text-sm text-gray-500 font-light mb-4">
              עקבו אחרינו באינסטגרם
            </p>
            <span className="inline-flex items-center gap-2 text-[#E1306C] text-sm font-light">
              לפרופיל
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
          </a>
        </div>

        {/* Desktop - Full Embeds */}
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

