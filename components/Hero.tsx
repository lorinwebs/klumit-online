'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-[#fdfcfb]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-0 md:gap-0 w-full">
        {/* Image Section - Centered */}
        <div className="relative h-[60vh] md:h-[80vh] order-2 md:order-1 flex items-center justify-center px-4 md:px-8 py-8 md:py-0">
          <div className="relative w-full h-full max-w-2xl mx-auto">
            <Image
              src="/hero-venice.jpg"
              alt="תיק יוקרתי בוונציה"
              fill
              className="object-cover object-center"
              priority
              quality={90}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
        
        {/* Text Section */}
        <div className="flex items-center justify-center order-1 md:order-2 bg-[#fdfcfb] px-8 md:px-16 py-12 md:py-0">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-center md:text-right text-[#1a1a1a]"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-6xl mb-6 font-light tracking-luxury leading-tight luxury-font"
            >
              אמנות המינימליזם
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-base md:text-lg mb-12 font-light max-w-md md:max-w-none mx-auto md:mx-0 leading-relaxed"
            >
              ייבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP היישר מאיטליה
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex gap-4 justify-center md:justify-end"
            >
              <Link
                href="/products"
                className="inline-block border border-[#1a1a1a] px-10 py-3 text-sm tracking-luxury hover:bg-[#1a1a1a] hover:text-white transition-luxury uppercase font-light"
              >
                לצפייה בקולקציה
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

