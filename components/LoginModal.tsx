'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { syncCustomerToShopify } from '@/lib/sync-customer';
import { Phone, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [e164Phone, setE164Phone] = useState(''); // שמור את המספר המנורמל ב-E.164

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setPhone('');
      setCode('');
      setStep('phone');
      setError('');
      setE164Phone(''); // נקה את המספר המנורמל
    }
  }, [isOpen]);

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
      console.log('🟢 LoginModal handleSendCode: Normalized phone', { original: phone, normalized: formattedPhone });
      
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
      console.error('❌ LoginModal handleSendCode: Error', err);
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
    setError('');
    setLoading(true);

    try {
      // השתמש במספר המנורמל שנשמר בשליחה, או ננרמל מחדש
      const phoneToVerify = e164Phone || normalizeILPhone(phone);
      console.log('🟡 LoginModal handleVerifyCode: Calling verifyOtp', { 
        originalPhone: phone, 
        e164Phone, 
        phoneToVerify, 
        codeLength: code.length 
      });
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneToVerify,
        token: code,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user) {
        // סנכרן עם Shopify ברקע (לא חוסם את ההתחברות)
        syncCustomerToShopify(
          data.user.id, 
          phoneToVerify,
          {
            email: data.user.email || data.user.user_metadata?.email || undefined,
            firstName: data.user.user_metadata?.first_name || undefined,
            lastName: data.user.user_metadata?.last_name || undefined,
          }
        ).catch((syncError) => {
          console.error('Error syncing to Shopify:', syncError);
        });
        
        // קריאה ל-onSuccess אם קיים
        if (onSuccess) {
          onSuccess();
        }
        
        // סגור את ה-modal
        onClose();
      }
    } catch (err) {
      console.error('❌ LoginModal handleVerifyCode: Error', err);
      let errorMessage = 'קוד שגוי';
      if (err instanceof Error) {
        if (err.message.includes('expired')) {
          errorMessage = 'קוד פג תוקף. אנא בקשי קוד חדש';
        } else if (err.message.includes('invalid')) {
          errorMessage = 'קוד שגוי. אנא נסי שוב';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md mx-4 p-8 relative" 
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="סגור"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6 text-right">
          התחברות
        </h2>

        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-light mb-2 text-right text-gray-600">
                מספר טלפון *
              </label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                  placeholder="050-123-4567"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'שולח קוד...' : 'שלח קוד אימות'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <p className="text-sm font-light text-gray-600 mb-4 text-right">
                נשלח קוד אימות למספר {phone}
              </p>
              <label className="block text-sm font-light mb-2 text-right text-gray-600">
                קוד אימות *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError('');
                }}
                className="flex-1 border border-gray-200 text-[#1a1a1a] py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-gray-50 transition-luxury"
              >
                חזרה
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'מאמת...' : 'אמת'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

