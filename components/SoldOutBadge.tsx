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
      className={`absolute top-2 right-2 z-20 rounded-full bg-white px-3.5 py-1 text-[12px] md:text-[13px] font-normal text-black leading-none ${className}`}
      role="status"
      aria-label={label}
    >
      {label}
    </div>
  );
}
