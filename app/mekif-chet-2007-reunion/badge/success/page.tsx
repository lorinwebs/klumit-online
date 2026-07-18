'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const EVENT_DATE = new Date('2026-06-10T18:00:00+03:00');

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = EVENT_DATE.getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex gap-4 justify-center mt-4">
      {[
        { label: 'דקות',  val: timeLeft.minutes },
        { label: 'שעות',  val: timeLeft.hours },
        { label: 'ימים',   val: timeLeft.days },
      ].map(({ label, val }) => (
        <div key={label} className="text-center bg-purple-50 rounded-xl px-4 py-3 min-w-[70px]">
          <div className="text-3xl font-bold text-purple-800">{val}</div>
          <div className="text-xs text-purple-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const id    = params.get('id');
  const count = params.get('count');

  const [badgeUrl, setBadgeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    // Poll every 2s for up to 20s waiting for PNG to be ready
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/badge/${id}`);
        const json = await res.json();
        if (json.signed_url) {
          setBadgeUrl(json.signed_url);
          setLoading(false);
          return;
        }
      } catch { /* ignore */ }
      if (attempts < 10) setTimeout(poll, 2000);
      else setLoading(false);
    };
    poll();
  }, [id]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Check icon */}
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-purple-900 mb-2">התג שלך נשמר!</h1>
        {count && (
          <p className="text-purple-600 text-lg mb-1">
            הצטרפת ל-<strong>{count}</strong> חברים מהמחזור שכבר מילאו
          </p>
        )}

        {/* Badge preview */}
        <div className="mt-8 mb-8">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">מייצר את התג...</p>
            </div>
          ) : badgeUrl ? (
            <div>
              <p className="text-sm text-slate-500 mb-3">כך יראה התג שלך</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={badgeUrl}
                alt="התג שלך"
                className="max-w-[280px] mx-auto rounded-xl shadow-lg border border-purple-100"
              />
            </div>
          ) : (
            <p className="text-sm text-slate-400">התג יופיע בקרוב</p>
          )}
        </div>

        {/* Countdown */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 mb-6">
          <p className="text-sm font-semibold text-purple-700 mb-1">המפגש הגדול עוד</p>
          <p className="text-xs text-slate-400 mb-2">10.6.2026</p>
          <Countdown />
        </div>

        <Link
          href="/mekif-chet-2007-reunion"
          className="inline-block bg-purple-700 hover:bg-purple-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          חזרה לדף המחזור
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
