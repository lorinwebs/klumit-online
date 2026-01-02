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

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setPhone('');
      setCode('');
      setStep('phone');
      setError('');
    }
  }, [isOpen]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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

      if (data.user) {
        // סנכרן עם Shopify
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
        
        // קריאה ל-onSuccess אם קיים
        if (onSuccess) {
          onSuccess();
        }
        
        // סגור את ה-modal
        onClose();
      }
    } catch (err) {
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

