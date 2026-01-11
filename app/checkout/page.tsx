'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';
import { shopifyClient, CREATE_CART_MUTATION, ADD_TO_CART_MUTATION, UPDATE_CART_BUYER_IDENTITY_MUTATION, UPDATE_CART_DISCOUNT_CODES_MUTATION, CART_DELIVERY_ADDRESSES_ADD_MUTATION } from '@/lib/shopify';
import { supabase } from '@/lib/supabase';
import { saveOrderAddress } from '@/lib/order-addresses';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';
import Link from 'next/link';
import { Check, User } from 'lucide-react';
import { trackBeginCheckout } from '@/lib/analytics';

export default function CheckoutPage() {
  const { items, cartId, loadFromShopify, getTotal } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [saveAddressPermanently, setSaveAddressPermanently] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [cartTotal, setCartTotal] = useState<number | null>(null);
  const [cartSubtotal, setCartSubtotal] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    apartment: '',
    floor: '',
    notes: '',
  });

  const hasTrackedCheckout = useRef(false);

  useEffect(() => {
      if (items.length === 0) {
        window.location.href = '/cart';
        return;
      }

    // Track begin checkout event (only once)
    if (items.length > 0 && !hasTrackedCheckout.current) {
      trackBeginCheckout({
        items: items.map(item => ({
          id: item.variantId,
          name: item.title,
          price: parseFloat(item.price),
          quantity: item.quantity,
        })),
        totalValue: getTotal(),
        currency: items[0]?.currencyCode || 'ILS',
      });
      hasTrackedCheckout.current = true;
    }

    // טען פרטים מהפרופיל אם המשתמש מחובר
    async function loadProfileData() {
      try {
        // השתמש ב-API route כדי לבדוק את הסשן מהקוקיז (אמין יותר)
        const response = await fetch('/api/auth/session', { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          const session = data?.session || (data?.user ? { user: data.user } : null);
          
          if (session?.user) {
            const currentUser = session.user;
            setUser(currentUser);
            const currentEmail = currentUser.email || currentUser.user_metadata?.email || '';
            
            // טען פרטים מהפרופיל כ-default
            setFormData({
              firstName: currentUser.user_metadata?.first_name || '',
              lastName: currentUser.user_metadata?.last_name || '',
              email: currentEmail,
              phone: currentUser.phone || currentUser.user_metadata?.phone || '',
              address: currentUser.user_metadata?.shipping_address || '',
              city: currentUser.user_metadata?.shipping_city || '',
              zipCode: currentUser.user_metadata?.shipping_zip_code || '',
              apartment: currentUser.user_metadata?.shipping_apartment || '',
              floor: currentUser.user_metadata?.shipping_floor || '',
              notes: currentUser.user_metadata?.shipping_notes || '',
            });
          } else {
            setUser(null);
          }
        } else {
          // Fallback ל-supabase.auth.getSession
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const currentUser = session.user;
              setUser(currentUser);
              const currentEmail = currentUser.email || currentUser.user_metadata?.email || '';
              
              setFormData({
                firstName: currentUser.user_metadata?.first_name || '',
                lastName: currentUser.user_metadata?.last_name || '',
                email: currentEmail,
                phone: currentUser.phone || currentUser.user_metadata?.phone || '',
                address: currentUser.user_metadata?.shipping_address || '',
                city: currentUser.user_metadata?.shipping_city || '',
                zipCode: currentUser.user_metadata?.shipping_zip_code || '',
                apartment: currentUser.user_metadata?.shipping_apartment || '',
                floor: currentUser.user_metadata?.shipping_floor || '',
                notes: currentUser.user_metadata?.shipping_notes || '',
              });
            } else {
              setUser(null);
            }
        } catch (fallbackErr) {
          setUser(null);
        }
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfileData();

    // האזן לשינויים בסטטוס ההתחברות
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const currentUser = session.user;
        const currentEmail = currentUser.email || currentUser.user_metadata?.email || '';
        
        // טען פרטים מהפרופיל כ-default
        setFormData({
          firstName: currentUser.user_metadata?.first_name || '',
          lastName: currentUser.user_metadata?.last_name || '',
          email: currentEmail,
          phone: currentUser.phone || currentUser.user_metadata?.phone || '',
          address: currentUser.user_metadata?.shipping_address || '',
          city: currentUser.user_metadata?.shipping_city || '',
          zipCode: currentUser.user_metadata?.shipping_zip_code || '',
          apartment: currentUser.user_metadata?.shipping_apartment || '',
          floor: currentUser.user_metadata?.shipping_floor || '',
          notes: currentUser.user_metadata?.shipping_notes || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [items]);

  const formatPrice = (amount: number) => {
    return Math.round(amount).toLocaleString('he-IL');
  };

  // חיפוש מיקוד אוטומטי לפי כתובת ועיר
  const lookupZipCode = async (address: string, city: string) => {
    if (!address || !city) return;
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    
    try {
      const query = encodeURIComponent(`${address}, ${city}, Israel`);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}&language=he&region=il`
      );
      const data = await response.json();
      
      if (data.results?.[0]?.address_components) {
        const postalCode = data.results[0].address_components.find(
          (c: any) => c.types.includes('postal_code')
        );
        if (postalCode?.long_name && !formData.zipCode) {
          setFormData(prev => ({ ...prev, zipCode: postalCode.long_name }));
        }
      }
    } catch (err) {
      // ignore - מיקוד לא קריטי
    }
  };

  // קרא ל-lookup כשמשתנה כתובת או עיר
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.address && formData.city && !formData.zipCode) {
        lookupZipCode(formData.address, formData.city);
      }
    }, 1000); // debounce 1 שנייה
    
    return () => clearTimeout(timer);
  }, [formData.address, formData.city]);

  const getTotal = useMemo(() => {
    // אם יש לנו מחיר סופי מ-Shopify (אחרי הנחה ומסים), זה הערך הכי מדויק
    if (cartTotal !== null) {
      return cartTotal;
    }

    // חישוב ידני זמני רק אם הקופון הוזן אבל העגלה טרם נוצרה ב-Shopify
    const localSubtotal = items.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
    if (appliedDiscountCode && discountAmount > 0) {
      return Math.max(0, localSubtotal - discountAmount);
    }
    
    return localSubtotal;
  }, [items, cartTotal, appliedDiscountCode, discountAmount]);

  const getSubtotal = () => {
    // העדפה ל-subtotal מ-Shopify אם קיים
    if (cartSubtotal !== null) {
      return cartSubtotal;
    }
    return items.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setError('אנא הזיני קוד קופון');
      return;
    }

    setApplyingDiscount(true);
    setError(null);

    // אם אין cartId, ניצור cart קודם כדי שנוכל להחיל את הקופון מיד
    let currentCartId = cartId;
    
    if (!currentCartId) {
      if (items.length === 0 || !items[0]?.variantId) {
        setError('שגיאה: לא נמצא מוצר בעגלה');
        setApplyingDiscount(false);
        return;
      }

      try {
        const createCartResponse = await shopifyClient.request(CREATE_CART_MUTATION, {
          cartInput: {
            lines: items.map(item => ({
              merchandiseId: item.variantId,
              quantity: item.quantity,
            })),
          },
        }) as { cartCreate?: { cart?: { id?: string }; userErrors?: Array<{ field: string[]; message: string }> } };

        if (createCartResponse.cartCreate?.userErrors && createCartResponse.cartCreate.userErrors.length > 0) {
          const errors = createCartResponse.cartCreate.userErrors.map(e => e.message).join(', ');
          setError(`שגיאה ביצירת עגלה: ${errors}`);
          setApplyingDiscount(false);
          return;
        }

        currentCartId = createCartResponse.cartCreate?.cart?.id || null;
        if (!currentCartId) {
          setError('לא ניתן ליצור עגלה');
          setApplyingDiscount(false);
          return;
        }

        // ה-cart ID יתעדכן אוטומטית כשטוענים את העגלה
        await loadFromShopify();
      } catch (err) {
        setError('שגיאה ביצירת עגלה. אנא נסי שוב.');
        setApplyingDiscount(false);
        return;
      }
    }

    try {
      const response = await shopifyClient.request(
        UPDATE_CART_DISCOUNT_CODES_MUTATION,
        {
          cartId: currentCartId,
          discountCodes: [discountCode.trim().toUpperCase()],
        }
      ) as {
        cartDiscountCodesUpdate?: {
          cart?: {
            cost?: {
              totalAmount?: { amount: string };
              subtotalAmount?: { amount: string };
            };
            discountCodes?: Array<{ code: string; applicable: boolean }>;
            discountAllocations?: Array<{
              discountedAmount?: { amount: string };
            }>;
          };
          userErrors?: Array<{ field: string[]; message: string }>;
          warnings?: Array<{ code: string; message: string }>;
        };
      };

      if (response.cartDiscountCodesUpdate?.userErrors && response.cartDiscountCodesUpdate.userErrors.length > 0) {
        const errors = response.cartDiscountCodesUpdate.userErrors.map(e => e.message).join(', ');
        setError(`קוד קופון לא תקין: ${errors}`);
        setAppliedDiscountCode(null);
        setDiscountAmount(0);
        setCartTotal(null);
        setCartSubtotal(null);
        return;
      }

      const cart = response.cartDiscountCodesUpdate?.cart;
      if (cart) {
        const discountCodeInfo = cart.discountCodes?.[0];
        if (discountCodeInfo?.applicable) {
          setAppliedDiscountCode(discountCodeInfo.code);
          const totalAmount = parseFloat(cart.cost?.totalAmount?.amount || '0');
          const subtotalAmount = parseFloat(cart.cost?.subtotalAmount?.amount || '0');
          
          // שמירת מחיר הביניים המעודכן מ-Shopify
          setCartSubtotal(subtotalAmount);
          setCartTotal(totalAmount);
          
          // חישוב ההנחה המדויק כפי ש-Shopify רואה אותו
          // ההנחה היא ההפרש בין subtotal ל-total (כולל מסים)
          const discount = subtotalAmount - totalAmount;
          setDiscountAmount(discount);
          setError(null);
        } else {
          setError('קוד קופון לא תקין או לא ניתן לשימוש');
          setAppliedDiscountCode(null);
          setDiscountAmount(0);
          setCartTotal(null);
          setCartSubtotal(null);
        }
      }
    } catch (err) {
      setError('שגיאה בבדיקת קוד הקופון. אנא נסי שוב.');
      setAppliedDiscountCode(null);
      setDiscountAmount(0);
      setCartTotal(null);
      setCartSubtotal(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    // אם אין cartId, פשוט נסיר את הקוד מה-state
    if (!cartId) {
      setAppliedDiscountCode(null);
      setDiscountCode('');
      setDiscountAmount(0);
      setCartTotal(null);
      setCartSubtotal(null);
      setError(null);
      return;
    }

    setApplyingDiscount(true);
    setError(null);

    try {
      const response = await shopifyClient.request(
        UPDATE_CART_DISCOUNT_CODES_MUTATION,
        {
          cartId: cartId,
          discountCodes: [],
        }
      ) as {
        cartDiscountCodesUpdate?: {
          cart?: {
            cost?: {
              totalAmount?: { amount: string };
            };
          };
          userErrors?: Array<{ field: string[]; message: string }>;
        };
      };

      if (response.cartDiscountCodesUpdate?.userErrors && response.cartDiscountCodesUpdate.userErrors.length > 0) {
        const errors = response.cartDiscountCodesUpdate.userErrors.map(e => e.message).join(', ');
        setError(`שגיאה בהסרת קוד קופון: ${errors}`);
        return;
      }

      setAppliedDiscountCode(null);
      setDiscountCode('');
      setDiscountAmount(0);
      setCartTotal(null);
      setCartSubtotal(null);
      setError(null);
    } catch (err) {
      setError('שגיאה בהסרת קוד הקופון. אנא נסי שוב.');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      setError('אנא אשר את תנאי הרכישה והתקנון כדי להמשיך');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.zipCode) {
      setError('אנא מלא את כל השדות הנדרשים');
      return;
    }

    // ולידציה של מיקוד ישראלי (7 ספרות)
    const cleanZip = formData.zipCode.replace(/\D/g, '');
    if (cleanZip.length !== 7) {
      setError('מיקוד לא תקין - מיקוד ישראלי צריך להכיל 7 ספרות');
      return;
    }

    // ולידציה של טלפון ישראלי
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 12) {
      setError('מספר טלפון לא תקין');
      return;
    }

    setError(null);
    setLoading(true);

      try {
        let currentCartId = cartId;

        // Create cart if doesn't exist
      let checkoutUrl: string | null = null;
      
        if (!currentCartId) {
          if (items.length === 0 || !items[0]?.variantId) {
            throw new Error('שגיאה: לא נמצא מוצר בעגלה');
          }

          // הכנת הכתובת השנייה (דירה, קומה, הערות)
          const address2 = [
            formData.apartment ? `דירה ${formData.apartment}` : '',
            formData.floor ? `קומה ${formData.floor}` : '',
            formData.notes ? formData.notes : ''
          ].filter(Boolean).join(', ');

          // פורמט טלפון קריטי - חייב להתחיל ב-+972
          const formatPhoneNumber = (phone: string): string => {
            // הסר רווחים ומקפים
            const cleaned = phone.replace(/[\s\-\(\)]/g, '');
            // אם כבר מתחיל ב-+972
            if (cleaned.startsWith('+972')) return cleaned;
            // אם מתחיל ב-972 (בלי +)
            if (cleaned.startsWith('972')) return `+${cleaned}`;
            // אם מתחיל ב-0
            if (cleaned.startsWith('0')) return `+972${cleaned.substring(1)}`;
            // אחרת - הוסף +972
            return `+972${cleaned}`;
          };
          const formattedPhone = formatPhoneNumber(formData.phone);

          try {
            // יצירת העגלה עם פרטי הלקוח (בלי כתובת - תתווסף אחרי)
          const createCartResponse = await shopifyClient.request(CREATE_CART_MUTATION, {
            cartInput: {
                lines: items.map(item => ({
                  merchandiseId: item.variantId,
                  quantity: item.quantity,
                })),
                buyerIdentity: {
                  email: formData.email,
                  phone: formattedPhone,
                  countryCode: 'IL',
                },
                discountCodes: appliedDiscountCode ? [appliedDiscountCode] : [],
              },
            }) as { cartCreate?: { cart?: { id?: string; checkoutUrl?: string }; userErrors?: Array<{ field: string[]; message: string }> } };

            // בדוק אם יש שגיאות
            if (createCartResponse.cartCreate?.userErrors && createCartResponse.cartCreate.userErrors.length > 0) {
              const errors = createCartResponse.cartCreate.userErrors.map(e => e.message).join(', ');
              throw new Error(`שגיאה ביצירת עגלה: ${errors}`);
            }

          currentCartId = createCartResponse.cartCreate?.cart?.id || null;
            checkoutUrl = createCartResponse.cartCreate?.cart?.checkoutUrl || null;
            
            if (!currentCartId) {
              throw new Error('לא ניתן ליצור עגלה - Shopify לא החזיר מזהה עגלה');
            }
            
            // Add delivery address to the new cart
            try {
              const addressResponse = await shopifyClient.request(CART_DELIVERY_ADDRESSES_ADD_MUTATION, {
                cartId: currentCartId,
                addresses: [{
                  address: {
                    deliveryAddress: {
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      address1: formData.address,
                      address2: address2 || undefined,
                      city: formData.city,
                      zip: formData.zipCode,
                      countryCode: 'IL',
                      phone: formattedPhone,
                    },
                  },
                  selected: true,
                }],
              }) as {
                cartDeliveryAddressesAdd?: {
                  cart?: { checkoutUrl?: string };
                  userErrors?: Array<{ field: string[]; message: string; code?: string }>;
                };
              };
              
              if (addressResponse.cartDeliveryAddressesAdd?.userErrors?.length) {
                // ignore errors
              }
              
              if (addressResponse.cartDeliveryAddressesAdd?.cart?.checkoutUrl) {
                checkoutUrl = addressResponse.cartDeliveryAddressesAdd.cart.checkoutUrl;
              }
            } catch (addressError: any) {
              // ignore
            }
            
            // ה-cart ID יתעדכן אוטומטית כשטוענים את העגלה
            await loadFromShopify();
            
            // אם יש קופון שהוחל, החל אותו על העגלה החדשה
            if (appliedDiscountCode) {
              try {
                const discountResponse = await shopifyClient.request(
                  UPDATE_CART_DISCOUNT_CODES_MUTATION,
                  {
                    cartId: currentCartId,
                    discountCodes: [appliedDiscountCode],
                  }
                ) as {
                  cartDiscountCodesUpdate?: {
                    cart?: {
                      cost?: {
                        totalAmount?: { amount: string };
                        subtotalAmount?: { amount: string };
                      };
                      discountCodes?: Array<{ code: string; applicable: boolean }>;
                      discountAllocations?: Array<{
                        discountedAmount?: { amount: string };
                      }>;
                    };
                    userErrors?: Array<{ field: string[]; message: string }>;
                  };
                };

                if (discountResponse.cartDiscountCodesUpdate?.cart) {
                  const cart = discountResponse.cartDiscountCodesUpdate.cart;
                  const totalAmount = parseFloat(cart.cost?.totalAmount?.amount || '0');
                  const subtotalAmount = parseFloat(cart.cost?.subtotalAmount?.amount || '0');
                  
                  // שמירת מחיר הביניים המעודכן מ-Shopify
                  setCartSubtotal(subtotalAmount);
                  setCartTotal(totalAmount);
                  
                  // חישוב ההנחה המדויק כפי ש-Shopify רואה אותו
                  const discount = subtotalAmount - totalAmount;
                  setDiscountAmount(discount);
                }
              } catch (discountError) {
                // לא נזרוק שגיאה - נמשיך גם אם הקופון לא הוחל
              }
            }
          } catch (shopifyError: any) {
            if (shopifyError.message) {
              throw new Error(`שגיאה ב-Shopify: ${shopifyError.message}`);
            }
            throw new Error('שגיאה ביצירת עגלה ב-Shopify. אנא נסה שוב מאוחר יותר.');
          }
        }


      // שמור כתובת בפרופיל אם המשתמש בחר לשמור לתמיד
      if (saveAddressPermanently) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // שמור ב-Supabase user_metadata
            await supabase.auth.updateUser({
              data: {
                shipping_address: formData.address,
                shipping_city: formData.city,
                shipping_zip_code: formData.zipCode,
                shipping_apartment: formData.apartment,
                shipping_floor: formData.floor,
                shipping_notes: formData.notes,
                phone: formData.phone,
              },
            });
            
            // שמור גם ב-Shopify Customer
            try {
              await fetch('/api/shopify/update-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  phone: formData.phone,
                  address: formData.address,
                  city: formData.city,
                  zipCode: formData.zipCode,
                  apartment: formData.apartment,
                  floor: formData.floor,
                  notes: formData.notes,
                }),
              });
            } catch (shopifyErr) {
              // ignore
            }
          }
        } catch (err) {
          // ignore
        }
      }

      // Always update buyer identity and delivery address before checkout
      // This ensures the form data is used, not old cart data
      const address2 = [
        formData.apartment ? `דירה ${formData.apartment}` : '',
        formData.floor ? `קומה ${formData.floor}` : '',
        formData.notes ? formData.notes : ''
      ].filter(Boolean).join(', ');

      // פורמט טלפון - E.164
      const formatPhoneNumber = (phone: string): string => {
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        if (cleaned.startsWith('+972')) return cleaned;
        if (cleaned.startsWith('972')) return `+${cleaned}`;
        if (cleaned.startsWith('0')) return `+972${cleaned.substring(1)}`;
        return `+972${cleaned}`;
      };
      const formattedPhone = formatPhoneNumber(formData.phone);

      if (currentCartId) {
        // Step 1: Update buyer identity (email, phone, country)
        try {
          const identityResponse = await shopifyClient.request(UPDATE_CART_BUYER_IDENTITY_MUTATION, {
            cartId: currentCartId,
            buyerIdentity: {
              email: formData.email,
              phone: formattedPhone,
              countryCode: 'IL',
            },
          }) as {
            cartBuyerIdentityUpdate?: {
              cart?: { checkoutUrl?: string };
              userErrors?: Array<{ field: string[]; message: string }>;
            };
          };
          
          if (identityResponse.cartBuyerIdentityUpdate?.userErrors?.length) {
            // ignore errors
          }
          
          if (identityResponse.cartBuyerIdentityUpdate?.cart?.checkoutUrl) {
            checkoutUrl = identityResponse.cartBuyerIdentityUpdate.cart.checkoutUrl;
          }
        } catch (identityError: any) {
          // ignore
        }

        // Step 2: Add delivery address using new mutation (2025-01+)
        try {
          const addressResponse = await shopifyClient.request(CART_DELIVERY_ADDRESSES_ADD_MUTATION, {
            cartId: currentCartId,
            addresses: [{
              address: {
                deliveryAddress: {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  address1: formData.address,
                  address2: address2 || undefined,
                  city: formData.city,
                  zip: formData.zipCode,
                  countryCode: 'IL',
                  phone: formattedPhone,
                },
              },
              selected: true,
            }],
          }) as {
            cartDeliveryAddressesAdd?: {
              cart?: { checkoutUrl?: string };
              userErrors?: Array<{ field: string[]; message: string; code?: string }>;
            };
          };
          
          if (addressResponse.cartDeliveryAddressesAdd?.userErrors?.length) {
            // ignore errors
          }
          
          if (addressResponse.cartDeliveryAddressesAdd?.cart?.checkoutUrl) {
            checkoutUrl = addressResponse.cartDeliveryAddressesAdd.cart.checkoutUrl;
          }
        } catch (addressError: any) {
          // ignore
        }

        // Step 3: Apply discount code if exists
        if (appliedDiscountCode) {
          try {
            await shopifyClient.request(
              UPDATE_CART_DISCOUNT_CODES_MUTATION,
              {
                cartId: currentCartId,
                discountCodes: [appliedDiscountCode],
              }
            );
          } catch (discountError) {
            // Continue even if this fails
          }
        }
      }

      // Fetch cart to verify identity was updated
      if (currentCartId) {
        try {
          const checkoutResponse = await shopifyClient.request(
            `query getCart($id: ID!) {
              cart(id: $id) {
                id
                checkoutUrl
                buyerIdentity {
                  email
                  phone
                }
                lines(first: 100) {
                  edges {
                    node {
                      id
                      quantity
                      merchandise {
                        ... on ProductVariant {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }`,
            { id: currentCartId }
          ) as { 
            cart?: { 
              id: string;
              checkoutUrl?: string;
              buyerIdentity?: { email?: string; phone?: string };
              lines?: { edges?: Array<{ node?: { id?: string; quantity?: number; merchandise?: { id?: string } } }> };
            } 
          };
          
          // Verify identity was updated - if still anonymous, create fresh cart
          const cartEmail = checkoutResponse.cart?.buyerIdentity?.email;
          if (cartEmail && (cartEmail.includes('anonymous') || cartEmail.includes('example.com'))) {
            
            // Create new cart with proper identity
            const freshCartResponse = await shopifyClient.request(CREATE_CART_MUTATION, {
              cartInput: {
                lines: items.map(item => ({
                  merchandiseId: item.variantId,
                  quantity: item.quantity,
                })),
                buyerIdentity: {
                  email: formData.email,
                  phone: formattedPhone,
                  countryCode: 'IL',
                },
                discountCodes: appliedDiscountCode ? [appliedDiscountCode] : [],
              },
            }) as { cartCreate?: { cart?: { id?: string; checkoutUrl?: string }; userErrors?: Array<{ field: string[]; message: string }> } };
            
            if (freshCartResponse.cartCreate?.cart?.id) {
              currentCartId = freshCartResponse.cartCreate.cart.id;
              checkoutUrl = freshCartResponse.cartCreate.cart.checkoutUrl || null;
              
              // Add delivery address to fresh cart
              try {
                const addressResponse = await shopifyClient.request(CART_DELIVERY_ADDRESSES_ADD_MUTATION, {
                  cartId: currentCartId,
                  addresses: [{
                    address: {
                      deliveryAddress: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address1: formData.address,
                        address2: address2 || undefined,
                        city: formData.city,
                        zip: formData.zipCode,
                        countryCode: 'IL',
                        phone: formattedPhone,
                      },
                    },
                    selected: true,
                  }],
                }) as {
                  cartDeliveryAddressesAdd?: {
                    cart?: { checkoutUrl?: string };
                    userErrors?: Array<{ field: string[]; message: string; code?: string }>;
                  };
                };
                
                if (addressResponse.cartDeliveryAddressesAdd?.cart?.checkoutUrl) {
                  checkoutUrl = addressResponse.cartDeliveryAddressesAdd.cart.checkoutUrl;
                }
              } catch (addressError: any) {
                // ignore
              }
            }
          } else {
            checkoutUrl = checkoutResponse.cart?.checkoutUrl || checkoutUrl;
          }
        } catch (shopifyError: any) {
          if (shopifyError.response?.status === 400 || shopifyError.message?.includes('400')) {
            throw new Error('שגיאה ב-Shopify: לא ניתן לקבל את קישור התשלום. אנא נסה שוב.');
          }
          throw shopifyError;
        }
      }

      // שמור כתובת משלוח לקנייה ספציפית ב-Supabase
      if (currentCartId) {
        const orderReference = `cart-${currentCartId.replace('gid://shopify/Cart/', '')}`;
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            try {
              await saveOrderAddress({
                user_id: session.user.id,
                order_reference: orderReference,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                zip_code: formData.zipCode,
                apartment: formData.apartment,
                floor: formData.floor,
                notes: formData.notes,
              });
            } catch (dbError: any) {
              // לא נזרוק שגיאה - נמשיך גם אם השמירה נכשלה
            }
          }
        } catch (err) {
          // אם הטבלה לא קיימת, זה בסדר - נמשיך
        }
      }

      // Redirect to Shopify Checkout
      if (checkoutUrl) {
        // בדוק אם ה-URL מפנה לדף סיסמה
        if (checkoutUrl.includes('/password') || checkoutUrl.includes('/en/password')) {
          throw new Error('החנות מוגנת בסיסמה. אנא הסר את ההגנה ב-Shopify Admin → Settings → Store availability');
        }
        
        // Redirect
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 500);
        return; // חשוב: אל תמשיך אחרי redirect
      } else if (currentCartId) {
        throw new Error('לא ניתן לקבל את קישור התשלום מ-Shopify');
      } else {
        throw new Error('לא ניתן ליצור עגלה - אין מזהה עגלה');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת קישור תשלום. נסה שוב מאוחר יותר.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
        <Header />
        <main className="flex-grow max-w-4xl mx-auto px-4 py-12 md:py-20 w-full">
          <div className="text-center" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a] mx-auto" aria-hidden="true"></div>
            <p className="text-sm font-light text-gray-600 mt-4">טוען פרטים...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-[#fdfcfb] md:overflow-hidden">
      <Header />
      <main id="main-content" className="flex-1 md:overflow-hidden overflow-y-auto" role="main">
        <div className="md:h-full max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-3">
          <div className="md:h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 md:mb-3">
              <h1 className="text-lg md:text-xl font-light luxury-font text-right">
                תשלום
              </h1>
              {/* Guest Checkout Notice - Compact */}
              {!user && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-light hover:bg-[#2a2a2a] transition-luxury whitespace-nowrap"
                >
                  התחבר
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4 md:flex-1 md:min-h-0 md:overflow-hidden">
          {/* Checkout Form */}
          <div className="md:col-span-3 md:overflow-y-auto md:pr-2">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 p-4">
                <h2 className="text-base md:text-lg font-light luxury-font mb-3 text-right">
                  פרטים אישיים
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-light mb-1 text-right text-gray-600">
                      שם פרטי *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-light mb-1 text-right text-gray-600">
                      שם משפחה *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label htmlFor="email" className="block text-xs font-light mb-1 text-right text-gray-600">
                    אימייל *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="mt-3">
                  <label htmlFor="phone" className="block text-xs font-light mb-1 text-right text-gray-600">
                    טלפון *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      // הסר תווים לא רלוונטיים, שמור + בהתחלה
                      let value = e.target.value;
                      if (value.startsWith('+')) {
                        value = '+' + value.slice(1).replace(/[^\d]/g, '');
                      } else {
                        value = value.replace(/[^\d]/g, '');
                      }
                      setFormData({ ...formData, phone: value });
                    }}
                    className={`w-full px-3 py-2 border bg-white font-light text-sm focus:outline-none transition-luxury text-right ${
                      formData.phone && !/^(\+972|972|0)\d{8,9}$/.test(formData.phone.replace(/[\s\-]/g, ''))
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-[#1a1a1a]'
                    }`}
                    placeholder="0501234567"
                    required
                    autoComplete="tel"
                    aria-describedby={formData.phone && !/^(\+972|972|0)\d{8,9}$/.test(formData.phone.replace(/[\s\-]/g, '')) ? 'phone-error-checkout' : undefined}
                  />
                  {formData.phone && !/^(\+972|972|0)\d{8,9}$/.test(formData.phone.replace(/[\s\-]/g, '')) && (
                    <p id="phone-error-checkout" className="text-xs text-red-500 mt-1 text-right" role="alert">מספר טלפון לא תקין</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white border border-gray-200 p-4">
                <h2 className="text-base md:text-lg font-light luxury-font mb-3 text-right">
                  כתובת משלוח
                </h2>
                <div className="mt-3">
                  <label className="block text-xs font-light mb-1 text-right text-gray-600">
                    כתובת *
                  </label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(address, city, zipCode, apartment, floor) => {
                      setFormData({
                        ...formData,
                        address,
                        city: city || formData.city,
                        zipCode: zipCode || formData.zipCode,
                        apartment: apartment || formData.apartment,
                        floor: floor || formData.floor,
                      });
                    }}
                    placeholder="הזן כתובת (או בחר מהרשימה)"
                    className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label htmlFor="city" className="block text-xs font-light mb-1 text-right text-gray-600">
                      עיר *
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      required
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label htmlFor="zipCode" className="block text-xs font-light mb-1 text-right text-gray-600">
                      מיקוד *
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      inputMode="numeric"
                      value={formData.zipCode}
                      onChange={(e) => {
                        // רק ספרות, מקסימום 7
                        const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                        setFormData({ ...formData, zipCode: value });
                      }}
                      className={`w-full px-3 py-2 border bg-white font-light text-sm focus:outline-none transition-luxury text-right ${
                        formData.zipCode && formData.zipCode.length > 0 && formData.zipCode.length !== 7
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-[#1a1a1a]'
                      }`}
                      placeholder="7 ספרות"
                      required
                      autoComplete="postal-code"
                      aria-describedby={formData.zipCode && formData.zipCode.length > 0 && formData.zipCode.length !== 7 ? 'zip-error' : undefined}
                    />
                    {formData.zipCode && formData.zipCode.length > 0 && formData.zipCode.length !== 7 && (
                      <p id="zip-error" className="text-xs text-red-500 mt-1 text-right" role="alert">מיקוד צריך להכיל 7 ספרות</p>
                    )}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label htmlFor="apartment" className="block text-xs font-light mb-1 text-right text-gray-600">
                      דירה
                    </label>
                    <input
                      id="apartment"
                      type="text"
                      value={formData.apartment}
                      onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      placeholder="מספר דירה"
                    />
                  </div>
                  <div>
                    <label htmlFor="floor" className="block text-xs font-light mb-1 text-right text-gray-600">
                      קומה
                    </label>
                    <input
                      id="floor"
                      type="text"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      placeholder="מספר קומה"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label htmlFor="notes" className="block text-xs font-light mb-1 text-right text-gray-600">
                    הערות (קוד ללובי, הוראות משלוח וכו&apos;)
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right resize-none"
                    placeholder="קוד ללובי, הוראות משלוח, הערות נוספות..."
                    rows={2}
                  />
                </div>
                
                {/* Save Address Checkbox */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveAddressPermanently}
                      onChange={(e) => setSaveAddressPermanently(e.target.checked)}
                      className="mt-0.5 w-4 h-4 border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                    />
                    <label htmlFor="saveAddress" className="text-xs font-light text-gray-700 text-right flex-1 cursor-pointer leading-relaxed">
                      שמור כתובת זו ופרטים אלה בפרופיל שלי לשימוש עתידי (ברירת מחדל לרכישות הבאות)
                    </label>
                  </div>
                </div>
              </div>


              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 p-5 md:p-6 md:h-full flex flex-col">
              <h2 className="text-lg md:text-xl font-light luxury-font mb-4 text-right">
                סיכום הזמנה
              </h2>
              
              <div className="space-y-3 text-sm font-light mb-4 flex-1 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.variantId} className="flex justify-between text-gray-700">
                    <div className="text-right">
                      <span>{item.title}</span>
                      {item.color && (
                        <span className="block text-xs text-gray-500 mt-0.5">צבע: {item.color}</span>
                      )}
                      {item.variantTitle && item.variantTitle !== 'Default Title' && !item.color && (
                        <span className="block text-xs text-gray-500 mt-0.5">{item.variantTitle}</span>
                      )}
                      <span className="text-xs text-gray-500"> x{item.quantity}</span>
                    </div>
                    <span>₪{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-light text-gray-600">סה״כ ביניים</span>
                    <span className="font-light">₪{formatPrice(getSubtotal())}</span>
                  </div>
                  {appliedDiscountCode && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-light">הנחה ({appliedDiscountCode})</span>
                      <span className="font-light">-₪{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {appliedDiscountCode && discountAmount === 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span className="font-light">הנחה ({appliedDiscountCode})</span>
                      <span className="font-light">מוחל</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base pt-3 border-t border-gray-200">
                    <span className="font-light">סה״כ</span>
                    <span className="font-light text-[#1a1a1a]">
                      ₪{formatPrice(getTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">כולל מע״מ</p>
                </div>
              </div>
              
              {/* Coupon Code Section - Moved to bottom */}
              <div className="pt-4 border-t border-gray-200 mt-auto">
                <h3 className="text-xs font-light mb-2 text-right text-gray-600">
                  קוד קופון
                </h3>
                {appliedDiscountCode ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-xs font-light text-green-800 text-right">
                          {appliedDiscountCode} הוחל
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        disabled={applyingDiscount}
                        className="text-xs text-gray-600 hover:text-gray-800 underline disabled:opacity-50 flex-shrink-0"
                      >
                        הסר
                      </button>
                    </div>
                    {discountAmount > 0 && (
                      <p className="text-xs text-green-700 text-right">
                        הנחה: ₪{formatPrice(discountAmount)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyDiscount();
                        }
                      }}
                      placeholder="הזיני קוד"
                      className="flex-1 px-3 py-2 border border-gray-200 bg-white font-light text-xs focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right uppercase"
                      disabled={applyingDiscount}
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={applyingDiscount || !discountCode.trim()}
                      className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {applyingDiscount ? 'בודק...' : 'החל'}
                    </button>
                  </div>
                )}
                {error && error.includes('קופון') && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-xs font-light text-right mt-2">
                    {error}
                  </div>
                )}
              </div>
              
              {/* Terms Checkbox */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                    required
                  />
                  <label htmlFor="terms" className="text-xs font-light text-gray-700 text-right flex-1 cursor-pointer leading-relaxed">
                    אני מאשר/ת שקראתי והבנתי את <Link href="/terms" target="_blank" className="text-[#1a1a1a] underline hover:no-underline">תנאי הרכישה והתקנון</Link> ואני מסכים/ה להם. אני מאשר/ת כי גילי הוא 18 שנים ומעלה.
                  </label>
                </div>
              </div>

              {/* Payment Button */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const form = document.querySelector('form');
                    if (form) {
                      form.requestSubmit();
                    } else {
                      handleSubmit(e as any);
                    }
                  }}
                  disabled={loading || !acceptedTerms}
                  className="w-full bg-[#1a1a1a] text-white py-3 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'מעבר לתשלום...' : 'המשך לתשלום מאובטח'}
                </button>
                {(!acceptedTerms || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.zipCode) && (
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    אנא מלא/י את כל הפרטים הנדרשים
                  </p>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-200 mt-4">
                <p className="text-xs font-light text-gray-600 leading-relaxed">
                  משלוח חינם מעל 500 ₪ • החזרה תוך 14 ימים
                </p>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          // אחרי התחברות מוצלחת, הנתונים ייטענו אוטומטית דרך useEffect
          setShowLoginModal(false);
        }}
      />
    </div>
  );
}
