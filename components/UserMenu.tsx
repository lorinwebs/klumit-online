'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const loadFromShopify = useCartStore((state) => state.loadFromShopify);
  
  // Ref אחד למניעת ריצות כפולות - עוקב אחרי ה-user ID שכבר עיבדנו
  const processedUserIdRef = useRef<string | null>(null);

  // פונקציה מרכזית לניהול שינויי משתמש (סינכרון עגלה + בדיקת שופיפיי)
  const handleUserSync = useCallback(async (currentUser: User | null) => {
    // 1. עדכון סטייט מקומי
    setUser(currentUser);
    setLoading(false);

    // 2. אם המשתמש הוא אותו משתמש שכבר עיבדנו - לא עושים כלום
    // (מטפל גם במקרה של null וגם במקרה של אותו user id)
    if (processedUserIdRef.current === currentUser?.id) {
      return;
    }

    // עדכון ה-Ref למשתמש הנוכחי (או null)
    processedUserIdRef.current = currentUser?.id || null;

    // 3. טעינת עגלה מחדש (תמיד קורה כשמתחלף יוזר או מתנתק)
    // loadFromShopify אמורה לדעת לטפל במצב שאין יוזר (לטעון עגלת אורח/מקומי)
    try {
      await loadFromShopify();
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }

    // 4. בדיקת חיבור שופיפיי (רק אם יש משתמש מחובר)
    if (currentUser) {
      try {
        const response = await fetch(`/api/user/shopify-customer-id?userId=${currentUser.id}`, {
          credentials: 'include',
          cache: 'no-store'
        });
        // אנחנו לא צריכים את התוצאה כאן, רק לוודא שהקריאה קרתה לצרכי סנכרון בצד שרת אם צריך
        if (response.ok) {
          // בדיקה הושלמה בהצלחה
        }
      } catch (err) {
        // התעלמות שקטה משגיאות בדיקת רקע
      }
    }
  }, [loadFromShopify]);

  useEffect(() => {
    let isMounted = true;

    // 1. בדיקה ראשונית בעליית הקומפוננטה
    const checkInitialSession = async () => {
      try {
        const { data: { user: initialUser } } = await supabase.auth.getUser();
        if (isMounted) {
          await handleUserSync(initialUser);
        }
      } catch (error) {
        if (isMounted) {
          await handleUserSync(null);
        }
      }
    };

    checkInitialSession();

    // 2. האזנה לשינויים (כולל Refresh Token, Sign In, Sign Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const sessionUser = session?.user || null;
      
      // אופטימיזציה: אם האירוע הוא רק עדכון טוקן והיוזר לא השתנה, נדלג
      if (event === 'TOKEN_REFRESHED' && sessionUser?.id === processedUserIdRef.current) {
        return;
      }

      await handleUserSync(sessionUser);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleUserSync]);

  // Render Logic
  const Icon = (
    <UserIcon 
      size={22} 
      className={`text-[#1a1a1a] transition-opacity ${loading ? 'opacity-50' : ''}`} 
      aria-hidden="true" 
    />
  );

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="relative hover:opacity-70 transition-opacity flex items-center justify-center w-6 h-6 min-w-[24px] shrink-0"
        aria-label="התחברות"
      >
        {Icon}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gray-400 rounded-full border border-white" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="relative hover:opacity-70 transition-opacity flex items-center justify-center w-6 h-6 min-w-[24px] shrink-0"
      aria-label="החשבון שלי"
    >
      {Icon}
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" aria-hidden="true" />
    </Link>
  );
}
