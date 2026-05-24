import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { he } from 'date-fns/locale';

export const SUMMER_START = '2026-07-01';
export const SUMMER_END = '2026-08-31';

export const PRESET_SITTERS = ['רון', 'שי', 'שחר'] as const;

export const ABROAD_PERIODS = [
  { start: '2026-07-08', end: '2026-07-15', label: 'איסקיה' },
  { start: '2026-08-08', end: '2026-08-22', label: 'אוסטריה' },
] as const;

export const HEBREW_WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] as const;

export const SUMMER_MONTHS = [
  { year: 2026, month: 7 },
  { year: 2026, month: 8 },
] as const;

export interface SummerShiftRow {
  key: string;
  dateLabel: string;
  abroadLabel: string | null;
  abroadShort: string | null;
}

export interface CalendarDay {
  key: string;
  day: number;
  inRange: boolean;
  abroadShort: string | null;
}

export interface CalendarMonth {
  year: number;
  month: number;
  title: string;
  weeks: (CalendarDay | null)[][];
}

function toYmd(d: Date): string {
  return format(startOfDay(d), 'yyyy-MM-dd');
}

function abroadShortFor(ymd: string): string | null {
  for (const period of ABROAD_PERIODS) {
    if (ymd >= period.start && ymd <= period.end) return period.label;
  }
  return null;
}

function inSummerRange(ymd: string): boolean {
  return ymd >= SUMMER_START && ymd <= SUMMER_END;
}

export function isWeekend(ymd: string): boolean {
  const day = getDay(parseISO(ymd));
  return day === 5 || day === 6;
}

/** א׳–ה׳ בבית — נחשב מסודר */
export function isCholAtHome(ymd: string): boolean {
  return inSummerRange(ymd) && !isWeekend(ymd) && !abroadShortFor(ymd);
}

/** ימים לבנים בבית — לא סופ״ש, לא חו״ל */
export function isTrackedScheduleDay(ymd: string): boolean {
  return isCholAtHome(ymd);
}

export function hasSchedule(
  ymd: string,
  assignments: Record<string, string[]>,
): boolean {
  return (assignments[ymd]?.length ?? 0) > 0;
}

export function scheduleMetrics(
  rows: SummerShiftRow[],
  assignments: Record<string, string[]>,
): { total: number; assigned: number; unassigned: number } {
  const tracked = rows.filter((r) => isTrackedScheduleDay(r.key));
  const assigned = tracked.filter((r) => hasSchedule(r.key, assignments)).length;
  return {
    total: tracked.length,
    assigned,
    unassigned: tracked.length - assigned,
  };
}

export function buildSummerShiftRows(): SummerShiftRow[] {
  const rows: SummerShiftRow[] = [];
  let d = parseISO(SUMMER_START);
  const end = parseISO(SUMMER_END);

  while (d <= end) {
    const key = toYmd(d);
    const abroadShort = abroadShortFor(key);
    rows.push({
      key,
      dateLabel: format(d, 'EEEE d.M', { locale: he }),
      abroadLabel: abroadShort ? `חו״ל · ${abroadShort}` : null,
      abroadShort,
    });
    d = addDays(d, 1);
  }

  return rows;
}

export function buildCalendarMonth(year: number, month: number): CalendarMonth {
  const first = startOfMonth(new Date(year, month - 1, 1));
  const last = endOfMonth(first);
  const title = format(first, 'LLLL yyyy', { locale: he });

  const weeks: (CalendarDay | null)[][] = [];
  let week: (CalendarDay | null)[] = [];

  const leading = getDay(first);
  for (let i = 0; i < leading; i++) week.push(null);

  let d = first;
  while (d <= last) {
    const key = toYmd(d);
    week.push({
      key,
      day: d.getDate(),
      inRange: inSummerRange(key),
      abroadShort: abroadShortFor(key),
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    d = addDays(d, 1);
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return { year, month, title, weeks };
}

export function abroadCellClass(label: string | null): string {
  if (!label) return '';
  if (label === 'איסקיה') return 'bg-orange-50 ring-1 ring-inset ring-orange-200';
  return 'bg-indigo-50 ring-1 ring-inset ring-indigo-200';
}

export function weekendCellClass(): string {
  return 'bg-violet-100/70';
}

export function abroadChipClass(label: string): string {
  if (label === 'איסקיה') return 'bg-orange-200 text-orange-950';
  return 'bg-indigo-200 text-indigo-950';
}

export function abroadBadgeClass(label: string): string {
  if (label.includes('איסקיה')) return 'bg-orange-100 text-orange-900';
  return 'bg-indigo-100 text-indigo-900';
}

export type FilterMode = 'all' | 'july' | 'august' | 'abroad';

export function filterSummerRows(rows: SummerShiftRow[], filter: FilterMode): SummerShiftRow[] {
  if (filter === 'all') return rows;
  if (filter === 'july') return rows.filter((r) => r.key.startsWith('2026-07'));
  if (filter === 'august') return rows.filter((r) => r.key.startsWith('2026-08'));
  return rows.filter((r) => r.abroadLabel !== null);
}

export function hebrewDayCount(n: number): string {
  if (n === 1) return 'יום אחד';
  if (n === 2) return 'יומיים';
  return `${n} ימים`;
}

export function countUnassignedDays(
  rows: SummerShiftRow[],
  assignments: Record<string, string[]>,
): number {
  return scheduleMetrics(rows, assignments).unassigned;
}

export function vacationCountdown(from: Date = new Date()): { value: string; sub: string } {
  const today = startOfDay(from);
  const start = startOfDay(parseISO(SUMMER_START));
  const end = startOfDay(parseISO(SUMMER_END));

  if (today > end) {
    return { value: 'הסתיים', sub: 'חופש הגדול 2026' };
  }
  if (today >= start) {
    return { value: 'בעיצומו', sub: 'חופש הגדול' };
  }

  const daysLeft = differenceInCalendarDays(start, today);
  if (daysLeft === 0) {
    return { value: 'היום', sub: 'תחילת החופש הגדול' };
  }
  return { value: hebrewDayCount(daysLeft), sub: 'עד תחילת החופש הגדול' };
}
