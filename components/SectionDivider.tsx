'use client';

import { motion } from 'framer-motion';

export default function SectionDivider() {
  return (
    <div className="py-12 md:py-16 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Left ornament */}
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-400"></div>
          
          {/* Center decorative element */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c9a962] opacity-40"></div>
            <div className="w-16 h-px bg-gradient-to-r from-[#c9a962]/40 via-[#c9a962] to-[#c9a962]/40"></div>
            <div className="w-3 h-3 rounded-full bg-[#c9a962] shadow-sm"></div>
            <div className="w-16 h-px bg-gradient-to-r from-[#c9a962] via-[#c9a962] to-[#c9a962]/40"></div>
            <div className="w-2 h-2 rounded-full bg-[#c9a962] opacity-40"></div>
          </div>
          
          {/* Right ornament */}
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-400"></div>
        </motion.div>
        
        {/* Optional text */}
        <motion.p 
          className="text-center mt-6 text-xs tracking-[0.3em] uppercase text-gray-400 font-light"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          הקולקציה שלנו
        </motion.p>
      </div>
    </div>
  );
}
