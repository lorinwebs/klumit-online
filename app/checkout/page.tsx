'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { shopifyClient, CREATE_CART_MUTATION, ADD_TO_CART_MUTATION } from '@/lib/shopify';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CheckoutPage() {
  const { items, cartId, setCartId, clearCart } = useCartStore();

  useEffect(() => {
    async function createShopifyCart() {
      if (items.length === 0) {
        window.location.href = '/cart';
        return;
      }

      try {
        let currentCartId = cartId;

        // Create cart if doesn't exist
        if (!currentCartId) {
          const firstItem = items[0];
          const createCartResponse = await shopifyClient.request(CREATE_CART_MUTATION, {
            cartInput: {
              lines: [
                {
                  merchandiseId: firstItem.variantId,
                  quantity: firstItem.quantity,
                },
              ],
            },
          }) as { cartCreate?: { cart?: { id?: string } } };

          currentCartId = createCartResponse.cartCreate?.cart?.id || null;
          if (currentCartId) {
            setCartId(currentCartId);
          }
        }

        // Add remaining items if cart was just created
        if (currentCartId && items.length > 1) {
          const remainingItems = items.slice(1);
          await shopifyClient.request(ADD_TO_CART_MUTATION, {
            cartId: currentCartId,
            lines: remainingItems.map((item) => ({
              merchandiseId: item.variantId,
              quantity: item.quantity,
            })),
          });
        }

        // Get updated cart with checkout URL
        if (currentCartId) {
          const cartResponse = await shopifyClient.request(
            `query getCart($id: ID!) {
              cart(id: $id) {
                checkoutUrl
              }
            }`,
            { id: currentCartId }
          ) as { cart?: { checkoutUrl?: string } };

          if (cartResponse.cart?.checkoutUrl) {
            window.location.href = cartResponse.cart.checkoutUrl;
          }
        }
      } catch (error) {
        console.error('Error creating cart:', error);
        alert('שגיאה ביצירת העגלה. נסה שוב מאוחר יותר.');
      }
    }

    createShopifyCart();
  }, [items, cartId, setCartId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-4">מעבר לתשלום</h1>
          <p className="text-gray-600 mb-8">מעבירים אותך לדף התשלום של Shopify...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


