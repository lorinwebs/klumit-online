'use client';

import { useEffect, useState, useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { shopifyClient, CREATE_CART_MUTATION, ADD_TO_CART_MUTATION, UPDATE_CART_DELIVERY_ADDRESS_MUTATION, UPDATE_CART_BUYER_IDENTITY_MUTATION, UPDATE_CART_DISCOUNT_CODES_MUTATION } from '@/lib/shopify';
import { supabase } from '@/lib/supabase';
import { saveOrderAddress } from '@/lib/order-addresses';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';
import Link from 'next/link';
import { Check, User } from 'lucide-react';

// פונקציה עזר לתיקון checkout URL
function fixCheckoutUrl(url: string, cartId: string | null): string {
  if (!url || !cartId) return url;
  
  // בדוק אם ה-URL כבר מכיל את הדומיין הנכון של Shopify
  if (url.includes('.myshopify.com') || url.includes('checkout.shopify.com')) {
    return url; // כבר תקין
  }
  
  // בדוק אם זה custom domain או localhost
  const isCustomDomain = url.includes('klumit-online.vercel.app') || 
                        url.includes('localhost') ||
                        url.includes('127.0.0.1') ||
                        (!url.includes('.myshopify.com') && !url.includes('checkout.shopify.com'));
  
  if (!isCustomDomain) {
    return url; // כבר תקין
  }
  
  console.log('⚠️ Fixing checkout URL from custom domain to Shopify domain...');
  console.log('🔍 Original URL:', url);
  
  try {
    // נסה לחלץ את ה-cart ID וה-key מה-URL (עובד גם עם http:// או https:// או ללא פרוטוקול)
    const cartMatch = url.match(/\/cart\/c\/([^?\/]+)(\?.*)?/);
    if (cartMatch) {
      const cartIdFromUrl = cartMatch[1];
      const queryString = cartMatch[2] || '';
      
      // קבל את הדומיין של Shopify מה-env
      const shopifyStoreDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'htcudj-yw';
      const fullShopifyDomain = shopifyStoreDomain.includes('.myshopify.com') 
        ? shopifyStoreDomain 
        : `${shopifyStoreDomain}.myshopify.com`;
      
      const fixedUrl = `https://${fullShopifyDomain}/cart/c/${cartIdFromUrl}${queryString}`;
      console.log('🔧 Fixed checkout URL:', fixedUrl);
      return fixedUrl;
    } else {
      // אם לא הצלחנו לחלץ מה-URL, ננסה להשתמש ב-cartId מה-GID
      const cartIdFromGid = cartId.replace('gid://shopify/Cart/', '');
      const urlMatch = url.match(/[?&]key=([^&]+)/);
      const key = urlMatch ? urlMatch[1] : '';
      
      const shopifyStoreDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'htcudj-yw';
      const fullShopifyDomain = shopifyStoreDomain.includes('.myshopify.com') 
        ? shopifyStoreDomain 
        : `${shopifyStoreDomain}.myshopify.com`;
      
      const fixedUrl = `https://${fullShopifyDomain}/cart/c/${cartIdFromGid}${key ? `?key=${key}` : ''}`;
      console.log('🔧 Fixed checkout URL (using GID):', fixedUrl);
      return fixedUrl;
    }
  } catch (urlError) {
    console.error('❌ Error fixing checkout URL:', urlError);
    // נסה לתקן גם אם יש שגיאה - חלץ את ה-cart ID מה-GID
    try {
      const cartIdFromGid = cartId.replace('gid://shopify/Cart/', '');
      const urlMatch = url.match(/[?&]key=([^&]+)/);
      const key = urlMatch ? urlMatch[1] : '';
      
      const shopifyStoreDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'htcudj-yw';
      const fullShopifyDomain = shopifyStoreDomain.includes('.myshopify.com') 
        ? shopifyStoreDomain 
        : `${shopifyStoreDomain}.myshopify.com`;
      
      const fixedUrl = `https://${fullShopifyDomain}/cart/c/${cartIdFromGid}${key ? `?key=${key}` : ''}`;
      console.log('🔧 Fixed checkout URL (fallback):', fixedUrl);
      return fixedUrl;
    } catch (fallbackError) {
      console.error('❌ Fallback error:', fallbackError);
      return url; // החזר את ה-URL המקורי אם יש שגיאה
    }
  }
}

export default function CheckoutPage() {
  const { items, cartId, setCartId } = useCartStore();
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

  useEffect(() => {
      if (items.length === 0) {
        window.location.href = '/cart';
        return;
      }

    // טען פרטים מהפרופיל אם המשתמש מחובר
    async function loadProfileData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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
      } catch (err) {
        console.error('Error loading profile data:', err);
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
        console.log('🛒 Creating cart to apply discount code...');
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

        setCartId(currentCartId);
        console.log('✅ Cart created for discount application:', currentCartId);
      } catch (err) {
        console.error('Error creating cart:', err);
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
          console.log('✅ Discount applied:', {
            code: discountCodeInfo.code,
            discountAmount: discount,
            subtotal: subtotalAmount,
            total: totalAmount,
            cartTotal: totalAmount,
            cartSubtotal: subtotalAmount,
            discountAllocations: cart.discountAllocations
          });
        } else {
          setError('קוד קופון לא תקין או לא ניתן לשימוש');
          setAppliedDiscountCode(null);
          setDiscountAmount(0);
          setCartTotal(null);
          setCartSubtotal(null);
        }
      }
    } catch (err) {
      console.error('Error applying discount code:', err);
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
      console.error('Error removing discount code:', err);
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

    setError(null);
    setLoading(true);

    console.log('🚀 ========== CHECKOUT START ==========');
    console.log('📦 Items:', items);
    console.log('📋 Form Data:', formData);
    console.log('🛒 Current Cart ID:', cartId);

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
          const formattedPhone = formData.phone.startsWith('+') 
            ? formData.phone 
            : formData.phone.startsWith('0')
            ? `+972${formData.phone.substring(1)}`
            : `+972${formData.phone}`;

          console.log('🛒 Creating cart with all items and address:', {
            itemsCount: items.length,
            email: formData.email,
            phone: formattedPhone,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            firstName: formData.firstName,
            lastName: formData.lastName,
            address2: address2 || '(empty)',
          });

          try {
            // יצירת העגלה עם כל הפריטים
            // הכתובת תועדכן מיד אחרי יצירת העגלה
            // אם יש קופון שנשמר ב-state, נחיל אותו כבר ביצירת העגלה
          const createCartResponse = await shopifyClient.request(CREATE_CART_MUTATION, {
            cartInput: {
                lines: items.map(item => ({
                  merchandiseId: item.variantId,
                  quantity: item.quantity,
                })),
                buyerIdentity: {
                  email: formData.email,
                  phone: formattedPhone,
                },
                discountCodes: appliedDiscountCode ? [appliedDiscountCode] : [],
              },
            }) as { cartCreate?: { cart?: { id?: string; checkoutUrl?: string }; userErrors?: Array<{ field: string[]; message: string }> } };

            console.log('✅ Cart creation response:', createCartResponse);
            console.log('📦 Cart ID:', createCartResponse.cartCreate?.cart?.id);
            console.log('🔗 Checkout URL:', createCartResponse.cartCreate?.cart?.checkoutUrl);

            // בדוק אם יש שגיאות
            if (createCartResponse.cartCreate?.userErrors && createCartResponse.cartCreate.userErrors.length > 0) {
              const errors = createCartResponse.cartCreate.userErrors.map(e => e.message).join(', ');
              console.error('❌ Shopify cart creation errors:', errors);
              console.error('Error details:', createCartResponse.cartCreate.userErrors);
              throw new Error(`שגיאה ביצירת עגלה: ${errors}`);
            }

          currentCartId = createCartResponse.cartCreate?.cart?.id || null;
            const rawCheckoutUrl = createCartResponse.cartCreate?.cart?.checkoutUrl || null;
            
            // אם ה-URL מכיל custom domain, נבנה אותו מחדש עם Shopify domain
            if (rawCheckoutUrl && currentCartId) {
              const isCustomDomainUrl = rawCheckoutUrl.includes('klumit-online.vercel.app') || 
                                       rawCheckoutUrl.includes('localhost') ||
                                       (!rawCheckoutUrl.includes('.myshopify.com') && !rawCheckoutUrl.includes('checkout.shopify.com'));
              
              if (isCustomDomainUrl) {
                // חלץ את ה-cart ID מה-GID
                const cartIdFromGid = currentCartId.replace('gid://shopify/Cart/', '');
                // חלץ את ה-key מה-URL המקורי
                const urlMatch = rawCheckoutUrl.match(/[?&]key=([^&]+)/);
                const key = urlMatch ? urlMatch[1] : '';
                
                // בנה URL חדש עם Shopify domain
                const shopifyStoreDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'htcudj-yw';
                const fullShopifyDomain = shopifyStoreDomain.includes('.myshopify.com') 
                  ? shopifyStoreDomain 
                  : `${shopifyStoreDomain}.myshopify.com`;
                
                checkoutUrl = `https://${fullShopifyDomain}/cart/c/${cartIdFromGid}${key ? `?key=${key}` : ''}`;
                console.log('🔧 Rebuilt checkout URL with Shopify domain:', checkoutUrl);
              } else {
                // גם אם לא מזוהה כ-custom domain, נבדוק שוב עם הפונקציה
                checkoutUrl = fixCheckoutUrl(rawCheckoutUrl, currentCartId);
              }
            } else {
              checkoutUrl = fixCheckoutUrl(rawCheckoutUrl || '', currentCartId);
            }
            
            console.log('📊 Cart Creation Summary:', {
              cartId: currentCartId,
              checkoutUrl: checkoutUrl,
              hasCart: !!createCartResponse.cartCreate?.cart,
              hasErrors: !!createCartResponse.cartCreate?.userErrors?.length,
            });
            
            if (!currentCartId) {
              console.error('❌ No cart ID in response:', createCartResponse);
              throw new Error('לא ניתן ליצור עגלה - Shopify לא החזיר מזהה עגלה');
            }

            console.log('✅ Cart created successfully:', currentCartId);
            setCartId(currentCartId);
            
            // עדכן את כתובת המשלוח מיד אחרי יצירת העגלה
            // זה מבטיח שהפרטים (שם, כתובת) יעברו ל-Checkout
            console.log('📍 Updating delivery address immediately after cart creation...');
            try {
              const deliveryAddressResponse = await shopifyClient.request(
                UPDATE_CART_DELIVERY_ADDRESS_MUTATION,
                {
                  cartId: currentCartId,
                  deliveryAddress: {
                    address1: formData.address,
                    address2: address2 || undefined,
                    city: formData.city,
                    zip: formData.zipCode,
                    country: 'IL',
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formattedPhone,
                  },
                }
              ) as {
                cartDeliveryAddressUpdate?: {
                  cart?: { checkoutUrl?: string };
                  userErrors?: Array<{ field: string[]; message: string }>;
                };
              };

              console.log('✅ Delivery address update response:', deliveryAddressResponse);

              if (deliveryAddressResponse.cartDeliveryAddressUpdate?.userErrors && 
                  deliveryAddressResponse.cartDeliveryAddressUpdate.userErrors.length > 0) {
                const errors = deliveryAddressResponse.cartDeliveryAddressUpdate.userErrors.map(e => e.message).join(', ');
                console.error('❌ Delivery address update errors:', errors);
                console.error('Error details:', deliveryAddressResponse.cartDeliveryAddressUpdate.userErrors);
              } else {
                console.log('✅ Delivery address updated successfully');
                // עדכן את checkoutUrl אם קיבלנו אחד חדש
                if (deliveryAddressResponse.cartDeliveryAddressUpdate?.cart?.checkoutUrl) {
                  const updatedUrl = deliveryAddressResponse.cartDeliveryAddressUpdate.cart.checkoutUrl;
                  checkoutUrl = fixCheckoutUrl(updatedUrl, currentCartId);
                  console.log('🔗 Updated checkout URL from delivery address update:', checkoutUrl);
                }
              }
            } catch (addressError: any) {
              console.warn('⚠️ Could not update delivery address immediately:', addressError);
              console.warn('Address error details:', addressError.message);
              // לא נזרוק שגיאה - נמשיך גם אם עדכון הכתובת נכשל
            }
            
            // אם יש קופון שהוחל, החל אותו על העגלה החדשה
            if (appliedDiscountCode) {
              console.log('🎟️ Applying discount code to new cart:', appliedDiscountCode);
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
                  console.log('✅ Discount code applied to new cart:', {
                    discountAmount: discount,
                    subtotal: subtotalAmount,
                    total: totalAmount,
                    cartSubtotal: subtotalAmount,
                    cartTotal: totalAmount,
                    discountAllocations: cart.discountAllocations
                  });
                }
              } catch (discountError) {
                console.warn('⚠️ Could not apply discount code to new cart:', discountError);
                // לא נזרוק שגיאה - נמשיך גם אם הקופון לא הוחל
              }
            }
          } catch (shopifyError: any) {
            console.error('❌ Shopify API error:', shopifyError);
            if (shopifyError.response) {
              console.error('Shopify response:', shopifyError.response);
            }
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
          }
        } catch (err) {
          console.warn('Could not save address to profile:', err);
        }
      }

      // Get Shopify Checkout URL if we don't have it yet
      if (currentCartId && !checkoutUrl) {
        console.log('🔍 Fetching checkout URL from Shopify...');
        try {
          const checkoutResponse = await shopifyClient.request(
            `query getCart($id: ID!) {
              cart(id: $id) {
                id
                checkoutUrl
              }
            }`,
            { id: currentCartId }
          ) as { 
            cart?: { 
              id: string;
              checkoutUrl?: string;
            } 
          };
          console.log('✅ Checkout URL response:', checkoutResponse);
          const retrievedUrl = checkoutResponse.cart?.checkoutUrl || null;
          checkoutUrl = retrievedUrl ? fixCheckoutUrl(retrievedUrl, currentCartId) : null;
          console.log('🔗 Retrieved checkout URL:', checkoutUrl);
        } catch (shopifyError: any) {
          console.error('❌ Error getting checkout URL from Shopify:', shopifyError);
          console.error('Error details:', {
            message: shopifyError.message,
            response: shopifyError.response,
            status: shopifyError.response?.status,
          });
          // אם יש שגיאת 400, זה יכול להיות שהעגלה לא קיימת או שיש בעיה אחרת
          if (shopifyError.response?.status === 400 || shopifyError.message?.includes('400')) {
            throw new Error('שגיאה ב-Shopify: לא ניתן לקבל את קישור התשלום. אנא נסה שוב.');
          }
          throw shopifyError;
        }
      }

      // שמור כתובת משלוח לקנייה ספציפית ב-Supabase
      if (currentCartId) {
        const orderReference = `cart-${currentCartId.replace('gid://shopify/Cart/', '')}`;
        console.log('💾 Saving order address to DB...');
        console.log('📝 Order Reference:', orderReference);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log('👤 Session:', session ? 'Exists' : 'None');
          console.log('👤 User ID:', session?.user?.id);
          
          if (session?.user) {
            try {
              console.log('💾 Attempting to save order address...');
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
              console.log('✅ Order address saved successfully');
            } catch (dbError: any) {
              console.error('❌ Error saving order address to DB:', dbError);
              console.error('DB Error details:', {
                message: dbError.message,
                code: dbError.code,
                details: dbError.details,
                hint: dbError.hint,
              });
              // לא נזרוק שגיאה - נמשיך גם אם השמירה נכשלה
              if (dbError.message && !dbError.message.includes('does not exist')) {
                console.warn('⚠️ DB error details:', dbError.message);
              }
            }
          } else {
            console.warn('⚠️ No user session - skipping order address save');
          }
        } catch (err) {
          // אם הטבלה לא קיימת, זה בסדר - נמשיך
          console.warn('⚠️ Could not save order address:', err);
        }
      }

      // Redirect to Shopify Checkout
      console.log('✅ ========== CHECKOUT SUCCESS ==========');
      console.log('🛒 Final Cart ID:', currentCartId);
      console.log('🔗 Checkout URL:', checkoutUrl);
      console.log('📦 Items Count:', items.length);
      
      if (checkoutUrl) {
        // בדוק אם ה-URL מפנה לדף סיסמה
        if (checkoutUrl.includes('/password') || checkoutUrl.includes('/en/password')) {
          console.error('❌ Checkout URL points to password page - store is password protected');
          throw new Error('החנות מוגנת בסיסמה. אנא הסר את ההגנה ב-Shopify Admin → Settings → Store availability');
        }
        
        // ניקוי cart ID מה-key אם הוא מכיל אותו
        let cleanCartId = currentCartId;
        if (cleanCartId && cleanCartId.includes('?key=')) {
          cleanCartId = cleanCartId.split('?key=')[0];
          console.log('🧹 Cleaned cart ID (removed key):', cleanCartId);
        }
        
        // תיקון URL אם הוא מכיל את הדומיין של האתר במקום Shopify
        // השתמש בפונקציה fixCheckoutUrl שתתקן את ה-URL אם צריך
        let finalCheckoutUrl = fixCheckoutUrl(checkoutUrl, cleanCartId);
        
        console.log('🔄 Redirecting to Shopify Checkout...');
        console.log('📍 Original URL:', checkoutUrl);
        console.log('📍 Fixed URL:', finalCheckoutUrl);
        
        // בדוק שהתיקון עבד - וודא שה-URL מכיל את הדומיין הנכון של Shopify
        const isValidShopifyUrl = finalCheckoutUrl.includes('.myshopify.com') || 
                                  finalCheckoutUrl.includes('checkout.shopify.com');
        
        if (!isValidShopifyUrl) {
          console.error('❌ Failed to fix URL - still contains custom domain');
          console.error('⚠️ Original URL:', checkoutUrl);
          console.error('⚠️ Fixed URL:', finalCheckoutUrl);
          console.error('⚠️ Shopify Store Domain:', process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN);
          console.error('⚠️ Cart ID:', cleanCartId);
          
          // נסה לתקן שוב עם fallback - חלץ את ה-cart ID מה-GID
          let cartIdFromGid = cleanCartId.replace('gid://shopify/Cart/', '');
          // הסר את ה-key מה-cart ID אם הוא עדיין שם
          if (cartIdFromGid.includes('?key=')) {
            cartIdFromGid = cartIdFromGid.split('?key=')[0];
          }
          
          // חלץ את ה-key מה-URL המקורי
          const urlMatch = checkoutUrl.match(/[?&]key=([^&]+)/);
          const key = urlMatch ? urlMatch[1] : '';
          
          const shopifyStoreDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'htcudj-yw';
          const fullShopifyDomain = shopifyStoreDomain.includes('.myshopify.com') 
            ? shopifyStoreDomain 
            : `${shopifyStoreDomain}.myshopify.com`;
          
          const fallbackUrl = `https://${fullShopifyDomain}/cart/c/${cartIdFromGid}${key ? `?key=${key}` : ''}`;
          console.log('🔄 Trying fallback URL:', fallbackUrl);
          console.log('📋 Fallback details:', {
            cartIdFromGid,
            key,
            shopifyStoreDomain,
            fullShopifyDomain
          });
          
          if (fallbackUrl.includes('.myshopify.com')) {
            console.log('✅ Fallback URL is valid, using it');
            finalCheckoutUrl = fallbackUrl;
          } else {
            console.error('❌ Fallback URL is also invalid!');
            throw new Error('שגיאה: לא ניתן לתקן את קישור התשלום. אנא בדוק את הגדרות Shopify.');
          }
        }
        
        // בדיקה אחרונה לפני redirect
        if (!finalCheckoutUrl.includes('.myshopify.com') && !finalCheckoutUrl.includes('checkout.shopify.com')) {
          console.error('❌ CRITICAL: Final URL is still not a Shopify URL!');
          console.error('Final URL:', finalCheckoutUrl);
          throw new Error('שגיאה קריטית: לא ניתן לתקן את קישור התשלום.');
        }
        
        if (finalCheckoutUrl !== checkoutUrl) {
          console.log('✅ Using fixed URL with Shopify domain');
        }
        
        // Delay redirect to allow reading console logs
        console.log('⏳ Waiting 5 seconds before redirect...');
        console.log('🎯 Final redirect URL:', finalCheckoutUrl);
        setTimeout(() => {
          console.log('🚀 Redirecting now to:', finalCheckoutUrl);
          // בדיקה אחרונה לפני redirect בפועל
          if (finalCheckoutUrl.includes('.myshopify.com') || finalCheckoutUrl.includes('checkout.shopify.com')) {
            window.location.href = finalCheckoutUrl;
          } else {
            console.error('❌ CRITICAL ERROR: About to redirect to invalid URL!');
            console.error('Invalid URL:', finalCheckoutUrl);
            alert('שגיאה: לא ניתן להמשיך לתשלום. אנא צור קשר עם התמיכה.');
          }
        }, 5000); // 5 seconds delay
        return; // חשוב: אל תמשיך אחרי redirect
      } else if (currentCartId) {
        console.error('❌ No checkout URL but cart exists');
        throw new Error('לא ניתן לקבל את קישור התשלום מ-Shopify');
      } else {
        console.error('❌ No cart ID');
        throw new Error('לא ניתן ליצור עגלה - אין מזהה עגלה');
      }
    } catch (err) {
      console.error('❌ ========== CHECKOUT ERROR ==========');
      console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
      console.error('Full error:', err);
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a] mx-auto"></div>
            <p className="text-sm font-light text-gray-600 mt-4">טוען פרטים...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#fdfcfb] overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-3">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h1 className="text-lg md:text-xl font-light luxury-font text-right">
                תשלום
              </h1>
              {/* Guest Checkout Notice - Compact */}
              {!user && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-light hover:bg-[#2a2a2a] transition-luxury whitespace-nowrap"
                >
                  התחברי
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-5 gap-3 md:gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Checkout Form */}
          <div className="md:col-span-3 overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 p-4">
                <h2 className="text-base md:text-lg font-light luxury-font mb-3 text-right">
                  פרטים אישיים
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-light mb-1 text-right text-gray-600">
                      שם פרטי *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-light mb-1 text-right text-gray-600">
                      שם משפחה *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      required
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-light mb-1 text-right text-gray-600">
                    אימייל *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                    required
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-light mb-1 text-right text-gray-600">
                    טלפון *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                    placeholder="050-123-4567"
                    required
                  />
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
                    <label className="block text-xs font-light mb-1 text-right text-gray-600">
                      עיר *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-light mb-1 text-right text-gray-600">
                      מיקוד *
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-light mb-1 text-right text-gray-600">
                      דירה
                    </label>
                    <input
                      type="text"
                      value={formData.apartment}
                      onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      placeholder="מספר דירה"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-light mb-1 text-right text-gray-600">
                      קומה
                    </label>
                    <input
                      type="text"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury text-right"
                      placeholder="מספר קומה"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-light mb-1 text-right text-gray-600">
                    הערות (קוד ללובי, הוראות משלוח וכו&apos;)
                  </label>
                  <textarea
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-light text-right">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 p-5 md:p-6 h-full flex flex-col">
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
