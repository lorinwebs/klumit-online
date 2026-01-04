'use client';

import { shopifyClient, CREATE_CART_MUTATION, ADD_TO_CART_MUTATION, GET_CART_QUERY, UPDATE_CART_BUYER_IDENTITY_MUTATION, REMOVE_CART_LINES_MUTATION, UPDATE_CART_LINES_MUTATION } from './shopify';
import { supabase } from './supabase';
import type { CartItem } from '@/store/cartStore';

// Debouncing ל-saveCartIdToMetafields כדי למנוע קריאות מיותרות
let saveCartIdTimeout: NodeJS.Timeout | null = null;
let pendingCartId: string | null = null;
let lastSavedCartId: string | null = null; // נזכור את ה-cartId האחרון שנשמר כדי למנוע שמירה כפולה

// Queue ל-syncCartToShopify כדי למנוע קריאות מקבילות
let syncInProgress = false;
let pendingSync: { items: CartItem[]; cartId: string | null; resolve: (cartId: string | null) => void; reject: (err: any) => void } | null = null;

// Promise של ה-sync הנוכחי כדי שנוכל לחכות לו
let currentSyncPromise: Promise<string | null> | null = null;

/**
 * פונקציית עזר להשוואת מזהים (מתמודדת עם GID לעומת ID רגיל)
 * זה קריטי למניעת כפילויות ומחיקות שגויות
 * 
 * דוגמאות:
 * - areIdsEqual("12345", "gid://shopify/ProductVariant/12345") => true
 * - areIdsEqual("gid://shopify/ProductVariant/12345", "12345") => true
 * - areIdsEqual("12345", "12345") => true
 */
function areIdsEqual(id1: string | undefined, id2: string | undefined): boolean {
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;
  
  // חילוץ המספר בסוף ה-GID או ID רגיל
  const extractId = (id: string): string => {
    // אם זה GID, קח את החלק האחרון אחרי ה-/
    if (id.includes('/')) {
      const parts = id.split('/');
      return parts[parts.length - 1].split('?')[0]; // הסר query params אם יש
    }
    // אם זה ID רגיל, החזר אותו כמו שהוא
    return id;
  };
  
  return extractId(id1) === extractId(id2);
}

/**
 * מחכה שהעדכון הנוכחי יסתיים לפני שטוענים מחדש את העגלה
 */
export async function waitForSyncToComplete(): Promise<void> {
  if (currentSyncPromise) {
    try {
      await currentSyncPromise;
    } catch (err) {
      // התעלם משגיאות - רק חכה שהעדכון יסתיים
    }
  }
}

/**
 * פונקציה עזר לשמירת cart ID ב-metafields
 * עם debouncing כדי למנוע קריאות מיותרות
 */
export async function saveCartIdToMetafields(cartId: string | null, immediate: boolean = false): Promise<void> {
  // אם זה קריאה מיידית, נקה את ה-timeout ונקרא מיד
  if (immediate) {
    if (saveCartIdTimeout) {
      clearTimeout(saveCartIdTimeout);
      saveCartIdTimeout = null;
    }
    pendingCartId = null;
    return saveCartIdToMetafieldsImpl(cartId);
  }
  
  // שמור את ה-cart ID האחרון
  pendingCartId = cartId;
  
  // נקה את ה-timeout הקודם
  if (saveCartIdTimeout) {
    clearTimeout(saveCartIdTimeout);
  }
  
  // קבע timeout חדש (500ms debounce)
  saveCartIdTimeout = setTimeout(() => {
    if (pendingCartId !== null) { // Allow null to be passed to clear metafield
      saveCartIdToMetafieldsImpl(pendingCartId).catch(err => {

      });
      pendingCartId = null;
    }
    saveCartIdTimeout = null;
  }, 500);
}

/**
 * הפונקציה הפנימית שמבצעת את השמירה
 */
