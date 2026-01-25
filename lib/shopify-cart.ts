'use client';

import { shopifyClient, CREATE_CART_MUTATION, ADD_TO_CART_MUTATION, GET_CART_QUERY, UPDATE_CART_BUYER_IDENTITY_MUTATION, REMOVE_CART_LINES_MUTATION, UPDATE_CART_LINES_MUTATION } from './shopify';
import { supabase } from './supabase';
import type { CartItem } from '@/store/cartStore';
import { formatPhoneForShopify } from './utils/phone';

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
      if (process.env.NODE_ENV === 'development') {
        console.warn('[waitForSyncToComplete] Sync completed with error:', err);
      }
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
        if (process.env.NODE_ENV === 'development') {
          console.error('[saveCartIdToMetafields] Failed to save cart ID:', err);
        }
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
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    // בדיקה שהסשן תקף ולא פג תוקף
    if (!session?.user) {
      return; // אין משתמש מחובר
    }
    
    // בדיקה שהטוקן לא פג תוקף
    // הערה: Supabase יבדוק את התוקף בצד השרת, אבל בודקים כאן כדי למנוע קריאות מיותרות
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[saveCartIdToMetafieldsImpl] Session expired, skipping save');
      }
      return; // הסשן פג תוקף
    }

    // קבל Shopify Customer ID (עם cache כדי למנוע קריאות מיותרות)
    const { getShopifyCustomerId } = await import('@/lib/sync-customer');
    let shopifyCustomerId = await getShopifyCustomerId(session.user.id, true);
    
    // אם אין shopifyCustomerId, ניצור לקוח ב-Shopify
    if (!shopifyCustomerId) {
      try {
        const response = await fetch('/api/shopify/find-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            phone: session.user.phone || session.user.user_metadata?.phone,
            email: session.user.email || session.user.user_metadata?.email,
          }),
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.customerId) {
            shopifyCustomerId = data.customerId;
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[saveCartIdToMetafieldsImpl] Error finding customer:', err);
        }
      }
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
        // נזכור את ה-cartId שנשמר כדי למנוע שמירה כפולה
        lastSavedCartId = cartId;
      }
    }
  } catch (err) {
    // לא קריטי - לא נדפיס שגיאה ב-production כדי לא להפריע למשתמש
    if (process.env.NODE_ENV === 'development') {
      console.error('[saveCartIdToMetafieldsImpl] Unexpected error:', err);
    }
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
        if (process.env.NODE_ENV === 'development') {
          console.error('[syncCartToShopifyImpl] Error getting session:', err);
        }
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
        if (process.env.NODE_ENV === 'development') {
          console.error('[syncCartToShopifyImpl] Error loading cart from metafields:', err);
        }
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
                    if (process.env.NODE_ENV === 'development') {
                      console.error('[syncCartToShopifyImpl] Error checking retry cart:', retryErr);
                    }
                  }
                }
              }
            }
          }
        } catch (retryErr) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[syncCartToShopifyImpl] Error retrying metafields lookup:', retryErr);
          }
        }
      }
      
      // אם עדיין אין cart ID, ניצור עגלה חדשה
      if (!existingCartId) {
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
        const userErrors = createResponse.cartCreate?.userErrors;

        if (newCartId) {
          try {
            const { supabase } = await import('@/lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // שמירה מיידית ב-metafields כדי שדפדפנים אחרים ימצאו אותה
              await saveCartIdToMetafields(newCartId, true);
            }
          } catch(e) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[syncCartToShopifyImpl] Error saving new cart ID:', e);
            }
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
        if (process.env.NODE_ENV === 'development') {
          console.error('[syncCartToShopifyImpl] Error updating buyer identity:', e);
        }
      }
    }

    // ג. חישוב ההבדלים (Diffing Algorithm)
    // =====================================
    
    const shopifyLines = cartData.lines?.edges || [];
    
    // מפה: VariantID -> { LineID, Quantity }
    const shopifyMap = new Map<string, { lineId: string, quantity: number, variantId: string }>();
    
    shopifyLines.forEach((edge: any) => {
      if (edge.node?.merchandise?.id) {
        shopifyMap.set(edge.node.merchandise.id, {
          lineId: edge.node.id,
          quantity: edge.node.quantity,
          variantId: edge.node.merchandise.id
        });
      }
    });

    // מפה: VariantID -> Quantity (מה שיש לנו בלוקאלי)
    const localMap = new Map<string, number>();
    items.forEach(item => {
      localMap.set(item.variantId, item.quantity);
    });

    // Helper function למציאת פריט ב-shopifyMap לפי variantId (עם תמיכה בפורמטים שונים)
    const findShopifyLine = (variantId: string): { lineId: string, quantity: number } | null => {
      // נסה למצוא ישירות
      const directMatch = shopifyMap.get(variantId);
      if (directMatch) {
        return { lineId: directMatch.lineId, quantity: directMatch.quantity };
      }
      
      // אם לא מצאנו, נחפש עם השוואה לפי ID אמיתי
      for (const [shopifyVariantId, shopifyLine] of shopifyMap.entries()) {
        if (areIdsEqual(variantId, shopifyVariantId)) {
          return { lineId: shopifyLine.lineId, quantity: shopifyLine.quantity };
        }
      }
      
      return null;
    };

    // Helper function לבדיקה אם variantId קיים ב-localMap (עם תמיכה בפורמטים שונים)
    const existsInLocalMap = (variantId: string): boolean => {
      if (localMap.has(variantId)) {
        return true;
      }
      
      for (const localVariantId of localMap.keys()) {
        if (areIdsEqual(variantId, localVariantId)) {
          return true;
        }
      }
      
      return false;
    };

    const linesToAdd: Array<{ merchandiseId: string, quantity: number }> = [];
    const linesToUpdate: Array<{ id: string, quantity: number }> = [];
    const linesToRemove: Array<string> = [];

    // 1. בדוק כל פריט מקומי: האם להוסיף או לעדכן?
    items.forEach(item => {
      const shopifyLine = findShopifyLine(item.variantId);
      
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
        if (!existsInLocalMap(variantId)) {
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
        if (process.env.NODE_ENV === 'development') {
          console.warn('[syncCartToShopifyImpl] Cart lines update errors:', updateResult.cartLinesUpdate.userErrors);
        }
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
      if (session?.user) {
        saveCartIdToMetafields(existingCartId, true).catch((e) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('[syncCartToShopifyImpl] Error saving cart ID to metafields:', e);
          }
        });
      }
    } catch(e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[syncCartToShopifyImpl] Error getting session for metafields save:', e);
      }
    }

    return existingCartId;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[syncCartToShopifyImpl] Fatal error during cart sync:', error);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('[loadCartFromShopify] Error loading cart:', error);
    }
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

  // קודם נבדוק אם המשתמש מחובר - אם כן, נבדוק קודם ב-metafields
  // שימוש ישיר ב-supabase.auth.getUser() במקום דרך API
  let session: any = null;
  let isLoggedIn = false;
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      session = { user };
      isLoggedIn = true;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[findCartByBuyerIdentity] Error getting user:', err);
    }
    return null;
  }

  // אם המשתמש מחובר, נבדוק קודם ב-metafields
  if (isLoggedIn && session?.user) {
    try {
      const { getShopifyCustomerId } = await import('@/lib/sync-customer');
      let shopifyCustomerId = await getShopifyCustomerId(session.user.id, true);
      
      // אם לא מצאנו ב-Supabase, נחפש ב-Shopify
      if (!shopifyCustomerId) {
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
            if (data.customerId) {
              shopifyCustomerId = data.customerId;
            }
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[findCartByBuyerIdentity] Error finding customer:', err);
          }
        }
      }
      
      if (shopifyCustomerId) {
            const currentShopifyCustomerId = shopifyCustomerId; // שמור את הערך כדי שיהיה זמין בכל ה-scope
            
            try {
              const response = await fetch(`/api/cart/save-cart-id?customerId=${encodeURIComponent(currentShopifyCustomerId)}`, {
                cache: 'no-store', // חשוב: לא להשתמש ב-cache כדי לקבל את הערך העדכני
              });

              if (response.ok) {
                let data: any;
                try {
                  data = await response.json();

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
                        if (process.env.NODE_ENV === 'development') {
                          console.error('[findCartByBuyerIdentity] Error updating buyer identity:', err);
                        }
                      }
                    }
                    
                    // נחזיר את העגלה בכל מקרה אם היא קיימת ב-metafields
                    return cartResponse.cart.id;
                  }
                    } catch (err) {
                      if (process.env.NODE_ENV === 'development') {
                        console.error('[findCartByBuyerIdentity] Error checking cart:', err);
                      }
                    }
                  }
                } catch (jsonError: any) {
                  // נמשיך לבדוק ב-localStorage במקרה של שגיאה
                  if (process.env.NODE_ENV === 'development') {
                    console.error('[findCartByBuyerIdentity] Error parsing JSON:', jsonError);
                  }
                }
              } else {
                // נמשיך לבדוק ב-localStorage במקרה של שגיאה
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[findCartByBuyerIdentity] Failed to fetch cart ID from metafields');
                }
              }
            } catch (fetchError: any) {
              // נמשיך לבדוק ב-localStorage במקרה של שגיאה
              if (process.env.NODE_ENV === 'development') {
                console.error('[findCartByBuyerIdentity] Error fetching cart ID:', fetchError);
              }
            }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[findCartByBuyerIdentity] Error in metafields lookup:', err);
      }
    }
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
        
        // אם העגלה קיימת אבל ה-buyerIdentity לא תואם, נעדכן אותה
        if (!emailMatch || !phoneMatch) {
          try {
            await shopifyClient.request(UPDATE_CART_BUYER_IDENTITY_MUTATION, {
              cartId: savedCartId,
              buyerIdentity: {
                email: buyerIdentity.email,
                phone: buyerIdentity.phone,
              },
            });
          } catch (updateErr) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[findCartByBuyerIdentity] Error updating buyer identity from localStorage:', updateErr);
            }
          }
        }
        
        return response.cart.id;
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[findCartByBuyerIdentity] Error loading cart from localStorage:', err);
      }
    }
  }
  return null;
}
















