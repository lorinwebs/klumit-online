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
  const [emailOTPCode, setEmailOTPCode] = useState('');
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

      setUser(session.user);
      setLoading(false);
    }

    checkUser();
  }, [router]);

  const handleSendEmailOTP = async () => {
    if (!formData.email) {
      setError('אנא הזן אימייל תחילה');
      return;
    }

    setError('');
    setVerifyingEmail(true);

    try {
      // נסה לשלוח OTP דרך signInWithOtp
      // הערה: כדי שזה יעבוד, צריך לאפשר הרשמות חדשות ב-Supabase Dashboard
      // Auth → Settings → Email Auth → Enable email signups
      // כדי לשלוח OTP (קוד 6 ספרות) במקום Magic Link, לא צריך להגדיר emailRedirectTo
      // Supabase ישלח OTP אוטומטית אם emailRedirectTo לא מוגדר
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: true, // נשתמש ב-true כדי לאפשר שליחת OTP
          // לא מגדירים emailRedirectTo - זה יגרום לשליחת OTP (קוד 6 ספרות) במקום Magic Link
          // אם האימייל כבר קיים, זה לא ייצור משתמש חדש
          // אם האימייל לא קיים, זה ייצור משתמש חדש עם האימייל הזה
        },
      });

      if (otpError) {
        // אם יש שגיאת "Signups not allowed", צריך לאפשר הרשמות חדשות ב-Supabase
        if (otpError.message.includes('Signups not allowed')) {
          setError('אנא הפעל הרשמות חדשות ב-Supabase Dashboard: Auth → Settings → Email Auth → Enable email signups');
          return;
        }
        
        throw otpError;
      }

      // אם OTP נשלח בהצלחה
      setEmailOTPSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת קוד אימות');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOTPCode || emailOTPCode.length !== 6) {
      setError('אנא הזן קוד בן 6 ספרות');
      return;
    }

    setError('');
    setVerifyingEmail(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: emailOTPCode,
        type: 'email',
      });

      if (verifyError) {
        // תרגום שגיאות לעברית
        let errorMessage = verifyError.message;
        if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
          errorMessage = 'הקוד פג תוקף או לא תקין';
        }
        throw new Error(errorMessage);
      }

      if (data.user) {
        setEmailVerified(true);
        // עדכן את האימייל ב-user_metadata
        await supabase.auth.updateUser({
          data: {
            email: formData.email,
            email_verified: true,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה באימות הקוד');
    } finally {
      setVerifyingEmail(false);
    }
  };

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
                    setEmailOTPCode('');
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
                      {verifyingEmail ? 'שולח...' : 'שלח קוד אימות במייל'}
                    </button>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm font-light text-right">
                        נשלח קוד אימות לכתובת {formData.email}. אנא הזן את הקוד:
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={emailOTPCode}
                          onChange={(e) => setEmailOTPCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="flex-1 px-4 py-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-center tracking-widest"
                          placeholder="000000"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOTP}
                          disabled={verifyingEmail || emailOTPCode.length !== 6}
                          className="bg-[#1a1a1a] text-white py-3 px-6 text-sm font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {verifyingEmail ? 'מאמת...' : 'אמת'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOTPSent(false);
                          setEmailOTPCode('');
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 text-right"
                      >
                        שלח קוד חדש
                      </button>
                    </>
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