async function saveCartIdToMetafieldsImpl(cartId: string | null): Promise<void> {
  try {
    // בדיקה: אם זה אותו cartId שכבר נשמר, לא נשמור שוב
    if (cartId && cartId === lastSavedCartId) {
      console.log('⏭️ saveCartIdToMetafieldsImpl: Skipping - cartId already saved', { cartId });
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    // בדיקה שהסשן תקף ולא פג תוקף
    if (!session?.user) {
      return; // אין משתמש מחובר
    }
    
    // בדיקה שהטוקן לא פג תוקף
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      return; // הסשן פג תוקף
    }

    // קבל Shopify Customer ID (עם cache כדי למנוע קריאות מיותרות)
    const { getShopifyCustomerId } = await import('@/lib/sync-customer');
    const shopifyCustomerId = await getShopifyCustomerId(session.user.id, true);
    
    if (shopifyCustomerId) {
      console.log('💾 saveCartIdToMetafieldsImpl: Saving cart ID to metafields', {
        shopifyCustomerId,
        cartId,
        userId: session.user.id,
      });
      
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
        // נזכור את ה-cartId שנשמר כדי למנוע שמירה כפולה
        lastSavedCartId = cartId;
        console.log('✅ saveCartIdToMetafieldsImpl: Successfully saved cart ID to metafields', {
          shopifyCustomerId,
          cartId,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ saveCartIdToMetafieldsImpl: Failed to save cart ID to metafields', {
          shopifyCustomerId,
          cartId,
          error: errorData,
          status: response.status,
        });
      }
    } else {
      console.warn('⚠️ saveCartIdToMetafieldsImpl: No shopifyCustomerId, cannot save to metafields', {
        userId: session.user.id,
      });
    }
  } catch (err) {
    // שקט - לא נדפיס שגיאה כאן כי זה לא קריטי
  }
}

/**
 * יוצר או מעדכן Shopify cart עם buyerIdentity
 * כך שהעגלה תישמר גם אחרי התנתקות
 * עם queue mechanism כדי למנוע קריאות מקבילות
 */
/**
 * יוצר או מעדכן Shopify cart עם buyerIdentity
 * עם מנגנון Queue חכם למניעת Race Conditions
 */
export async function syncCartToShopify(
  items: CartItem[],
  existingCartId: string | null = null,
  buyerIdentity?: { email?: string; phone?: string }
): Promise<string | null> {
  // אם יש sync בתהליך, ננהל את התור
  if (syncInProgress) {
    return new Promise<string | null>((resolve, reject) => {
      // אם כבר יש בקשה שממתינה בתור, היא כבר לא רלוונטית כי הגיעה אחת חדשה יותר
      if (pendingSync) {
        // שחרר את הבקשה הקודמת כדי שה-UI לא ייתקע בהמתנה לנצח
        // נחזיר לה את ה-ID הישן (או null), ה-UI יתעדכן ממילא כשהבקשה החדשה תסתיים
        pendingSync.resolve(existingCartId);
      }
      // מגדירים את עצמנו כממתינים הבאים
      pendingSync = { items, cartId: existingCartId, resolve, reject };
    });
  }

  syncInProgress = true;
  
  // שומרים את ה-Promise הנוכחי כדי שנוכל להמתין לו
  currentSyncPromise = syncCartToShopifyImpl(items, existingCartId, buyerIdentity)
    .then(async (result) => {
      // הסנכרון הסתיים בהצלחה. האם הצטברו בקשות בתור בזמן שעבדנו?
      if (pendingSync) {
        const nextSync = pendingSync;
        pendingSync = null;
        
        // נשארים במצב syncInProgress = true ומריצים את הבא בתור
        // משתמשים ב-result (ה-cartId העדכני) עבור הסנכרון הבא
        try {
          const nextResult = await syncCartToShopify(
             nextSync.items, 
             result || nextSync.cartId, 
             buyerIdentity
          );
          nextSync.resolve(nextResult);
          return nextResult;
        } catch (err) {
          nextSync.reject(err);
          throw err;
        }
      }
      syncInProgress = false;
      currentSyncPromise = null;
      return result;
    })
    .catch(async (err) => {
       // אם נכשלנו, אבל יש בקשה ממתינה - ננסה להריץ אותה בכל זאת
       if (pendingSync) {
         const nextSync = pendingSync;
         pendingSync = null;
         try {
           const nextResult = await syncCartToShopify(nextSync.items, nextSync.cartId, buyerIdentity);
           nextSync.resolve(nextResult);
           return nextResult;
         } catch (nextErr) {
           nextSync.reject(nextErr);
           throw nextErr;
         }
       }
       syncInProgress = false;
       currentSyncPromise = null;
       throw err;
    })
    .finally(() => {
      // משחררים את המנעול רק אם אין עוד עבודה (pendingSync)
      // הלוגיקה ב-then למעלה כבר מטפלת בזה, אבל ליתר ביטחון:
      if (!pendingSync) {
        syncInProgress = false;
        currentSyncPromise = null;
      }
    });

  return currentSyncPromise;
}

