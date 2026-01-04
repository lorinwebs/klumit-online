'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/supabase';
import { User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadFromShopify = useCartStore((state) => state.loadFromShopify);

  // פונקציה לבדיקה ויצירת Shopify Customer אם צריך
  // רק אם המשתמש מחובר
  // חשוב: לא ניצור יוזר חדש - זה צריך להיות רק דרך כפתור "חבר עכשיו" בדף החשבון
  const ensureShopifyCustomer = async (user: User) => {
    if (!user) {
      return;
    }
    
    try {
      // בדוק קודם ב-DB דרך API (server-side) במקום client-side
      const response = await fetch(`/api/user/shopify-customer-id?userId=${user.id}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const { shopifyCustomerId } = await response.json();
        if (shopifyCustomerId) {
          return; // יש כבר חיבור, לא צריך לעשות כלום
        }
      }
    } catch (err) {
      // שגיאה בבדיקה - לא קריטי
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          const userData = data.user || data.session?.user;
          
          if (userData) {
            setUser(userData);
            setLoading(false);
            // בדוק Shopify Customer ID רק פעם אחת
            await ensureShopifyCustomer(userData).catch(() => {});
            // טען את העגלה מ-Shopify
            loadFromShopify().catch(() => {});
          } else {
            setUser(null);
            setLoading(false);
            // אם המשתמש התנתק, טען את העגלה מ-localStorage (אם יש)
            loadFromShopify().catch(() => {});
          }
        } else {
          setUser(null);
          setLoading(false);
          // טען את העגלה מ-localStorage (אם יש)
          loadFromShopify().catch(() => {});
        }
      } catch (err) {
        if (!isMounted) return;
        setUser(null);
        setLoading(false);
        // טען את העגלה מ-localStorage (אם יש)
        loadFromShopify().catch(() => {});
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []); // רק פעם אחת ב-mount

  // תמיד הצג את האייקון, גם בזמן טעינה
  // אם יש שגיאה או שהטעינה נתקעה, עדיין נראה את האייקון
  // אם loading, נציג את האייקון של התחברות (default)

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="relative p-1.5 md:p-2 hover:opacity-70 transition-opacity"
        aria-label="התחברות"
      >
        <UserIcon size={20} className={`md:w-[22px] md:h-[22px] text-[#1a1a1a] ${loading ? 'opacity-50' : ''}`} />
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-gray-400 rounded-full border border-white" />
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="relative p-1.5 md:p-2 hover:opacity-70 transition-opacity"
      aria-label="החשבון שלי"
    >
      <UserIcon size={20} className="md:w-[22px] md:h-[22px] text-[#1a1a1a]" />
      <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
    </Link>
  );
}


