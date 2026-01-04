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

    // Process embeds when script loads
    script.onload = () => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
      }
    };

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <section className="py-12 md:py-24 bg-[#fdfcfb] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <a 
            href="https://www.instagram.com/klomit/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 md:gap-3 group"
          >
            <Instagram size={24} className="text-[#E1306C] group-hover:scale-110 transition-transform md:w-7 md:h-7" />
            <span className="text-xl md:text-3xl font-light luxury-font text-[#1a1a1a]">
              עקבו אחרינו באינסטגרם
            </span>
          </a>
          <p className="text-gray-500 font-light mt-2 text-sm md:text-base">
            @klomit
          </p>
        </div>

        {/* Instagram Posts - Carousel on mobile, Grid on desktop */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 overflow-y-visible">
          <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
            {INSTAGRAM_POSTS.map((postUrl, index) => (
              <div 
                key={index} 
                className="w-[260px] flex-shrink-0 bg-white rounded-lg shadow-sm"
                style={{ overflow: 'visible' }}
              >
                <blockquote
                  className="instagram-media"
                  data-instgrm-permalink={postUrl}
                  data-instgrm-version="14"
                  style={{
                    background: '#FFF',
                    border: 0,
                    borderRadius: '3px',
                    boxShadow: 'none',
                    margin: '0',
                    maxWidth: '260px',
                    minWidth: '260px',
                    padding: 0,
                    width: '260px',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 justify-items-center">
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

        {/* CTA Button */}
        <div className="text-center mt-8 md:mt-10">
          <a
            href="https://www.instagram.com/klomit/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white px-6 md:px-8 py-3 text-sm tracking-luxury uppercase font-light hover:opacity-90 transition-opacity rounded-sm"
          >
            <Instagram size={18} />
            לפרופיל המלא
          </a>
        </div>
      </div>
    </section>
  );
}

