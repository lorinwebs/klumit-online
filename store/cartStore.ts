import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  variantId: string;
  title: string;
  price: string;
  currencyCode: string;
  quantity: number;
  image?: string;
  available: boolean;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setCartId: (id: string) => void;
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
      },
      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
      },
      clearCart: () => {
        set({ items: [], cartId: null });
      },
      setCartId: (id) => {
        set({ cartId: id });
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
      name: 'klomit-cart',
    }
  )
);


