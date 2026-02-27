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
  backgroundImage = '/hero-venice.jpg',
}: HeroMinimalProps) {
  const { t } = useLanguage();

  const displayTitle = title || t('hero.title');
  const displayDescription = description || t('hero.description');
  const displayCtaText = ctaText || t('hero.cta');

  return (
    <section className="relative h-[45vh] md:h-[70vh] min-h-[340px] md:min-h-[540px] flex items-end overflow-hidden">
      {/* Background Image */}
      {backgroundImage && (
        <>
          <div className="absolute inset-0 md:hidden">
            <Image
              src={backgroundImage}
              alt="Hero background"
              fill
              priority
              className="object-cover"
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

      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-espresso/15 to-transparent" />

      {/* Content — anchored to bottom */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-10 pb-10 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5 md:space-y-6"
        >
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl md:text-5xl lg:text-6xl font-light text-white leading-[1.1] max-w-2xl"
            style={{ textShadow: '0 2px 30px rgba(0,0,0,0.2)' }}
          >
            {displayTitle}
          </motion.h1>

          {/* CTA */}
          {displayCtaText && ctaLink && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                className="group inline-flex items-center gap-2 text-[10px] md:text-[11px] tracking-editorial uppercase font-medium text-white/90 hover:text-white transition-all duration-500"
              >
                <span>{displayCtaText}</span>
                <ArrowLeft size={12} className="transition-transform duration-500 group-hover:-translate-x-1" />
                <span className="block w-8 h-[1px] bg-white/40 group-hover:w-12 group-hover:bg-white/80 transition-all duration-500" />
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
