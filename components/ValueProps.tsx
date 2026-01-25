'use client';

import { Truck, Shield, Award, HeadphonesIcon, MapPin } from 'lucide-react';
import Link from 'next/link';

const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const props = [
  {
    icon: HeadphonesIcon,
    title: 'שירות לקוחות',
    subtitle: '054-990-3139 (וואטסאפ)',
    whatsappLink: 'https://wa.me/972549903139',
  },
  {
    icon: Truck,
    title: 'משלוח חינם',
    subtitle: 'בהזמנות מעל ₪500',
  },
  {
    icon: MapPin,
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

export default function ValueProps() {
  return (
    <section className="bg-white text-[#1a1a1a] py-8 md:py-12 border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        {/* Mobile - Grid Layout */}
        <div className="md:hidden grid grid-cols-2 gap-6">
          {props.map((prop, index) => {
            const content = (
              <div className="flex flex-col items-center text-center gap-2">
                {prop.whatsappLink ? (
                  <WhatsAppIcon size={18} />
                ) : (
                  <prop.icon size={18} className="text-[#1a1a1a] opacity-40" strokeWidth={1} />
                )}
                <div className="space-y-0.5">
                  <p className={`text-[10px] font-light tracking-[0.15em] uppercase ${prop.whatsappLink ? 'text-[#25D366]' : 'text-[#1a1a1a] opacity-80'}`}>{prop.title}</p>
                  <p className={`text-[9px] font-light tracking-[0.1em] ${prop.whatsappLink ? 'text-[#25D366] opacity-80' : 'text-[#1a1a1a] opacity-50'}`}>{prop.subtitle}</p>
                </div>
              </div>
            );
            
            if (prop.whatsappLink) {
              return (
                <Link
                  key={index}
                  href={prop.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity duration-300"
                >
                  {content}
                </Link>
              );
            }
            
            return <div key={index}>{content}</div>;
          })}
        </div>
        
        {/* Desktop - Grid - Minimalist */}
        <div className="hidden md:grid md:grid-cols-5 gap-8 lg:gap-12">
          {props.map((prop, index) => {
            const content = (
              <div className="flex flex-col items-center text-center gap-3">
                {prop.whatsappLink ? (
                  <WhatsAppIcon size={16} />
                ) : (
                  <prop.icon size={16} className="text-[#1a1a1a] opacity-30" strokeWidth={1} />
                )}
                <div className="space-y-1">
                  <p className={`text-[10px] font-light tracking-[0.2em] uppercase ${prop.whatsappLink ? 'text-[#25D366]' : 'text-[#1a1a1a] opacity-70'}`}>{prop.title}</p>
                  <p className={`text-[9px] font-light tracking-[0.15em] ${prop.whatsappLink ? 'text-[#25D366] opacity-70' : 'text-[#1a1a1a] opacity-50'}`}>{prop.subtitle}</p>
                </div>
              </div>
            );
            
            if (prop.whatsappLink) {
              return (
                <Link
                  key={index}
                  href={prop.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity duration-300 cursor-pointer"
                >
                  {content}
                </Link>
              );
            }
            
            return <div key={index}>{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
