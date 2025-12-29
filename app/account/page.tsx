'use client';

import { useEffect, useState } from 'react';
import { supabase, type User } from '@/lib/supabase';
import { getShopifyCustomerId, syncCustomerToShopify } from '@/lib/sync-customer';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User as UserIcon, Phone, Package, Check, Edit2, Mail } from 'lucide-react';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shopifyCustomerId, setShopifyCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);
      
      // טען את הנתונים לטופס
      if (session.user) {
        setFormData({
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          email: session.user.email || session.user.user_metadata?.email || '',
        });

        // קבל את ה-Shopify Customer ID
        const customerId = await getShopifyCustomerId(session.user.id);
        setShopifyCustomerId(customerId);
      }
      
      setLoading(false);
    }

    getUser();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
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

      // אם האימייל השתנה, צריך לאמת אותו
      const emailChanged = formData.email && formData.email !== (user.email || user.user_metadata?.email);
      
      if (formData.email) {
        if (emailChanged) {
          // עדכן אימייל עם אימות
          const { error: emailError } = await supabase.auth.updateUser({
            email: formData.email,
          }, {
            emailRedirectTo: `${window.location.origin}/auth/verify-email`,
          });

          if (emailError) throw emailError;
          
          // שמור את האימייל ב-user_metadata (עד שיאומת)
          updateData.data.email = formData.email;
          updateData.data.email_verified = false;
          
          setEmailVerificationSent(true);
        } else {
          // אם האימייל לא השתנה, רק עדכן את user_metadata
          updateData.data.email = formData.email;
        }
      }

      // עדכן את השם
      const { error: updateError, data } = await supabase.auth.updateUser(updateData);

      if (updateError) throw updateError;

      // עדכן את המשתמש המקומי
      if (data.user) {
        setUser(data.user);
      }

      // סנכרן עם Shopify
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
      }

      setEditing(false);
      
      // אם נשלח אימייל אימות, הצג הודעה
      if (emailVerificationSent) {
        setTimeout(() => {
          setEmailVerificationSent(false);
        }, 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת הפרטים');
      setEmailVerificationSent(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
        <Header />
        <main className="flex-grow max-w-4xl mx-auto px-4 py-20">
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
      <main className="flex-grow max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-12 text-right">
          החשבון שלי
        </h1>

        <div className="space-y-8">
          {/* User Info */}
          <div className="bg-white border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon size={32} className="text-gray-400" />
                </div>
                <div className="text-right flex-1">
                  {!editing ? (
                    <>
                      <h2 className="text-xl font-light luxury-font mb-1">
                        {user.user_metadata?.first_name && user.user_metadata?.last_name
                          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                          : user.user_metadata?.first_name
                          ? user.user_metadata.first_name
                          : user.phone || 'משתמש'}
                      </h2>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-light text-gray-600">
                          {user.email || user.user_metadata?.email || 'אין אימייל'}
                        </p>
                        {user.email && !user.email_confirmed_at && (
                          <span className="text-xs font-light text-orange-600">
                            (ממתין לאימות)
                          </span>
                        )}
                        {user.email && user.email_confirmed_at && (
                          <Check size={14} className="text-green-600" />
                        )}
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleSave} className="space-y-4">
                      <div>
                        <label className="block text-xs font-light mb-1 text-right text-gray-600">
                          שם פרטי
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-light mb-1 text-right text-gray-600">
                          שם משפחה
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-light mb-1 text-right text-gray-600">
                          אימייל
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pr-10 pl-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                      {emailVerificationSent && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 text-xs font-light text-right">
                          נשלח אימייל אימות לכתובת {formData.email}. אנא בדוק את תיבת הדואר שלך ואימות את האימייל.
                        </div>
                      )}
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-xs font-light text-right">
                          {error}
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={saving || !formData.firstName || !formData.lastName}
                          className="flex-1 bg-[#1a1a1a] text-white py-2 px-4 text-xs tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {saving ? 'שומר...' : 'שמור'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            setError('');
                            setEmailVerificationSent(false);
                            // שחזר את הנתונים
                            setFormData({
                              firstName: user.user_metadata?.first_name || '',
                              lastName: user.user_metadata?.last_name || '',
                              email: user.email || user.user_metadata?.email || '',
                            });
                          }}
                          className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 text-xs tracking-luxury uppercase font-light hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-luxury"
                        >
                          ביטול
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="ערוך פרופיל"
                >
                  <Edit2 size={20} className="text-gray-600" />
                </button>
              )}
            </div>

            {!editing && (
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-right">
                  <Phone size={20} className="text-gray-400" />
                  <span className="text-sm font-light text-gray-700">
                    {user.phone || 'לא צוין'}
                  </span>
                </div>
                {shopifyCustomerId && (
                  <div className="flex items-center gap-3 text-right">
                    <Check size={20} className="text-green-600" />
                    <span className="text-sm font-light text-gray-700">
                      מחובר ל-Shopify
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Orders Section */}
          <div className="bg-white border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Package size={24} className="text-gray-400" />
              <h2 className="text-xl font-light luxury-font">ההזמנות שלי</h2>
            </div>
            <p className="text-sm font-light text-gray-600 text-right">
              עדיין אין הזמנות
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

