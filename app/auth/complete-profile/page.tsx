'use client';

import { useState, useEffect } from 'react';
import { supabase, type User } from '@/lib/supabase';
import { syncCustomerToShopify } from '@/lib/sync-customer';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User as UserIcon, Phone, Mail } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // בדוק אם המשתמש כבר מילא פרטים
      // אם יש first_name ו-last_name, המשתמש כבר נרשם - מעבר לדף הבית
      const hasProfile = 
        (session.user.user_metadata?.first_name && session.user.user_metadata?.last_name) ||
        session.user.email;
      
      if (hasProfile) {
        // המשתמש כבר נרשם - מעבר לדף הבית
        router.push('/');
        return;
      }

      setUser(session.user);
      
      // בדוק אם האימייל כבר מאומת
      if (session.user.email && session.user.email_confirmed_at) {
        setEmailVerified(true);
      }
      
      setLoading(false);
    }

    checkUser();
  }, [router]);

  const handleSendEmailOTP = async () => {
    if (!formData.email) {
      setError('אנא הזן אימייל תחילה');
      return;
    }

    if (!user) {
      setError('משתמש לא מחובר');
      return;
    }

    setError('');
    setVerifyingEmail(true);

    try {
      // עדכן את האימייל של המשתמש הקיים ושלח magic link
      const { error: updateError } = await supabase.auth.updateUser({
        email: formData.email,
      }, {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
      });

      if (updateError) {
        // אם האימייל כבר קיים במשתמש אחר, נשמור רק ב-user_metadata
        if (updateError.message.includes('already registered') || 
            updateError.message.includes('already exists') ||
            updateError.message.includes('User already registered')) {
          // שמור את האימייל ב-user_metadata בלבד
          const { error: metadataError } = await supabase.auth.updateUser({
            data: {
              email: formData.email,
              email_verified: false,
            },
          });

          if (metadataError) {
            throw metadataError;
          }

          setEmailOTPSent(true);
          setError('האימייל נשמר ב-user_metadata. הערה: האימייל כבר קיים במשתמש אחר, לכן הוא נשמר רק ב-user_metadata ולא ב-user.email.');
          return;
        }
        throw updateError;
      }

      // אם updateUser הצליח, נשלח magic link אוטומטית
      setEmailOTPSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת קישור אימות');
    } finally {
      setVerifyingEmail(false);
    }
  };

  // בדוק אם האימייל כבר מאומת (כשהמשתמש חוזר מהקישור)
  useEffect(() => {
    async function checkEmailVerification() {
      if (!user || !formData.email) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === formData.email && session.user.email_confirmed_at) {
        setEmailVerified(true);
        setEmailOTPSent(false);
      }
    }
    
    checkEmailVerification();
  }, [user, formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!user) {
        throw new Error('משתמש לא מחובר');
      }

      // עדכן את הפרופיל ב-Supabase
      const updateData: {
        data: {
          first_name: string;
          last_name: string;
          email?: string;
          email_verified?: boolean;
        };
      } = {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
      };

      // אם יש אימייל, חייבים לאמת אותו לפני המשך
      if (formData.email.length > 0 && !emailVerified) {
        throw new Error('אנא אמת את האימייל לפני סיום ההרשמה');
      }

      // אם יש אימייל מאומת, עדכן אותו
      if (formData.email.length > 0 && emailVerified) {
        updateData.data.email = formData.email;
        updateData.data.email_verified = true;
      }

      // עדכן את השם
      const { error: updateError } = await supabase.auth.updateUser(updateData);

      if (updateError) throw updateError;

      // סנכרן עם Shopify (עם כל הפרטים)
      try {
        await syncCustomerToShopify(
          user.id, 
          user.phone || '', 
          {
            email: formData.email || undefined,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }
        );
      } catch (syncError) {
        console.warn('Could not sync to Shopify:', syncError);
        // לא נזרוק שגיאה - זה לא קריטי
      }

      // מעבר לדף הבית
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת הפרטים');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
        <Header />
        <main className="flex-grow max-w-md mx-auto px-4 py-20 w-full">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-12 w-64 mb-8" />
            <div className="bg-gray-200 h-32 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow max-w-md mx-auto px-4 py-20 w-full">
        <div className="bg-white border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-light luxury-font mb-2 text-right">
            השלם את הפרטים
          </h1>
          <p className="text-sm font-light text-gray-600 mb-8 text-right">
            אנא מלא את הפרטים הבאים להשלמת ההרשמה
          </p>

          <div className="mb-6">
            <label className="block text-sm font-light mb-2 text-right">
              מספר טלפון
            </label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 text-right">
                <Phone size={20} className="text-gray-400" />
                <span className="text-sm font-light text-gray-700">
                  {user.phone || 'לא צוין'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-light mb-2 text-right">
                שם פרטי
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-2 text-right">
                שם משפחה
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-2 text-right">
                אימייל
              </label>
              <div className="relative">
                <Mail size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setEmailOTPSent(false);
                    setEmailVerified(false);
                    setError('');
                  }}
                  disabled={emailVerified}
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="your@email.com"
                />
              </div>
              <p className="text-xs font-light text-gray-500 mt-2 text-right">
                נשתמש באימייל לשליחת עדכונים והזמנות
              </p>
              
              {formData.email.length > 0 && !emailVerified && (
                <div className="mt-4 space-y-3">
                  {!emailOTPSent ? (
                    <button
                      type="button"
                      onClick={handleSendEmailOTP}
                      disabled={verifyingEmail}
                      className="w-full bg-gray-100 text-[#1a1a1a] py-3 px-6 text-sm font-light hover:bg-gray-200 transition-luxury disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      {verifyingEmail ? 'שולח...' : 'שלח קישור אימות במייל'}
                    </button>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm font-light text-right">
                      נשלח קישור אימות לכתובת {formData.email}. אנא בדוק את תיבת הדואר שלך ולחץ על הקישור כדי לאמת את האימייל.
                    </div>
                  )}
                </div>
              )}
              
              {emailVerified && (
                <div className="mt-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm font-light text-right flex items-center gap-2">
                  <span>✓</span>
                  <span>האימייל אומת בהצלחה</span>
                </div>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                saving || 
                !formData.firstName || 
                !formData.lastName || 
                (formData.email.length > 0 && !emailVerified)
              }
              className="w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'שומר...' : 'סיים הרשמה'}
            </button>
            
            {formData.email && !emailVerified && (
              <p className="text-xs text-gray-500 text-right mt-2">
                אנא אמת את האימייל לפני סיום ההרשמה
              </p>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

