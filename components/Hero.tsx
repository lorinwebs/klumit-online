'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Full-width Background Image */}
      <Image
        src="/cover.jpeg"
        alt="קלומית - מוצרי עור מאיטליה"
        fill
        className="object-cover"
        priority
        quality={90}
        sizes="100vw"
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-center text-white px-4"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl mb-4 font-light tracking-luxury leading-tight luxury-font"
          >
            קלומית בע״מ
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl lg:text-2xl mb-3 font-light leading-relaxed"
          >
            יבואני תיקים ארנקים וחגורות מאיטליה - משנת 1984
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-base md:text-lg mb-10 font-light opacity-90"
          >
            יבואנים בלעדיים של <strong>RENATO ANGI VENEZIA</strong> ו-<strong>CARLINO GROUP VENEZIA</strong>
          </motion.p>
          <motion.div 
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
