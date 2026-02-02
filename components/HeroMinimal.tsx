'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';

interface HeroMinimalProps {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

export default function HeroMinimal({
  title,
  subtitle,
  description,
  ctaText,
  ctaLink = '/about',
  backgroundImage = '/hero-venice.jpg', // Default image
}: HeroMinimalProps) {
  const { t } = useLanguage();
  
  // Use translations with fallback to props
  const displayTitle = title || t('hero.title');
  const displayDescription = description || t('hero.description');
  const displayCtaText = ctaText || t('hero.cta');
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
              className="object-cover scale-110"
              style={{ objectPosition: 'center 30%' }}
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
              style={{ objectPosition: 'center 35%' }}
              sizes="100vw"
              quality={95}
            />
          </div>
        </>
      )}

      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 text-center flex flex-col items-center justify-between pt-8 md:pt-12 pb-6 md:pb-8 h-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="space-y-4 md:space-y-5 w-full"
        >
          {/* Title with hanging tag */}
          <div className="relative inline-block">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-2xl md:text-4xl lg:text-5xl tracking-wide leading-tight text-white drop-shadow-2xl"
              style={{ 
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 300, 
                letterSpacing: '0.08em', 
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                fontStyle: 'normal'
              }}
            >
              {displayTitle}
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
                  {t('hero.newTag')}
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Spacer - maintains spacing */}
          <div className="h-3 md:h-4"></div>

        </motion.div>

        {/* CTA Button - moved to bottom */}
        {displayCtaText && ctaLink && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-auto"
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[8px] md:text-[9px] tracking-[0.25em] uppercase font-light border border-white/50 text-white/80 hover:bg-white/10 hover:border-white hover:text-white transition-all duration-300 cursor-pointer backdrop-blur-sm"
            >
              <span>{displayCtaText}</span>
              <ArrowLeft size={10} className="md:w-3 md:h-3" />
            </a>
          </motion.div>
        )}
      </div>

      {/* Minimal bottom fade - very subtle */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/30 to-transparent pointer-events-none" />
    </section>
  );
}
