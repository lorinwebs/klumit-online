import { ShieldCheck, RotateCcw, Store, Phone } from 'lucide-react';
import PaymentIcons from '@/components/PaymentIcons';

/**
 * Reassurance block for the checkout: security, returns, physical store, phone,
 * plus the accepted payment methods. Kept factual and quiet, in the site's tone.
 */
export default function TrustStrip({ compact = false }: { compact?: boolean }) {
  const items = [
    { icon: ShieldCheck, text: 'תשלום מאובטח PCI DSS · 3D Secure' },
    { icon: RotateCcw, text: 'החזרה או החלפה תוך 14 יום' },
    { icon: Store, text: 'חנות פיזית · גאולה 45, תל אביב' },
    { icon: Phone, text: '03-5178502 · א׳–ה׳ 10:00–17:00' },
  ];

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <ul className={`grid gap-2 text-[11px] md:text-xs font-light text-black/65 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2">
            <Icon size={14} strokeWidth={1.5} className="shrink-0 text-black/50" aria-hidden />
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <PaymentIcons className="justify-start" />
        <p className="text-[10px] font-light text-black/45 leading-relaxed">
          פרטי הכרטיס מוזנים ישירות בטופס המאובטח של Grow ואינם נשמרים באתר.
        </p>
      </div>
    </div>
  );
}
