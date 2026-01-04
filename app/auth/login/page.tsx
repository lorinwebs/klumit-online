'use client';

import { useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Phone, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { verifyOtpServer } from '@/app/auth/actions';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isPending, startTransition] = useTransition();

  // פונקציה לניקוי מספר טלפון - רק ספרות
  const cleanPhoneInput = (value: string): string => {
    // אפשר + בהתחלה, אחרת רק ספרות
    return value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  };

  // נרמול מספר טלפון ישראלי
  const normalizePhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    const without972 = digits.startsWith('972') ? digits.slice(3) : digits;
    const local = without972.startsWith('0') ? without972.slice(1) : without972;
    return `+972${local}`;
  };

  const isValidPhone = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    const without972 = digits.startsWith('972') ? digits.slice(3) : digits;
    const local = without972.startsWith('0') ? without972.slice(1) : without972;
    return local.length === 9 && local.startsWith('5');
  };

  // שליחת קוד OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!isValidPhone(phone)) {
      setLocalError('מספר טלפון לא תקין');
      return;
    }

    setLoading(true);
    const formattedPhone = normalizePhone(phone);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { channel: 'sms' },
      });

      if (error) throw error;
      setStep('verify');
    } catch (err: any) {
      console.error(err);
      setLocalError(err?.message || 'שגיאה בשליחת קוד');
    } finally {
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
            {step === 'phone' 
              ? 'הכנס את מספר הטלפון שלך לקבלת קוד אימות'
              : `נשלח קוד ל-${phone}`
            }
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
                    onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
                    placeholder="0501234567"
                    className="w-full pr-10 pl-4 py-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                    required
                  />
                </div>
                <p className="text-xs font-light text-gray-500 mt-2 text-right">
                  נשלח לך קוד אימות ב-SMS
                </p>
              </div>

              {localError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                  {localError}
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
            <form 
              action={async (formData: FormData) => {
                console.log('🟡 LoginPage: Form submitted', { 
                  hasFormData: !!formData,
                  token: formData.get('token'),
                  phone: formData.get('phone')
                });
                setLocalError('');
                startTransition(async () => {
                  try {
                    console.log('🟡 LoginPage: Calling verifyOtpServer...');
                    const result = await verifyOtpServer(null, formData);
                    console.log('🟡 LoginPage: verifyOtpServer returned', { hasResult: !!result, hasError: !!result?.error });
                    if (result?.error) {
                      console.log('🔴 LoginPage: Server Action returned error', result.error);
                      setLocalError(result.error);
                    }
                  } catch (err: any) {
                    console.log('🟡 LoginPage: Exception in form action', { 
                      errorMessage: err?.message,
                      errorDigest: err?.digest,
                      isRedirect: err?.digest?.includes('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')
                    });
                    // redirect זורק שגיאה ב-Next.js - זה תקין
                    const errorMessage = err?.message || '';
                    const errorDigest = err?.digest || '';
                    if (errorMessage && !errorMessage.includes('NEXT_REDIRECT') && !errorDigest.includes('NEXT_REDIRECT')) {
                      console.log('🔴 LoginPage: Unexpected error (not redirect)', err);
                      setLocalError('שגיאה באימות הקוד');
                    } else {
                      console.log('✅ LoginPage: Redirect error (expected)');
                    }
                  }
                });
              }}
              className="space-y-6"
            >
              {/* Hidden input לטלפון המנורמל */}
              <input
                type="hidden"
                name="phone"
                value={normalizePhone(phone)}
              />
              <div>
                <label className="block text-sm font-light mb-2 text-right">
                  קוד אימות
                </label>
                <input
                  type="text"
                  name="token"
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

              {localError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                  {localError}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isPending || code.length !== 6}
                  className="w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(isPending || loading) && <Loader2 className="animate-spin" size={20} />}
                  {(isPending || loading) ? 'מאמת...' : 'אמת קוד'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                    setLocalError('');
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
