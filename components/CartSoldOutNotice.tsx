'use client';

import { useEffect, useMemo, useState } from 'react';
import Toast from '@/components/Toast';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/lib/LanguageContext';

/**
 * When returning visitors still have sold-out bags in a previous-session cart,
 * loadFromShopify removes them and this toast explains + offers WhatsApp Italy order.
 */
export default function CartSoldOutNotice() {
  const { t, language } = useLanguage();
  const notice = useCartStore((state) => state.soldOutRemovalNotice);
  const clearSoldOutRemovalNotice = useCartStore((state) => state.clearSoldOutRemovalNotice);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!notice || notice.titles.length === 0) {
      setShow(false);
      return;
    }

    setShow(true);
    const timer = window.setTimeout(() => {
      setShow(false);
      clearSoldOutRemovalNotice();
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [notice, clearSoldOutRemovalNotice]);

  const whatsappHref = useMemo(() => {
    if (!notice?.titles.length) return undefined;
    const list = notice.titles.join(', ');
    const msg =
      language === 'he'
        ? `היי, פריטים שאזלו מהמלאי — אשמח להזמין מאיטליה: ${list}`
        : language === 'ru'
          ? `Здравствуйте, товары закончились — хочу заказать из Италии: ${list}`
          : `Hi — sold-out items — I'd like to order from Italy: ${list}`;
    return `https://wa.me/972549903139?text=${encodeURIComponent(msg)}`;
  }, [language, notice]);

  return (
    <Toast
      show={show}
      message={t('products.cartSoldOutRemoved')}
      showViewCart={false}
      type="warning"
      actionHref={whatsappHref}
      actionLabel={t('products.outOfStockWhatsAppCta')}
    />
  );
}
