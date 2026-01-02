'use client';

import { useEffect, useState } from 'react';
import { supabase, type User } from '@/lib/supabase';
import { getShopifyCustomerId, syncCustomerToShopify } from '@/lib/sync-customer';
import { logProfileChanges, getClientInfo } from '@/lib/profile-changes';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { User as UserIcon, Phone, Package, Check, Edit2, Mail, LogOut, MapPin } from 'lucide-react';
import Image from 'next/image';

interface Order {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        quantity: number;
        image: { url: string; altText: string | null } | null;
        discountedTotalSet: { shopMoney: { amount: string; currencyCode: string } };
      };
    }>;
  };
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shopifyCustomerId, setShopifyCustomerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingZipCode: '',
    shippingApartment: '',
    shippingFloor: '',
    shippingNotes: '',
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
        // הצג את האימייל הקיים (לא את pending_email)
        const currentEmail = session.user.email || session.user.user_metadata?.email || '';
        setFormData({
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          email: currentEmail,
          phone: session.user.phone || session.user.user_metadata?.phone || '',
          shippingAddress: session.user.user_metadata?.shipping_address || '',
          shippingCity: session.user.user_metadata?.shipping_city || '',
          shippingZipCode: session.user.user_metadata?.shipping_zip_code || '',
          shippingApartment: session.user.user_metadata?.shipping_apartment || '',
          shippingFloor: session.user.user_metadata?.shipping_floor || '',
          shippingNotes: session.user.user_metadata?.shipping_notes || '',
        });
        
        // שמור את הנתונים המקוריים להשוואה
        setOriginalFormData({
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          email: currentEmail,
          phone: session.user.phone || session.user.user_metadata?.phone || '',
          shippingAddress: session.user.user_metadata?.shipping_address || '',
          shippingCity: session.user.user_metadata?.shipping_city || '',
          shippingZipCode: session.user.user_metadata?.shipping_zip_code || '',
          shippingApartment: session.user.user_metadata?.shipping_apartment || '',
          shippingFloor: session.user.user_metadata?.shipping_floor || '',
          shippingNotes: session.user.user_metadata?.shipping_notes || '',
        });

        // קבל את ה-Shopify Customer ID
        const customerId = await getShopifyCustomerId(session.user.id);
        setShopifyCustomerId(customerId);
      }
      
      setLoading(false);
    }

    getUser();
  }, [router]);

  // טען הזמנות כשהמשתמש נטען
  useEffect(() => {
    let isMounted = true; // flag למניעת עדכון state אחרי unmount
    
    async function fetchOrders() {
      if (!user) return;

      setLoadingOrders(true);
      try {
        // קבל את ה-session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (isMounted) {
            setLoadingOrders(false);
          }
          return;
        }

        // שלח את האימייל ב-query params
        const email = session.user.email || session.user.user_metadata?.email;
        if (!email) {
          if (isMounted) {
            setOrders([]);
            setLoadingOrders(false);
          }
          return;
        }
        
        const url = `/api/orders?email=${encodeURIComponent(email)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // חשוב: שולח cookies
        });
        
        if (!isMounted) return; // בדיקה לפני עדכון state
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        } else {
          // רק אם זה לא 401 (כי 401 יכול להיות מ-call ישן)
          if (response.status !== 401) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error fetching orders:', errorData);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching orders:', err);
        }
      } finally {
        if (isMounted) {
          setLoadingOrders(false);
        }
      }
    }

    if (user) {
      fetchOrders();
    }
    
    // cleanup function
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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
          pending_email?: string;
          phone?: string;
          shipping_address?: string;
          shipping_city?: string;
          shipping_zip_code?: string;
        } & Record<string, any>;
      } = {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          shipping_address: formData.shippingAddress,
          shipping_city: formData.shippingCity,
          shipping_zip_code: formData.shippingZipCode,
          shipping_apartment: formData.shippingApartment,
          shipping_floor: formData.shippingFloor,
          shipping_notes: formData.shippingNotes,
        },
      };

      // בדוק אם יש אימייל מאומת
      const hasVerifiedEmail = user.email && user.email_confirmed_at;
      
      // אם האימייל השתנה, צריך לאמת אותו לפני עדכון
      const emailChanged = formData.email && formData.email !== (user.email || user.user_metadata?.email);
      
      if (formData.email) {
        if (emailChanged && !hasVerifiedEmail) {
          // אם האימייל השתנה ואין אימייל מאומת, נשמור אותו ב-user_metadata ונשלח magic link
          // לא נעדכן את האימייל ישירות - רק אחרי אימות מוצלח
          updateData.data.pending_email = formData.email;
          updateData.data.email_verified = false;
          
          // שלח magic link לאימות דרך signInWithOtp (לא יוצר משתמש חדש)
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: formData.email,
            options: {
              shouldCreateUser: false,
              emailRedirectTo: `${window.location.origin}/auth/verify-email?new_email=${encodeURIComponent(formData.email)}`,
            },
          });

          if (otpError) {
            // אם signInWithOtp נכשל, נסה דרך resend
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: formData.email,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/verify-email?new_email=${encodeURIComponent(formData.email)}`,
              },
            });

            if (resendError && !resendError.message.includes('Signups not allowed')) {
              throw resendError;
            }
          }
          
          setEmailVerificationSent(true);
          // אל תסגור את מצב העריכה - המשתמש צריך לראות את ההודעה
        } else if (!emailChanged) {
          // אם האימייל לא השתנה, רק עדכן את user_metadata (אם יש אימייל מאומת, הוא לא ישתנה)
          if (hasVerifiedEmail) {
            // אם יש אימייל מאומת, לא נעדכן אותו
            updateData.data.email = user.email;
          } else {
            // אם אין אימייל מאומת, עדכן את user_metadata
            updateData.data.email = formData.email;
          }
        }
      }

      // עדכן את השם (ולא את האימייל אם הוא השתנה)
      const { error: updateError, data } = await supabase.auth.updateUser(updateData);

      if (updateError) throw updateError;

      // עדכן את המשתמש המקומי
      if (data.user) {
        setUser(data.user);
      }

      // שמור היסטוריית שינויים
      if (originalFormData) {
        const clientInfo = getClientInfo();
        const changes: Array<{
          user_id: string;
          field_name: string;
          old_value: string | null;
          new_value: string | null;
          ip_address?: string;
          user_agent?: string;
        }> = [];

        // השווה כל שדה ושמור שינויים
        const fieldsToCheck: Array<{ key: keyof typeof formData; name: string }> = [
          { key: 'firstName', name: 'first_name' },
          { key: 'lastName', name: 'last_name' },
          { key: 'email', name: 'email' },
          { key: 'phone', name: 'phone' },
          { key: 'shippingAddress', name: 'shipping_address' },
          { key: 'shippingCity', name: 'shipping_city' },
          { key: 'shippingZipCode', name: 'shipping_zip_code' },
          { key: 'shippingApartment', name: 'shipping_apartment' },
          { key: 'shippingFloor', name: 'shipping_floor' },
          { key: 'shippingNotes', name: 'shipping_notes' },
        ];

        fieldsToCheck.forEach(({ key, name }) => {
          const oldValue = originalFormData[key] || null;
          const newValue = formData[key] || null;
          
          // שמור רק אם השתנה
          if (oldValue !== newValue) {
            changes.push({
              user_id: user.id,
              field_name: name,
              old_value: oldValue,
              new_value: newValue,
              ...clientInfo,
            });
          }
        });

        // שמור את כל השינויים
        if (changes.length > 0) {
          await logProfileChanges(changes);
        }

        // עדכן את הנתונים המקוריים
        setOriginalFormData({ ...formData });
      }

      // סנכרן עם Shopify (רק אם האימייל לא השתנה או אם הוא כבר מאומת)
      if (!emailChanged) {
        try {
          await syncCustomerToShopify(
            user.id,
            formData.phone || user.phone || '',
            {
              email: formData.email || undefined,
              firstName: formData.firstName,
              lastName: formData.lastName,
              address: formData.shippingAddress || undefined,
              city: formData.shippingCity || undefined,
              zipCode: formData.shippingZipCode || undefined,
            }
          );
        } catch (syncError) {
          console.warn('Could not sync to Shopify:', syncError);
        }
      }

      // אם האימייל לא השתנה, סגור את מצב העריכה
      // אם האימייל השתנה, השאר במצב עריכה כדי שהמשתמש יראה את ההודעה
      if (!emailChanged) {
        setEditing(false);
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
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-12 lg:mb-16">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light luxury-font mb-2 text-right">
                החשבון שלי
              </h1>
              <p className="text-sm md:text-base font-light text-gray-500 text-right">
                ניהול פרטים אישיים והזמנות
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-light text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-200 hover:border-gray-300 whitespace-nowrap"
              dir="rtl"
            >
              <span>התנתק</span>
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* User Info - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 p-6 lg:p-8 sticky top-8">
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
                            onChange={(e) => {
                              setFormData({ ...formData, email: e.target.value });
                              setEmailVerificationSent(false);
                              setError('');
                            }}
                            disabled={!!(user.email && user.email_confirmed_at)}
                            className="w-full pr-10 pl-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right disabled:bg-gray-50 disabled:cursor-not-allowed"
                            placeholder={user.email && user.email_confirmed_at ? 'אימייל מאומת - לא ניתן לערוך' : 'your@email.com'}
                          />
                        </div>
                        {user.email && user.email_confirmed_at && (
                          <p className="mt-1 text-xs text-gray-500 text-right">
                            אימייל מאומת - לא ניתן לערוך. ניתן להוסיף אימייל נוסף רק אם אין אימייל מאומת.
                          </p>
                        )}
                        {!user.email && !user.email_confirmed_at && formData.email && (
                          <p className="mt-1 text-xs text-gray-500 text-right">
                            הוסף אימייל כדי לקבל עדכונים והזמנות
                          </p>
                        )}
                        {emailVerificationSent && (
                          <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 text-xs font-light text-right">
                            נשלח קישור אימות לכתובת {formData.email}. אנא בדוק את תיבת הדואר שלך ולחץ על הקישור כדי לאמת את האימייל. האימייל יתעדכן רק אחרי אימות מוצלח.
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-light mb-1 text-right text-gray-600">
                          טלפון
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full pr-10 pl-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                            placeholder="050-123-4567"
                          />
                        </div>
                      </div>
                      
                      {/* Shipping Address Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-light mb-4 text-right text-gray-700">
                          כתובת משלוח (ברירת מחדל)
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-light mb-1 text-right text-gray-600">
                              כתובת
                            </label>
                            <AddressAutocomplete
                              value={formData.shippingAddress}
                              onChange={(address, city, zipCode, apartment, floor) => {
                                setFormData({
                                  ...formData,
                                  shippingAddress: address,
                                  shippingCity: city || formData.shippingCity,
                                  shippingZipCode: zipCode || formData.shippingZipCode,
                                  shippingApartment: apartment || formData.shippingApartment,
                                  shippingFloor: floor || formData.shippingFloor,
                                });
                              }}
                              placeholder="רחוב ומספר בית (או בחר מהרשימה)"
                              className="w-full px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-light mb-1 text-right text-gray-600">
                                עיר
                              </label>
                              <input
                                type="text"
                                value={formData.shippingCity}
                                onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                                placeholder="עיר"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-light mb-1 text-right text-gray-600">
                                מיקוד
                              </label>
                              <input
                                type="text"
                                value={formData.shippingZipCode}
                                onChange={(e) => setFormData({ ...formData, shippingZipCode: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                                placeholder="מיקוד"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-light mb-1 text-right text-gray-600">
                                דירה
                              </label>
                              <input
                                type="text"
                                value={formData.shippingApartment}
                                onChange={(e) => setFormData({ ...formData, shippingApartment: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                                placeholder="מספר דירה"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-light mb-1 text-right text-gray-600">
                                קומה
                              </label>
                              <input
                                type="text"
                                value={formData.shippingFloor}
                                onChange={(e) => setFormData({ ...formData, shippingFloor: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                                placeholder="מספר קומה"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-light mb-1 text-right text-gray-600">
                              הערות (קוד ללובי, הוראות משלוח וכו')
                            </label>
                            <textarea
                              value={formData.shippingNotes}
                              onChange={(e) => setFormData({ ...formData, shippingNotes: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right resize-none"
                              placeholder="קוד ללובי, הוראות משלוח, הערות נוספות..."
                              rows={3}
                            />
                          </div>
                          <p className="text-xs text-gray-500 text-right">
                            כתובת זו תשמש כברירת מחדל ברכישות. ניתן לשנות אותה בכל רכישה.
                          </p>
                        </div>
                      </div>
                      
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
                            const currentEmail = user.email || user.user_metadata?.email || '';
                            const restoredData = {
                              firstName: user.user_metadata?.first_name || '',
                              lastName: user.user_metadata?.last_name || '',
                              email: currentEmail,
                              phone: user.phone || user.user_metadata?.phone || '',
                              shippingAddress: user.user_metadata?.shipping_address || '',
                              shippingCity: user.user_metadata?.shipping_city || '',
                              shippingZipCode: user.user_metadata?.shipping_zip_code || '',
                              shippingApartment: user.user_metadata?.shipping_apartment || '',
                              shippingFloor: user.user_metadata?.shipping_floor || '',
                              shippingNotes: user.user_metadata?.shipping_notes || '',
                            };
                            setFormData(restoredData);
                            setOriginalFormData(restoredData);
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
                {(user.user_metadata?.shipping_address || user.user_metadata?.shipping_city || user.user_metadata?.shipping_zip_code) && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-start gap-3 text-right">
                      <MapPin size={20} className="text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-light text-gray-500 mb-1">כתובת משלוח</div>
                        {user.user_metadata?.shipping_address && (
                          <div className="text-sm font-light text-gray-700">
                            {user.user_metadata.shipping_address}
                          </div>
                        )}
                        {(user.user_metadata?.shipping_city || user.user_metadata?.shipping_zip_code) && (
                          <div className="text-sm font-light text-gray-700">
                            {[user.user_metadata?.shipping_city, user.user_metadata?.shipping_zip_code].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
          </div>

          {/* Orders Section - Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-8">
                <Package size={24} className="text-gray-400" />
                <h2 className="text-2xl font-light luxury-font">ההזמנות שלי</h2>
              </div>
              {loadingOrders ? (
                <div className="flex justify-center items-center py-12">
                  <p className="text-sm font-light text-gray-600 text-right">טוען הזמנות...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package size={48} className="text-gray-300 mb-4" />
                  <p className="text-base font-light text-gray-500 text-right">
                    עדיין אין הזמנות
                  </p>
                  <p className="text-sm font-light text-gray-400 mt-2 text-right">
                    ההזמנות שלך יופיעו כאן לאחר ביצוע רכישה
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <a
                      key={order.id}
                      href={`/order/${order.name.replace('#', '')}`}
                      className="block border border-gray-200 p-5 lg:p-6 hover:border-[#1a1a1a] hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start gap-4 lg:gap-6">
                        {order.lineItems.edges[0]?.node.image && (
                          <div className="relative w-20 h-28 lg:w-24 lg:h-32 flex-shrink-0 bg-gray-100">
                            <Image
                              src={order.lineItems.edges[0].node.image.url}
                              alt={order.lineItems.edges[0].node.image.altText || order.lineItems.edges[0].node.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="96px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="text-lg font-light text-[#1a1a1a] mb-1">
                                הזמנה {order.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('he-IL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <span className="text-lg font-light text-[#1a1a1a] whitespace-nowrap">
                              ₪{parseFloat(order.totalPriceSet.shopMoney.amount).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {order.lineItems.edges.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-light text-gray-700 mb-1">
                                {order.lineItems.edges[0].node.title}
                              </p>
                              {order.lineItems.edges.length > 1 && (
                                <p className="text-xs text-gray-500">
                                  +{order.lineItems.edges.length - 1} פריטים נוספים
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-600 pt-3 border-t border-gray-100">
                            <span className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${
                                order.displayFinancialStatus === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              {order.displayFinancialStatus === 'PAID' ? 'שולם' : 'ממתין לתשלום'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${
                                order.displayFulfillmentStatus === 'FULFILLED' ? 'bg-blue-500' : 'bg-gray-400'
                              }`} />
                              {order.displayFulfillmentStatus === 'FULFILLED' ? 'נשלח' : 'ממתין למשלוח'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

