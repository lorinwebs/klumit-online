import { HebrewCalendar, HDate, flags, type HolidayEvent } from '@hebcal/core';
import {
  addDays,
  endOfYear,
  format,
  getDay,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns';
import { he } from 'date-fns/locale';

export type ShiftRowType = 'shabbat' | 'holiday' | 'both';

export interface ShiftRow {
  key: string;
  start: string;
  end: string;
  dateLabel: string;
  typeLabel: string;
  rowType: ShiftRowType;
  holidayNames: string[];
}

function rowTypeLabel(rowType: ShiftRowType): string {
  if (rowType === 'both') return 'גם וגם';
  if (rowType === 'holiday') return 'חג';
  return 'שישי–שבת';
}

function toYmd(d: Date): string {
  return format(startOfDay(d), 'yyyy-MM-dd');
}

function isRelevantHoliday(ev: HolidayEvent): boolean {
  const f = ev.getFlags();
  if (f & flags.MINOR_FAST) return false;
  if (f & flags.MODERN_HOLIDAY) return false;
  if (f & flags.CHAG) return true;
  if (f & flags.CHOL_HAMOED) return true;
  if (f & flags.MINOR_HOLIDAY) return true;
  return false;
}

function holidaysOnDay(d: Date): string[] {
  const hd = new HDate(startOfDay(d));
  const evts = HebrewCalendar.getHolidaysOnDate(hd, true) ?? [];
  const names = evts.filter(isRelevantHoliday).map((e) => e.render('he'));
  return [...new Set(names)];
}

function collectHolidayDays(from: Date, until: Date): Map<string, string[]> {
  const map = new Map<string, string[]>();
  let d = startOfDay(from);
  const end = startOfDay(until);
  while (d <= end) {
    const names = holidaysOnDay(d);
    if (names.length > 0) map.set(toYmd(d), names);
    d = addDays(d, 1);
  }
  return map;
}

function normalizeHolidayName(name: string): string {
  return name
    .replace(/\s*578\d/g, '')
    .replace(/\s*[אב]'?\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function holidaysRelated(namesA: string[], namesB: string[]): boolean {
  for (const a of namesA) {
    for (const b of namesB) {
      const na = normalizeHolidayName(a);
      const nb = normalizeHolidayName(b);
      if (!na || !nb) continue;
      if (na === nb || na.includes(nb) || nb.includes(na)) return true;
    }
  }
  return false;
}

function mergeNameLists(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

function mergeHolidayRanges(holidayDays: Map<string, string[]>) {
  const sorted = [...holidayDays.keys()].sort();
  const ranges: { start: string; end: string; names: string[] }[] = [];

  let i = 0;
  while (i < sorted.length) {
    const start = sorted[i];
    let names = [...holidayDays.get(start)!];
    let end = start;
    let j = i + 1;
    while (j < sorted.length) {
      const next = sorted[j];
      const prev = sorted[j - 1];
      const nextNames = holidayDays.get(next)!;
      const dayAfterPrev = toYmd(addDays(parseISO(prev), 1));
      const sameNames = nextNames.join('|') === names.join('|');
      if (next === dayAfterPrev && (sameNames || holidaysRelated(names, nextNames))) {
        end = next;
        names = mergeNameLists(names, nextNames);
        j++;
      } else break;
    }
    ranges.push({ start, end, names });
    i = j;
  }
  return ranges;
}

export function upcomingFridays(until: Date): Date[] {
  const today = startOfDay(new Date());
  let d = today;
  while (getDay(d) !== 5) d = addDays(d, 1);
  const fridays: Date[] = [];
  while (d <= until) {
    fridays.push(d);
    d = addDays(d, 7);
  }
  return fridays;
}

export function weekendLabel(friday: Date): string {
  const saturday = addDays(friday, 1);
  return `${format(friday, 'd.M')} – ${format(saturday, 'd.M')}`;
}

function rangeHasWeekendDay(start: string, end: string): boolean {
  let d = parseISO(start);
  const endD = parseISO(end);
  while (d <= endD) {
    const day = getDay(d);
    if (day === 5 || day === 6) return true;
    d = addDays(d, 1);
  }
  return false;
}

function inferRowType(start: string, end: string, holidayNames: string[]): ShiftRowType {
  if (holidayNames.length === 0) return 'shabbat';
  if (rangeHasWeekendDay(start, end)) return 'both';
  return 'holiday';
}

function dateLabelForRange(start: string, end: string, rowType: ShiftRowType): string {
  const s = parseISO(start);
  const e = parseISO(end);
  if (rowType === 'shabbat' && getDay(s) === 5 && toYmd(e) === toYmd(addDays(s, 1))) {
    return weekendLabel(s);
  }
  if (start === end) {
    return format(s, 'EEEE d.M', { locale: he });
  }
  return `${format(s, 'd.M')} – ${format(e, 'd.M')}`;
}

function createRow(start: string, end: string, holidayNames: string[]): ShiftRow {
  const rowType = inferRowType(start, end, holidayNames);
  return {
    key: start,
    start,
    end,
    dateLabel: dateLabelForRange(start, end, rowType),
    typeLabel: rowTypeLabel(rowType),
    rowType,
    holidayNames,
  };
}

function rangeIntersectsWeekend(
  range: { start: string; end: string },
  friday: Date
): boolean {
  let d = parseISO(range.start);
  const endD = parseISO(range.end);
  const friYmd = toYmd(friday);
  const satYmd = toYmd(addDays(friday, 1));
  while (d <= endD) {
    const ymd = toYmd(d);
    if (ymd === friYmd || ymd === satYmd) return true;
    d = addDays(d, 1);
  }
  return false;
}

function shouldMergeRows(a: ShiftRow, b: ShiftRow): boolean {
  const dayAfterA = toYmd(addDays(parseISO(a.end), 1));
  if (b.start !== dayAfterA) return false;
  if (a.holidayNames.length === 0 && b.holidayNames.length === 0) return false;
  if (a.holidayNames.length && b.holidayNames.length) {
    return holidaysRelated(a.holidayNames, b.holidayNames);
  }
  return a.holidayNames.length > 0 || b.holidayNames.length > 0;
}

function mergeTwoRows(a: ShiftRow, b: ShiftRow): ShiftRow {
  const start = a.start;
  const end = b.end;
  const holidayNames = mergeNameLists(a.holidayNames, b.holidayNames);
  return createRow(start, end, holidayNames);
}

function mergeConsecutiveRows(rows: ShiftRow[]): ShiftRow[] {
  if (rows.length <= 1) return rows;
  const sorted = [...rows].sort((x, y) => x.start.localeCompare(y.start));
  const out: ShiftRow[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (shouldMergeRows(current, next)) {
      current = mergeTwoRows(current, next);
    } else {
      out.push(current);
      current = next;
    }
  }
  out.push(current);
  return out;
}

export function buildShiftRows(from: Date, until: Date): ShiftRow[] {
  const fromDay = startOfDay(from);
  const untilDay = startOfDay(until);
  const fridays = upcomingFridays(untilDay).filter((f) => !isBefore(f, fromDay));
  const holidayDays = collectHolidayDays(fromDay, untilDay);
  const ranges = mergeHolidayRanges(holidayDays);
  const rows: ShiftRow[] = [];
  const consumedFridays = new Set<string>();

  for (const range of ranges) {
    const touchesWeekend = fridays.some((f) => rangeIntersectsWeekend(range, f));
    if (touchesWeekend) {
      for (const f of fridays) {
        if (rangeIntersectsWeekend(range, f)) consumedFridays.add(toYmd(f));
      }
      rows.push(createRow(range.start, range.end, range.names));
    }
  }

  for (const range of ranges) {
    const touchesWeekend = fridays.some((f) => rangeIntersectsWeekend(range, f));
    if (touchesWeekend) continue;
    rows.push(createRow(range.start, range.end, range.names));
  }

  for (const friday of fridays) {
    const key = toYmd(friday);
    if (consumedFridays.has(key)) continue;
    const sat = toYmd(addDays(friday, 1));
    const holidayNames = mergeNameLists(
      holidayDays.get(key) ?? [],
      holidayDays.get(sat) ?? []
    );
    rows.push(createRow(key, sat, holidayNames));
  }

  return mergeConsecutiveRows(rows);
}

export function defaultShiftRows(): ShiftRow[] {
  return buildShiftRows(startOfDay(new Date()), endOfYear(new Date()));
}

export function typeBadgeClass(rowType: ShiftRowType): string {
  if (rowType === 'both') return 'bg-emerald-100 text-emerald-900';
  if (rowType === 'holiday') return 'bg-violet-100 text-violet-900';
  return 'bg-amber-100 text-amber-900';
}

/** תאריכים מספריים (לא יום בשבוע) — להצגה משמאל לימין */
export function rowDateUsesLtr(row: ShiftRow): boolean {
  if (row.rowType === 'shabbat' || row.rowType === 'both') return true;
  return row.start !== row.end;
}
