import { create } from 'zustand';
import { syncCartToShopify, loadCartFromShopify, findCartByBuyerIdentity, saveCartIdToMetafields, waitForSyncToComplete } from '@/lib/shopify-cart';

export interface CartItem {
  id: string; // Shopify Line ID
  variantId: string; // Product Variant ID
  title: string;
  price: string;
  currencyCode: string;
  quantity: number;
  image?: string;
  available: boolean;
  quantityAvailable?: number; // כמה יחידות זמינות במלאי
  color?: string;
  variantTitle?: string;
  handle?: string;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  isLoading: boolean;
  isUpdating: boolean; // הוספתי את זה כדי שה-UI יוכל להציג ספינר קטן אם רוצים
  addItem: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  loadFromShopify: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

const CART_ID_STORAGE_KEY = 'klumit-cart-id';

// משתנים גלובליים לניהול מצב מחוץ ל-Store (מונע Race Conditions)
let isLoadingFromShopify = false;
let updateInProgress = false; // דגל קריטי: מונע דריסה של עדכונים אופטימיים
let updateVersion = 0; // מונה גרסאות כדי לדעת אם המידע שחזר מהשרת עדיין רלוונטי

function saveCartIdToLocalStorage(cartId: string | null) {
  if (typeof window === 'undefined') return;
  if (cartId) {
    localStorage.setItem(CART_ID_STORAGE_KEY, cartId);
  } else {
    localStorage.removeItem(CART_ID_STORAGE_KEY);
  }
}

function getCartIdFromLocalStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_ID_STORAGE_KEY);
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  cartId: null,
  isLoading: false,
  isUpdating: false,
  
  loadFromShopify: async () => {
    // 1. הגנות מפני טעינות כפולות או דריסת עדכונים
    if (isLoadingFromShopify || updateInProgress) {
      return;
    }
    
    isLoadingFromShopify = true;
    const currentVersion = updateVersion; // שומרים את הגרסה הנוכחית לפני היציאה לשרת
    
    // ממתינים שהסנכרון הקודם יסתיים (מהקובץ הקודם שתיקנו)
    await waitForSyncToComplete();
    
    // בדיקה נוספת: אם בזמן שחיכינו המשתמש ביצע פעולה, מבטלים את הטעינה
    if (updateInProgress || updateVersion !== currentVersion) {
      isLoadingFromShopify = false;
      return;
    }

    set({ isLoading: true });
    
    try {
      // משתמשים ב-API route כדי לבדוק את הסשן מהקוקיז (אמין יותר מ-supabase.auth.getSession)
      let session: any = null;
      try {
        const response = await fetch('/api/auth/session', { 
          credentials: 'include',
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          session = data?.session || (data?.user ? { user: data.user } : null);
        }
      } catch (err) {
        console.error('❌ loadFromShopify: Failed to fetch session from API', err);
        // Fallback to supabase.auth.getSession
        const { supabase } = await import('@/lib/supabase');
        const { data } = await supabase.auth.getSession();
        session = data?.session;
      }
      
      const isLoggedIn = !!session?.user;
      let targetCartId: string | null = null;
      
      console.log('🚀 loadFromShopify: Session check', {
        isLoggedIn,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
      });
      
      // לוגיקת מציאת Cart ID
      if (isLoggedIn) {
        const buyerIdentity = {
          email: session.user.email || session.user.user_metadata?.email,
          phone: session.user.phone || session.user.user_metadata?.phone,
        };
        // תמיד מחפשים לפי buyerIdentity אם המשתמש מחובר
        console.log('🔍 loadFromShopify: About to call findCartByBuyerIdentity', { buyerIdentity, userId: session.user.id });
        targetCartId = await findCartByBuyerIdentity(buyerIdentity);
        console.log('🔍 loadFromShopify: findCartByBuyerIdentity returned', { targetCartId });
        if (targetCartId) {
          // לא נשמור שוב ל-metafields כי זה כבר נמצא ב-metafields (אחרת לא היינו מוצאים אותו)
          // נשמור רק ב-localStorage כדי שנוכל לטעון אותה מחדש
          saveCartIdToLocalStorage(targetCartId);
        } else {
          // אם לא מצאנו לפי buyerIdentity, נבדוק ב-localStorage
          // אבל רק אם העגלה ב-localStorage שייכת למשתמש הזה (יש לה buyerIdentity תואם)
          const localStorageCartId = getCartIdFromLocalStorage();
          if (localStorageCartId) {
            try {
              // נבדוק אם העגלה ב-localStorage שייכת למשתמש הזה
              const cartResponse = await (await import('@/lib/shopify')).shopifyClient.request(
                (await import('@/lib/shopify')).GET_CART_QUERY,
                { id: localStorageCartId }
              ) as { cart?: { id?: string; buyerIdentity?: { email?: string; phone?: string } } };
              
              if (cartResponse.cart?.id) {
                const cartBuyerIdentity = cartResponse.cart.buyerIdentity;
                const emailMatch = !buyerIdentity.email || cartBuyerIdentity?.email === buyerIdentity.email;
                const phoneMatch = !buyerIdentity.phone || cartBuyerIdentity?.phone === buyerIdentity.phone;
                
                // רק אם העגלה תואמת את ה-buyerIdentity, נשתמש בה
                if (emailMatch && phoneMatch) {
                  targetCartId = localStorageCartId;
                  // נעדכן את ה-metafields עם העגלה הזו - שמירה מיידית
                  saveCartIdToMetafields(targetCartId, true).catch(() => {});
                } else {
                  // אם העגלה לא תואמת, נמחק אותה מ-localStorage ונשתמש בעגלה מ-metafields בלבד
                  saveCartIdToLocalStorage(null);
                }
              }
            } catch (err) {
              // אם יש שגיאה, נמחק את העגלה מ-localStorage
              saveCartIdToLocalStorage(null);
            }
          }
        }
      } else {
        targetCartId = getCartIdFromLocalStorage();
      }
      
      // אם יש ID, טוענים את הפריטים
      if (targetCartId) {
        const loadedItems = await loadCartFromShopify(targetCartId);
        
        // Safety Check: האם המשתמש שינה משהו בזמן שחיכינו לתשובה מהשרת?
        // אם כן, אנחנו זורקים את המידע מהשרת לפח כדי לא לדרוס את הפעולה של המשתמש
        if (updateVersion !== currentVersion || updateInProgress) {
          isLoadingFromShopify = false;
          set({ isLoading: false });
          return;
        }
        
        if (loadedItems && loadedItems.length > 0) {
          // תיקון כמות שחרגה מהמלאי - Shopify כבר תיקן את זה, אבל נוודא שהכמות לא חורגת
          const correctedItems = loadedItems.map(item => {
            if (item.quantityAvailable !== undefined && item.quantity > item.quantityAvailable) {
              return { ...item, quantity: item.quantityAvailable };
            }
            return item;
          });
          
          set({ 
            items: correctedItems, 
            cartId: targetCartId,
            isLoading: false 
          });
          // תמיד שומרים את ה-cartId ב-localStorage כשטוענים את העגלה
          saveCartIdToLocalStorage(targetCartId);
          // שמירה מיידית ב-metafields כדי שדפדפנים אחרים ימצאו אותה
          if (isLoggedIn) {
            saveCartIdToMetafields(targetCartId, true).catch(() => {});
          }
        } else {
          // העגלה לא נמצאה או ריקה - אבל לא נמחק פריטים קיימים!
          const currentItems = get().items;
          if (currentItems.length === 0) {
            // רק אם אין פריטים מקומיים, נאפס
            // אבל נשמור את ה-cartId כדי שנוכל לטעון את העגלה מחדש
            set({ items: [], cartId: targetCartId, isLoading: false });
            // לא נמחק את ה-cartId מ-localStorage גם אם העגלה ריקה
            // כי זה יכול להיות שהעגלה תתמלא שוב
            if (targetCartId) {
              saveCartIdToLocalStorage(targetCartId);
            }
          } else {
            // יש פריטים מקומיים - נשמור אותם ונסנכרן לעגלה חדשה
            set({ cartId: targetCartId, isLoading: false });
            // נשמור את ה-cartId כדי שנוכל לטעון את העגלה מחדש
            if (targetCartId) {
              saveCartIdToLocalStorage(targetCartId);
            }
          }
        }
      } else {
        // אין Cart ID - אבל לא נמחק פריטים קיימים!
        const currentItems = get().items;
        if (currentItems.length === 0) {
          set({ items: [], cartId: null, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      }
    } catch (err) {
      set({ isLoading: false });
    } finally {
      isLoadingFromShopify = false;
    }
  },
  
  addItem: async (item) => {
    // בדיקת מלאי לפני הוספה
    const { items } = get();
    const existingItem = items.find((i) => i.variantId === item.variantId);
    const currentQuantity = existingItem?.quantity || 0;
    const newQuantity = currentQuantity + 1;
    
    // בדיקת מלאי: רק אם יש מידע על מלאי (לא undefined ולא null)
    // quantityAvailable יכול להיות 0 (אזל במלאי) או מספר חיובי (כמה יחידות זמינות)
    const quantityAvailable = item.quantityAvailable;
    if (quantityAvailable !== undefined && quantityAvailable !== null) {
      // אם המלאי הוא 0 - חוסמים (אזל במלאי)
      if (quantityAvailable === 0) {
        return;
      }
      
      // אם הכמות החדשה גדולה מהמלאי הזמין - חוסמים
      if (newQuantity > quantityAvailable) {
        return;
      }
    }
    // אם quantityAvailable הוא undefined או null - מאפשרים הוספה (אין מידע על מלאי)
    
    // 1. סימון שהתחיל עדכון
    updateInProgress = true;
    updateVersion++; 
    set({ isUpdating: true });
    
    const { cartId: stateCartId } = get();
    
    // ניהול Cart ID - אם המשתמש מחובר, נחפש את העגלה ב-metafields לפני localStorage
    let cartId = stateCartId;
    if (!cartId) {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // אם המשתמש מחובר, נחפש את העגלה ב-metafields
          const buyerIdentity = {
            email: session.user.email || session.user.user_metadata?.email,
            phone: session.user.phone || session.user.user_metadata?.phone,
          };
          const metafieldsCartId = await findCartByBuyerIdentity(buyerIdentity);
          if (metafieldsCartId) {
            cartId = metafieldsCartId;
            saveCartIdToLocalStorage(metafieldsCartId);
          } else {
            // אם לא מצאנו ב-metafields, לא נשתמש ב-localStorage
            // כי זה יכול לגרום ליצירת עגלות שונות בדפדפנים שונים
            // במקום זה, נמתין שהעגלה תיווצר דרך loadFromShopify או syncCartToShopify
            cartId = null;
          }
        } else {
          // אם המשתמש לא מחובר, נשתמש ב-localStorage
          cartId = getCartIdFromLocalStorage();
        }
      } catch (err) {
        // אם יש שגיאה, נבדוק אם המשתמש מחובר
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // אם המשתמש מחובר, לא נשתמש ב-localStorage
            cartId = null;
          } else {
            // אם המשתמש לא מחובר, נשתמש ב-localStorage
            cartId = getCartIdFromLocalStorage();
          }
        } catch (checkErr) {
          // אם יש שגיאה בבדיקה, נשתמש ב-localStorage
          cartId = getCartIdFromLocalStorage();
        }
      }
    }
    
    // 2. עדכון אופטימי (מיידי ל-UI)
    const newItems = [...items];
    const existingItemIndex = newItems.findIndex((i) => i.variantId === item.variantId);
    
    if (existingItemIndex >= 0) {
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + 1,
        // מעדכנים את quantityAvailable אם סופק
        quantityAvailable: item.quantityAvailable !== undefined 
          ? item.quantityAvailable 
          : newItems[existingItemIndex].quantityAvailable,
      };
    } else {
      // שים לב: id הוא זמני עד שנקבל Line ID משופיפיי, אבל זה בסדר כי ה-Diffing עובד לפי variantId
      newItems.push({ ...item, quantity: 1, id: item.variantId }); 
    }
    
    set({ items: newItems });
    
    // 3. שליחה לשרת - אם המשתמש מחובר, נשלח גם buyerIdentity
    try {
      let buyerIdentity: { email?: string; phone?: string } | undefined = undefined;
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          buyerIdentity = {
            email: session.user.email || session.user.user_metadata?.email,
            phone: session.user.phone || session.user.user_metadata?.phone,
          };
        }
      } catch (err) {
        // ignore
      }
      
      const newCartId = await syncCartToShopify(newItems, cartId, buyerIdentity);
      
      // עדכון ה-Cart ID שחזר - תמיד שומרים את ה-cartId ב-localStorage וב-metafields
      const finalCartId = newCartId || cartId;
      if (finalCartId) {
        if (finalCartId !== stateCartId) {
          set({ cartId: finalCartId });
        }
        // תמיד שומרים את ה-cartId ב-localStorage, גם אם הוא לא השתנה
        saveCartIdToLocalStorage(finalCartId);
        
        // שמירה ל-Supabase אם מחובר - תמיד שומרים גם אם זה לא השתנה
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          saveCartIdToMetafields(finalCartId, true).catch(() => {});
        }
      }
      
      // טעינה מחדש מהשרת כדי לקבל את המצב האמיתי (כולל מלאי ותיקון כמות אם חרגה)
      // אבל רק אם יש cart ID - לא נדרוס את הפריטים החדשים אם אין cart ID
      updateInProgress = false; // חייבים לסיים לפני loadFromShopify
      if (newCartId || cartId) {
        // מחכים קצת כדי לוודא ש-Shopify סיים לעדכן
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const loadedItems = await loadCartFromShopify(newCartId || cartId!);
        if (loadedItems) {
          // אם Shopify תיקן את הכמות, נשתמש בערך שלו
          const updatedItem = loadedItems.find(i => i.variantId === item.variantId);
          if (updatedItem && updatedItem.quantity !== newQuantity) {
          }
          
          // תמיד נשתמש בנתונים מ-Shopify כי זה המצב האמיתי
          // אבל נוודא שיש את כל הפריטים שהוספנו
          set({ items: loadedItems });
        }
      }
    } catch (err) {
      // במקרה שגיאה, נחזיר את המצב הקודם
      set({ items });
      updateInProgress = false;
      set({ isUpdating: false });
    } finally {
      updateInProgress = false;
      set({ isUpdating: false });
    }
  },
  
  removeItem: async (variantId: string) => {
    updateInProgress = true;
    updateVersion++;
    set({ isUpdating: true });
    
    const { cartId: stateCartId, items } = get();
    // ניהול Cart ID - אם המשתמש מחובר, נחפש את העגלה ב-metafields לפני localStorage
    let cartId = stateCartId;
    if (!cartId) {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // אם המשתמש מחובר, נחפש את העגלה ב-metafields
          const buyerIdentity = {
            email: session.user.email || session.user.user_metadata?.email,
            phone: session.user.phone || session.user.user_metadata?.phone,
          };
          const metafieldsCartId = await findCartByBuyerIdentity(buyerIdentity);
          if (metafieldsCartId) {
            cartId = metafieldsCartId;
            saveCartIdToLocalStorage(metafieldsCartId);
          } else {
            // אם לא מצאנו ב-metafields, לא נשתמש ב-localStorage
            // כי זה יכול לגרום ליצירת עגלות שונות בדפדפנים שונים
            // במקום זה, נמתין שהעגלה תיווצר דרך loadFromShopify או syncCartToShopify
            cartId = null;
          }
        } else {
          // אם המשתמש לא מחובר, נשתמש ב-localStorage
          cartId = getCartIdFromLocalStorage();
        }
      } catch (err) {
        // אם יש שגיאה, נבדוק אם המשתמש מחובר
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // אם המשתמש מחובר, לא נשתמש ב-localStorage
            cartId = null;
          } else {
            // אם המשתמש לא מחובר, נשתמש ב-localStorage
            cartId = getCartIdFromLocalStorage();
          }
        } catch (checkErr) {
          // אם יש שגיאה בבדיקה, נשתמש ב-localStorage
          cartId = getCartIdFromLocalStorage();
        }
      }
    }
    
    // עדכון אופטימי
    const newItems = items.filter((i) => i.variantId !== variantId);
    
    // עדכון הסטייט המקומי
    set({ items: newItems });
    
    // טיפול במקרה שהעגלה התרוקנה לגמרי
    if (newItems.length === 0) {
      set({ cartId: null });
      saveCartIdToLocalStorage(null);
      // *** תיקון: חייבים לשלוח לשרת בקשה לרוקן/למחוק את העגלה ***
      // אנחנו שולחים מערך ריק, ה-syncCartToShopify יטפל בזה
    }
    
    try {
      // *** תיקון: קוראים ל-Sync גם כשהמערך ריק כדי לנקות בשופיפיי ***
      // אם המשתמש מחובר, נשלח גם buyerIdentity
      let buyerIdentity: { email?: string; phone?: string } | undefined = undefined;
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          buyerIdentity = {
            email: session.user.email || session.user.user_metadata?.email,
            phone: session.user.phone || session.user.user_metadata?.phone,
          };
        }
      } catch (err) {
        // ignore
      }
      
      const newCartId = await syncCartToShopify(newItems, cartId, buyerIdentity);
      
      // תמיד שומרים את ה-cartId ב-localStorage
      if (newCartId) {
        if (newCartId !== stateCartId) {
          set({ cartId: newCartId });
        }
        // תמיד שומרים את ה-cartId, גם אם העגלה ריקה
        saveCartIdToLocalStorage(newCartId);
      } else if (cartId && newItems.length > 0) {
        // אם לא קיבלנו cartId חדש אבל יש לנו אחד קיים ויש פריטים, נשמור אותו
        saveCartIdToLocalStorage(cartId);
      }
    } catch (err) {
    } finally {
      updateInProgress = false;
      set({ isUpdating: false });
    }
  },
  
  updateQuantity: async (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      return get().removeItem(variantId);
    }
    
    // בדיקת מלאי לפני עדכון - מונעים כל ניסיון להעלות מעל המקסימום
    const currentItem = get().items.find(i => i.variantId === variantId);
    if (currentItem?.quantityAvailable !== undefined) {
      // חוסמים כל ניסיון להעלות מעל המקסימום (גם אם הכמות שווה למקסימום)
      if (quantity > currentItem.quantityAvailable) {
        // לא נעדכן אם חרגנו מהמלאי - מחזירים מיד ללא עדכון
        return;
      }
    }
    
    updateInProgress = true;
    updateVersion++;
    // לא מגדירים loading/updating כדי לא להבהב את הממשק בשינוי כמות (+)
    
    const { cartId: stateCartId, items } = get();
    // ניהול Cart ID - אם המשתמש מחובר, נחפש את העגלה ב-metafields לפני localStorage
    let cartId = stateCartId;
    if (!cartId) {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // אם המשתמש מחובר, נחפש את העגלה ב-metafields
          const buyerIdentity = {
            email: session.user.email || session.user.user_metadata?.email,
            phone: session.user.phone || session.user.user_metadata?.phone,
          };
          const metafieldsCartId = await findCartByBuyerIdentity(buyerIdentity);
          if (metafieldsCartId) {
            cartId = metafieldsCartId;
            saveCartIdToLocalStorage(metafieldsCartId);
          } else {
            // אם לא מצאנו ב-metafields, לא נשתמש ב-localStorage
            // כי זה יכול לגרום ליצירת עגלות שונות בדפדפנים שונים
            // במקום זה, נמתין שהעגלה תיווצר דרך loadFromShopify או syncCartToShopify
            cartId = null;
          }
        } else {
          // אם המשתמש לא מחובר, נשתמש ב-localStorage
          cartId = getCartIdFromLocalStorage();
        }
      } catch (err) {
        // אם יש שגיאה, נבדוק אם המשתמש מחובר
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // אם המשתמש מחובר, לא נשתמש ב-localStorage
            cartId = null;
          } else {
            // אם המשתמש לא מחובר, נשתמש ב-localStorage
            cartId = getCartIdFromLocalStorage();
          }
        } catch (checkErr) {
          // אם יש שגיאה בבדיקה, נשתמש ב-localStorage
          cartId = getCartIdFromLocalStorage();
        }
      }
    }
    
    const newItems = items.map((i) =>
      i.variantId === variantId ? { ...i, quantity } : i
    );
    
    set({ items: newItems });
    
    try {
      // אם המשתמש מחובר, נשלח גם buyerIdentity
      let buyerIdentity: { email?: string; phone?: string } | undefined = undefined;
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          buyerIdentity = {
            email: session.user.email || session.user.user_metadata?.email,
            phone: session.user.phone || session.user.user_metadata?.phone,
          };
        }
      } catch (err) {
        // ignore
      }
      
      const newCartId = await syncCartToShopify(newItems, cartId, buyerIdentity);
      
      // תמיד שומרים את ה-cartId ב-localStorage
      if (newCartId) {
        if (newCartId !== stateCartId) {
          set({ cartId: newCartId });
        }
        // תמיד שומרים את ה-cartId, גם אם הוא לא השתנה
        saveCartIdToLocalStorage(newCartId);
      } else if (cartId) {
        // אם לא קיבלנו cartId חדש אבל יש לנו אחד קיים, נשמור אותו
        saveCartIdToLocalStorage(cartId);
      }
      
      // טעינה מחדש מהשרת כדי לקבל את המצב האמיתי (כולל מלאי)
      // זה מבטיח שאם Shopify תיקן משהו, נקבל את הערך הנכון
      updateInProgress = false; // חייבים לסיים לפני loadFromShopify
      if (newCartId || cartId) {
        const loadedItems = await loadCartFromShopify(newCartId || cartId!);
        if (loadedItems) {
          // בדיקה נוספת: אם Shopify תיקן את הכמות, נשתמש בערך שלו
          const updatedItem = loadedItems.find(i => i.variantId === variantId);
          if (updatedItem && updatedItem.quantity !== quantity) {
          }
          set({ items: loadedItems, cartId: newCartId || cartId });
          // תמיד שומרים את ה-cartId ב-localStorage כשטוענים את העגלה
          if (newCartId || cartId) {
            saveCartIdToLocalStorage(newCartId || cartId);
          }
        }
      }
    } catch (err) {
      // במקרה שגיאה, נחזיר את המצב הקודם
      set({ items });
      updateInProgress = false;
    }
  },
  
  clearCart: () => {
    // עדכון מקומי
    set({ items: [], cartId: null });
    saveCartIdToLocalStorage(null);
    
    // אם רוצים לנקות גם בשרת (אופציונלי אך מומלץ)
    const { cartId } = get();
    if (cartId) {
      syncCartToShopify([], cartId).catch(() => {});
    }
  },
  
  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0
    );
  },
  
  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
