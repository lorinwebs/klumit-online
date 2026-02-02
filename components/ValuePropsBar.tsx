'use client';

import { Phone, Truck, Store, Award, Shield } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function ValuePropsBar() {
  const { t } = useLanguage();
  
  const props = [
    {
      icon: Phone,
      title: t('value.customerService'),
      subtitle: t('value.customerServiceDetail'),
      link: 'https://wa.me/972549903139',
      external: true,
    },
    {
      icon: Truck,
      title: t('value.freeShipping'),
      subtitle: t('value.freeShippingDetail'),
    },
    {
      icon: Store,
      title: t('value.physicalStore'),
      subtitle: t('value.physicalStoreDetail'),
    },
    {
      icon: Award,
      title: t('value.italianLeather'),
      subtitle: t('value.italianLeatherDetail'),
    },
    {
      icon: Shield,
      title: t('value.securePayment'),
      subtitle: t('value.securePaymentDetail'),
    },
  ];

  return (
    <div className="sticky top-[110px] md:top-[120px] z-30 bg-[#f8f8f8] border-b border-gray-200">
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
        <div className="md:hidden flex overflow-x-auto scrollbar-hide gap-0">
          {props.map((prop, index) => {
            const Icon = prop.icon;
            const content = (
              <div className="flex-shrink-0 flex items-center gap-1.5 py-2 px-2.5 border-l border-gray-200 last:border-l-0 min-w-[140px] max-w-[180px]">
                <Icon size={14} className="text-[#1a1a1a] flex-shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] font-light uppercase tracking-wide text-[#1a1a1a] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    {prop.title}
                  </p>
                  <p className="text-[7px] font-light text-gray-600 mt-0.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
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
