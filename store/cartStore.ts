import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncCartToShopify, loadCartFromShopify, findCartByBuyerIdentity, saveCartIdToMetafields } from '@/lib/shopify-cart';

// Debounce timer ל-syncToShopify
let syncTimeout: NodeJS.Timeout | null = null;

export interface CartItem {
  id: string;
  variantId: string;
  title: string;
  price: string;
  currencyCode: string;
  quantity: number;
  image?: string;
  available: boolean;
  color?: string;
  variantTitle?: string;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setCartId: (id: string) => void;
  syncToShopify: () => Promise<void>;
  loadFromShopify: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      addItem: (item) => {
        const existingItem = get().items.find((i) => i.variantId === item.variantId);
        if (existingItem) {
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] });
        }
        // סנכרן ל-Shopify ברקע עם debounce
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          get().syncToShopify().catch(err => console.warn('Failed to sync cart to Shopify:', err));
        }, 500);
      },
      removeItem: (variantId: string) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
        // סנכרן ל-Shopify ברקע עם debounce
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          get().syncToShopify().catch(err => console.warn('Failed to sync cart to Shopify:', err));
        }, 500);
      },
      updateQuantity: (variantId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
        // סנכרן ל-Shopify ברקע עם debounce
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          get().syncToShopify().catch(err => console.warn('Failed to sync cart to Shopify:', err));
        }, 500);
      },
      clearCart: () => {
        set({ items: [], cartId: null });
      },
      setCartId: (id: string) => {
        set({ cartId: id });
      },
      syncToShopify: async () => {
        const { items, cartId } = get();
        if (items.length === 0) {
          console.log('⚠️ No items to sync');
          return;
        }
        
        console.log('🔄 Starting sync to Shopify:', { itemsCount: items.length, currentCartId: cartId });
        
        try {
          const newCartId = await syncCartToShopify(items, cartId);
          console.log('✅ Sync completed:', { newCartId, oldCartId: cartId });
          
          if (newCartId) {
            if (newCartId !== cartId) {
              // עדכן את ה-cart ID רק אם הוא השתנה
              console.log('📝 Updating cart ID in localStorage:', { old: cartId, new: newCartId });
              set({ cartId: newCartId });
            } else {
              console.log('✅ Cart ID unchanged:', newCartId);
            }
            // תמיד שמור cart ID ב-metafields (גם אם זה cart קיים)
            saveCartIdToMetafields(newCartId).catch((err: any) => 
              console.warn('Failed to save cart ID to metafields:', err)
            );
          } else {
            console.warn('⚠️ syncCartToShopify returned null - no cart ID');
          }
        } catch (error) {
          console.error('❌ Error syncing cart to Shopify:', error);
        }
      },
      loadFromShopify: async () => {
        const { cartId, items } = get();
        
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user) {
            return; // אין משתמש מחובר, אל תעשה כלום
          }

          const buyerIdentity = {
            email: session.user.email || session.user.user_metadata?.email,
            phone: session.user.phone || session.user.user_metadata?.phone,
          };

          // תמיד נסה למצוא cart לפי buyerIdentity (מ-metafields)
          const foundCartId = await findCartByBuyerIdentity(buyerIdentity);
          
          if (foundCartId) {
            // אם מצאנו cart ID שונה מה-localStorage, טען את העגלה מ-Shopify
            if (foundCartId !== cartId) {
              console.log('Found different cart ID, loading from Shopify:', foundCartId);
              const loadedItems = await loadCartFromShopify(foundCartId);
              if (loadedItems && loadedItems.length > 0) {
                set({ items: loadedItems, cartId: foundCartId });
                return;
              }
            } else if (cartId && items.length === 0) {
              // אם יש cart ID אבל אין פריטים, טען מ-Shopify
              const loadedItems = await loadCartFromShopify(cartId);
              if (loadedItems && loadedItems.length > 0) {
                set({ items: loadedItems });
                return;
              }
            } else if (items.length > 0 && foundCartId === cartId) {
              // אם יש פריטים ב-localStorage ו-cart ID תואם, סנכרן ל-Shopify
              console.log('Cart has items and cart ID matches, syncing to Shopify');
              await get().syncToShopify();
              return;
            }
          } else if (items.length > 0) {
            // אם יש פריטים אבל לא מצאנו cart ID, סנכרן ל-Shopify
            console.log('Cart has items but no cart ID found, syncing to Shopify');
            await get().syncToShopify();
            return;
          }
        } catch (err) {
          console.warn('Could not load cart from Shopify:', err);
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
    }),
    {
      name: 'klumit-cart',
    }
  )
);
