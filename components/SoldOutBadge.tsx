'use client';

import { useLanguage } from '@/lib/LanguageContext';

type SoldOutBadgeProps = {
  className?: string;
};

export default function SoldOutBadge({ className = '' }: SoldOutBadgeProps) {
  const { t } = useLanguage();
  const label = t('products.soldOut');
  return (
    <div
      className={`absolute top-2 right-2 z-20 bg-black px-3 py-1 text-[11px] md:text-[12px] font-light tracking-[0.12em] uppercase text-white leading-none ${className}`}
      role="status"
      aria-label={label}
    >
      {label}
    </div>
  );
}
