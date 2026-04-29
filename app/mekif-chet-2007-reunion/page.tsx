'use client';

import { useEffect, useState } from 'react';
import { Users, Sparkles, UserPlus, DollarSign, CreditCard, Crown, Camera } from 'lucide-react';

interface Participant {
  name: string;
  className?: string;
  phone?: string;
  email?: string;
  city?: string;
  preferredDate?: string;
  budget?: string;
  meetingStyle?: string;
  notes?: string;
  wantsToHelp?: string;
  otherClass?: string;
  paid?: boolean;
}

interface ReunionData {
  total: number;
  byClass: Record<string, Participant[]>;
}

const CLASS_COLORS: Record<string, string> = {
  'יב1':    '#3b82f6',
  'יב2':    '#10b981',
  'יב3':    '#8b5cf6',
  'יב4':    '#ec4899',
  'יב5':    '#f59e0b',
  'יב6':    '#6366f1',
  'יב7':    '#f43f5e',
  'יב8':    '#14b8a6',
  'יב9':    '#f97316',
  'יב10':   '#06b6d4',
  'אחר':    '#64748b',
  'לא צוין': '#94a3b8',
};

const CLASS_NAMES: Record<string, string> = {
  'יב1': 'מדעית',
  'יב2': 'מחר ספורט',
  'יב3': 'מחר',
  'יב4': 'אתגר',
  'יב5': 'טכ"מ',
  'יב6': 'מב"ר',
  'יב7': 'חינוך מיוחד',
  'יב8': 'תעשייה וניהול',
  'יב9': 'מחר',
  'יב10': 'משאבי אנוש',
};

