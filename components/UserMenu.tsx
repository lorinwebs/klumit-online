'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadFromShopify = useCartStore((state) => state.loadFromShopify);

  // Helper for Shopify Sync (kept separate to not block UI)
  const checkShopifyId = async (userId: string) => {
    try {
      fetch(`/api/user/shopify-customer-id?userId=${userId}`, { cache: 'no-store' });
    } catch (e) {
      // silent fail
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        // 1. נסה קודם מ-localStorage (מהיר יותר, עובד גם במובייל)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setUser(session.user);
          setLoading(false);
          loadFromShopify().catch(() => {});
          checkShopifyId(session.user.id);
          return;
        }
        
        // 2. Fallback: בדיקה דרך ה-API (בודק cookies בצד השרת)
        const res = await fetch('/api/auth/session', { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          
          if (data?.user && mounted) {
            setUser(data.user);
            setLoading(false);
            
            // סנכרן את ה-session ל-localStorage
            try {
              if (data.session) {
                await supabase.auth.setSession({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                });
              }
            } catch (err) {
              // ignore
            }
            
            loadFromShopify().catch(() => {});
            checkShopifyId(data.user.id);
            return;
          }
        }
        
        // 3. אין משתמש
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        // שגיאה - נניח שאין משתמש
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // בדיקה ראשונית
    checkUser();

    // האזנה לשינויים ב-auth (Login, Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          loadFromShopify().catch(() => {});
          checkShopifyId(session.user.id);
        } else {
          // אם יש signOut, נבדוק שוב דרך ה-API
          checkUser();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadFromShopify]);

  const Icon = (
    <UserIcon 
      size={22} 
      className={`text-[#1a1a1a] transition-opacity ${loading ? 'opacity-50' : ''}`} 
      aria-hidden="true" 
    />
  );

  // אם יש משתמש, נציג עיגול ירוק
  if (user) {
    return (
      <Link
        href="/account"
        className="relative hover:opacity-70 active:opacity-50 transition-opacity flex items-center justify-center w-6 h-6 min-w-[24px] shrink-0 touch-manipulation"
        aria-label="החשבון שלי"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {Icon}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white pointer-events-none" aria-hidden="true" />
      </Link>
    );
  }
  
  // אם אין משתמש
  return (
    <Link
      href="/auth/login"
      className="relative hover:opacity-70 active:opacity-50 transition-opacity flex items-center justify-center w-6 h-6 min-w-[24px] shrink-0 touch-manipulation"
      aria-label="התחברות"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {Icon}
      {!loading && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gray-400 rounded-full border border-white pointer-events-none" aria-hidden="true" />
      )}
    </Link>
  );
}
