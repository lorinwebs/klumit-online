'use client';

import { useState, useEffect } from 'react';
import { supabase, type User } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User as UserIcon, Phone, Mail } from 'lucide-react';
import { verifyEmailOtpServer } from '@/app/auth/actions';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  
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
      const hasProfile = session.user.user_metadata?.first_name && session.user.user_metadata?.last_name;
      
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
      // שלח קוד OTP לאימייל (ללא קישור)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        // אם האימייל כבר קיים במשתמש אחר, נשמור רק ב-user_metadata
        if (otpError.message.includes('already registered') || 
            otpError.message.includes('already exists') ||
            otpError.message.includes('User already registered')) {
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

          // נסה לשלוח OTP שוב
          const { error: retryError } = await supabase.auth.signInWithOtp({
            email: formData.email,
            options: {
              shouldCreateUser: false,
            },
          });

          if (retryError && !retryError.message.includes('Signups not allowed')) {
            throw retryError;
          }
        } else {
          throw otpError;
        }
      }

      setEmailOTPSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת קוד אימות');
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
        <main id="main-content" className="flex-grow max-w-md mx-auto px-4 py-20 w-full" role="main">
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
      <main id="main-content" className="flex-grow max-w-md mx-auto px-4 py-20 w-full" role="main">
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
                    setEmailVerificationCode('');
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
                      {verifyingEmail ? 'שולח...' : 'שלח קוד אימות במייל'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm font-light text-right">
                        נשלח קוד אימות לכתובת {formData.email}. אנא בדוק את תיבת הדואר שלך והזן את הקוד למטה כדי לאמת את האימייל.
                      </div>
                      <div>
                        <label className="block text-xs font-light mb-1 text-right text-gray-600">
                          קוד אימות
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={emailVerificationCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setEmailVerificationCode(value);
                            }}
                            className="flex-1 px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-center tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!emailVerificationCode || emailVerificationCode.length !== 6) {
                                setError('אנא הזן קוד אימות תקין (6 ספרות)');
                                return;
                              }
                              
                              setVerifyingEmail(true);
                              setError('');
                              
                              const formDataToSend = new FormData();
                              formDataToSend.append('email', formData.email);
                              formDataToSend.append('token', emailVerificationCode);
                              
                              const result = await verifyEmailOtpServer(null, formDataToSend);
                              
                              if (result.error) {
                                setError(result.error);
                                setVerifyingEmail(false);
                              } else {
                                setEmailVerified(true);
                                setEmailOTPSent(false);
                                setEmailVerificationCode('');
                                setVerifyingEmail(false);
                                
                                // עדכן את האימייל ב-user
                                const { data: { user: updatedUser } } = await supabase.auth.getUser();
                                if (updatedUser) {
                                  setUser(updatedUser);
                                }
                              }
                            }}
                            disabled={verifyingEmail || emailVerificationCode.length !== 6}
                            className="px-4 py-2 bg-[#1a1a1a] text-white text-xs tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {verifyingEmail ? 'מאמת...' : 'אמת'}
                          </button>
                        </div>
                      </div>
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

