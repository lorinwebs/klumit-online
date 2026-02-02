'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface HeroMinimalProps {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

export default function HeroMinimal({
  title = 'קולקציית 2026',
  subtitle,
  description = 'תיקים יוקרתיים מעור איטלקי. עיצובים חדשים מ-RENATO ANGI ו-CARLINO GROUP',
  ctaText = 'הסיפור שלנו',
  ctaLink = '/about',
  backgroundImage = '/hero-venice.jpg', // Default image
}: HeroMinimalProps) {
  return (
    <section 
      className="relative h-[30vh] md:h-[60vh] min-h-[300px] md:min-h-[500px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      {backgroundImage && (
        <>
          <div className="absolute inset-0 hero-bg-mobile md:hidden">
            <Image
              src={backgroundImage}
              alt="Hero background"
              fill
              priority
              className="object-cover"
              style={{ objectPosition: 'center 25%' }}
              sizes="100vw"
              quality={90}
            />
          </div>
          <div className="absolute inset-0 hidden md:block">
            <Image
              src={backgroundImage}
              alt="Hero background"
              fill
              priority
              className="object-cover"
              style={{ objectPosition: 'center 45%' }}
              sizes="100vw"
              quality={90}
            />
          </div>
        </>
      )}

      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="space-y-4 md:space-y-5"
        >
          {/* Title with hanging tag */}
          <div className="relative inline-block">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl tracking-wide leading-tight text-white drop-shadow-2xl"
              style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 100, 
                letterSpacing: '0.1em', 
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                fontStyle: 'normal'
              }}
            >
              {title}
            </motion.h1>

            {/* "נחתה באתר" - Floating tag */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 1.5, 
                delay: 0.4,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
              className="absolute -bottom-8 md:-bottom-10 -left-8 md:-left-16"
            >
              {/* Tag with rotation and movement */}
              <motion.div
                animate={{ 
                  rotate: [-5, 5, -5],
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span 
                  className="inline-block text-[10px] md:text-xs tracking-[0.3em] uppercase font-light text-white/90 px-3 md:px-4 py-1 md:py-1.5 border-2 border-white/50 backdrop-blur-sm whitespace-nowrap"
                  style={{ 
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  נחתה באתר
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Spacer - maintains spacing */}
          <div className="h-3 md:h-4"></div>

          {/* CTA Button */}
          {ctaText && ctaLink && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="pt-4"
            >
              <a
                href={ctaLink}
                onClick={(e) => {
                  if (ctaLink.startsWith('#')) {
                    e.preventDefault();
                    const element = document.querySelector(ctaLink);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-2 text-[10px] md:text-xs tracking-[0.3em] uppercase font-light border border-white/70 text-white hover:bg-white/10 hover:border-white transition-all duration-300 cursor-pointer backdrop-blur-sm"
              >
                <span>{ctaText}</span>
                <ArrowLeft size={14} />
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Minimal bottom fade - very subtle */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/30 to-transparent pointer-events-none" />
    </section>
  );
}
