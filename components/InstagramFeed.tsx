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
    <section className="py-16 md:py-24 bg-[#fdfcfb]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <a 
            href="https://www.instagram.com/klomit/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 group"
          >
            <Instagram size={28} className="text-[#E1306C] group-hover:scale-110 transition-transform" />
            <span className="text-2xl md:text-3xl font-light luxury-font text-[#1a1a1a]">
              עקבו אחרינו באינסטגרם
            </span>
          </a>
          <p className="text-gray-500 font-light mt-3">
            @klomit
          </p>
        </div>

        {/* Instagram Posts - Carousel on mobile, Grid on desktop */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 w-max pb-4">
            {INSTAGRAM_POSTS.map((postUrl, index) => (
              <div 
                key={index} 
                className="w-[280px] flex-shrink-0 bg-white rounded-lg overflow-hidden shadow-sm"
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
    </section>
  );
}

