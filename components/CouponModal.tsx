'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Copy, Check } from 'lucide-react';

export default function CouponModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const couponCode = 'FIRSTORDER20';

  useEffect(() => {
    let isMounted = true;
    let showTimeout: NodeJS.Timeout;

    const showCoupon = (userId: string) => {
      if (!isMounted) return;
      
      const hasSeenCoupon = localStorage.getItem(`coupon_shown_${userId}`);
      if (hasSeenCoupon) {
        return;
      }

      // עיכוב קצר לפני הצגת המודל
      showTimeout = setTimeout(() => {
        if (isMounted) {
          setIsOpen(true);
          localStorage.setItem(`coupon_shown_${userId}`, 'true');
        }
      }, 1500);
    };

    const checkAndShowCoupon = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userId = session.user.id;
          
          // בדוק אם המשתמש חדש (נוצר בדקה האחרונה)
          const userCreatedAt = session.user.created_at;
          const isNewUser = userCreatedAt && 
            (Date.now() - new Date(userCreatedAt).getTime()) < 120000; // 2 דקות

          if (isNewUser) {
            showCoupon(userId);
          }
        }
      } catch (error) {
        // ignore
      }
    };

    // בדיקה ראשונית
    checkAndShowCoupon();

    // האזנה לשינויים ב-auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const userId = session.user.id;
        
        // בדוק אם המשתמש חדש
        const userCreatedAt = session.user.created_at;
        const isNewUser = userCreatedAt && 
          (Date.now() - new Date(userCreatedAt).getTime()) < 120000; // 2 דקות

        if (isNewUser) {
          showCoupon(userId);
        }
      }
    });

    return () => {
      isMounted = false;
      if (showTimeout) {
        clearTimeout(showTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = couponCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" 
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coupon-modal-title"
    >
      <div 
        className="bg-white w-full max-w-md mx-4 p-8 relative shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        role="document"
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="סגור חלון"
        >
          <X size={24} aria-hidden="true" />
        </button>

        <div className="text-center space-y-6">
          <h2 
            id="coupon-modal-title" 
            className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a]"
          >
            ברוכה הבאה למועדון החברים!
          </h2>
          
          <p className="text-lg md:text-xl font-light text-gray-700 leading-relaxed">
            הקופון שלך לקניה ראשונה:
          </p>

          <div className="bg-gradient-to-r from-[#8B6914] to-[#c9a962] p-6 rounded-lg">
            <div className="flex items-center justify-center gap-4">
              <span className="text-2xl md:text-3xl font-bold text-white tracking-wider">
                {couponCode}
              </span>
              <button
                onClick={handleCopy}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded transition-colors"
                aria-label="העתק קופון"
              >
                {copied ? (
                  <Check size={20} aria-hidden="true" />
                ) : (
                  <Copy size={20} aria-hidden="true" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-white text-sm mt-2">הועתק!</p>
            )}
          </div>

          <p className="text-sm font-light text-gray-600">
            השתמשי בקופון בקופה כדי לקבל 20% הנחה על הקניה הראשונה שלך
          </p>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury"
          >
            תודה!
          </button>
        </div>
      </div>
    </div>
  );
}
