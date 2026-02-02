'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function AboutCTA() {
  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-[#fdfcfb] to-[#f8f7f4]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center"
        >
          {/* CTA Button */}
          <Link
            href="/about"
            className="group flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white hover:bg-[#c9a962] transition-all duration-300 text-sm tracking-wider uppercase font-light"
          >
            <span>הסיפור שלנו</span>
            <ArrowLeft size={16} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
