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
    // Load Instagram embed script
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
  }, []);

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
          <p className="text-gray-500 font-light mt-1 md:mt-3 text-sm md:text-base">
            @klomit
          </p>
        </div>

        {/* Mobile - Horizontal scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {INSTAGRAM_POSTS.map((postUrl, index) => (
              <div 
                key={index} 
                className="w-[280px] flex-shrink-0"
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
                    maxWidth: '280px',
                    minWidth: '280px',
                    padding: 0,
                    width: '280px',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop - Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 justify-items-center">
          {INSTAGRAM_POSTS.map((postUrl, index) => (
            <div 
              key={index} 
              className="w-full max-w-[328px]"
            >
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
