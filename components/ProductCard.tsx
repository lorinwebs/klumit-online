'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { motion } from 'framer-motion';
import Toast from './Toast';

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
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const [showToast, setShowToast] = useState(false);

  // בדיקה אם המוצר הגיע למקסימום במלאי
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
      
      // Show toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  };

  // פורמט מחיר פרימיום
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
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-light">
                אין תמונה
              </div>
            )}
            {onSale && (
              <div className="absolute top-3 right-3 bg-[#1a1a1a]/90 text-white px-2 py-1 text-[10px] tracking-luxury uppercase font-light" aria-label="מוצר במבצע">
                מבצע
              </div>
            )}
            {!available && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center" aria-label="מוצר אזל מהמלאי">
                <span className="text-gray-600 font-light tracking-luxury uppercase text-xs">אזל מהמלאי</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/98 border-t border-gray-100">
              <button
                onClick={handleAddToCart}
                disabled={!available || isMaxStock}
                className="w-full py-2 text-[10px] tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isMaxStock ? `מקסימום ${quantityAvailable} יחידות במלאי` : `הוסף ${title} לסל הקניות`}
              >
                {isMaxStock ? 'מקסימום במלאי' : 'הוספה לסל'}
              </button>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <h3 className="text-base font-light luxury-font text-[#1a1a1a] leading-tight">
              {title}
            </h3>
            <div className="flex items-center gap-2 justify-end">
              {onSale && originalPrice && (
                <span className="text-gray-400 line-through text-xs font-light">
                  ₪{formatPrice(originalPrice)}
                </span>
              )}
              <p className="text-sm font-light text-[#1a1a1a]">
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

