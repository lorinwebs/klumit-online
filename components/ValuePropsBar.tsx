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

        {/* Mobile: Scrollable - Horizontal scroll without overlap */}
        <div className="md:hidden overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {props.map((prop, index) => {
              const Icon = prop.icon;
              const content = (
                <div className="flex-shrink-0 flex items-center gap-1 py-2 px-2 border-l border-gray-200 first:border-l-0 w-[100px]">
                  <Icon size={11} className="text-[#1a1a1a] flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[7px] font-light uppercase tracking-wide text-[#1a1a1a] leading-[1.2] whitespace-nowrap overflow-hidden text-ellipsis">
                      {prop.title}
                    </p>
                    <p className="text-[6px] font-light text-gray-600 mt-0.5 leading-[1.2] whitespace-nowrap overflow-hidden text-ellipsis">
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
    </div>
  );
}
