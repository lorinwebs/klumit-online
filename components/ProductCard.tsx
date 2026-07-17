'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { motion } from 'framer-motion';
import Toast from './Toast';
import { trackAddToCart } from '@/lib/analytics';
import { useLanguage } from '@/lib/LanguageContext';
import SoldOutBadge from '@/components/SoldOutBadge';

interface ProductCardProps {
  id: string;
  title: string;
  handle: string;
  price: string;
  currencyCode: string;
  image?: string;
  variantId: string;
  available: boolean;
  quantityAvailable?: number;
  onSale?: boolean;
  originalPrice?: string;
}

export default function ProductCard({
  title,
  handle,
  price,
  currencyCode,
  image,
  variantId,
  available,
  quantityAvailable,
  onSale = false,
  originalPrice,
}: ProductCardProps) {
  const { t } = useLanguage();
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const [showToast, setShowToast] = useState(false);

  const existingItem = items.find((i) => i.variantId === variantId);
  const currentQuantity = existingItem?.quantity || 0;
  const isMaxStock = quantityAvailable !== undefined &&
                     currentQuantity >= quantityAvailable;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (available && !isMaxStock) {
      await addItem({
        id: variantId,
        variantId,
        title,
        price,
        currencyCode,
        image,
        available,
        quantityAvailable,
        handle,
      });

      trackAddToCart({
        id: variantId,
        name: title,
        price: parseFloat(price),
        currency: currencyCode,
        quantity: 1,
      });

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  };

  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    return Math.round(num).toLocaleString('he-IL');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="group"
    >
      <Link href={`/products/${handle}`}>
        <div className="overflow-hidden">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f5] mb-3">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/30 text-sm font-light">
                אין תמונה
              </div>
            )}
            {onSale && (
              <div
                className={`absolute top-3 bg-black text-white px-2.5 py-1 text-[10px] tracking-[0.18em] uppercase font-light ${available ? 'right-3' : 'left-3'}`}
                aria-label="מוצר במבצע"
              >
                מבצע
              </div>
            )}
            {!available && <SoldOutBadge className="top-3 right-3" />}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/98 border-t border-black/10">
              <button
                onClick={handleAddToCart}
                disabled={!available || isMaxStock}
                className="w-full py-2 text-[10px] tracking-[0.18em] uppercase font-light hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isMaxStock ? `${t('products.outOfStock')} (${quantityAvailable} ${t('products.units')})` : `${t('products.addToCart')} ${title}`}
              >
                {isMaxStock ? t('products.outOfStock') : t('products.addToCartShort')}
              </button>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-base font-light font-display text-black leading-tight">
              {title}
            </h3>
            <div className="flex items-center gap-2 justify-center">
              {onSale && originalPrice && (
                <span className="text-black/35 line-through text-xs font-light">
                  ₪{formatPrice(originalPrice)}
                </span>
              )}
              <p className="text-sm font-light text-black">
                ₪{formatPrice(price)}
              </p>
            </div>
          </div>
        </div>
      </Link>
      <Toast show={showToast} message="נוסף לעגלה" showViewCart={true} />
    </motion.div>
  );
}
