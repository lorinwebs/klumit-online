'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full h-[85vh] md:h-[90vh] min-h-[600px] overflow-hidden">
      {/* Full-screen Image */}
      <Image
        src="/coverimage.jpeg"
        alt="קלומית - מוצרי עור מאיטליה"
        fill
        className="object-cover object-center"
        priority
        fetchPriority="high"
        quality={95}
        sizes="100vw"
        loading="eager"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIRAAMEBRIhMQYTQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0G7c2I20AAeiImpUqD/9k="
      />
      
      {/* Subtle dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Text Overlay - Centered, Large, Minimalist */}
      <LazyMotion features={domAnimation} strict>
        <div className="absolute inset-0 flex items-center justify-center">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center px-6 md:px-12 max-w-5xl mx-auto"
          >
            {/* Main Brand Name - Large, Elegant */}
            <m.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl mb-6 md:mb-8 font-light tracking-[0.05em] leading-[1.1] luxury-font text-white"
            >
              קלומית אונליין
            </m.h1>
            
            {/* Subtitle - Elegant, Spacious */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="space-y-3 md:space-y-4"
            >
              <m.p 
                className="text-sm md:text-base lg:text-lg font-light tracking-[0.15em] uppercase text-white/90 leading-relaxed"
              >
                יבואני תיקים ארנקים וחגורות מאיטליה
              </m.p>
              
              <m.div className="w-16 md:w-20 h-px bg-white/40 mx-auto" />
              
              <m.p 
                className="text-xs md:text-sm lg:text-base font-light tracking-[0.2em] uppercase text-white/70 leading-relaxed"
              >
                משנת 1984
              </m.p>
            </m.div>
            
            {/* Exclusive Brands - Subtle, Bottom */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-white/20"
            >
              <p className="text-[10px] md:text-xs lg:text-sm font-light tracking-[0.25em] uppercase text-white/60 leading-relaxed">
                יבואנים בלעדיים של{' '}
                <span className="text-white/80">Renato Angi Venezia</span>
                {' '}ו-{' '}
                <span className="text-white/80">Carlino Group</span>
              </p>
            </m.div>
          </m.div>
        </div>
      </LazyMotion>
      
      {/* Subtle bottom gradient for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fdfcfb] to-transparent pointer-events-none" />
    </section>
  );
}
