'use client';

import { useEffect, useState } from 'react';
import { supabase, type User } from '@/lib/supabase';
import { User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadFromShopify = useCartStore((state) => state.loadFromShopify);

  // פונקציה לבדיקה ויצירת Shopify Customer אם צריך
  const ensureShopifyCustomer = async (user: User) => {
    try {
      const { getShopifyCustomerId, syncCustomerToShopify } = await import('@/lib/sync-customer');
      let shopifyCustomerId = await getShopifyCustomerId(user.id);
      
      // אם אין Shopify Customer ID, ננסה למצוא/ליצור אותו אוטומטית
      // אבל רק אם לא ניסינו לאחרונה (כדי למנוע throttling)
      if (!shopifyCustomerId) {
        // בדוק אם ניסינו ליצור customer לאחרונה (ב-5 דקות האחרונות)
        const lastAttemptKey = `shopify_customer_creation_attempt_${user.id}`;
        const lastAttempt = localStorage.getItem(lastAttemptKey);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (lastAttempt && (now - parseInt(lastAttempt)) < fiveMinutes) {
          console.log('⏳ Skipping customer creation - last attempt was less than 5 minutes ago (throttling protection)');
          return; // אל תנסה ליצור customer שוב אם ניסינו לאחרונה
        }
        
        console.log('🔄 No Shopify Customer ID found, attempting to find/create customer...');
        const phone = user.phone || user.user_metadata?.phone;
        const email = user.email || user.user_metadata?.email;
        
        // חייב להיות טלפון כדי ליצור customer (זה המזהה העיקרי)
        if (phone) {
          // שמור זמן ניסיון
          localStorage.setItem(lastAttemptKey, now.toString());
          
          try {
            // syncCustomerToShopify יחפש customer קיים לפי טלפון או ייצור חדש
            shopifyCustomerId = await syncCustomerToShopify(
              user.id,
              phone,
              {
                email: email || undefined,
                firstName: user.user_metadata?.first_name || undefined,
                lastName: user.user_metadata?.last_name || undefined,
              }
            );
            
            // אם הצלחנו, מחק את ה-timestamp
            if (shopifyCustomerId) {
              localStorage.removeItem(lastAttemptKey);
              console.log('✅ Created/found Shopify Customer automatically:', shopifyCustomerId);
            } else {
              console.warn('⚠️ Could not create/find Shopify customer');
            }
          } catch (err) {
            console.warn('⚠️ Could not create Shopify customer:', err);
            // אם זו שגיאת throttling, נשאיר את ה-timestamp כדי לא לנסות שוב
          }
        } else {
          console.warn('⚠️ No phone - cannot create/find Shopify customer (phone is required)');
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not ensure Shopify Customer:', err);
    }
  };

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // אם יש משתמש מחובר, ודא שיש לו Shopify Customer ואז טען את העגלה
      if (session?.user) {
        await ensureShopifyCustomer(session.user).catch(err => 
          console.warn('Error ensuring Shopify customer:', err)
        );
        loadFromShopify().catch(err => console.warn('Failed to load cart from Shopify:', err));
      }
    }).catch(err => {
      console.error('Error getting session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // אם יש משתמש מחובר, ודא שיש לו Shopify Customer ואז טען את העגלה
      if (session?.user) {
        await ensureShopifyCustomer(session.user).catch(err => 
          console.warn('Error ensuring Shopify customer:', err)
        );
        loadFromShopify().catch(err => console.warn('Failed to load cart from Shopify:', err));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadFromShopify]);

  // תמיד הצג את האייקון, גם בזמן טעינה
  // אם יש שגיאה או שהטעינה נתקעה, עדיין נראה את האייקון
  // אם loading, נציג את האייקון של התחברות (default)

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="p-2 hover:opacity-70 transition-opacity"
        aria-label="התחברות"
      >
        <UserIcon size={24} className={`text-[#1a1a1a] ${loading ? 'opacity-50' : ''}`} />
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="p-2 hover:opacity-70 transition-opacity"
      aria-label="החשבון שלי"
    >
      <UserIcon size={24} className="text-[#1a1a1a]" />
    </Link>
  );
}