/**
 * הפונקציה הפנימית שמבצעת את הסנכרון בפועל
 * גרסה מתוקנת: משתמשת ב-Diffing במקום מחיקה והוספה מחדש
 */
async function syncCartToShopifyImpl(
  items: CartItem[],
  existingCartId: string | null = null,
  buyerIdentity?: { email?: string; phone?: string }
): Promise<string | null> {
  
  try {
    // פונקציה עזר לעיצוב טלפון בפורמט Shopify (E.164)
    const formatPhoneForShopify = (phone: string | undefined): string | undefined => {
      if (!phone) return undefined;
      let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
      if (cleaned.startsWith('+')) {
        const digitsAfterPlus = cleaned.substring(1).replace(/\D/g, '');
        return digitsAfterPlus.length >= 10 ? cleaned : undefined;
      }
      const digitsOnly = cleaned.replace(/\D/g, '');
      if (digitsOnly.length === 0) return undefined;
      if (digitsOnly.startsWith('972')) return `+${digitsOnly}`;
      if (digitsOnly.startsWith('0') && digitsOnly.length >= 9 && digitsOnly.length <= 10) {
        return `+972${digitsOnly.substring(1)}`;
      }
      if (digitsOnly.length >= 9 && digitsOnly.length <= 10 && !digitsOnly.startsWith('0')) {
        return `+972${digitsOnly}`;
      }
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
          if (!formattedPhone) {
            delete buyerIdentity.phone;
          }
        }
      } catch (err) {
        // ignore
      }
    } else if (buyerIdentity.phone) {
      const formattedPhone = formatPhoneForShopify(buyerIdentity.phone);
      if (formattedPhone) {
        buyerIdentity.phone = formattedPhone;
      } else {
        delete buyerIdentity.phone;
      }
    }

    // בניית אובייקט buyerIdentity תקין
    let validBuyerIdentity: { email?: string; phone?: string } | undefined = undefined;
    
    const isValidEmail = buyerIdentity?.email && 
      buyerIdentity.email.includes('@') && 
      !buyerIdentity.email.endsWith('.local') &&
      !buyerIdentity.email.startsWith('temp-') &&
      buyerIdentity.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    if (buyerIdentity) {
      const formattedPhone = buyerIdentity.phone ? formatPhoneForShopify(buyerIdentity.phone) : undefined;
      
      if (isValidEmail || (formattedPhone && formattedPhone.startsWith('+'))) {
        validBuyerIdentity = {};
        if (isValidEmail && buyerIdentity.email) validBuyerIdentity.email = buyerIdentity.email;
        if (formattedPhone) validBuyerIdentity.phone = formattedPhone;
      }
    }

    // אם אין cart ID אבל יש buyerIdentity תקין, נסה לטעון מ-metafields
    // זה קריטי כדי שכל דפדפן ישתמש באותה עגלה
    if (!existingCartId && validBuyerIdentity) {
      try {
        const { getShopifyCustomerId } = await import('@/lib/sync-customer');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const now = Math.floor(Date.now() / 1000);
          if (!session.expires_at || session.expires_at >= now) {
            const shopifyCustomerId = await getShopifyCustomerId(session.user.id, true);
            if (shopifyCustomerId) {
              const response = await fetch(`/api/cart/save-cart-id?customerId=${encodeURIComponent(shopifyCustomerId)}`);
              if (response.ok) {
                const data = await response.json();
                if (data.cartId) {
                  try {
                    const cartCheck = await shopifyClient.request(GET_CART_QUERY, {
                      id: data.cartId,
                    }) as { cart?: { id?: string; buyerIdentity?: { email?: string; phone?: string } } };
                    
                    if (cartCheck.cart?.id) {
                      // נבדוק שהעגלה תואמת את ה-buyerIdentity
                      const cartBuyerIdentity = cartCheck.cart.buyerIdentity;
                      const emailMatch = !validBuyerIdentity.email || cartBuyerIdentity?.email === validBuyerIdentity.email;
                      const phoneMatch = !validBuyerIdentity.phone || cartBuyerIdentity?.phone === validBuyerIdentity.phone;
                      
                      if (emailMatch && phoneMatch) {
                        existingCartId = data.cartId;
                      } else {
                        // אם העגלה לא תואמת, נעדכן את ה-buyerIdentity
                        try {
                          await shopifyClient.request(UPDATE_CART_BUYER_IDENTITY_MUTATION, {
                            cartId: data.cartId,
                            buyerIdentity: validBuyerIdentity,
                          });
                          existingCartId = data.cartId;
                        } catch (updateErr) {
                          // בכל מקרה נשתמש בעגלה הזו
                          existingCartId = data.cartId;
                        }
                      }
                    }
                  } catch (cartErr) {
                    // ignore
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        // ignore
      }
    }

    // ---------------------------------------------------------
    // תרחיש 1: יצירת עגלה חדשה (אם אין ID קיים)
    // ---------------------------------------------------------
    if (!existingCartId) {
      // אם המשתמש מחובר, ננסה לחכות קצת ולחפש שוב ב-metafields
      // זה יכול לעזור במקרה של race condition שבו עגלה נוצרת במקביל
      if (validBuyerIdentity) {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // נחכה קצת וננסה לחפש שוב ב-metafields
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const { getShopifyCustomerId } = await import('@/lib/sync-customer');
            const shopifyCustomerId = await getShopifyCustomerId(session.user.id, true);
            if (shopifyCustomerId) {
              const retryResponse = await fetch(`/api/cart/save-cart-id?customerId=${encodeURIComponent(shopifyCustomerId)}`);
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.cartId) {
                  try {
                    const retryCartCheck = await shopifyClient.request(GET_CART_QUERY, {
                      id: retryData.cartId,
                    }) as { cart?: { id?: string; buyerIdentity?: { email?: string; phone?: string } } };
                    
                    if (retryCartCheck.cart?.id) {
                      const cartBuyerIdentity = retryCartCheck.cart.buyerIdentity;
                      const emailMatch = !validBuyerIdentity.email || cartBuyerIdentity?.email === validBuyerIdentity.email;
                      const phoneMatch = !validBuyerIdentity.phone || cartBuyerIdentity?.phone === validBuyerIdentity.phone;
                      
                      if (emailMatch && phoneMatch) {
                        existingCartId = retryData.cartId;
                      }
                    }
                  } catch (retryErr) {
                    // ignore
                  }
                }
              }
            }
          }
        } catch (retryErr) {
          // ignore
        }
      }
      
      // אם עדיין אין cart ID, ניצור עגלה חדשה
      // אבל רק אם המשתמש לא מחובר - אם המשתמש מחובר, צריך תמיד להשתמש בעגלה מ-metafields
      if (!existingCartId) {
        // אם המשתמש מחובר, לא ניצור עגלה חדשה - נחזיר null ונמתין שהעגלה תיווצר דרך metafields
        if (validBuyerIdentity) {
          try {
            const { supabase } = await import('@/lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // במקרה כזה, נחזיר null ונמתין שהעגלה תיווצר דרך loadFromShopify
              return null;
            }
          } catch(e) {
            // אם יש שגיאה, נמשיך ליצור עגלה חדשה
          }
        }
        
        // אם המשתמש לא מחובר, ניצור עגלה חדשה
        const lines = items.map(item => ({
          merchandiseId: item.variantId,
          quantity: item.quantity,
        }));

        const cartInput: any = { lines };
        if (validBuyerIdentity) {
          cartInput.buyerIdentity = validBuyerIdentity;
        }

        const createResponse = await shopifyClient.request(CREATE_CART_MUTATION, { cartInput }) as any;
        const newCartId = createResponse.cartCreate?.cart?.id;

        if (newCartId) {
          try {
            const { supabase } = await import('@/lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // שמירה מיידית ב-metafields כדי שדפדפנים אחרים ימצאו אותה
              await saveCartIdToMetafields(newCartId, true);
            }
          } catch(e) {
          }
        }
        return newCartId;
      }
    }

    // ---------------------------------------------------------
    // תרחיש 2: עדכון עגלה קיימת (החלק הקריטי ששונה)
    // ---------------------------------------------------------
    
    // א. קודם כל מביאים את העגלה הנוכחית משופיפיי ("האמת" של השרת)
    const currentCartResponse = await shopifyClient.request(GET_CART_QUERY, {
      id: existingCartId,
    }) as any;

    const cartData = currentCartResponse.cart;
    
    // אם העגלה לא קיימת יותר בשופיפיי, ניצור חדשה
    if (!cartData?.id) {
      return syncCartToShopifyImpl(items, null, buyerIdentity);
    }

    // ב. עדכון Buyer Identity אם צריך
    const cartBuyerIdentity = cartData.buyerIdentity;
    const needsBuyerIdentityUpdate = validBuyerIdentity && (
      cartBuyerIdentity?.email !== validBuyerIdentity.email ||
      cartBuyerIdentity?.phone !== validBuyerIdentity.phone
    );

    if (needsBuyerIdentityUpdate && validBuyerIdentity) {
      try {
        await shopifyClient.request(UPDATE_CART_BUYER_IDENTITY_MUTATION, {
          cartId: existingCartId,
          buyerIdentity: validBuyerIdentity,
        });
      } catch (e) { 
      }
    }

    // ג. חישוב ההבדלים (Diffing Algorithm)
    // =====================================
    
    const shopifyLines = cartData.lines?.edges || [];
    
    // מפה: VariantID -> { LineID, Quantity }
    const shopifyMap = new Map<string, { lineId: string, quantity: number }>();
    
    shopifyLines.forEach((edge: any) => {
      if (edge.node?.merchandise?.id) {
        shopifyMap.set(edge.node.merchandise.id, {
          lineId: edge.node.id,
          quantity: edge.node.quantity
        });
      }
    });

    // מפה: VariantID -> Quantity (מה שיש לנו בלוקאלי)
    const localMap = new Map<string, number>();
    items.forEach(item => {
      localMap.set(item.variantId, item.quantity);
    });


    const linesToAdd: Array<{ merchandiseId: string, quantity: number }> = [];
    const linesToUpdate: Array<{ id: string, quantity: number }> = [];
    const linesToRemove: Array<string> = [];

    // 1. בדוק כל פריט מקומי: האם להוסיף או לעדכן?
    items.forEach(item => {
      const shopifyLine = shopifyMap.get(item.variantId);
      
      if (shopifyLine) {
        // קיים גם בשופיפיי. האם הכמות שונה?
        if (shopifyLine.quantity !== item.quantity) {
          // עדכון: משתמשים ב-LineID הקיים! לא מוחקים!
          linesToUpdate.push({
            id: shopifyLine.lineId, 
            quantity: item.quantity
          });
        } else {
        }
      } else {
        // לא קיים בשופיפיי -> הוספה
        linesToAdd.push({
          merchandiseId: item.variantId,
          quantity: item.quantity
        });
      }
    });

    // 2. בדוק כל פריט בשופיפיי: האם למחוק? (אם הוא לא קיים אצלנו בלוקאלי)
    // אבל רק אם יש פריטים בלוקאלי - אם אין פריטים בלוקאלי, זה אומר שהעגלה ריקה
    // ואז נמחק הכל. אבל אם יש פריטים, נמחק רק את מה שלא קיים בלוקאלי
    if (items.length > 0) {
      shopifyMap.forEach((val, variantId) => {
        if (!localMap.has(variantId)) {
          linesToRemove.push(val.lineId);
        }
      });
    } else {
      // אם אין פריטים בלוקאלי, נמחק הכל מהעגלה
      shopifyMap.forEach((val, variantId) => {
        linesToRemove.push(val.lineId);
      });
    }


    // ד. ביצוע הפעולות (רק מה שצריך)
    if (linesToAdd.length > 0) {
      const addResult = await shopifyClient.request(ADD_TO_CART_MUTATION, {
        cartId: existingCartId,
        lines: linesToAdd
      });
    }

    if (linesToUpdate.length > 0) {
      const updateResult = await shopifyClient.request(UPDATE_CART_LINES_MUTATION, {
        cartId: existingCartId,
        lines: linesToUpdate
      }) as any;
      
      // בדוק אם יש שגיאות
      if (updateResult?.cartLinesUpdate?.userErrors?.length > 0) {
      }
    }

    if (linesToRemove.length > 0) {
      const removeResult = await shopifyClient.request(REMOVE_CART_LINES_MUTATION, {
        cartId: existingCartId,
        lineIds: linesToRemove
      });
    }
    
    // שמירה ל-Metafields למקרה הצורך
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) saveCartIdToMetafields(existingCartId, true).catch(() => {});
    } catch(e) {}

    return existingCartId;

  } catch (error) {
    return existingCartId; 
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
              quantityAvailable?: number;
              selectedOptions?: Array<{ name?: string; value?: string }>;
              price?: { amount?: string; currencyCode?: string };
              product?: { 
                title?: string;
                handle?: string;
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

        // Extract color from selectedOptions
        const colorOption = merchandise.selectedOptions?.find(opt => 
          opt.name?.toLowerCase() === 'color' || 
          opt.name?.toLowerCase() === 'צבע' ||
          opt.name?.toLowerCase() === 'colour'
        );
        const color = colorOption?.value || null;

        return {
          id: node.id || merchandise.id || '',
          variantId: merchandise.id || '',
          title: product?.title || merchandise.title || '',
          price: merchandise.price?.amount || '0',
          currencyCode: merchandise.price?.currencyCode || 'ILS',
          quantity: node.quantity || 1,
          image: image?.url,
          available: true,
          quantityAvailable: merchandise.quantityAvailable ?? undefined,
          handle: product?.handle,
          color: color || undefined,
          variantTitle: merchandise.title && merchandise.title !== 'Default Title' ? merchandise.title : undefined,
        };
      });


    return items;
  } catch (error) {
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
  console.log('🚀 findCartByBuyerIdentity: CALLED', { buyerIdentity, isWindow: typeof window !== 'undefined' });
  
  if (typeof window === 'undefined') return null;

  // קודם נבדוק אם המשתמש מחובר - אם כן, נבדוק קודם ב-metafields
  // משתמשים ב-API route כדי לבדוק את הסשן מהקוקיז (אמין יותר)
  let session: any = null;
  let isLoggedIn = false;
  try {
    const response = await fetch('/api/auth/session', { 
      credentials: 'include',
      cache: 'no-store'
    });
    if (response.ok) {
      const data = await response.json();
      session = data?.session || (data?.user ? { user: data.user } : null);
      isLoggedIn = !!session?.user;
    }
    console.log('🔍 findCartByBuyerIdentity: Initial login check (from API)', {
      isLoggedIn,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
    });
  } catch (err) {
    console.error('❌ findCartByBuyerIdentity: Error checking session from API', err);
    // Fallback to supabase.auth.getSession
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.auth.getSession();
      session = data?.session;
      isLoggedIn = !!session?.user;
      console.log('🔍 findCartByBuyerIdentity: Fallback login check (from Supabase)', {
        isLoggedIn,
        hasSession: !!session,
        hasUser: !!session?.user,
      });
    } catch (fallbackErr) {
      console.error('❌ findCartByBuyerIdentity: Error in fallback session check', fallbackErr);
      return null;
    }
  }

  // אם המשתמש מחובר, נבדוק קודם ב-metafields
  if (isLoggedIn && session?.user) {
    try {
      const { getShopifyCustomerId } = await import('@/lib/sync-customer');
      let shopifyCustomerId = await getShopifyCustomerId(session.user.id, true);
      
      console.log('🔍 findCartByBuyerIdentity: Shopify Customer ID from Supabase', {
        userId: session.user.id,
        shopifyCustomerId,
      });
      
      // אם לא מצאנו ב-Supabase, נחפש ב-Shopify
      if (!shopifyCustomerId) {
        console.log('🔍 findCartByBuyerIdentity: Not in Supabase, searching Shopify...');
        try {
          const response = await fetch('/api/shopify/find-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session.user.id,
              phone: buyerIdentity.phone || session.user.phone,
              email: buyerIdentity.email || session.user.email,
            }),
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 findCartByBuyerIdentity: find-customer result', data);
            if (data.customerId) {
              shopifyCustomerId = data.customerId;
            }
          }
        } catch (err) {
          console.error('❌ findCartByBuyerIdentity: find-customer failed', err);
        }
      }
      
      if (shopifyCustomerId) {
            const currentShopifyCustomerId = shopifyCustomerId; // שמור את הערך כדי שיהיה זמין בכל ה-scope
            console.log('🔍 findCartByBuyerIdentity: Looking for cart in metafields', {
              shopifyCustomerId: currentShopifyCustomerId,
              buyerIdentity,
              userId: session.user.id,
            });
            
            try {
              const response = await fetch(`/api/cart/save-cart-id?customerId=${encodeURIComponent(currentShopifyCustomerId)}`, {
                cache: 'no-store', // חשוב: לא להשתמש ב-cache כדי לקבל את הערך העדכני
              });

              if (response.ok) {
                let data: any;
                try {
                  data = await response.json();
                  console.log('📦 findCartByBuyerIdentity: Metafields response', {
                    shopifyCustomerId: currentShopifyCustomerId,
                    cartIdFromMetafields: data.cartId,
                    buyerIdentity,
                    responseStatus: response.status,
                  });

                  if (data.cartId) {
                    try {
                  const cartResponse = await shopifyClient.request(GET_CART_QUERY, {
                    id: data.cartId,
                  }) as { cart?: { id?: string; buyerIdentity?: { email?: string; phone?: string } } };

                  if (cartResponse.cart?.id) {
                    // אם יש cartId ב-metafields, נחזיר אותו גם אם ה-buyerIdentity לא תואם בדיוק
                    // ננסה לעדכן את ה-buyerIdentity אם צריך, אבל נחזיר את העגלה בכל מקרה
                    const cartBuyerIdentity = cartResponse.cart.buyerIdentity;
                    const emailMatch = !buyerIdentity.email || cartBuyerIdentity?.email === buyerIdentity.email;
                    
                    // פונקציה עזר לעיצוב טלפון בפורמט Shopify (E.164) - אותה פונקציה כמו ב-syncCartToShopifyImpl
                    const formatPhoneForShopify = (phone: string | undefined): string | undefined => {
                      if (!phone) return undefined;
                      let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
                      if (cleaned.startsWith('+')) {
                        const digitsAfterPlus = cleaned.substring(1).replace(/\D/g, '');
                        return digitsAfterPlus.length >= 10 ? cleaned : undefined;
                      }
                      const digitsOnly = cleaned.replace(/\D/g, '');
                      if (digitsOnly.length === 0) return undefined;
                      if (digitsOnly.startsWith('972')) return `+${digitsOnly}`;
                      if (digitsOnly.startsWith('0') && digitsOnly.length >= 9 && digitsOnly.length <= 10) {
                        return `+972${digitsOnly.substring(1)}`;
                      }
                      if (digitsOnly.length >= 9 && digitsOnly.length <= 10 && !digitsOnly.startsWith('0')) {
                        return `+972${digitsOnly}`;
                      }
                      return undefined;
                    };
                    
                    // השוואת טלפון - נשווה גם את הפורמט המקורי וגם את הפורמט המעוצב
                    const formattedBuyerPhone = formatPhoneForShopify(buyerIdentity.phone);
                    const formattedCartPhone = formatPhoneForShopify(cartBuyerIdentity?.phone);
                    const phoneMatch = !buyerIdentity.phone || 
                      cartBuyerIdentity?.phone === buyerIdentity.phone ||
                      (formattedBuyerPhone && formattedBuyerPhone === formattedCartPhone);

                    // אם העגלה תואמת את ה-buyerIdentity, נחזיר אותה
                    if (emailMatch && phoneMatch) {
                      return cartResponse.cart.id;
                    }
                    
                    // אם העגלה לא תואמת אבל יש buyerIdentity תקין, נעדכן את העגלה
                    // זה יכול לקרות אם העגלה נוצרה לפני שהמשתמש התחבר
                    if (buyerIdentity.email || buyerIdentity.phone) {
                      try {
                        const validBuyerIdentity: any = {};
                        if (buyerIdentity.email && buyerIdentity.email.includes('@')) {
                          validBuyerIdentity.email = buyerIdentity.email;
                        }
                        if (formattedBuyerPhone) {
                          validBuyerIdentity.phone = formattedBuyerPhone;
                        }
                        
                        if (Object.keys(validBuyerIdentity).length > 0) {
                          await shopifyClient.request(UPDATE_CART_BUYER_IDENTITY_MUTATION, {
                            cartId: cartResponse.cart.id,
                            buyerIdentity: validBuyerIdentity,
                          });
                        }
                      } catch (err) {
                        // אם יש שגיאה בעדכון, נמשיך בכל מקרה
                      }
                    }
                    
                    // נחזיר את העגלה בכל מקרה אם היא קיימת ב-metafields
                    console.log('✅ findCartByBuyerIdentity: Found cart in metafields', {
                      cartId: cartResponse.cart.id,
                      cartBuyerIdentity,
                      requestedBuyerIdentity: buyerIdentity,
                      emailMatch,
                      phoneMatch,
                    });
                    return cartResponse.cart.id;
                  }
                    } catch (err) {
                      console.error('❌ findCartByBuyerIdentity: Error checking cart from metafields', {
                        cartId: data.cartId,
                        error: err,
                      });
                    }
                  } else {
                    console.log('⚠️ findCartByBuyerIdentity: No cartId in metafields response', {
                      shopifyCustomerId: currentShopifyCustomerId,
                      data,
                    });
                  }
                } catch (jsonError: any) {
                  console.error('❌ findCartByBuyerIdentity: Failed to parse metafields response', {
                    shopifyCustomerId: currentShopifyCustomerId,
                    status: response.status,
                    error: jsonError?.message || jsonError,
                  });
                  // נמשיך לבדוק ב-localStorage במקרה של שגיאה
                }
              } else {
                let errorData: any = null;
                try {
                  errorData = await response.json().catch(() => null);
                } catch (e) {
                  // ignore
                }
                
                console.error('❌ findCartByBuyerIdentity: Failed to fetch metafields', {
                  shopifyCustomerId: currentShopifyCustomerId,
                  status: response.status,
                  statusText: response.statusText,
                  error: errorData,
                  url: `/api/cart/save-cart-id?customerId=${encodeURIComponent(currentShopifyCustomerId)}`,
                });
                // נמשיך לבדוק ב-localStorage במקרה של שגיאה
              }
            } catch (fetchError: any) {
              console.error('❌ findCartByBuyerIdentity: Failed to fetch metafields (network error)', {
                shopifyCustomerId: currentShopifyCustomerId,
                error: fetchError?.message || fetchError,
                stack: fetchError?.stack,
                url: `/api/cart/save-cart-id?customerId=${encodeURIComponent(currentShopifyCustomerId)}`,
              });
              // נמשיך לבדוק ב-localStorage במקרה של שגיאה
            }
      } else {
        console.warn('⚠️ findCartByBuyerIdentity: No shopifyCustomerId', {
          userId: session.user.id,
        });
      }
    } catch (err) {
      console.error('❌ findCartByBuyerIdentity: Error in logged-in branch', err);
    }
  } else {
    console.log('⚠️ findCartByBuyerIdentity: User not logged in, skipping metafields check');
  }

  // אם המשתמש לא מחובר, או שלא מצאנו ב-metafields, נבדוק ב-localStorage
  const savedCartId = localStorage.getItem('klumit-cart-id');
  
  if (savedCartId) {
    try {
      const response = await shopifyClient.request(GET_CART_QUERY, {
        id: savedCartId,
      }) as { cart?: { id?: string; buyerIdentity?: { email?: string; phone?: string } } };

      if (response.cart?.id) {
        const cartBuyerIdentity = response.cart.buyerIdentity;
        const emailMatch = !buyerIdentity.email || cartBuyerIdentity?.email === buyerIdentity.email;
        const phoneMatch = !buyerIdentity.phone || cartBuyerIdentity?.phone === buyerIdentity.phone;
        
        if (emailMatch && phoneMatch) {
          return response.cart.id;
        }
      }
    } catch (err) {
      // ignore
    }
  }

  return null;
}
















