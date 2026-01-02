'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { syncCustomerToShopify } from '@/lib/sync-customer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [e164Phone, setE164Phone] = useState(''); // שמור את המספר המנורמל ב-E.164

  // פונקציה לנרמול מספר טלפון ישראלי ל-E.164
  const normalizeILPhone = (raw: string): string => {
    // הסר כל תווים שאינם ספרות
    const digits = raw.replace(/\D/g, '');
    
    // אם כבר יש קידומת 972, הסר אותה
    const without972 = digits.startsWith('972') ? digits.slice(3) : digits;
    
    // אם מתחיל ב-0, הסר אותו
    const local = without972.startsWith('0') ? without972.slice(1) : without972;
    
    // החזר בפורמט E.164
    return `+972${local}`;
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // הסר כל תווים שאינם ספרות
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // בדוק אם המספר מתחיל ב-+972 או 972
    if (phoneNumber.startsWith('+972')) {
      const afterCountryCode = digitsOnly.slice(3); // הסר 972
      // מספר ישראלי צריך להיות 9 ספרות אחרי קידומת המדינה
      return afterCountryCode.length === 9 && afterCountryCode.startsWith('5');
    }
    
    // אם מתחיל ב-0, הסר אותו ובדוק
    if (phoneNumber.startsWith('0')) {
      const withoutZero = digitsOnly.slice(1);
      // מספר ישראלי צריך להיות 9 ספרות אחרי ה-0
      return withoutZero.length === 9 && withoutZero.startsWith('5');
    }
    
    // אם לא מתחיל ב-0 או +, בדוק אם זה 9 ספרות שמתחילות ב-5
    if (digitsOnly.length === 9 && digitsOnly.startsWith('5')) {
      return true;
    }
    
    return false;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // בדוק ולידציה לפני שליחה
    if (!validatePhoneNumber(phone)) {
      setError('מספר טלפון לא תקין. אנא הכנס מספר ישראלי תקין (למשל: 050-123-4567)');
      return;
    }
    
    setLoading(true);

    try {
      // ננרמל את המספר ל-E.164 ונשמור אותו
      const formattedPhone = normalizeILPhone(phone);
      
      // בדיקה נוספת אחרי עיצוב
      if (!formattedPhone.match(/^\+9725\d{8}$/)) {
        setError('מספר טלפון לא תקין. אנא הכנס מספר ישראלי תקין (למשל: 050-123-4567)');
        setLoading(false);
        return;
      }
      
      // שמור את המספר המנורמל ב-state לשימוש באימות
      setE164Phone(formattedPhone);
      console.log('🟢 handleSendCode: Normalized phone', { original: phone, normalized: formattedPhone });
      
      // הוסף timeout ל-signInWithOtp
      const sendPromise = supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout: signInWithOtp took too long (10 seconds)'));
        }, 10000);
      });
      
      const { error } = await Promise.race([sendPromise, timeoutPromise]);

      if (error) throw error;
      
      setStep('verify');
    } catch (err) {
      console.error('❌ handleSendCode: Error', err);
      if (err instanceof Error && err.message.includes('Timeout')) {
        setError('שליחת הקוד לוקחת יותר מדי זמן. אנא נסה שוב');
      } else {
        setError(err instanceof Error ? err.message : 'שגיאה בשליחת קוד');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🟢 handleVerifyCode: Starting verification');
    setError('');
    setLoading(true);

    try {
      // בדוק אם Supabase client תקין
      if (!supabase || !supabase.auth) {
        console.error('❌ Supabase client not initialized');
        setError('שגיאה בחיבור לשרת. אנא רענן את הדף ונסה שוב');
        setLoading(false);
        return;
      }
      
      // בדוק שהקוד לא ריק
      if (!code || code.trim().length === 0) {
        setError('אנא הכנס קוד אימות');
        setLoading(false);
        return;
      }
      
      // השתמש במספר המנורמל שנשמר בשליחה, או ננרמל מחדש
      const phoneToVerify = e164Phone || normalizeILPhone(phone);
      
      // בדיקה נוספת שהמספר תקין
      if (!phoneToVerify.match(/^\+9725\d{8}$/)) {
        console.error('❌ handleVerifyCode: Invalid phone format', { phoneToVerify, e164Phone, phone });
        setError('מספר טלפון לא תקין. אנא חזור לשלב הקודם ונסה שוב');
        setLoading(false);
        return;
      }
      
      console.log('🟡 handleVerifyCode: Calling verifyOtp', { 
        originalPhone: phone, 
        e164Phone, 
        phoneToVerify, 
        codeLength: code.length,
        code: code.trim(),
        phonesMatch: e164Phone === phoneToVerify
      });
      
      // נשתמש ב-verifyOtp ישירות ללא timeout מיותר
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneToVerify,
        token: code.trim(),
        type: 'sms',
      });

      if (error) {
        console.error('❌ handleVerifyCode: verifyOtp error', error);
        // תרגום שגיאות ספציפיות
        let errorMessage = 'קוד שגוי';
        if (error.message?.toLowerCase().includes('expired')) {
          errorMessage = 'הקוד פג תוקף. אנא בקש קוד חדש';
        } else if (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('token')) {
          errorMessage = 'קוד שגוי. אנא נסה שוב';
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // בדוק אם יש session אחרי verifyOtp
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🟡 handleVerifyCode: Session after verifyOtp', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        hasDataUser: !!data?.user,
        userId: session?.user?.id || data?.user?.id
      });

      // אם אין user ב-data אבל יש session, נשתמש ב-session
      const user = data?.user || session?.user;
      
      if (!user) {
        console.error('❌ handleVerifyCode: No user in response or session');
        setError('שגיאה באימות הקוד. אנא נסה שוב');
        setLoading(false);
        return;
      }

      // סנכרן עם Shopify אחרי התחברות מוצלחת
      // תמיד נסנכרן עם Shopify כדי ליצור קישור בין הטלפון ל-Shopify Customer
      if (user) {
        console.log('🟢 handleVerifyCode: User verified, checking profile');
        // בדוק אם המשתמש כבר מילא פרטים
        // צריך גם first_name וגם last_name (שדות חובה)
        const hasProfile = 
          (user.user_metadata?.first_name && user.user_metadata?.last_name) ||
          user.email;
        
        console.log('🟡 handleVerifyCode: Profile check', { hasProfile, hasEmail: !!user.email, hasFirstName: !!user.user_metadata?.first_name });
        
        // מעבר מיידי לדף המתאים (לא מחכים לסנכרון)
        console.log('🟢 handleVerifyCode: Redirecting immediately', { hasProfile, target: hasProfile ? '/' : '/auth/complete-profile' });
        
        // סנכרן עם Shopify ברקע אחרי ה-redirect (לא חוסם את ההתחברות)
        // זה יוצר/מוצא customer ב-Shopify לפי טלפון ושומר את הקישור ב-DB
        // נעשה את זה ב-setTimeout כדי לא לחסום את ה-redirect
        setTimeout(() => {
          console.log('🟡 handleVerifyCode: Starting Shopify sync in background');
          syncCustomerToShopify(
            user.id, 
            phoneToVerify,
            {
              email: user.email || user.user_metadata?.email || undefined,
              firstName: user.user_metadata?.first_name || undefined,
              lastName: user.user_metadata?.last_name || undefined,
            }
          ).catch((syncError) => {
            console.error('❌ handleVerifyCode: Error syncing to Shopify:', syncError);
          });
        }, 100); // קצת delay כדי לא לחסום את ה-redirect
        
        if (hasProfile) {
          window.location.href = '/';
        } else {
          window.location.href = '/auth/complete-profile';
        }
      } else {
        console.warn('⚠️ handleVerifyCode: No user in response, redirecting to home');
        window.location.href = '/';
      }
    } catch (err) {
      console.error('❌ handleVerifyCode: Error caught', err);
      // תרגום שגיאות OTP לעברית
      let errorMessage = 'קוד שגוי';
      
      if (err instanceof Error && err.message) {
        const message = err.message.toLowerCase();
        if (message.includes('expired') || message.includes('invalid') || message.includes('token')) {
          errorMessage = 'הקוד פג תוקף או לא תקין. אנא בקש קוד חדש';
        } else if (message.includes('code') || message.includes('otp')) {
          errorMessage = 'קוד שגוי. אנא נסה שוב';
        } else {
          errorMessage = err.message;
        }
      }
      
      console.log('🟡 handleVerifyCode: Setting error message', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('🟢 handleVerifyCode: Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow max-w-md mx-auto px-4 py-20 w-full">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-light text-gray-600 hover:text-[#1a1a1a] mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          חזרה
        </Link>

        <div className="bg-white border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-light luxury-font mb-2 text-right">
            התחברות
          </h1>
          <p className="text-sm font-light text-gray-600 mb-8 text-right">
            הכנס את מספר הטלפון שלך לקבלת קוד אימות
          </p>

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-6" suppressHydrationWarning>
              <div>
                <label className="block text-sm font-light mb-2 text-right">
                  מספר טלפון
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-123-4567"
                    className="w-full pr-10 pl-4 py-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury"
                    required
                  />
                </div>
                <p className="text-xs font-light text-gray-500 mt-2 text-right">
                  נשלח לך קוד אימות ב-SMS
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed"
                suppressHydrationWarning
              >
                {loading ? 'שולח...' : 'שלח קוד'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6" suppressHydrationWarning>
              <div>
                <label className="block text-sm font-light mb-2 text-right">
                  קוד אימות
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-200 bg-white font-light text-sm text-center tracking-widest text-2xl focus:border-[#1a1a1a] focus:outline-none transition-luxury"
                  maxLength={6}
                  required
                />
                <p className="text-xs font-light text-gray-500 mt-2 text-right">
                  נשלח קוד ל-{phone}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed"
                  suppressHydrationWarning
                >
                  {loading ? 'מאמת...' : 'אמת קוד'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                    setError('');
                  }}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 text-sm tracking-luxury uppercase font-light hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-luxury"
                  suppressHydrationWarning
                >
                  שנה מספר
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

