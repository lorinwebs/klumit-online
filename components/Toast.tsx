'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ToastProps {
  show: boolean;
  message: string;
  showViewCart?: boolean;
  type?: 'success' | 'warning';
}

export default function Toast({ show, message, showViewCart = true, type = 'success' }: ToastProps) {
  const isWarning = type === 'warning';
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50"
          role="alert"
          aria-live="polite"
          style={{
            maxWidth: 'calc(100vw - 2rem)',
          }}
        >
          <div className={`${isWarning ? 'bg-amber-600' : 'bg-[#1a1a1a]'} text-white px-4 md:px-6 py-3 md:py-4 rounded-sm shadow-lg flex items-center gap-3 md:gap-4 w-full max-w-full`}>
            <div className="flex-shrink-0" aria-hidden="true">
              {isWarning ? (
                <AlertCircle size={18} className="text-white" />
              ) : (
                <Check size={18} className="text-white" />
              )}
            </div>
            <span className="text-sm font-light tracking-luxury uppercase flex-grow break-words whitespace-normal">
              {message}
            </span>
            {showViewCart && !isWarning && (
              <Link
                href="/cart"
                className="text-xs font-light tracking-luxury uppercase underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap flex-shrink-0"
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

