'use client';

import { shopifyClient, CREATE_CART_MUTATION, ADD_TO_CART_MUTATION, GET_CART_QUERY, UPDATE_CART_BUYER_IDENTITY_MUTATION } from './shopify';
import { supabase } from './supabase';
import type { CartItem } from '@/store/cartStore';

/**
 * פונקציה עזר לשמירת cart ID ב-metafields
 */
export async function saveCartIdToMetafields(cartId: string): Promise<void> {
  try {
    console.log('💾 Attempting to save cart ID to metafields:', cartId);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.warn('⚠️ No user session - cannot save cart ID to metafields');
      return; // אין משתמש מחובר
    }

    // קבל Shopify Customer ID
    const { getShopifyCustomerId, syncCustomerToShopify } = await import('@/lib/sync-customer');
    let shopifyCustomerId = await getShopifyCustomerId(session.user.id);
    
    console.log('👤 Shopify Customer ID from DB:', shopifyCustomerId);
    
    // אם אין Shopify Customer ID, ננסה למצוא/ליצור customer אוטומטית
    // רק אם המשתמש מחובר (יש session)
    if (!shopifyCustomerId && session?.user) {
      console.log('🔄 No Shopify Customer ID found, attempting to find/create customer (user is logged in)...');
      const phone = session.user.phone || session.user.user_metadata?.phone;
      const email = session.user.email || session.user.user_metadata?.email;
      
      // חייב להיות טלפון כדי ליצור customer (זה המזהה העיקרי)
      if (phone) {
        try {
          // בדוק אם ניסינו ליצור customer לאחרונה (ב-5 דקות האחרונות)
          // זה רק למניעת יצירה חדשה, לא למניעת חיפוש customer קיים
          const lastAttemptKey = `shopify_customer_creation_attempt_${session.user.id}`;
          const lastAttempt = typeof window !== 'undefined' ? localStorage.getItem(lastAttemptKey) : null;
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;
          const shouldSkipCreation = lastAttempt && (now - parseInt(lastAttempt)) < fiveMinutes;
          
          if (shouldSkipCreation) {
            console.log('⏳ Skipping customer creation - last attempt was less than 5 minutes ago (throttling protection)');
            console.log('🔍 But still trying to find existing customer...');
          }
          
          // syncCustomerToShopify יחפש customer קיים לפי טלפון או ייצור חדש
          // אם יש throttling, הוא עדיין ינסה למצוא customer קיים
          shopifyCustomerId = await syncCustomerToShopify(
            session.user.id,
            phone,
            {
              email: email || undefined,
              firstName: session.user.user_metadata?.first_name || undefined,
              lastName: session.user.user_metadata?.last_name || undefined,
            }
          );
          
          // אם הצלחנו, מחק את ה-timestamp
          if (shopifyCustomerId) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(lastAttemptKey);
            }
            console.log('✅ Created/found Shopify Customer ID:', shopifyCustomerId);
          } else {
            if (!shouldSkipCreation && typeof window !== 'undefined') {
              // שמור זמן ניסיון רק אם ניסינו ליצור (לא רק למצוא)
              localStorage.setItem(lastAttemptKey, now.toString());
            }
            console.warn('⚠️ Could not create/find Shopify customer');
          }
        } catch (err) {
          console.warn('⚠️ Could not create Shopify customer:', err);
        }
      } else {
        console.warn('⚠️ No phone - cannot create/find Shopify customer (phone is required)');
      }
    } else if (!session?.user) {
      console.log('ℹ️ User not logged in - skipping Shopify customer creation');
    }
    
    if (shopifyCustomerId) {
      // שמור cart ID ב-metafields
      const response = await fetch('/api/cart/save-cart-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: shopifyCustomerId,
          cartId: cartId,
        }),
      });
      
      if (response.ok) {
        console.log('✅ Cart ID saved to metafields successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('❌ Failed to save cart ID to metafields:', response.status, response.statusText, errorData);
      }
    } else {
      console.warn('⚠️ No Shopify Customer ID - cannot save cart ID to metafields');
    }
  } catch (err) {
    console.warn('❌ Could not save cart ID to metafields:', err);
  }
}

/**
 * יוצר או מעדכן Shopify cart עם buyerIdentity
 * כך שהעגלה תישמר גם אחרי התנתקות
 */
