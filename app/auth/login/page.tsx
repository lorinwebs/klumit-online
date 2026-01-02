'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
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

  // נרמול מספר טלפון ישראלי ל-E.164
  const normalizePhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    const without972 = digits.startsWith('972') ? digits.slice(3) : digits;
    const local = without972.startsWith('0') ? without972.slice(1) : without972;
    return `+972${local}`;
  };

  // בדיקת תקינות מספר טלפון
  const isValidPhone = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    const without972 = digits.startsWith('972') ? digits.slice(3) : digits;
    const local = without972.startsWith('0') ? without972.slice(1) : without972;
    return local.length === 9 && local.startsWith('5');
  };

  // שליחת קוד OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidPhone(phone)) {
      setError('מספר טלפון לא תקין. אנא הכנס מספר ישראלי תקין');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = normalizePhone(phone);

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      });

      if (error) throw error;

      setStep('verify');
    } catch (err: any) {
      setError(err?.message || 'שגיאה בשליחת קוד. אנא נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  // אימות קוד OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.trim().length !== 6) {
      setError('אנא הכנס קוד אימות בן 6 ספרות');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = normalizePhone(phone);

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code.trim(),
        type: 'sms',
      });

      if (error) {
        if (error.message?.toLowerCase().includes('expired')) {
          setError('הקוד פג תוקף. אנא בקש קוד חדש');
        } else if (error.message?.toLowerCase().includes('invalid')) {
          setError('קוד שגוי. אנא נסה שוב');
        } else {
          setError(error.message || 'קוד שגוי');
        }
        setLoading(false);
        return;
      }

      // בדוק אם יש user ב-data או ב-session
      const user = data?.user;
      
      console.log('✅ verifyOtp success', { hasUser: !!user, userId: user?.id });
      
      if (!user) {
        // נסה לקבל session כגיבוי
        console.log('⚠️ No user in data, checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('✅ Found user in session', { userId: session.user.id });
          // יש session - המשתמש מחובר
          const hasProfile = 
            (session.user.user_metadata?.first_name && session.user.user_metadata?.last_name) ||
            session.user.email;

          console.log('🔄 Redirecting...', { hasProfile, target: hasProfile ? '/' : '/auth/complete-profile' });
          setLoading(false);

          // השתמש ב-window.location.replace במקום href כדי למנוע בעיות
          if (hasProfile) {
            window.location.replace('/');
          } else {
            window.location.replace('/auth/complete-profile');
          }
          return;
        } else {
          console.error('❌ No user in data or session');
          setError('שגיאה באימות הקוד. אנא נסה שוב');
          setLoading(false);
          return;
        }
      }

      // יש user - המשתמש מחובר
      const hasProfile = 
        (user.user_metadata?.first_name && user.user_metadata?.last_name) ||
        user.email;

      console.log('🔄 Redirecting...', { hasProfile, target: hasProfile ? '/' : '/auth/complete-profile' });
      setLoading(false);

      // השתמש ב-window.location.replace במקום href כדי למנוע בעיות
      if (hasProfile) {
        window.location.replace('/');
      } else {
        window.location.replace('/auth/complete-profile');
      }
    } catch (err: any) {
      setError(err?.message || 'שגיאה באימות הקוד. אנא נסה שוב');
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
            <form onSubmit={handleSendCode} className="space-y-6">
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
              >
                {loading ? 'שולח...' : 'שלח קוד'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
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
