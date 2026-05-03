'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { badgeSchema, BadgeFormData, BadgeFormInput, GRADES, GRADE_LABELS, GENDERS, GENDER_LABELS, MARITAL_STATUSES, getMaritalLabel, type Gender, type MaritalStatus } from '../../../lib/badge/schema';
import { BadgePreview } from '../../../components/badge/BadgePreview';

interface PaidParticipant {
  name: string;
  grade: string;
  city: string;
  hasBadge: boolean;
}

export default function BadgePage() {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [participants, setParticipants] = useState<PaidParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState('');

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BadgeFormInput, unknown, BadgeFormData>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      first_name: '', last_name: '', gender: undefined,
      marital_status: 'single', other_status: '', married_name: '',
      grade: undefined, city: '', occupation: '', num_children: 0, monday_name: '', _hp: '',
    },
    mode: 'onChange',
  });

  const values = watch();
  const gender = watch('gender');
  const maritalStatus = watch('marital_status');

  useEffect(() => {
    fetch('/api/badge/count')
      .then(r => r.json())
      .then(d => setCount(d.count))
      .catch(() => null);
    fetch('/api/badge/paid-participants')
      .then(r => r.json())
      .then(d => setParticipants(d.participants || []))
      .catch(() => null)
      .finally(() => setParticipantsLoading(false));
  }, []);

  async function onSubmit(data: BadgeFormData) {
    setSubmitError('');
    try {
      const res = await fetch('/api/badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? 'שגיאה בשליחה');
        return;
      }
      router.push(`/mekif-chet-2007-reunion/badge/success?id=${json.id}&count=${json.count}`);
    } catch {
      setSubmitError('שגיאת רשת. נסו שוב.');
    }
  }

  const inputCls = 'w-full border border-purple-200 rounded-xl px-4 py-3 text-right text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition bg-white';
  const errorCls = 'text-red-500 text-sm mt-1 text-right';
  const labelCls = 'block text-sm font-semibold text-purple-800 mb-1 text-right';

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-purple-100 px-6 py-8 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mekif-chet-logo.png"
          alt="לוגו מקיף ח׳"
          className="w-16 h-16 object-contain mx-auto mb-3"
        />
        <h1 className="text-3xl font-bold text-purple-900">מפגש מחזור האיחוד</h1>
        <p className="text-purple-600 mt-1 text-lg">צרו את תג השם שלכם</p>
        {count !== null && (
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full border border-purple-100 mt-3">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span><strong>{count}</strong> חברים כבר מילאו</span>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-8 order-1">
            <h2 className="text-xl font-bold text-purple-900 mb-6 text-right">מלאו את הפרטים</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Honeypot */}
              <input {...register('_hp')} type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

              {/* Gender */}
              <div>
                <label className={labelCls}>מגדר <span className="text-red-400">*</span></label>
                <div className="flex gap-3">
                  {GENDERS.map(g => (
                    <label key={g} className="flex-1">
                      <input {...register('gender')} type="radio" value={g} className="peer sr-only" />
                      <div className="cursor-pointer text-center border border-purple-200 rounded-xl px-4 py-3 text-slate-700 peer-checked:bg-purple-700 peer-checked:text-white peer-checked:border-purple-700 transition font-medium">
                        {GENDER_LABELS[g]}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.gender && <p className={errorCls}>{errors.gender.message}</p>}
              </div>

              {/* Participant selector */}
              <div>
                <label className={labelCls}>בחרו את השם שלכם <span className="text-red-400">*</span></label>
                {participantsLoading ? (
                  <div className={`${inputCls} flex items-center justify-center text-slate-400`}>טוען...</div>
                ) : (
                  <select
                    className={inputCls}
                    value={selectedParticipant}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSelectedParticipant(name);
                      if (name) {
                        const p = participants.find(p => p.name === name);
                        setValue('first_name', name, { shouldValidate: true });
                        setValue('monday_name', name);
                        if (p?.grade) {
                          setValue('grade', p.grade as any, { shouldValidate: true });
                        }
                        if (p?.city) {
                          setValue('city', p.city, { shouldValidate: true });
                        }
                      }
                    }}
                  >
                    <option value="">בחרו שם...</option>
                    {participants.filter(p => !p.hasBadge).map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* First name - pre-filled from dropdown, editable */}
              <div>
                <label className={labelCls}>שם פרטי <span className="text-red-400">*</span></label>
                <input
                  {...register('first_name')}
                  type="text"
                  placeholder="לורין"
                  className={inputCls}
                  dir="rtl"
                />
                {errors.first_name && <p className={errorCls}>{errors.first_name.message}</p>}
              </div>

              {/* Last name (maiden) - always visible */}
              <div>
                <label className={labelCls}>שם משפחה לפני נישואין <span className="text-red-400">*</span></label>
                <input
                  {...register('last_name')}
                  type="text"
                  placeholder="טוטח"
                  className={inputCls}
                  dir="rtl"
                />
                {errors.last_name && <p className={errorCls}>{errors.last_name.message}</p>}
              </div>

              {/* Married name - always visible */}
              <div>
                <label className={labelCls}>שם משפחה לאחר נישואין</label>
                <input
                  {...register('married_name')}
                  type="text"
                  placeholder="חייט"
                  className={inputCls}
                  dir="rtl"
                />
              </div>

              {/* Marital status */}
              <div>
                <label className={labelCls}>סטטוס משפחתי <span className="text-red-400">*</span></label>
                <div className="flex gap-3">
                  {MARITAL_STATUSES.map(s => (
                    <label key={s} className="flex-1">
                      <input {...register('marital_status')} type="radio" value={s} className="peer sr-only" />
                      <div className="cursor-pointer text-center border border-purple-200 rounded-xl px-4 py-3 text-slate-700 peer-checked:bg-purple-700 peer-checked:text-white peer-checked:border-purple-700 transition font-medium">
                        {gender ? getMaritalLabel(s, gender as Gender) : getMaritalLabel(s, 'male')}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.marital_status && <p className={errorCls}>{errors.marital_status.message}</p>}
                {maritalStatus === 'other' && (
                  <div className="mt-2">
                    <input
                      {...register('other_status')}
                      type="text"
                      placeholder="אחר"
                      maxLength={20}
                      className={inputCls}
                      dir="rtl"
                    />
                    <p className="text-xs text-slate-400 mt-1 text-right">עד 10 תווים. אם ריק יופיע &quot;אחר&quot;</p>
                  </div>
                )}
              </div>

              {/* Grade - show always but auto-filled when participant selected */}
              <div>
                <label className={labelCls}>כיתה <span className="text-red-400">*</span></label>
                <select {...register('grade')} className={inputCls} defaultValue="">
                  <option value="" disabled>בחרו כיתה...</option>
                  {GRADES.map(g => (
                    <option key={g} value={g}>{GRADE_LABELS[g]}</option>
                  ))}
                </select>
                {errors.grade && <p className={errorCls}>{errors.grade.message}</p>}
              </div>

              {/* City */}
              <div>
                <label className={labelCls}>עיר <span className="text-red-400">*</span></label>
                <input
                  {...register('city')}
                  type="text"
                  placeholder="ראשון לציון"
                  className={inputCls}
                  dir="rtl"
                />
                {errors.city && <p className={errorCls}>{errors.city.message}</p>}
              </div>

              {/* Occupation */}
              <div>
                <label className={labelCls}>עיסוק <span className="text-red-400">*</span></label>
                <input
                  {...register('occupation')}
                  type="text"
                  placeholder="הייטק / רפואה / חינוך..."
                  className={inputCls}
                  dir="rtl"
                />
                {errors.occupation && <p className={errorCls}>{errors.occupation.message}</p>}
              </div>

              {/* Number of children */}
              <div>
                <label className={labelCls}>מספר ילדים</label>
                <input
                  {...register('num_children')}
                  type="number"
                  min={0}
                  max={20}
                  placeholder="0"
                  className={inputCls}
                  dir="rtl"
                />
                {errors.num_children && <p className={errorCls}>{errors.num_children.message}</p>}
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-right text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                {isSubmitting ? 'שומר...' : 'שמרו את התג'}
              </button>
            </form>
          </div>

          {/* Live preview */}
          <div className="order-2 lg:sticky lg:top-8">
            <h2 className="text-xl font-bold text-purple-900 mb-4 text-right">תצוגה מקדימה</h2>
            <div className="max-w-xs mx-auto lg:mx-0">
              <BadgePreview data={{ ...values, num_children: typeof values.num_children === 'number' ? values.num_children : Number(values.num_children) || 0 }} />
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center lg:text-right">
              התג להדפסה יופק אוטומטית לאחר השמירה
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
