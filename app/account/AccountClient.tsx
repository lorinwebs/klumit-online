'use client';

import { useState, useEffect } from 'react';
import { supabase, type User } from '@/lib/supabase';
import { getShopifyCustomerId, syncCustomerToShopify, clearCustomerIdCache } from '@/lib/sync-customer';
import { findShopifyCustomerByPhone, saveShopifyCustomerId, verifyEmailOtpServer } from '@/app/auth/actions';
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

interface AccountClientProps {
  initialUser: User;
  initialOrders?: Order[];
  initialShopifyCustomerId?: string | null;
}

export default function AccountClient({ 
  initialUser, 
  initialOrders = [], 
  initialShopifyCustomerId = null 
}: AccountClientProps) {
  const [user, setUser] = useState<User>(initialUser);
  const [shopifyCustomerId, setShopifyCustomerId] = useState<string | null>(initialShopifyCustomerId);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [syncingShopify, setSyncingShopify] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: initialUser.user_metadata?.first_name || '',
    lastName: initialUser.user_metadata?.last_name || '',
    email: initialUser.email || initialUser.user_metadata?.email || '',
    phone: initialUser.phone || initialUser.user_metadata?.phone || '',
    shippingAddress: initialUser.user_metadata?.shipping_address || '',
    shippingCity: initialUser.user_metadata?.shipping_city || '',
    shippingZipCode: initialUser.user_metadata?.shipping_zip_code || '',
    shippingApartment: initialUser.user_metadata?.shipping_apartment || '',
    shippingFloor: initialUser.user_metadata?.shipping_floor || '',
    shippingNotes: initialUser.user_metadata?.shipping_notes || '',
  });

  const [originalFormData, setOriginalFormData] = useState(formData);

  // טען Shopify Customer ID ברקע רק פעם אחת אם אין
  // לא ננסה ליצור יוזר חדש - זה רק דרך כפתור "חבר עכשיו"
  useEffect(() => {
    // אם יש כבר initialShopifyCustomerId, לא צריך לטעון שוב
    if (initialShopifyCustomerId) {
      return;
    }
    
    // אם אין shopifyCustomerId, נבדוק פעם אחת מה-DB
    if (!shopifyCustomerId && user) {
      getShopifyCustomerId(user.id, false) // false = לא להשתמש ב-cache
        .then((customerId) => {
          if (customerId) {
            setShopifyCustomerId(customerId);
          }
        })
        .catch(() => {});
    }
  }, []); // ריק - רק פעם אחת בטעינה הראשונית

  // טען הזמנות אם אין
  useEffect(() => {
    if (orders.length === 0 && user) {
      const email = user.email || user.user_metadata?.email;
      if (email) {
        setLoadingOrders(true);
        fetch(`/api/orders?email=${encodeURIComponent(email)}`)
          .then((res) => res.json())
          .then((data) => {
            setOrders(data.orders || []);
          })
          .catch(() => {})
          .finally(() => {
            setLoadingOrders(false);
          });
      }
    }
  }, [user, orders.length]);

  const handleLogout = async () => {
    try {
      // נקה גם בצד הלקוח
      await supabase.auth.signOut();
      // נקה גם בצד השרת (עוגיות)
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.push('/');
    router.refresh();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!user) {
        throw new Error('משתמש לא מחובר');
      }

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

      const hasVerifiedEmail = user.email && user.email_confirmed_at;
      const emailChanged = formData.email && formData.email !== (user.email || user.user_metadata?.email);
      
      if (formData.email) {
        if (emailChanged && !hasVerifiedEmail) {
          updateData.data.pending_email = formData.email;
          updateData.data.email_verified = false;
          
          // שלח קוד OTP לאימייל (ללא קישור)
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: formData.email,
            options: {
              shouldCreateUser: false,
            },
          });

          if (otpError) {
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: formData.email,
            });

            if (resendError && !resendError.message.includes('Signups not allowed')) {
              throw resendError;
            }
          }
          
          setEmailVerificationSent(true);
        } else if (!emailChanged) {
          if (hasVerifiedEmail) {
            updateData.data.email = user.email;
          } else {
            updateData.data.email = formData.email;
          }
        }
      }

      const { error: updateError, data } = await supabase.auth.updateUser(updateData);

      if (updateError) throw updateError;

      if (data.user) {
        setUser(data.user);
      }

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

        setOriginalFormData({ ...formData });
        
        if (changes.length > 0) {
          logProfileChanges(changes).catch(() => {});
        }
      }

      if (!emailChanged) {
        syncCustomerToShopify(
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
        ).catch(() => {});
      }

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
              <div className="flex items-center gap-2 text-right mt-2">
                {!shopifyCustomerId && (
                  <>
                    <span className="text-xs font-light text-orange-600">לא מחובר ל-Shopify</span>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!user || syncingShopify) return;
                        const phone = user.phone || user.user_metadata?.phone;
                        if (!phone) {
                          alert('מספר טלפון לא נמצא');
                          return;
                        }
                        try {
                          setSyncingShopify(true);
                          
                          // שלב 1: חפש לקוח קיים ב-Shopify (Server Action)
                          let customerId = await findShopifyCustomerByPhone(phone);
                          
                          // שלב 2: אם לא מצאנו, ננסה ליצור חדש (client-side)
                          if (!customerId) {
                            customerId = await syncCustomerToShopify(
                              user.id,
                              phone,
                              {
                                email: user.email || user.user_metadata?.email || undefined,
                                firstName: user.user_metadata?.first_name || undefined,
                                lastName: user.user_metadata?.last_name || undefined,
                                address: user.user_metadata?.shipping_address || undefined,
                                city: user.user_metadata?.shipping_city || undefined,
                                zipCode: user.user_metadata?.shipping_zip_code || undefined,
                              }
                            );
                          }
                          
                          // שלב 3: אם יש Shopify Customer ID, שמור ב-DB (Server Action)
                          if (customerId) {
                            const saved = await saveShopifyCustomerId(user.id, customerId, phone);
                            if (saved) {
                              clearCustomerIdCache(user.id);
                              const newCustomerId = await getShopifyCustomerId(user.id, false);
                              setShopifyCustomerId(newCustomerId);
                            } else {
                              setShopifyCustomerId(customerId);
                            }
                          } else {
                            alert('לא הצלחנו לחבר. ייתכן שהלקוח כבר קיים ב-Shopify או שיש בעיה עם ה-API. נסה שוב מאוחר יותר.');
                          }
                        } catch (err) {
                          alert(`שגיאה בחיבור ל-Shopify: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
                        } finally {
                          setSyncingShopify(false);
                        }
                      }}
                      className="text-xs font-light text-blue-600 hover:text-blue-800 underline disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={syncingShopify}
                    >
                      {syncingShopify ? 'מחבר...' : 'חבר עכשיו'}
                    </button>
                  </>
                )}
              </div>
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
                            <div className="mt-2 space-y-3">
                              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 text-xs font-light text-right">
                                נשלח קוד אימות לכתובת {formData.email}. אנא בדוק את תיבת הדואר שלך והזן את הקוד למטה כדי לאמת את האימייל. האימייל יתעדכן רק אחרי אימות מוצלח.
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
                                        // רענן את המשתמש
                                        const { data: { user: updatedUser } } = await supabase.auth.getUser();
                                        if (updatedUser) {
                                          setUser(updatedUser);
                                          setEmailVerificationSent(false);
                                          setEmailVerificationCode('');
                                          setFormData({ ...formData, email: updatedUser.email || formData.email });
                                        }
                                        setVerifyingEmail(false);
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
                              placeholder="0501234567"
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
                                הערות (קוד ללובי, הוראות משלוח וכו&apos;)
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

