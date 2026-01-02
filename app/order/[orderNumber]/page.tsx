'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

  const orderNumberDisplay = order.name.startsWith('#') ? order.name : `#${order.name}`;
  const fulfillmentStatus = order.displayFulfillmentStatus === 'FULFILLED' 
    ? 'נשלח' 
    : order.displayFulfillmentStatus === 'UNFULFILLED' 
    ? 'טרם נשלח' 
    : order.displayFulfillmentStatus;

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
            הזמנה {orderNumberDisplay}
          </h1>
          <p className="text-sm text-gray-600">
            תאריך הזמנה: {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Order Status - Columns */}
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500 block mb-2">
                סטטוס משלוח
              </span>
              <span className="text-lg font-light text-[#1a1a1a]">
                {fulfillmentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items - Product Names Only */}
        <div className="bg-white border border-gray-200 p-8">
          <h2 className="text-2xl font-light luxury-font text-[#1a1a1a] mb-6">
            פריטים בהזמנה
          </h2>
          <div className="space-y-4">
            {order.lineItems.edges.map(({ node: item }) => (
              <div key={item.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <h3 className="text-base font-light text-[#1a1a1a]">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

