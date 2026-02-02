'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoginModal from './LoginModal';
import { X } from 'lucide-react';

export default function MembershipTopBar() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    // בדוק אם המשתמש כבר סגר את הבר
    const dismissed = localStorage.getItem('membershipTopBarDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const checkUser = async () => {
      if (!isMounted) return;
      
      try {
        // בדיקה ראשונית מ-localStorage
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          return;
        }

        // Fallback: בדיקה דרך ה-API
        const res = await fetch('/api/auth/session', { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsLoggedIn(!!data?.user);
          }
        } else {
          if (isMounted) {
            setIsLoggedIn(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsLoggedIn(false);
        }
      }
    };

    checkUser();

    // האזנה לשינויים ב-auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoggedIn(true);
        setShowLoginModal(false);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
      } else if (session) {
        setIsLoggedIn(!!session.user);
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleClick = async () => {
    // שלח אירוע לטלגרם שלחצו על הבר
    try {
      await fetch('/api/telegram/notify-membership-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });
    } catch (error) {
      console.warn('Failed to send click event to Telegram:', error);
    }
    
    // פתח את מודל ההתחברות
    setShowLoginModal(true);
  };

  const handleDismiss = async () => {
    setIsDismissed(true);
    localStorage.setItem('membershipTopBarDismissed', 'true');
    
    // שלח אירוע לטלגרם
    try {
      await fetch('/api/telegram/notify-membership-dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          source: 'topBar',
        }),
      });
    } catch (error) {
      console.warn('Failed to send dismiss event to Telegram:', error);
    }
  };

  // אל תציג את הבר אם: מחובר, נסגר, עדיין בבדיקה, או בדף מקיף חט
  if (isLoggedIn === null || isLoggedIn || isDismissed || pathname === '/mekif-chet-2007-reunion') {
    return null;
  }

  return (
    <>
      <div className="relative bg-[#1a1a1a] text-white py-3 px-4 text-center z-[70]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={handleClick}
            className="text-sm md:text-base font-light hover:underline cursor-pointer"
            dir="rtl"
          >
            הצטרפו למועדון הלקוחות ותקבלו <span className="font-medium">20%</span> בקניה ראשונה!
          </button>
          <button
            onClick={handleDismiss}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          setIsLoggedIn(true);
        }}
      />
    </>
  );
}
