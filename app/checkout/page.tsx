'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { shopifyClient, CREATE_CART_MUTATION, ADD_TO_CART_MUTATION } from '@/lib/shopify';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CheckoutPage() {
  const { items, cartId, setCartId, clearCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createGrowPaymentLink() {
      if (items.length === 0) {
        window.location.href = '/cart';
        return;
      }

      try {
        setLoading(true);
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

        // Get cart total
        if (currentCartId) {
          const cartResponse = await shopifyClient.request(
            `query getCart($id: ID!) {
              cart(id: $id) {
                id
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                }
                buyerIdentity {
                  email
                  phone
                }
              }
            }`,
            { id: currentCartId }
          ) as { 
            cart?: { 
              id: string;
              cost?: { totalAmount?: { amount: string; currencyCode: string } };
              buyerIdentity?: { email?: string; phone?: string };
            } 
          };

          if (cartResponse.cart) {
            const totalAmount = parseFloat(cartResponse.cart.cost?.totalAmount?.amount || '0');
            const orderReference = `cart-${currentCartId.replace('gid://shopify/Cart/', '')}`;
            
            // Create Payment Link via API
            const paymentResponse = await fetch('/api/grow/create-payment-link', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: totalAmount,
                reference: orderReference,
                description: `תשלום עבור עגלה ${orderReference}`,
                customerEmail: cartResponse.cart.buyerIdentity?.email,
                customerPhone: cartResponse.cart.buyerIdentity?.phone,
                successUrl: `${window.location.origin}/payment/success?reference=${orderReference}`,
                cancelUrl: `${window.location.origin}/payment/cancel?reference=${orderReference}`,
              }),
            });

            if (!paymentResponse.ok) {
              const errorData = await paymentResponse.json().catch(() => ({ error: 'Unknown error' }));
              const errorMessage = errorData.details || errorData.error || `שגיאה ${paymentResponse.status}`;
              console.error('Payment link creation failed:', errorData);
              throw new Error(errorMessage);
            }

            const responseData = await paymentResponse.json();
            const { paymentLink } = responseData;
            
            console.log('Payment link response:', { 
              hasLink: !!paymentLink,
              paymentId: responseData.paymentId,
            });
            
            // Redirect to Grow payment page
            if (paymentLink) {
              window.location.href = paymentLink;
            } else {
              console.error('No payment link in response:', responseData);
              throw new Error('לא התקבל קישור תשלום מהשרת');
            }
          }
        }
      } catch (err) {
        console.error('Error creating payment link:', err);
        setError(err instanceof Error ? err.message : 'שגיאה ביצירת קישור תשלום. נסה שוב מאוחר יותר.');
        setLoading(false);
      }
    }

    createGrowPaymentLink();
  }, [items, cartId, setCartId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-serif font-bold mb-4 text-red-600">שגיאה</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.href = '/cart'}
              className="bg-[#1a1a1a] text-white px-6 py-3 rounded hover:bg-[#2a2a2a] transition-colors"
            >
              חזרה לעגלה
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-4">מעבר לתשלום</h1>
          <p className="text-gray-600 mb-8">מעבירים אותך לדף התשלום המאובטח...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a] mx-auto"></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
