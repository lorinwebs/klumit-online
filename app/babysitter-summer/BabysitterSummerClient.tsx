'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HEBREW_WEEKDAYS,
  PRESET_SITTERS,
  SUMMER_MONTHS,
  abroadCellClass,
  abroadChipClass,
  buildCalendarMonth,
  buildSummerShiftRows,
  hasSchedule,
  isTrackedScheduleDay,
  isWeekend,
  scheduleMetrics,
  vacationCountdown,
  weekendCellClass,
  type CalendarDay,
  type CalendarMonth,
} from '@/lib/babysitter-summer-rows';

function MetricCard({
  value,
  label,
  sub,
  tone,
}: {
  value: string;
  label: string;
  sub?: string;
  tone: 'amber' | 'sky';
}) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    sky: 'border-sky-200 bg-white text-gray-900',
  };
  return (
    <div className={`flex-1 rounded-2xl border-2 px-4 py-4 text-center shadow-sm ${tones[tone]}`}>
      <p className="text-3xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-base font-semibold text-gray-700">{label}</p>
      {sub ? <p className="mt-0.5 text-sm text-gray-500">{sub}</p> : null}
    </div>
  );
}

export default function BabysitterSummerClient() {
  const rows = useMemo(() => buildSummerShiftRows(), []);
  const months = useMemo(
    () => SUMMER_MONTHS.map(({ year, month }) => buildCalendarMonth(year, month)),
    [],
  );

  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [knownNames, setKnownNames] = useState<string[]>([...PRESET_SITTERS]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkName, setBulkName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/babysitter-summer');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'שגיאה בטעינה');
      setAssignments(json.assignments ?? {});
      setKnownNames(json.names ?? [...PRESET_SITTERS]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function patchOne(key: string, sitter_name: string, action: 'add' | 'remove') {
    const res = await fetch('/api/babysitter-summer', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shift_date: key, sitter_name, action }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'שגיאה בשמירה');
    return json;
  }

  async function applyBulk(action: 'add' | 'remove') {
    const name = bulkName.trim();
    if (!name || selected.size === 0) return;

    setSaving(true);
    setError(null);
    const keys = [...selected];

    try {
      for (const key of keys) {
        const list = assignments[key] ?? [];
        if (action === 'add' && list.includes(name)) continue;
        if (action === 'remove' && !list.includes(name)) continue;
        await patchOne(key, name, action);
      }

      setAssignments((prev) => {
        const next = { ...prev };
        for (const key of keys) {
          const list = next[key] ?? [];
          if (action === 'add') {
            if (!list.includes(name)) {
              next[key] = [...list, name].sort((a, b) => a.localeCompare(b, 'he'));
            }
          } else {
            const filtered = list.filter((n) => n !== name);
            if (filtered.length) next[key] = filtered;
            else delete next[key];
          }
        }
        return next;
      });

      if (action === 'add' && !knownNames.includes(name)) {
        setKnownNames((prev) => [...prev, name].sort((a, b) => a.localeCompare(b, 'he')));
      }

      setBulkName('');
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בשמירה');
      await load();
    } finally {
      setSaving(false);
    }
  }

  const datalistId = 'babysitter-summer-names';
  const selectedCount = selected.size;

  const scheduleStats = useMemo(
    () => scheduleMetrics(rows, assignments),
    [rows, assignments],
  );
  const vacation = useMemo(() => vacationCountdown(), []);

  return (
    <div className="min-h-screen bg-sky-50 px-2 py-6 pb-36 sm:px-3" dir="rtl" lang="he">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-center text-3xl font-bold text-gray-900">בייביסטר קיץ</h1>
        <p className="mb-4 text-center text-xl text-gray-700">1.7 – 31.8.2026 · רון · שי · שחר</p>

        {!loading && (
          <div className="mb-4 flex gap-3">
            <MetricCard
              tone="amber"
              value={`${scheduleStats.assigned} / ${scheduleStats.total}`}
              label="שיבוצים"
              sub="ימים לבנים (לא סופ״ש, לא חו״ל)"
            />
            <MetricCard tone="sky" value={vacation.value} label={vacation.sub} />
          </div>
        )}

        <p className="mb-4 text-center text-base text-gray-600">לחצו על תאריכים → בחרו שם → שמור</p>

        {error && (
          <p className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-center text-lg text-red-800" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-center text-xl text-gray-600">טוען…</p>
        ) : (
          <div className="space-y-6">
            {months.map((month) => (
              <MonthGrid
                key={`${month.year}-${month.month}`}
                month={month}
                assignments={assignments}
                selected={selected}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}

        {selectedCount > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-sky-300 bg-white px-3 py-4 shadow-lg">
            <p className="mb-2 text-center text-lg font-bold text-gray-900">
              נבחרו {selectedCount} תאריכים
            </p>
            <div className="mx-auto flex max-w-lg gap-2">
              <input
                type="text"
                list={datalistId}
                value={bulkName}
                disabled={saving}
                onChange={(e) => setBulkName(e.target.value)}
                placeholder="שם"
                className="min-w-0 flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 text-xl outline-none focus:border-sky-500"
                autoComplete="name"
              />
              <button
                type="button"
                disabled={saving || !bulkName.trim()}
                onClick={() => applyBulk('add')}
                className="shrink-0 rounded-xl bg-green-600 px-5 py-3 text-xl font-bold text-white disabled:bg-gray-300"
              >
                {saving ? '…' : 'שמור'}
              </button>
              <button
                type="button"
                disabled={saving || !bulkName.trim()}
                onClick={() => applyBulk('remove')}
                className="shrink-0 rounded-xl bg-red-500 px-4 py-3 text-xl font-bold text-white disabled:bg-gray-300"
              >
                הסר
              </button>
            </div>
            <div className="mx-auto mt-2 flex max-w-lg flex-wrap justify-center gap-2">
              {knownNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  disabled={saving}
                  onClick={() => setBulkName(name)}
                  className="rounded-full bg-sky-100 px-3 py-1 text-lg text-gray-900"
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => setSelected(new Set())}
              className="mt-2 w-full text-center text-base text-gray-600 underline"
            >
              ביטול בחירה
            </button>
          </div>
        )}

        <datalist id={datalistId}>
          {knownNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>
    </div>
  );
}

function MonthGrid({
  month,
  assignments,
  selected,
  onToggleSelect,
}: {
  month: CalendarMonth;
  assignments: Record<string, string[]>;
  selected: Set<string>;
  onToggleSelect: (key: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-sky-200 bg-white shadow-sm">
      <h2 className="border-b border-sky-100 bg-sky-50 px-4 py-3 text-center text-xl font-bold text-gray-900">
        {month.title}
      </h2>

      <div className="grid grid-cols-7 border-b border-sky-100 bg-sky-50/80">
        {HEBREW_WEEKDAYS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-sm font-bold text-gray-600 sm:text-base"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {month.weeks.flatMap((week, wi) =>
          week.map((day, di) => (
            <CalendarCell
              key={day ? day.key : `empty-${wi}-${di}`}
              day={day}
              assignments={assignments}
              isSelected={day ? selected.has(day.key) : false}
              onToggleSelect={onToggleSelect}
            />
          )),
        )}
      </div>
    </section>
  );
}

function CalendarCell({
  day,
  assignments,
  isSelected,
  onToggleSelect,
}: {
  day: CalendarDay | null;
  assignments: Record<string, string[]>;
  isSelected: boolean;
  onToggleSelect: (key: string) => void;
}) {
  if (!day) {
    return (
      <div className="min-h-[5.5rem] border-b border-e border-sky-100 bg-gray-50/40 sm:min-h-[6.5rem]" />
    );
  }

  const names = assignments[day.key] ?? [];
  const tracked = day.inRange && isTrackedScheduleDay(day.key);
  const missing = tracked && !hasSchedule(day.key, assignments);
  const weekend = day.inRange && isWeekend(day.key);

  let cellBg = 'bg-white';
  if (!day.inRange) cellBg = 'bg-gray-50/60 text-gray-300';
  else if (weekend) cellBg = weekendCellClass();
  else if (day.abroadShort) cellBg = abroadCellClass(day.abroadShort);
  else if (missing) cellBg = 'bg-amber-50';

  return (
    <button
      type="button"
      disabled={!day.inRange}
      onClick={() => onToggleSelect(day.key)}
      aria-label={`${day.day}${names.length ? ` — ${names.join(', ')}` : ''}`}
      aria-pressed={isSelected}
      className={`relative flex min-h-[5.5rem] flex-col border-b border-e border-sky-100 p-1 text-start transition-colors sm:min-h-[6.5rem] sm:p-1.5 ${cellBg} ${
        day.inRange ? `cursor-pointer ${weekend ? 'hover:bg-violet-200/60' : 'hover:bg-sky-50/80'}` : 'cursor-default'
      } ${isSelected ? 'ring-2 ring-inset ring-sky-500' : ''}`}
    >
      <span
        className={`ms-auto block text-sm font-bold tabular-nums sm:text-base ${
          day.inRange ? 'text-gray-900' : 'text-gray-300'
        }`}
      >
        {day.day}
      </span>

      {day.inRange && day.abroadShort && (
        <span
          className={`mt-0.5 truncate rounded px-1 py-0.5 text-[10px] font-bold leading-tight sm:text-xs ${abroadChipClass(day.abroadShort)}`}
        >
          {day.abroadShort}
        </span>
      )}

      {day.inRange && names.length > 0 && (
        <div className="mt-auto flex flex-col gap-0.5">
          {names.map((name) => (
            <span
              key={name}
              className="truncate rounded bg-emerald-200 px-1 py-0.5 text-[10px] font-bold text-emerald-950 sm:text-xs"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
