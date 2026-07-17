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
    <div className="sticky top-[110px] md:top-[120px] z-30 bg-cream border-y border-black/10">
      <div className="max-w-7xl mx-auto">
        {/* Desktop */}
        <div className="hidden md:grid md:grid-cols-5">
          {props.map((prop, index) => {
            const Icon = prop.icon;
            const content = (
              <div className="group flex flex-col items-center justify-center gap-2.5 py-4 px-3 transition-colors duration-300 hover:bg-black/[0.03] relative">
                <Icon size={20} className="text-black" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-black leading-tight">
                    {prop.title}
                  </p>
                  <p className="text-[10px] font-light text-black/50 mt-0.5 leading-tight">
                    {prop.subtitle}
                  </p>
                </div>
                {index < props.length - 1 && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-6 bg-black/10" />
                )}
              </div>
            );

            if (prop.link && prop.external) {
              return (
                <Link key={index} href={prop.link} target="_blank" rel="noopener noreferrer" className="block">
                  {content}
                </Link>
              );
            }
            return <div key={index}>{content}</div>;
          })}
        </div>

        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {props.map((prop, index) => {
              const Icon = prop.icon;
              const content = (
                <div className="flex-shrink-0 flex items-center gap-2 py-3 px-3 border-l border-black/10 first:border-l-0 w-[120px]">
                  <Icon size={14} className="text-black flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-medium tracking-wide uppercase text-black leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis">
                      {prop.title}
                    </p>
                    <p className="text-[8px] font-light text-black/50 mt-0.5 leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis">
                      {prop.subtitle}
                    </p>
                  </div>
                </div>
              );

              if (prop.link && prop.external) {
                return (
                  <Link key={index} href={prop.link} target="_blank" rel="noopener noreferrer" className="block">
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
