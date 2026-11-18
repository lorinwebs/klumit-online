import type { FaqItem } from '@/lib/seo';

export default function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-sand border-y border-sand">
      {items.map((item) => (
        <div key={item.question} className="py-5">
          <h3 className="text-base font-medium text-espresso">{item.question}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-dark">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}
