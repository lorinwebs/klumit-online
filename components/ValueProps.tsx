'use client';

import { Truck, Shield, Award, HeadphonesIcon, MapPin } from 'lucide-react';

const props = [
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
  {
    icon: HeadphonesIcon,
    title: 'שירות לקוחות',
    subtitle: '054-990-3139 (וואטסאפ)',
  },
];

export default function ValueProps() {
  return (
    <section className="bg-[#FDFBF7] text-[#1a1a1a] py-4 md:py-6 md:-mt-20 relative z-20 border-t border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile - Horizontal scroll with fade indicator */}
        <div className="md:hidden relative">
          {/* Fade gradient on left (RTL: indicates more content) */}
          <div className="absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/80 to-transparent z-10 pointer-events-none flex items-center">
            <svg className="w-4 h-4 text-[#1a1a1a]/40 animate-bounce mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          
          <div className="flex gap-6 overflow-x-auto scrollbar-hide py-1 pr-4 pl-14">
            {props.map((prop, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <prop.icon size={18} className="text-[#8B6914]" strokeWidth={1.5} />
                <div className="whitespace-nowrap">
                  <span className="text-xs font-light">{prop.title}</span>
                  <span className="text-[10px] text-gray-500 font-light mr-1"> • {prop.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop - Grid */}
        <div className="hidden md:grid md:grid-cols-5 gap-6">
          {props.map((prop, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center gap-2"
            >
              <prop.icon size={28} className="text-[#8B6914]" strokeWidth={1.5} />
              <div>
                <p className="text-base font-light tracking-wide">{prop.title}</p>
                <p className="text-xs text-gray-500 font-light">{prop.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
