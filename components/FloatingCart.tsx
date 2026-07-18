'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/lib/LanguageContext';

/**
 * TaliaSol-style floating cart bubble — bottom start corner
 * (chat widget owns the end corner). Only visible when the cart has items.
 */
export default function FloatingCart() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const loadFromShopify = useCartStore((state) => state.loadFromShopify);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    loadFromShopify().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || itemCount === 0 || pathname === '/cart') return null;

  return (
    <Link
      href="/cart"
      className="fixed start-5 bottom-5 z-[9998] flex items-center justify-center w-14 h-14 rounded-full bg-white text-black shadow-[0_6px_24px_rgba(0,0,0,0.18)] border border-black/5 hover:scale-105 transition-transform duration-200 animate-fade-in"
      aria-label={`${t('header.cart')} (${itemCount})`}
    >
      <ShoppingBag size={20} strokeWidth={1.5} aria-hidden="true" />
      <span
        className="absolute -top-1 -end-1 bg-[#e11d2e] text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-medium"
        aria-hidden="true"
      >
        {itemCount}
      </span>
    </Link>
  );
}
