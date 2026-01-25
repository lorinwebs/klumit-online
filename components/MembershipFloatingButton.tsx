'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoginModal from './LoginModal';
import { X } from 'lucide-react';

export default function MembershipFloatingButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // בדוק אם המשתמש כבר סגר את הכפתור
    const dismissed = localStorage.getItem('membershipFloatingButtonDismissed');
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
        // סגור את המודל אם הוא פתוח
        setShowLoginModal(false);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
      } else if (session) {
        // בדיקה נוספת למקרה שהאירוע לא SIGNED_IN אבל יש סשן
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

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem('membershipFloatingButtonDismissed', 'true');
    
    // שלח אירוע לטלגרם
    try {
      await fetch('/api/telegram/notify-membership-dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });
    } catch (error) {
      // Silent fail - don't break the dismiss functionality
      console.warn('Failed to send dismiss event to Telegram:', error);
    }
  };

  // אם המשתמש מחובר, עדיין בודקים, או שהכפתור נסגר - אל תציג את הכפתור
  if (isLoggedIn === null || isLoggedIn || isDismissed) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50 relative">
        <button
          onClick={() => setShowLoginModal(true)}
          className="bg-gradient-to-r from-[#8B6914] to-[#c9a962] text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col items-center gap-1 group relative pr-8"
          aria-label="הצטרף למועדון החברים"
          dir="rtl"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="סגור"
            dir="ltr"
          >
            <X size={14} className="text-white" />
          </button>
          <span className="text-sm md:text-base font-light tracking-luxury uppercase whitespace-nowrap">
            מועדון חברים - 20% לקניה ראשונה
          </span>
        </button>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={async () => {
          // סגור את המודל מיד
          setShowLoginModal(false);
          
          // המתן קצת כדי שהסשן יישמר
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // בדוק מחדש את מצב ההתחברות
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              setIsLoggedIn(true);
            } else {
              // אם עדיין אין סשן, נסה דרך ה-API
              const res = await fetch('/api/auth/session', { 
                credentials: 'include',
                cache: 'no-store'
              });
              if (res.ok) {
                const data = await res.json();
                setIsLoggedIn(!!data?.user);
              }
            }
          } catch (error) {
            // ignore
          }
          
          router.refresh();
        }}
      />
    </>
  );
}
