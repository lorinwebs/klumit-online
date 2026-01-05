'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <LazyMotion features={domAnimation} strict>
      <section className="relative w-full h-[70vh] md:h-[85vh] min-h-[400px] landscape:min-h-[100svh] overflow-hidden">
        {/* Full-width Background Image - LCP element */}
        <Image
          src="/coverimage.jpeg"
          alt="קלומית - מוצרי עור מאיטליה"
          fill
          className="object-cover"
          priority
          fetchPriority="high"
          quality={85}
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIRAAMEBRIhMQYTQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0G7c2I20AAeiImpUqD/9k="
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center focus-light">
          <m.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-center text-white px-4"
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
                className="inline-block border border-white px-10 py-3 text-sm tracking-luxury hover:bg-white hover:text-[#1a1a1a] transition-luxury uppercase font-light"
              >
                לצפייה בקולקציה
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>
    </LazyMotion>
  );
}
