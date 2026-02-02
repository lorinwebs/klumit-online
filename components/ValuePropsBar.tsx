'use client';

import { Phone, Truck, Store, Award, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ValuePropsBar() {
  const props = [
    {
      icon: Phone,
      title: 'שירות לקוחות',
      subtitle: '054-990-3139 (וואטסאפ)',
      link: 'https://wa.me/972549903139',
      external: true,
    },
    {
      icon: Truck,
      title: 'משלוח חינם',
      subtitle: 'בהזמנות מעל ₪500',
    },
    {
      icon: Store,
      title: 'חנות פיזית',
      subtitle: 'גאולה 45, תל אביב',
    },
    {
      icon: Award,
      title: 'עור איטלקי',
      subtitle: 'איכות פרימיום מ-1984',
    },
    {
      icon: Shield,
      title: 'תשלום מאובטח',
      subtitle: '100% הגנה על הפרטים',
    },
  ];

  return (
    <div className="sticky top-[136px] md:top-[120px] z-30 bg-[#f8f8f8] border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Desktop: Horizontal */}
        <div className="hidden md:grid md:grid-cols-5 divide-x divide-gray-200">
          {props.map((prop, index) => {
            const Icon = prop.icon;
            const content = (
              <div className="flex flex-col items-center justify-center gap-2 py-3 px-2 hover:bg-white/50 transition-colors">
                <Icon size={18} className="text-[#1a1a1a]" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-[10px] font-light uppercase tracking-wider text-[#1a1a1a] leading-tight">
                    {prop.title}
                  </p>
                  <p className="text-[9px] font-light text-gray-600 mt-0.5 leading-tight">
                    {prop.subtitle}
                  </p>
                </div>
              </div>
            );

            if (prop.link && prop.external) {
              return (
                <Link
                  key={index}
                  href={prop.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {content}
                </Link>
              );
            }

            return <div key={index}>{content}</div>;
          })}
        </div>

        {/* Mobile: Scrollable */}
        <div className="md:hidden flex overflow-x-auto scrollbar-hide">
          {props.map((prop, index) => {
            const Icon = prop.icon;
            const content = (
              <div className="flex-shrink-0 flex items-center gap-2 py-2.5 px-3 border-l border-gray-200 last:border-l-0 min-w-[160px]">
                <Icon size={16} className="text-[#1a1a1a]" strokeWidth={1.5} />
                <div>
                  <p className="text-[9px] font-light uppercase tracking-wider text-[#1a1a1a] leading-tight">
                    {prop.title}
                  </p>
                  <p className="text-[8px] font-light text-gray-600 mt-0.5 leading-tight">
                    {prop.subtitle}
                  </p>
                </div>
              </div>
            );

            if (prop.link && prop.external) {
              return (
                <Link
                  key={index}
                  href={prop.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {content}
                </Link>
              );
            }

            return <div key={index}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
