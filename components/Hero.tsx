'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full h-[60vh] md:h-[65vh] min-h-[350px] landscape:min-h-[80svh] overflow-hidden">
      {/* Full-width Background Image - LCP element - Loaded first, outside LazyMotion */}
      <Image
        src="/coverimage.jpeg"
        alt="קלומית - מוצרי עור מאיטליה"
        fill
        className="object-cover"
        priority
        fetchPriority="high"
        quality={85}
        sizes="100vw"
        loading="eager"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIRAAMEBRIhMQYTQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0G7c2I20AAeiImpUqD/9k="
      />
      
      {/* Warm Light Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/25" />
      
      {/* Content - Wrapped in LazyMotion for animations only */}
      <LazyMotion features={domAnimation} strict>
        <div className="absolute inset-0 flex items-center justify-center focus-light">
          <m.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-center text-white px-4"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)' }}
          >
            <m.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-3xl md:text-5xl lg:text-6xl mb-4 font-light tracking-luxury leading-tight luxury-font"
            >
              קלומית אונליין
            </m.h1>
            
            {/* Mobile Layout */}
            <div className="md:hidden">
              <m.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg font-light leading-relaxed"
              >
                יבואני תיקים ארנקים וחגורות מאיטליה
              </m.p>
              <m.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.8 }}
                className="text-lg font-light leading-relaxed mb-3"
              >
                משנת 1984
              </m.p>
              <m.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-base font-light opacity-90"
              >
                יבואנים בלעדיים של
              </m.p>
              <m.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.8 }}
                className="text-lg font-light opacity-90 mb-10"
              >
                <strong>Renato Angi Venezia</strong> ו-<strong>Carlino Group</strong>
              </m.p>
            </div>
            
            {/* Desktop Layout */}
            <m.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="hidden md:block text-xl lg:text-2xl mb-3 font-light leading-relaxed"
            >
              יבואני תיקים ארנקים וחגורות מאיטליה - משנת 1984
            </m.p>
            <m.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="hidden md:block text-xl lg:text-2xl mb-10 font-light opacity-90"
            >
              יבואנים בלעדיים של <strong>Renato Angi Venezia</strong> ו-<strong>Carlino Group</strong>
            </m.p>
            <m.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link
                href="/products"
                className="inline-block bg-white text-[#1a1a1a] px-12 py-4 text-sm tracking-luxury hover:bg-[#c9a962] hover:text-white transition-luxury uppercase font-medium shadow-lg"
                style={{ textShadow: 'none' }}
              >
                לצפייה בקולקציה
              </Link>
            </m.div>
          </m.div>
        </div>
      </LazyMotion>
    </section>
  );
}
