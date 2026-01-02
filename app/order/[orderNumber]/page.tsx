'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface OrderLineItem {
  id: string;
  title: string;
  quantity: number;
  image: { url: string; altText: string | null } | null;
  originalUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  discountedTotalSet: { shopMoney: { amount: string; currencyCode: string } };
  variant: {
    id: string;
    title: string;
    image: { url: string; altText: string | null } | null;
  } | null;
}

interface Order {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  subtotalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  totalShippingPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  totalTaxSet: { shopMoney: { amount: string; currencyCode: string } };
  totalDiscountsSet: { shopMoney: { amount: string; currencyCode: string } };
  lineItems: {
    edges: Array<{ node: OrderLineItem }>;
  };
  shippingAddress: {
    firstName: string | null;
    lastName: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
    phone: string | null;
  } | null;
  billingAddress: {
    firstName: string | null;
    lastName: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
    phone: string | null;
  } | null;
}

export default function OrderPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/order/${orderNumber}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'שגיאה בטעינת ההזמנה');
        }

        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת ההזמנה');
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const formatPrice = (amount: string) => {
    return parseFloat(amount).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-light text-gray-600">טוען הזמנה...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-light mb-4 text-[#1a1a1a]">הזמנה לא נמצאה</h1>
          <p className="text-gray-600 mb-8">{error || 'ההזמנה לא נמצאה במערכת'}</p>
          <Link
            href="/"
            className="inline-block bg-[#1a1a1a] text-white px-8 py-3 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury"
          >
            חזרה לעמוד הבית
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcfb] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#1a1a1a] transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לעמוד הבית
          </Link>
          <h1 className="text-4xl md:text-5xl font-light luxury-font text-[#1a1a1a] mb-2">
            הזמנה #{order.name}
          </h1>
          <p className="text-sm text-gray-600">
            תאריך הזמנה: {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Order Status */}
        <div className="bg-white border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
                סטטוס תשלום
              </span>
              <span className="text-sm font-light text-[#1a1a1a]">
                {order.displayFinancialStatus === 'PAID' ? 'שולם' : order.displayFinancialStatus}
              </span>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
                סטטוס משלוח
              </span>
              <span className="text-sm font-light text-[#1a1a1a]">
                {order.displayFulfillmentStatus === 'FULFILLED' ? 'נשלח' : 
                 order.displayFulfillmentStatus === 'UNFULFILLED' ? 'טרם נשלח' : 
                 order.displayFulfillmentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-light luxury-font text-[#1a1a1a]">
              פריטים בהזמנה
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {order.lineItems.edges.map(({ node: item }) => (
              <div key={item.id} className="p-6 flex gap-6">
                {item.variant?.image && (
                  <div className="relative w-24 h-32 flex-shrink-0 bg-gray-100">
                    <Image
                      src={item.variant.image.url}
                      alt={item.variant.image.altText || item.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-base font-light text-[#1a1a1a] mb-1">
                    {item.title}
                  </h3>
                  {item.variant?.title && item.variant.title !== 'Default Title' && (
                    <p className="text-sm text-gray-600 mb-2">{item.variant.title}</p>
                  )}
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-sm text-gray-600">כמות: {item.quantity}</span>
                    <span className="text-base font-light text-[#1a1a1a]">
                      ₪{formatPrice(item.discountedTotalSet.shopMoney.amount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-light luxury-font text-[#1a1a1a] mb-6">
            סיכום הזמנה
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">סה&quot;כ מוצרים</span>
              <span className="text-[#1a1a1a]">
                ₪{formatPrice(order.subtotalPriceSet.shopMoney.amount)}
              </span>
            </div>
            {parseFloat(order.totalShippingPriceSet.shopMoney.amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">משלוח</span>
                <span className="text-[#1a1a1a]">
                  ₪{formatPrice(order.totalShippingPriceSet.shopMoney.amount)}
                </span>
              </div>
            )}
            {parseFloat(order.totalDiscountsSet.shopMoney.amount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>הנחה</span>
                <span>
                  -₪{formatPrice(order.totalDiscountsSet.shopMoney.amount)}
                </span>
              </div>
            )}
            {parseFloat(order.totalTaxSet.shopMoney.amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">מע״מ</span>
                <span className="text-[#1a1a1a]">
                  ₪{formatPrice(order.totalTaxSet.shopMoney.amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg pt-4 border-t border-gray-200">
              <span className="font-light text-[#1a1a1a]">סה״כ</span>
              <span className="font-light text-[#1a1a1a]">
                ₪{formatPrice(order.totalPriceSet.shopMoney.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Addresses */}
        {(order.shippingAddress || order.billingAddress) && (
          <div className="grid md:grid-cols-2 gap-8">
            {order.shippingAddress && (
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-lg font-light luxury-font text-[#1a1a1a] mb-4">
                  כתובת משלוח
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {order.shippingAddress.firstName && order.shippingAddress.lastName && (
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  )}
                  {order.shippingAddress.address1 && (
                    <p>{order.shippingAddress.address1}</p>
                  )}
                  {order.shippingAddress.address2 && (
                    <p>{order.shippingAddress.address2}</p>
                  )}
                  {order.shippingAddress.city && (
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.zip && `, ${order.shippingAddress.zip}`}
                    </p>
                  )}
                  {order.shippingAddress.province && (
                    <p>{order.shippingAddress.province}</p>
                  )}
                  {order.shippingAddress.country && (
                    <p>{order.shippingAddress.country}</p>
                  )}
                  {order.shippingAddress.phone && (
                    <p>{order.shippingAddress.phone}</p>
                  )}
                </div>
              </div>
            )}
            {order.billingAddress && (
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-lg font-light luxury-font text-[#1a1a1a] mb-4">
                  כתובת חיוב
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {order.billingAddress.firstName && order.billingAddress.lastName && (
                    <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                  )}
                  {order.billingAddress.address1 && (
                    <p>{order.billingAddress.address1}</p>
                  )}
                  {order.billingAddress.address2 && (
                    <p>{order.billingAddress.address2}</p>
                  )}
                  {order.billingAddress.city && (
                    <p>
                      {order.billingAddress.city}
                      {order.billingAddress.zip && `, ${order.billingAddress.zip}`}
                    </p>
                  )}
                  {order.billingAddress.province && (
                    <p>{order.billingAddress.province}</p>
                  )}
                  {order.billingAddress.country && (
                    <p>{order.billingAddress.country}</p>
                  )}
                  {order.billingAddress.phone && (
                    <p>{order.billingAddress.phone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

