'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface Brand {
  name: string;
  displayName: string;
  image: string;
  hoverImage: string;
  productCount: number;
}

interface BrandShowcaseProps {
  title: string;
  subtitle?: string;
  category: 'bags' | 'belts' | 'wallets';
}

function BrandCard({ brand, index, category }: { brand: Brand; index: number; category: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex-shrink-0 w-[35vw] md:w-auto"
    >
      <Link
        href={`/products?tab=${category}&vendor=${encodeURIComponent(brand.name)}`}
        className="group block"
      >
        <div className="relative aspect-square overflow-hidden mb-2 bg-gray-50">
          <Image
            src={brand.image}
            alt={brand.displayName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 35vw, 25vw"
            unoptimized
            priority={index < 4}
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
        
        {/* Brand Name */}
        <div className="text-center">
          <h3 className="text-sm md:text-base font-light tracking-[0.15em] uppercase text-[#1a1a1a] group-hover:text-[#c9a962] transition-colors duration-300">
            {brand.displayName}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BrandShowcase({ title, subtitle, category }: BrandShowcaseProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`/api/brands?category=${category}`);
        if (!response.ok) throw new Error('Failed to fetch brands');
        const data = await response.json();
        setBrands(data.brands || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [category]);

  if (loading) {
    return (
      <section className="py-6 md:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              {/* Mobile: Horizontal scroll skeleton */}
              <div className="md:hidden flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[35vw] aspect-square bg-gray-200 rounded"></div>
                ))}
              </div>
              {/* Desktop: Grid skeleton */}
              <div className="hidden md:grid md:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="py-6 md:py-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Title Section */}
        {title && (
          <div className="flex items-center justify-between px-4 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-light tracking-wide text-[#1a1a1a]">
              {title}
            </h2>
            {subtitle && (
              <h3 className="text-xl md:text-2xl font-light tracking-[0.15em] uppercase text-[#1a1a1a]/60">
                {subtitle}
              </h3>
            )}
          </div>
        )}

        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide pb-2 px-4" dir="ltr">
          <div className="flex gap-3">
            {brands.map((brand, index) => (
              <BrandCard 
                key={brand.name} 
                brand={brand} 
                index={index} 
                category={category}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-3 md:gap-4 px-4">
          {brands.map((brand, index) => (
            <BrandCard 
              key={brand.name} 
              brand={brand} 
              index={index} 
              category={category}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