export default function ReunionPage() {
  const [data, setData] = useState<ReunionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'מקיף ח\' 2007 מפגש איחוד!';

    const fetchData = async () => {
      try {
        const response = await fetch('/api/monday/reunion');
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={20} />
          </div>
          <p className="text-slate-400 text-sm tracking-wide">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center p-10 rounded-2xl border border-slate-200 shadow-sm max-w-md">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-red-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  const allClasses = ['יב1', 'יב2', 'יב3', 'יב4', 'יב5', 'יב6', 'יב7', 'יב8', 'יב9', 'יב10', 'אחר'];
  const allClassesData: Record<string, Participant[]> = {};
  allClasses.forEach(c => { allClassesData[c] = data?.byClass[c] || []; });
  if (data?.byClass['לא צוין']) allClassesData['לא צוין'] = data.byClass['לא צוין'];

  const total = data?.total || 0;
  const paidCount = Object.values(allClassesData).flat().filter(p => p.paid).length;
  const paidPercentage = total > 0 ? Math.round((paidCount / total) * 100) : 0;

  const PRICE_PER_PERSON = 400;
  const TARGET_PARTICIPANTS = 24;
  const collectedAmount = paidCount * PRICE_PER_PERSON;
  const totalTargetAmount = TARGET_PARTICIPANTS * PRICE_PER_PERSON;

  let leadingClasses: string[] = [];
  let maxPaidCount = 0;
  Object.entries(allClassesData).forEach(([className, participants]) => {
    const classPaidCount = participants.filter(p => p.paid).length;
    if (classPaidCount > maxPaidCount && classPaidCount > 0) {
      maxPaidCount = classPaidCount;
      leadingClasses = [className];
    } else if (classPaidCount === maxPaidCount && classPaidCount > 0) {
      leadingClasses.push(className);
    }
  });

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">


      {/* Hero */}
      <div className="bg-white border-b border-slate-100 px-6 py-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mekifh.mashov.info/wp-content/uploads/sites/82/2021/06/Semel-MekifH-%D7%A9%D7%9C%D7%95%D7%9D-%D7%95%D7%90%D7%A0%D7%95%D7%A0%D7%95.png"
          alt="לוגו מקיף ח׳"
          width={80}
          height={80}
          className="object-contain mx-auto mb-4"
        />
        <h1 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight mb-1">
          מקיף ח&#x27; 2007
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-indigo-600 mb-8">
          מפגש האיחוד
        </h2>

        {/* CTA buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <a
            href="https://forms.monday.com/forms/f2abc9fccb939b062aeb659cc4454b24?r=euc1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <UserPlus size={18} />
            הרשמה למפגש
          </a>
          <a
            href="/mekif-chet-2007-reunion/gallery"
            className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <Camera size={18} />
            גלריה
          </a>
          <a
            href="https://links.payboxapp.com/ROF2GSCOP0b"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: '#0088cc' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#006ba3')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0088cc')}
          >
            <CreditCard size={18} />
            תשלום &#x20AA;400
          </a>
        </div>

        {/* Registered count pill */}
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-5 py-2 rounded-full border border-indigo-100">
          <Users size={15} />
          <span><strong>{total}</strong> נרשמו עד כה</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

        {/* Welcome message */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl mx-auto">
          <div className="px-8 py-6 text-center">
            <p className="text-slate-600 text-base md:text-lg leading-relaxed font-light">
              היי לכולם, החלטנו שהגיע הזמן ליצור מפגש, רק לנו (בלי בני זוג וילדים!!) לא להאמין כמה אנחנו זקנים וכמה זמן לא נפגשנו, יאללה תמלאו את הטופס ובקרוב נעדכן מתי זה קורה!
            </p>
          </div>

          {/* Payment stats */}
          <div className="bg-emerald-50 border-t border-emerald-100 px-8 py-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-widest mb-1">סטטוס תשלומים</p>
                <p className="text-2xl font-bold text-slate-800">
                  {paidCount} <span className="text-base font-normal text-slate-500">/ {total} שילמו</span>
                </p>
                {leadingClasses.length > 0 && maxPaidCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Crown size={12} className="text-amber-500" fill="currentColor" />
                    <span className="text-xs text-slate-500">
                      <strong className="text-amber-600">{leadingClasses.join(', ')}</strong> מובילה עם{' '}
                      <strong className="text-emerald-600">{maxPaidCount}</strong> תשלומים
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full md:w-72">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>&#x20AA;{collectedAmount.toLocaleString('he-IL')} נאסף</span>
                  <span className="font-bold text-emerald-600">{paidPercentage}%</span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(paidPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  יעד: &#x20AA;{totalTargetAmount.toLocaleString('he-IL')} ({TARGET_PARTICIPANTS} משתתפים)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(allClassesData).map(([className, participants]) => {
            const color = CLASS_COLORS[className] || CLASS_COLORS['לא צוין'];
            const isLeading = leadingClasses.includes(className);
            const classPaidCount = participants.filter(p => p.paid).length;

            return (
              <div
                key={className}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                  isLeading ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                }`}
              >
                {/* Color accent bar */}
                <div style={{ height: '4px', background: isLeading ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : color }} />

                {/* Header */}
                <div className="px-4 py-3 flex items-start justify-between border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-bold text-slate-800">{className}</h2>
                      {isLeading && <Crown size={13} className="text-amber-500" fill="currentColor" />}
                    </div>
                    {CLASS_NAMES[className] && (
                      <p className="text-xs text-slate-400 mt-0.5">{CLASS_NAMES[className]}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: color }}
                    >
                      {participants.length}
                    </span>
                    {classPaidCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                        <DollarSign size={10} />
                        {classPaidCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Participants */}
                <div className="px-3 py-2 max-h-72 overflow-y-auto space-y-1 min-h-[80px]">
                  {participants.length > 0 ? (
                    participants.map((participant, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          participant.paid
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-slate-300 text-xs w-4 shrink-0">{index + 1}</span>
                        <span className={`flex-1 ${participant.paid ? 'font-medium' : ''}`}>
                          {participant.name}
                        </span>
                        {participant.paid && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        )}
                        {participant.otherClass && (
                          <span className="text-xs text-slate-400 italic">{participant.otherClass}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-300 text-sm">
                      אין נרשמים עדיין
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Organizers */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">המארגנות</p>
            <div className="space-y-3">
              {[
                { name: 'לורין טוטח (חייט)', phone: '0524893329' },
                { name: 'נטלי נחום (אמיר)', phone: '0524258068' },
                { name: 'טל נקר (מי-פז)', phone: '0542553737' },
              ].map(org => (
                <div key={org.phone} className="flex items-center justify-center gap-3 flex-wrap">
                  <span className="text-slate-700 font-medium text-sm">{org.name}</span>
                  <a
                    href={`tel:${org.phone}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-mono bg-indigo-50 hover:bg-indigo-100 px-3 py-0.5 rounded-lg transition-colors"
                  >
                    {org.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
