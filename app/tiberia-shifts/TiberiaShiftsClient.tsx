'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildShiftRows,
  rowDateUsesLtr,
  type ShiftRow,
  type ShiftRowType,
  typeBadgeClass,
} from '@/lib/tiberia-shift-rows';
import { endOfYear, startOfDay } from 'date-fns';

type FilterMode = 'all' | 'shabbat' | 'holiday';

function DateLabel({ row }: { row: ShiftRow }) {
  const ltr = rowDateUsesLtr(row);
  return (
    <span dir={ltr ? 'ltr' : undefined} className={ltr ? 'inline-block tabular-nums' : undefined}>
      {row.dateLabel}
    </span>
  );
}

function HolidayNames({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-gray-400">—</span>;
  return <span className="font-semibold text-violet-900">{names.join(' · ')}</span>;
}

function TypeBadge({ rowType, label }: { rowType: ShiftRowType; label: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-base font-bold ${typeBadgeClass(rowType)}`}
    >
      {label}
    </span>
  );
}

function AssignedNames({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-gray-400">—</span>;
  return <span className="text-lg font-bold text-green-800">{names.join(' · ')}</span>;
}

function filterRows(rows: ShiftRow[], filter: FilterMode): ShiftRow[] {
  if (filter === 'all') return rows;
  if (filter === 'shabbat') return rows.filter((r) => r.rowType === 'shabbat');
  return rows.filter((r) => r.rowType === 'holiday' || r.rowType === 'both');
}

export default function TiberiaShiftsClient() {
  const rows = useMemo(
    () => buildShiftRows(startOfDay(new Date()), endOfYear(new Date())),
    []
  );

  const [filter, setFilter] = useState<FilterMode>('all');
  const filteredRows = useMemo(() => filterRows(rows, filter), [rows, filter]);
  const showHolidayColumn = filter !== 'shabbat';

  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [knownNames, setKnownNames] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkName, setBulkName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/tiberia-shifts');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'שגיאה בטעינה');
      setAssignments(json.assignments ?? {});
      setKnownNames(json.names ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelected(new Set());
  }, [filter]);

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    const keys = filteredRows.map((r) => r.key);
    const allSelected = keys.length > 0 && keys.every((k) => selected.has(k));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(keys));
    }
  }

  async function patchOne(key: string, guard_name: string, action: 'add' | 'remove') {
    const res = await fetch('/api/tiberia-shifts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekend_date: key, guard_name, action }),
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

  const datalistId = 'tiberia-shift-names';
  const selectedCount = selected.size;
  const allVisibleSelected =
    filteredRows.length > 0 && filteredRows.every((r) => selected.has(r.key));

  const filterBtn = (mode: FilterMode, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(mode)}
      className={`flex-1 rounded-xl py-3 text-lg font-bold transition-colors sm:text-xl ${
        filter === mode ? 'bg-amber-500 text-white' : 'text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-amber-50 px-3 py-6 pb-36" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 text-center text-3xl font-bold text-gray-900">משמרות בטבריה</h1>
        <p className="mb-2 text-center text-xl text-gray-700">מי עם סבתא וסבא?</p>
        <p className="mb-4 text-center text-base text-gray-600">
          סמנו תאריכים → כתבו שם → שמור
        </p>

        <div className="mb-4 flex gap-2 rounded-2xl border-2 border-amber-200 bg-white p-1 shadow-sm">
          {filterBtn('all', 'הכל')}
          {filterBtn('shabbat', 'שישי–שבת')}
          {filterBtn('holiday', 'חגים')}
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-center text-lg text-red-800" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-center text-xl text-gray-600">טוען…</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-center text-xl text-gray-600">אין תאריכים בפילטר הזה</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border-2 border-amber-200 bg-white shadow-sm">
            <table className="w-full min-w-[24rem] text-right">
              <thead>
                <tr className="border-b-2 border-amber-100 bg-amber-50">
                  <th className="w-12 px-2 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-6 w-6 accent-amber-500"
                      aria-label="בחירת הכל"
                    />
                  </th>
                  <th className="px-2 py-3 text-lg font-bold text-gray-900">תאריך</th>
                  <th className="px-2 py-3 text-lg font-bold text-gray-900">סוג</th>
                  {showHolidayColumn && (
                    <th className="px-2 py-3 text-lg font-bold text-gray-900">חג</th>
                  )}
                  <th className="px-2 py-3 text-lg font-bold text-gray-900">מי נמצא</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const assigned = assignments[row.key] ?? [];
                  const isSelected = selected.has(row.key);
                  const rowShowsHoliday = showHolidayColumn && row.rowType !== 'shabbat';

                  return (
                    <tr
                      key={row.key}
                      className={`border-b border-amber-100 align-middle ${
                        isSelected ? 'bg-amber-100/80' : ''
                      }`}
                    >
                      <td className="px-2 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(row.key)}
                          className="h-6 w-6 accent-amber-500"
                          aria-label={`בחירת ${row.dateLabel}`}
                        />
                      </td>
                      <td className="px-2 py-3 text-lg leading-snug text-gray-900">
                        <DateLabel row={row} />
                      </td>
                      <td className="px-2 py-3">
                        <TypeBadge rowType={row.rowType} label={row.typeLabel} />
                      </td>
                      {showHolidayColumn && (
                        <td className="px-2 py-3 text-lg">
                          {rowShowsHoliday ? (
                            <HolidayNames names={row.holidayNames} />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-2 py-3">
                        <AssignedNames names={assigned} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedCount > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-amber-300 bg-white px-3 py-4 shadow-lg">
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
                className="min-w-0 flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 text-xl outline-none focus:border-amber-500"
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
            {knownNames.length > 0 && (
              <div className="mx-auto mt-2 flex max-w-lg flex-wrap justify-center gap-2">
                {knownNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    disabled={saving}
                    onClick={() => setBulkName(name)}
                    className="rounded-full bg-amber-100 px-3 py-1 text-lg text-gray-900"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
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
