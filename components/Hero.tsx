'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <>
      {/* Text Section - Separate */}
      <section className="w-full bg-[#fdfcfb] py-4 md:py-6 pb-2 md:pb-3">
        <LazyMotion features={domAnimation} strict>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center px-6 py-2 md:px-10 md:py-3 max-w-4xl mx-auto"
          >
            <m.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-3xl md:text-4xl lg:text-5xl mb-1 font-bold tracking-luxury leading-tight luxury-font bg-gradient-to-r from-[#8B6914] via-[#c9a962] to-[#8B6914] bg-clip-text text-transparent"
            >
              קלומית אונליין
            </m.h1>
            
            {/* Mobile Layout */}
            <div className="md:hidden">
              <m.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="text-sm font-bold leading-tight whitespace-nowrap text-[#4a4a4a]"
              >
                יבואני תיקים ארנקים וחגורות מאיטליה • משנת 1984
              </m.p>
              <m.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.7 }}
                className="text-xs font-bold text-[#6a6a6a] mt-0.5"
              >
                יבואנים בלעדיים של <strong className="text-[#8B6914]">Renato Angi Venezia</strong> ו-<strong className="text-[#8B6914]">Carlino Group</strong>
              </m.p>
            </div>
            
            {/* Desktop Layout */}
            <m.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="hidden md:block text-base lg:text-lg font-bold leading-tight text-[#4a4a4a]"
            >
              יבואני תיקים ארנקים וחגורות מאיטליה • משנת 1984
            </m.p>
            <m.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="hidden md:block text-sm lg:text-base font-bold text-[#6a6a6a] mt-0.5"
            >
              יבואנים בלעדיים של <strong className="text-[#8B6914]">Renato Angi Venezia</strong> ו-<strong className="text-[#8B6914]">Carlino Group</strong>
            </m.p>
          </m.div>
        </LazyMotion>
      </section>

      {/* Image Section - Separate */}
      <section className="relative w-full h-[30vh] md:h-[35vh] min-h-[200px] overflow-hidden">
        <Image
          src="/coverimage.jpeg"
          alt="קלומית - מוצרי עור מאיטליה"
          fill
          className="object-cover object-center"
          priority
          fetchPriority="high"
          quality={85}
          sizes="100vw"
          loading="eager"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIRAAMEBRIhMQYTQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0G7c2I20AAeiImpUqD/9k="
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/15" />
      </section>
    </>
  );
}
