import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'פרטים' },
  { id: 2, label: 'תשלום' },
  { id: 3, label: 'אישור' },
] as const;

/** Compact 1 · 2 · 3 progress indicator shown on every checkout page. */
export default function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="שלבי הרכישה" className="w-full">
      <ol className="flex items-center justify-center gap-2 md:gap-3 text-[11px] md:text-xs font-light">
        {STEPS.map((step, index) => {
          const done = step.id < current;
          const active = step.id === current;
          return (
            <li key={step.id} className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] transition-colors ${
                    done
                      ? 'border-black bg-black text-white'
                      : active
                        ? 'border-black text-black'
                        : 'border-black/25 text-black/40'
                  }`}
                >
                  {done ? <Check size={12} strokeWidth={2.5} aria-hidden /> : step.id}
                </span>
                <span className={active || done ? 'text-black' : 'text-black/40'}>{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`block h-px w-8 md:w-14 ${done ? 'bg-black' : 'bg-black/20'}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
