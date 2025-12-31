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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Format phone number (add country code if needed)
      const formattedPhone = phone.startsWith('+') ? phone : `+972${phone.replace(/^0/, '')}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      });

      if (error) throw error;
      
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת קוד');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+972${phone.replace(/^0/, '')}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms',
      });

      if (error) throw error;

      // סנכרן עם Shopify אחרי התחברות מוצלחת
      // Redirect to complete profile page
      if (data.user) {
        // בדוק אם המשתמש כבר מילא פרטים
        // צריך גם first_name וגם last_name (שדות חובה)
        const hasProfile = 
          (data.user.user_metadata?.first_name && data.user.user_metadata?.last_name) ||
          data.user.email;
        
        if (hasProfile) {
          // אם יש פרטים, סנכרן עם Shopify
          try {
            await syncCustomerToShopify(
              data.user.id, 
              formattedPhone,
              {
                email: data.user.email || data.user.user_metadata?.email || undefined,
                firstName: data.user.user_metadata?.first_name || undefined,
                lastName: data.user.user_metadata?.last_name || undefined,
              }
            );
          } catch (syncError) {
            console.error('Error syncing to Shopify:', syncError);
          }
          window.location.href = '/';
        } else {
          // אם אין פרטים, מעבר לדף השלמת פרטים
          window.location.href = '/auth/complete-profile';
        }
      } else {
        window.location.href = '/';
      }
    } catch (err) {
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
      
      setError(errorMessage);
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

