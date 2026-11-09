'use client';

import { useMemo, useState } from 'react';
import { GIFTS, type Gift } from './gifts';

type SortKey = 'name' | 'amount';

function nis(n: number) {
  return `₪${Math.round(n).toLocaleString('he-IL')}`;
}

function perGuest(gift: Gift) {
  if (gift.guests <= 0) return null;
  return gift.amount / gift.guests;
}

function normalize(value: string) {
  return value.replace(/[״"'.׳,]/g, '').replace(/\s+/g, ' ').trim();
}

export default function WeddingGifts() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');

  const filtered = useMemo(() => {
    const q = normalize(query);
    const list = q
      ? GIFTS.filter((gift) => normalize(gift.name).includes(q))
      : GIFTS.slice();

    list.sort((a, b) => {
      if (sort === 'amount') return b.amount - a.amount || a.name.localeCompare(b.name, 'he');
      return a.name.localeCompare(b.name, 'he');
    });
    return list;
  }, [query, sort]);

  const totals = useMemo(() => {
    const guests = filtered.reduce((sum, gift) => sum + gift.guests, 0);
    const amount = filtered.reduce((sum, gift) => sum + gift.amount, 0);
    return {
      guests,
      amount,
      average: guests > 0 ? amount / guests : null,
      names: filtered.length,
    };
  }, [filtered]);

  const searching = query.trim().length > 0;

  return (
    <div
      dir="rtl"
      lang="he"
      className="min-h-dvh bg-[#f4ece4] text-[#2c241f]"
      style={{ fontFamily: 'var(--font-assistant), Heebo, Arial, sans-serif' }}
    >
      <div className="mx-auto min-h-dvh w-full max-w-lg">
        <header className="sticky top-0 z-20 border-b border-[#e4d5c6] bg-[#f4ece4]/95 px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur-md">
          <p className="text-center text-sm tracking-[0.18em] text-[#a07c58]">לורין ומור</p>
          <h1 className="mt-1 text-center text-[1.7rem] font-semibold leading-tight">
            כמה החברים הביאו
          </h1>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Stat label={searching ? 'אורחים בחיפוש' : 'אורחים'} value={totals.guests.toLocaleString('he-IL')} />
            <Stat label={searching ? 'סכום בחיפוש' : 'סכום'} value={nis(totals.amount)} />
          </div>
          <div className="mt-2 rounded-2xl bg-[#6f2e3c] px-4 py-3 text-white shadow-sm">
            <p className="text-sm text-white/80">ממוצע לאורח</p>
            <p className="mt-0.5 text-3xl font-semibold leading-none tabular-nums">
              <span dir="ltr">{totals.average == null ? '—' : nis(totals.average)}</span>
            </p>
          </div>

          <div className="relative mt-4">
            <label className="block">
              <span className="sr-only">חיפוש לפי שם</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="חיפוש לפי שם"
                enterKeyHint="search"
                autoComplete="off"
                className="h-12 w-full rounded-2xl border border-[#e4d5c6] bg-white pe-16 ps-4 text-base text-[#2c241f] outline-none ring-[#6f2e3c] placeholder:text-[#a8988c] focus:ring-2"
              />
            </label>
            {searching ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-1 end-1 rounded-xl px-3 text-sm font-medium text-[#6f2e3c]"
              >
                נקה
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-[#7d6d62]">
              {totals.names.toLocaleString('he-IL')} שמות
            </p>
            <div className="flex rounded-full bg-white p-1 text-sm shadow-sm ring-1 ring-[#e4d5c6]">
              <SortButton active={sort === 'name'} onClick={() => setSort('name')}>
                לפי שם
              </SortButton>
              <SortButton active={sort === 'amount'} onClick={() => setSort('amount')}>
                לפי סכום
              </SortButton>
            </div>
          </div>
        </header>

        <main className="space-y-3 px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-white px-4 py-8 text-center text-lg text-[#7d6d62] shadow-sm">
              לא מצאנו את השם הזה
            </p>
          ) : (
            filtered.map((gift) => {
              const average = perGuest(gift);
              return (
                <article
                  key={gift.name}
                  className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5"
                >
                  <h2 className="text-xl font-semibold leading-snug">{gift.name}</h2>
                  {gift.detail ? (
                    <p className="mt-1 text-sm text-[#7d6d62]">{gift.detail}</p>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-[#f0e4d8] pt-3">
                    <Figure label="אורחים" value={gift.guests.toLocaleString('he-IL')} />
                    <Figure label="סכום" value={nis(gift.amount)} />
                    <Figure label="לאורח" value={average == null ? '—' : nis(average)} emphasis />
                  </dl>
                </article>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-[#e4d5c6]">
      <p className="text-sm text-[#7d6d62]">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">
        <span dir="ltr">{value}</span>
      </p>
    </div>
  );
}

function Figure({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm text-[#7d6d62]">{label}</dt>
      <dd
        className={`mt-0.5 text-lg font-semibold tabular-nums ${emphasis ? 'text-[#6f2e3c]' : ''}`}
      >
        <span dir="ltr">{value}</span>
      </dd>
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 ${
        active ? 'bg-[#6f2e3c] text-white' : 'text-[#7d6d62]'
      }`}
    >
      {children}
    </button>
  );
}
