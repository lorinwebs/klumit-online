'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface ToastProps {
  show: boolean;
  message: string;
  showViewCart?: boolean;
}

export default function Toast({ show, message, showViewCart = true }: ToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-[#1a1a1a] text-white px-6 py-4 rounded-sm shadow-lg flex items-center gap-4 min-w-[280px]">
            <div className="flex-shrink-0">
              <Check size={18} className="text-white" />
            </div>
            <span className="text-sm font-light tracking-luxury uppercase flex-grow">
              {message}
            </span>
            {showViewCart && (
              <Link
                href="/cart"
                className="text-xs font-light tracking-luxury uppercase underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                צפה בעגלה
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