export async function syncCartToShopify(
  items: CartItem[],
  existingCartId: string | null = null,
  buyerIdentity?: { email?: string; phone?: string }
): Promise<string | null> {
  try {
    // אם אין פריטים, אל תעשה כלום
    if (items.length === 0) {
      return existingCartId;
    }

    console.log('🛒 Syncing cart to Shopify:', {
      itemsCount: items.length,
      existingCartId,
      hasBuyerIdentity: !!buyerIdentity,
    });

    // פונקציה עזר לעיצוב טלפון בפורמט Shopify (E.164)
    const formatPhoneForShopify = (phone: string | undefined): string | undefined => {
      if (!phone) return undefined;
      
      // הסר רווחים ותווים מיוחדים
      let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
      
      // אם כבר מתחיל ב-+, השאר אותו
      if (cleaned.startsWith('+')) {
        // ודא שיש לפחות 10 ספרות אחרי ה-+
        const digitsAfterPlus = cleaned.substring(1).replace(/\D/g, '');
        if (digitsAfterPlus.length >= 10) {
          return cleaned;
        }
      }
      
      // הסר כל תווים שאינם ספרות
      const digitsOnly = cleaned.replace(/\D/g, '');
      
      // אם אין ספרות, החזר undefined
      if (digitsOnly.length === 0) return undefined;
      
      // אם מתחיל ב-972, הוסף +
      if (digitsOnly.startsWith('972')) {
        return `+${digitsOnly}`;
      }
      
      // אם מתחיל ב-0, החלף ב-972
      if (digitsOnly.startsWith('0')) {
        const withoutZero = digitsOnly.substring(1);
        if (withoutZero.length >= 9) {
          return `+972${withoutZero}`;
        }
      }
      
      // אם יש 9-10 ספרות, הוסף 972
      if (digitsOnly.length >= 9 && digitsOnly.length <= 10) {
        return `+972${digitsOnly}`;
      }
      
      // אם יש יותר מ-10 ספרות, נסה לזהות אם זה כבר עם קוד מדינה
      if (digitsOnly.length > 10) {
        // אם מתחיל ב-972, הוסף +
        if (digitsOnly.startsWith('972')) {
          return `+${digitsOnly}`;
        }
      }
      
      // אם לא הצלחנו לעצב, החזר undefined (לא נשלח טלפון לא תקין)
      console.warn('Could not format phone number:', phone);
      return undefined;
    };

    // נסה לקבל buyerIdentity מהמשתמש המחובר אם לא סופק
    if (!buyerIdentity) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const rawPhone = session.user.phone || session.user.user_metadata?.phone;
          const formattedPhone = formatPhoneForShopify(rawPhone);
          buyerIdentity = {
            email: session.user.email || session.user.user_metadata?.email || undefined,
            phone: formattedPhone,
          };
          // אם הטלפון לא תקין, אל תכלול אותו
          if (!formattedPhone) {
            delete buyerIdentity.phone;
          }
        }
      } catch (err) {
        console.warn('Could not get user session for cart sync:', err);
      }
    } else if (buyerIdentity.phone) {
      // עיצוב טלפון גם אם סופק מבחוץ
      const formattedPhone = formatPhoneForShopify(buyerIdentity.phone);
      if (formattedPhone) {
        buyerIdentity.phone = formattedPhone;
      } else {
        // אם הטלפון לא תקין, הסר אותו
        delete buyerIdentity.phone;
      }
    }

    // בדוק אם יש buyerIdentity תקין
    const hasValidBuyerIdentity = buyerIdentity && (
      buyerIdentity.email || 
      (buyerIdentity.phone && buyerIdentity.phone.startsWith('+'))
    );

    // אם אין cart ID ב-localStorage אבל יש buyerIdentity, נסה לטעון מ-metafields
    if (!existingCartId && hasValidBuyerIdentity) {
      try {
        console.log('🔍 No existing cart ID, checking metafields...');
        const { getShopifyCustomerId } = await import('@/lib/sync-customer');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const shopifyCustomerId = await getShopifyCustomerId(session.user.id);
          if (shopifyCustomerId) {
            const response = await fetch(`/api/cart/save-cart-id?customerId=${encodeURIComponent(shopifyCustomerId)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.cartId) {
                // בדוק אם ה-cart עדיין קיים ב-Shopify
                try {
                  const cartCheck = await shopifyClient.request(GET_CART_QUERY, {
                    id: data.cartId,
                  }) as { cart?: { id?: string } };
                  
                  if (cartCheck.cart?.id) {
                    console.log('✅ Found valid cart ID in metafields, using it:', data.cartId);
                    existingCartId = data.cartId;
                  } else {
                    console.warn('⚠️ Cart ID in metafields is invalid, will create new cart');
                  }
                } catch (cartErr) {
                  console.warn('⚠️ Could not verify cart ID from metafields:', cartErr);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not load cart ID from metafields:', err);
      }
    }

    // אם יש cart קיים, נסה לעדכן אותו (גם אם יש buyerIdentity)
    if (existingCartId) {
      // נסה עד 3 פעמים עם delay כדי למנוע conflicts
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            // המתן קצת לפני ניסיון נוסף
            await new Promise(resolve => setTimeout(resolve, 200 * attempt));
          }

          // הוסף/עדכן פריטים
          const lines = items.map(item => ({
            merchandiseId: item.variantId,
            quantity: item.quantity,
          }));

          const addResponse = await shopifyClient.request(ADD_TO_CART_MUTATION, {
            cartId: existingCartId,
            lines,
          }) as { cartLinesAdd?: { cart?: { id?: string } } };

          if (addResponse.cartLinesAdd?.cart?.id) {
            const updatedCartId = addResponse.cartLinesAdd.cart.id;
            // שמור cart ID ב-metafields גם בעדכון (אם יש buyerIdentity)
            if (hasValidBuyerIdentity) {
              saveCartIdToMetafields(updatedCartId).catch(err => 
                console.warn('Failed to save cart ID to metafields:', err)
              );
            }
            return updatedCartId;
          }
        } catch (err: any) {
          // אם זה לא conflict, זרוק שגיאה
          if (err?.response?.errors?.[0]?.extensions?.code !== 'CONFLICT') {
            console.warn('Failed to update existing cart:', err);
            break; // אל תנסה שוב אם זו לא שגיאת conflict
          }
          
          // אם זה conflict וזה הניסיון האחרון, נמשיך ליצור cart חדש
          if (attempt === 2) {
            console.warn('Cart conflict after 3 attempts, creating new cart');
          }
        }
      }
    }

    // צור cart חדש עם buyerIdentity (אם יש)
    const createResponse = await shopifyClient.request(CREATE_CART_MUTATION, {
      cartInput: {
        lines: items.map(item => ({
          merchandiseId: item.variantId,
          quantity: item.quantity,
        })),
        buyerIdentity: hasValidBuyerIdentity ? {
          email: buyerIdentity.email || undefined,
          phone: buyerIdentity.phone || undefined,
        } : undefined,
      },
    }) as { cartCreate?: { cart?: { id?: string }; userErrors?: Array<{ message: string }> } };

    if (createResponse.cartCreate?.userErrors && createResponse.cartCreate.userErrors.length > 0) {
      console.error('Shopify cart creation errors:', createResponse.cartCreate.userErrors);
      return null;
    }

    const newCartId = createResponse.cartCreate?.cart?.id || null;
    
    console.log('✅ Created new cart:', newCartId);
    
    // שמור cart ID ב-Shopify Customer metafields אם יש buyerIdentity
    if (newCartId && hasValidBuyerIdentity) {
      console.log('💾 Saving cart ID to metafields...');
      saveCartIdToMetafields(newCartId).catch(err => 
        console.warn('Failed to save cart ID to metafields:', err)
      );
    }
    
    return newCartId;
  } catch (error) {
    console.error('Error syncing cart to Shopify:', error);
    return null;
  }
}

/**
 * טוען cart מ-Shopify לפי cart ID
 */
export async function loadCartFromShopify(cartId: string): Promise<CartItem[] | null> {
  try {
    const response = await shopifyClient.request(GET_CART_QUERY, {
      id: cartId,
    }) as { cart?: { 
      id?: string;
      lines?: { 
        edges?: Array<{ 
          node?: { 
            id?: string;
            quantity?: number;
            merchandise?: { 
              id?: string;
              title?: string;
              price?: { amount?: string; currencyCode?: string };
              product?: { 
                title?: string;
                images?: { edges?: Array<{ node?: { url?: string; altText?: string | null } }> };
              };
            };
          };
        }>;
      };
    } };

    if (!response.cart?.lines?.edges) {
      return null;
    }

    const items: CartItem[] = response.cart.lines.edges
      .filter(edge => edge.node?.merchandise)
      .map(edge => {
        const node = edge.node!;
        const merchandise = node.merchandise!;
        const product = merchandise.product;
        const image = product?.images?.edges?.[0]?.node;

        return {
          id: node.id || merchandise.id || '',
          variantId: merchandise.id || '',
          title: product?.title || merchandise.title || '',
          price: merchandise.price?.amount || '0',
          currencyCode: merchandise.price?.currencyCode || 'ILS',
          quantity: node.quantity || 1,
          image: image?.url,
          available: true,
        };
      });

    return items;
  } catch (error) {
    console.error('Error loading cart from Shopify:', error);
    return null;
  }
}

/**
 * מנסה למצוא cart קיים לפי buyerIdentity
 * מחפש ב-localStorage ואז ב-Shopify Customer metafields
 */
export async function findCartByBuyerIdentity(
  buyerIdentity: { email?: string; phone?: string }
): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // קודם נסה למצוא ב-localStorage
  const savedCartId = localStorage.getItem('klumit-cart') 
    ? JSON.parse(localStorage.getItem('klumit-cart') || '{}').state?.cartId 
    : null;
  
  if (savedCartId) {
    try {
      const response = await shopifyClient.request(GET_CART_QUERY, {
        id: savedCartId,
      }) as { cart?: { id?: string; buyerIdentity?: { email?: string; phone?: string } } };

      // בדוק שה-cart קיים ושהמשתמש תואם
      if (response.cart?.id) {
        const cartBuyerIdentity = response.cart.buyerIdentity;
        const emailMatch = !buyerIdentity.email || cartBuyerIdentity?.email === buyerIdentity.email;
        const phoneMatch = !buyerIdentity.phone || cartBuyerIdentity?.phone === buyerIdentity.phone;
        
        if (emailMatch && phoneMatch) {
          return response.cart.id;
        }
      }
    } catch (err) {
      console.warn('Cart ID from localStorage is invalid:', err);
    }
  }

  // תמיד נסה לטעון מ-Shopify Customer metafields (גם אם יש cart ID ב-localStorage)
  // זה מאפשר לטעון את העגלה מדפדפן אחר
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('🔍 Looking for cart ID in metafields...');
      // קבל Shopify Customer ID
      const { getShopifyCustomerId } = await import('@/lib/sync-customer');
      const shopifyCustomerId = await getShopifyCustomerId(session.user.id);
      
      console.log('👤 Shopify Customer ID from DB:', shopifyCustomerId);
      
      if (shopifyCustomerId) {
        // טען cart ID מ-metafields
        const response = await fetch(`/api/cart/save-cart-id?customerId=${encodeURIComponent(shopifyCustomerId)}`);
        console.log('📡 Metafields API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Cart ID from metafields:', data.cartId);
          
          if (data.cartId) {
            // בדוק שה-cart קיים ושהמשתמש תואם
            try {
              const cartResponse = await shopifyClient.request(GET_CART_QUERY, {
                id: data.cartId,
              }) as { cart?: { id?: string; buyerIdentity?: { email?: string; phone?: string } } };

              if (cartResponse.cart?.id) {
                const cartBuyerIdentity = cartResponse.cart.buyerIdentity;
                const emailMatch = !buyerIdentity.email || cartBuyerIdentity?.email === buyerIdentity.email;
                const phoneMatch = !buyerIdentity.phone || cartBuyerIdentity?.phone === buyerIdentity.phone;
                
                console.log('✅ Cart found in metafields:', {
                  cartId: cartResponse.cart.id,
                  emailMatch,
                  phoneMatch,
                  cartEmail: cartBuyerIdentity?.email,
                  cartPhone: cartBuyerIdentity?.phone,
                });
                
                if (emailMatch && phoneMatch) {
                  // אם יש cart ID ב-localStorage אבל הוא שונה, עדכן אותו
                  if (savedCartId !== data.cartId) {
                    console.log('🔄 Found different cart ID in metafields, updating localStorage');
                  }
                  return cartResponse.cart.id;
                } else {
                  console.warn('⚠️ Cart ID from metafields does not match buyer identity');
                }
              }
            } catch (err) {
              console.warn('❌ Cart ID from metafields is invalid:', err);
            }
          } else {
            console.log('ℹ️ No cart ID found in metafields');
          }
        } else {
          const errorText = await response.text().catch(() => '');
          console.warn('❌ Failed to load cart ID from metafields:', response.status, response.statusText, errorText);
        }
      } else {
        // אם אין Shopify Customer ID, אל תנסה ליצור אותו כאן
        // זה יקרה רק אם המשתמש מחובר ויש לו טלפון
        console.log('ℹ️ No Shopify Customer ID - user must be logged in to create customer');
      }
    } else {
      console.log('ℹ️ No user session - cannot load cart from metafields');
    }
  } catch (err) {
    console.warn('❌ Could not load cart ID from metafields:', err);
  }

  return null;
}

