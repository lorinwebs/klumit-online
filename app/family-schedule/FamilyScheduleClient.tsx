'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, Plus, X, AlertTriangle, Sparkles, Loader2, Trash2, RotateCcw, Megaphone, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import {
  format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, addMonths, subMonths,
  isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getHours, getMinutes,
  setHours, setMinutes, differenceInMinutes, isToday as isDateToday, startOfDay, endOfDay,
} from 'date-fns';
import { he } from 'date-fns/locale';

// --- Types ---
interface FamilyEvent {
  id: string; title: string; person: string; category: string;
  start_time: string; end_time: string; recurring: boolean;
  reminder_minutes?: number | null; notes?: string | null;
}
interface ParsedEvent {
  title: string; person: string; category: string; date: string;
  start_time: string; end_time: string; recurring: boolean; notes?: string;
  reminder_minutes?: number | null;
}
type ViewMode = 'day' | 'week' | 'month';

// --- Constants ---
const PEOPLE = ['לורין', 'מור', 'רון', 'שי', 'שחר', 'כולם'];
const DEFAULT_CATEGORIES = ['אימון', 'חוג', 'עבודה', 'משפחה', 'אחר'];

const PERSON_BG: Record<string, string> = {
  'לורין': '#ec4899',
  'מור': '#3b82f6',
  'רון': '#f59e0b',
  'שי': '#22c55e',
  'שחר': '#8b5cf6',
  'כולם': '#6366f1',
};
const PERSON_EMOJI: Record<string, string> = {
  'לורין': '👩', 'מור': '👨', 'רון': '👧', 'שי': '👧', 'שחר': '👧', 'כולם': '👨‍👩‍👧‍👧',
};
const CATEGORY_EMOJI: Record<string, string> = {
  'אימון': '🏋️', 'חוג': '🎨', 'עבודה': '💼', 'משפחה': '👨‍👩‍👧‍👧', 'אחר': '📌',
};
const PERSON_COLORS: Record<string, string> = {
  'לורין': 'bg-pink-100 text-pink-800', 'מור': 'bg-sky-100 text-sky-800',
  'רון': 'bg-amber-100 text-amber-800', 'שי': 'bg-lime-100 text-lime-800',
  'שחר': 'bg-violet-100 text-violet-800', 'כולם': 'bg-gray-100 text-gray-800',
};

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAYS_HE_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const ANNOUNCEMENT_COLORS = [
  { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
];

interface Announcement { id: string; text: string; color: number; created_at: string; }

function getPersonColor(person: string): string {
  return PERSON_BG[person] || '#6b7280';
}

function isMultiDayEvent(event: FamilyEvent): boolean {
  const start = startOfDay(new Date(event.start_time));
  const end = startOfDay(new Date(event.end_time));
  const daysDiff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return daysDiff >= 2;
}

// --- Helpers ---
function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(getHours(d)).padStart(2, '0')}:${String(getMinutes(d)).padStart(2, '0')}`;
}

function getWeekDates(date: Date): Date[] {
  const sun = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(sun, i));
}

function getEventsForDay(events: FamilyEvent[], day: Date): FamilyEvent[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();
  return events.filter(e => {
    const eStart = new Date(e.start_time).getTime();
    const eEnd = new Date(e.end_time).getTime();
    return eStart <= dayEnd && eEnd >= dayStart;
  });
}

function findConflicts(events: FamilyEvent[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (a.person !== b.person && a.person !== 'כולם' && b.person !== 'כולם') continue;
      const [as, ae, bs, be] = [new Date(a.start_time).getTime(), new Date(a.end_time).getTime(), new Date(b.start_time).getTime(), new Date(b.end_time).getTime()];
      if (as < be && bs < ae) { ids.add(a.id); ids.add(b.id); }
    }
  }
  return ids;
}

function findConflictPairs(events: FamilyEvent[]): [FamilyEvent, FamilyEvent][] {
  const pairs: [FamilyEvent, FamilyEvent][] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (a.person !== b.person && a.person !== 'כולם' && b.person !== 'כולם') continue;
      const [as, ae, bs, be] = [new Date(a.start_time).getTime(), new Date(a.end_time).getTime(), new Date(b.start_time).getTime(), new Date(b.end_time).getTime()];
      if (as < be && bs < ae) pairs.push([a, b]);
    }
  }
  return pairs;
}

function getHoursRange(events: FamilyEvent[], expandS = 0, expandE = 0) {
  let mn = 8, mx = 18;
  if (events.length > 0) {
    mn = 23; mx = 0;
    events.forEach(e => {
      const sh = getHours(new Date(e.start_time)), eh = getHours(new Date(e.end_time));
      const em = getMinutes(new Date(e.end_time));
      const eeh = em > 0 ? eh + 1 : eh;
      mn = Math.min(mn, sh, eh); mx = Math.max(mx, sh, eeh);
    });
  }
  mn = Math.max(0, mn - expandS); mx = Math.min(23, mx + expandE);
  if (mx - mn < 6) mx = Math.min(23, mn + 6);
  return { hours: Array.from({ length: mx - mn + 1 }, (_, i) => mn + i), minHour: mn, maxHour: mx, canExpandStart: mn > 0, canExpandEnd: mx < 23 };
}

function getActiveHoursForWeek(events: FamilyEvent[], weekDates: Date[]): Set<number> {
  const activeHours = new Set<number>();
  weekDates.forEach(day => {
    const dayEvents = getEventsForDay(events, day);
    dayEvents.forEach(e => {
      const startH = getHours(new Date(e.start_time));
      const endH = getHours(new Date(e.end_time));
      const endM = getMinutes(new Date(e.end_time));
      const actualEndH = endM > 0 ? endH + 1 : endH;
      for (let h = startH; h <= actualEndH; h++) activeHours.add(h);
    });
  });
  return activeHours;
}

interface HourRange { type: 'active' | 'collapsed'; hours: number[]; }
function groupHoursForDisplay(allHours: number[], activeHours: Set<number>): HourRange[] {
  const ranges: HourRange[] = [];
  let currentRange: HourRange | null = null;
  allHours.forEach(h => {
    const isActive = activeHours.has(h);
    if (!currentRange || currentRange.type !== (isActive ? 'active' : 'collapsed')) {
      if (currentRange) ranges.push(currentRange);
      currentRange = { type: isActive ? 'active' : 'collapsed', hours: [h] };
    } else {
      currentRange.hours.push(h);
    }
  });
  if (currentRange) ranges.push(currentRange);
  return ranges;
}

function getDisplayHoursForDay(ev: FamilyEvent, day: Date, minHour: number, maxHour: number): { startH: number; endH: number } {
  const evStart = new Date(ev.start_time);
  const evEnd = new Date(ev.end_time);
  const isStartDay = isSameDay(evStart, day);
  const isEndDay = isSameDay(evEnd, day);

  let startH: number, endH: number;
  if (isStartDay && isEndDay) {
    startH = getHours(evStart) + getMinutes(evStart) / 60;
    endH = getHours(evEnd) + getMinutes(evEnd) / 60;
  } else if (isStartDay) {
    startH = getHours(evStart) + getMinutes(evStart) / 60;
    endH = maxHour + 1;
  } else if (isEndDay) {
    startH = minHour;
    endH = getHours(evEnd) + getMinutes(evEnd) / 60;
  } else {
    startH = minHour;
    endH = maxHour + 1;
  }
  return { startH, endH };
}

// --- Overlap layout algorithm (Google Calendar style) ---
interface LayoutEvent extends FamilyEvent { col: number; colSpan: number; totalCols: number; }
function layoutOverlappingEvents(events: FamilyEvent[], _minHour: number): LayoutEvent[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => {
    const diff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (diff !== 0) return diff;
    return (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) - (new Date(a.end_time).getTime() - new Date(a.start_time).getTime());
  });
  const result: LayoutEvent[] = [];
  const groups: FamilyEvent[][] = [];
  let currentGroup: FamilyEvent[] = [sorted[0]];
  let groupEnd = new Date(sorted[0].end_time).getTime();
  for (let i = 1; i < sorted.length; i++) {
    const evStart = new Date(sorted[i].start_time).getTime();
    if (evStart < groupEnd) {
      currentGroup.push(sorted[i]);
      groupEnd = Math.max(groupEnd, new Date(sorted[i].end_time).getTime());
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
      groupEnd = new Date(sorted[i].end_time).getTime();
    }
  }
  groups.push(currentGroup);
  for (const group of groups) {
    const columns: FamilyEvent[][] = [];
    const eventCols = new Map<string, number>();
    for (const ev of group) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1];
        if (new Date(lastInCol.end_time).getTime() <= new Date(ev.start_time).getTime()) {
          columns[c].push(ev); eventCols.set(ev.id, c); placed = true; break;
        }
      }
      if (!placed) { columns.push([ev]); eventCols.set(ev.id, columns.length - 1); }
    }
    const totalCols = columns.length;
    for (const ev of group) {
      const col = eventCols.get(ev.id)!;
      let colSpan = 1;
      for (let nc = col + 1; nc < totalCols; nc++) {
        const blocked = columns[nc].some(o => {
          const os = new Date(o.start_time).getTime(), oe = new Date(o.end_time).getTime();
          const es = new Date(ev.start_time).getTime(), ee = new Date(ev.end_time).getTime();
          return es < oe && os < ee;
        });
        if (blocked) break;
        colSpan++;
      }
      result.push({ ...ev, col, colSpan, totalCols });
    }
  }
  return result;
}

// --- Now Indicator ---
function NowIndicator({ hourToOffset, cumulativeOffset }: { hourToOffset: Map<number, number>; cumulativeOffset: number }) {
  const now = new Date();
  if (!isDateToday(now)) return null;
  const nowH = getHours(now) + getMinutes(now) / 60;
  const baseOffset = hourToOffset.get(Math.floor(nowH));
  if (baseOffset === undefined) return null;
  const nowOffset = baseOffset + ((nowH % 1) * 60);
  if (nowOffset < 0 || nowOffset > cumulativeOffset) return null;
  return (
    <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none" style={{ top: `${nowOffset}px` }}>
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shadow-sm" />
      <div className="flex-1 border-t-2 border-red-500" />
    </div>
  );
}

// --- All-Day / Multi-Day Banner (Google Calendar style) ---
function AllDayBanner({ events, conflicts: _conflicts, onEventClick }: {
  events: FamilyEvent[]; conflicts: Set<string>; onEventClick: (e: FamilyEvent) => void;
}) {
  if (events.length === 0) return null;
  return (
    <div className="border-b border-gray-200 bg-gray-50/40 px-1 py-1 space-y-0.5">
      {events.map(ev => {
        const color = getPersonColor(ev.person);
        return (
          <button key={ev.id} onClick={() => onEventClick(ev)}
            className="w-full text-right px-2 py-1 rounded text-[11px] font-bold truncate hover:brightness-90 transition-all flex items-center gap-1.5 text-white"
            style={{ backgroundColor: color, borderRadius: '4px' }}>
            {ev.title}
            <span className="text-[9px] opacity-80 mr-auto">{fmtTime(ev.start_time)} - {fmtTime(ev.end_time)}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- Conflict Panel ---
function ConflictPanel({ isOpen, onClose, conflictPairs, onEventClick }: {
  isOpen: boolean; onClose: () => void;
  conflictPairs: [FamilyEvent, FamilyEvent][];
  onEventClick: (e: FamilyEvent) => void;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30 backdrop-blur-sm" />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{conflictPairs.length} קונפליקטים</h3>
              <p className="text-xs text-gray-500">אירועים חופפים לאותו אדם</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {conflictPairs.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין קונפליקטים כרגע</p>
            </div>
          )}
          {conflictPairs.map(([a, b], idx) => {
            const colorA = getPersonColor(a.person);
            const colorB = getPersonColor(b.person);
            return (
              <div key={idx} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <button onClick={() => { onEventClick(a); onClose(); }} className="w-full text-right p-3 hover:bg-gray-50 transition-colors flex items-start gap-3">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: colorA }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500">{PERSON_EMOJI[a.person] || '👤'} {a.person} &middot; {fmtTime(a.start_time)} - {fmtTime(a.end_time)}</p>
                  </div>
                </button>
                <div className="px-3 flex items-center gap-2">
                  <div className="flex-1 border-t border-dashed border-red-200" />
                  <span className="text-[10px] text-red-400 font-medium shrink-0">חפיפה</span>
                  <div className="flex-1 border-t border-dashed border-red-200" />
                </div>
                <button onClick={() => { onEventClick(b); onClose(); }} className="w-full text-right p-3 hover:bg-gray-50 transition-colors flex items-start gap-3">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: colorB }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.title}</p>
                    <p className="text-xs text-gray-500">{PERSON_EMOJI[b.person] || '👤'} {b.person} &middot; {fmtTime(b.start_time)} - {fmtTime(b.end_time)}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}.animate-slide-in-right{animation:slideInRight .2s ease-out}`}</style>
    </div>
  );
}

// --- Inline event rendering helper (Google Calendar style) ---
function renderInlineEvent(ev: LayoutEvent, opts: {
  top: number; height: number; rightPct: number; widthPct: number;
  isConflict: boolean; onClick: () => void;
  draggable?: boolean; onDragStart?: (e: React.DragEvent) => void;
}) {
  const color = getPersonColor(ev.person);
  return (
    <button
      key={ev.id}
      draggable={opts.draggable}
      onDragStart={opts.onDragStart}
      onClick={(e) => { e.stopPropagation(); opts.onClick(); }}
      style={{
        top: `${opts.top}px`,
        height: `${Math.max(opts.height, 20)}px`,
        right: `calc(${opts.rightPct}% + 1px)`,
        width: `calc(${opts.widthPct}% - 3px)`,
        backgroundColor: color,
        borderRadius: '4px',
      }}
      className="absolute px-1.5 py-0.5 overflow-hidden cursor-pointer hover:brightness-90 hover:shadow-md transition-all pointer-events-auto text-white"
    >
      <p className="text-[11px] font-bold truncate leading-tight">{ev.title}</p>
      {opts.height > 28 && <p className="text-[10px] opacity-85 leading-tight">{fmtTime(ev.start_time)} - {fmtTime(ev.end_time)}</p>}
      {opts.height > 48 && <p className="text-[9px] opacity-75 leading-tight mt-0.5">{ev.person}</p>}
    </button>
  );
}

// --- Event Block (compact mode for month view, Google Calendar style) ---
function EventBlockCompact({ event, isConflict: _isConflict, onClick, viewDay }: {
  event: FamilyEvent; isConflict: boolean; onClick?: () => void; viewDay?: Date;
}) {
  const color = getPersonColor(event.person);
  const evStart = new Date(event.start_time);
  const evEnd = new Date(event.end_time);
  const isMultiDay = !isSameDay(evStart, evEnd);
  const isFirstDay = viewDay ? isSameDay(evStart, viewDay) : true;
  const isLastDay = viewDay ? isSameDay(evEnd, viewDay) : true;
  const isAllDay = isMultiDay && !isFirstDay && !isLastDay;
  const timeLabel = isMultiDay
    ? (isFirstDay ? fmtTime(event.start_time) : isLastDay ? `עד ${fmtTime(event.end_time)}` : 'כל היום')
    : fmtTime(event.start_time);

  if (isAllDay || isMultiDay) {
    return (
      <button onClick={onClick} className="w-full text-right px-1.5 py-0.5 rounded text-[10px] leading-tight truncate hover:brightness-90 transition-all text-white font-medium" style={{ backgroundColor: color, borderRadius: '4px' }}>
        {event.title}
      </button>
    );
  }
  return (
    <button onClick={onClick} className="w-full text-right px-1.5 py-0.5 rounded text-[10px] leading-tight truncate hover:bg-gray-100 transition-all flex items-center gap-1" style={{ color: '#3c4043' }}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-gray-500">{timeLabel}</span> <span className="font-medium">{event.title}</span>
    </button>
  );
}

// --- Mobile Day View ---
function MobileDayView({ events, date, conflicts, onCellClick, onEventClick, minHour, hours }: {
  events: FamilyEvent[]; date: Date; conflicts: Set<string>;
  onCellClick: (d: Date, h: number) => void; onEventClick: (e: FamilyEvent) => void;
  minHour: number; hours: number[];
}) {
  const dayEvents = getEventsForDay(events, date);
  const multiDayEvents = dayEvents.filter(isMultiDayEvent);
  const timedEvents = dayEvents.filter(e => !isMultiDayEvent(e));
  const activeHours = new Set<number>();
  timedEvents.forEach(e => {
    const startH = getHours(new Date(e.start_time));
    const endH = getHours(new Date(e.end_time));
    const endM = getMinutes(new Date(e.end_time));
    const actualEndH = endM > 0 ? endH + 1 : endH;
    for (let h = startH; h <= actualEndH; h++) activeHours.add(h);
  });
  const hourRanges = groupHoursForDisplay(hours, activeHours);
  const laid = layoutOverlappingEvents(timedEvents, minHour);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedRanges, setExpandedRanges] = useState<Set<number>>(new Set());
  const toggleRange = (rangeIdx: number) => { setExpandedRanges(prev => { const next = new Set(prev); next.has(rangeIdx) ? next.delete(rangeIdx) : next.add(rangeIdx); return next; }); };

  const hourToOffset = new Map<number, number>();
  let cumulativeOffset = 0;
  hourRanges.forEach((range, idx) => {
    const isExpanded = expandedRanges.has(idx);
    if (range.type === 'collapsed' && !isExpanded) {
      range.hours.forEach(h => hourToOffset.set(h, cumulativeOffset));
      cumulativeOffset += 20;
    } else {
      range.hours.forEach(h => { hourToOffset.set(h, cumulativeOffset); cumulativeOffset += 60; });
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      const firstEvent = dayEvents.length > 0 ? Math.min(...dayEvents.map(e => getHours(new Date(e.start_time)))) : 8;
      const scrollTo = hourToOffset.get(firstEvent) || 0;
      scrollRef.current.scrollTop = Math.max(0, scrollTo - 60);
    }
  }, [date, dayEvents]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto bg-white">
      <AllDayBanner events={multiDayEvents} conflicts={conflicts} onEventClick={onEventClick} />
      <div className="relative" style={{ height: `${cumulativeOffset}px` }}>
        {hourRanges.map((range, rangeIdx) => {
          const isExpanded = expandedRanges.has(rangeIdx);
          if (range.type === 'collapsed' && !isExpanded) {
            const offset = hourToOffset.get(range.hours[0]) || 0;
            return (
              <div key={`range-${rangeIdx}`} className="absolute w-full border-b border-gray-100 bg-gray-50/50 flex" style={{ top: `${offset}px`, height: '20px' }} onClick={() => toggleRange(rangeIdx)}>
                <div className="w-12 text-[9px] text-gray-400 flex items-center justify-center shrink-0"><ChevronDown size={12} /></div>
                <div className="flex-1 flex items-center justify-center border-r border-gray-100">
                  <span className="text-[9px] text-gray-400">{range.hours[0]}:00 - {range.hours[range.hours.length - 1]}:00</span>
                </div>
              </div>
            );
          }
          return range.hours.map(hour => {
            const offset = hourToOffset.get(hour) || 0;
            return (
              <div key={hour} className="absolute w-full border-b border-gray-100 flex" style={{ top: `${offset}px`, height: '60px' }} onClick={() => onCellClick(date, hour)}>
                <div className="w-12 text-[11px] text-gray-400 text-left pl-2 pt-0.5 shrink-0 flex flex-col items-center">
                  <span>{String(hour).padStart(2, '0')}:00</span>
                  {range.type === 'collapsed' && isExpanded && (
                    <button onClick={(e) => { e.stopPropagation(); toggleRange(rangeIdx); }} className="text-gray-400 hover:text-gray-600 mt-0.5"><ChevronUp size={10} /></button>
                  )}
                </div>
                <div className="flex-1 border-r border-gray-100" />
              </div>
            );
          });
        })}
        <div className="absolute top-0 bottom-0" style={{ right: '48px', left: '4px' }}>
          {(() => {
            const maxHour = hours[hours.length - 1] ?? 23;
            return laid.map(ev => {
              const { startH, endH } = getDisplayHoursForDay(ev, date, minHour, maxHour);
              const startOffset = hourToOffset.get(Math.floor(startH)) || 0;
              const endOffset = hourToOffset.get(Math.min(Math.floor(endH), maxHour)) || 0;
              const top = startOffset + ((startH % 1) * 60);
              const height = Math.max(endOffset - startOffset + ((endH % 1) * 60) - ((startH % 1) * 60), 24);
                  return renderInlineEvent(ev, { top, height, rightPct: ev.col * (100 / ev.totalCols), widthPct: (ev.colSpan * 100) / ev.totalCols, isConflict: conflicts.has(ev.id), onClick: () => onEventClick(ev) });
            });
          })()}
        </div>
        {isDateToday(date) && <NowIndicator hourToOffset={hourToOffset} cumulativeOffset={cumulativeOffset} />}
      </div>
    </div>
  );
}

// --- Mobile Week Strip ---
function MobileWeekStrip({ weekDates, currentDate, onSelectDate, events }: {
  weekDates: Date[]; currentDate: Date; onSelectDate: (d: Date) => void; events: FamilyEvent[];
}) {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      {weekDates.map((d, i) => {
        const selected = isSameDay(d, currentDate);
        const today = isDateToday(d);
        const hasEvents = getEventsForDay(events, d).length > 0;
        return (
          <button key={i} onClick={() => onSelectDate(d)} className="flex-1 py-1.5 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-500">{DAYS_HE_SHORT[i]}</span>
            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
              ${selected ? 'bg-blue-500 text-white' : today ? 'bg-blue-100 text-blue-600' : 'text-gray-900 hover:bg-gray-100'}`}>
              {d.getDate()}
            </span>
            {hasEvents && !selected && <div className="w-1 h-1 rounded-full bg-blue-400" />}
            {!hasEvents && <div className="w-1 h-1" />}
          </button>
        );
      })}
    </div>
  );
}

// --- Desktop Week View ---
function WeekView({ events, weekDates, conflicts, onCellClick, onEventClick, expandStart, expandEnd, onEventDrop }: {
  events: FamilyEvent[]; weekDates: Date[]; conflicts: Set<string>;
  onCellClick: (d: Date, h: number) => void; onEventClick: (e: FamilyEvent) => void;
  expandStart: number; expandEnd: number;
  onEventDrop?: (e: FamilyEvent, d: Date, h: number) => void;
}) {
  const timedEvents = events.filter(e => !isMultiDayEvent(e));
  const { hours, minHour } = getHoursRange(timedEvents, expandStart, expandEnd);
  const activeHours = getActiveHoursForWeek(timedEvents, weekDates);
  const hourRanges = groupHoursForDisplay(hours, activeHours);
  const [draggedEvent, setDraggedEvent] = useState<FamilyEvent | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [expandedRanges, setExpandedRanges] = useState<Set<number>>(new Set());
  const gridCols = '60px repeat(7, 1fr)';
  const handleDrop = (d: Date, h: number) => { if (draggedEvent && onEventDrop) onEventDrop(draggedEvent, d, h); setDraggedEvent(null); setDragOverCell(null); };
  const toggleRange = (rangeIdx: number) => { setExpandedRanges(prev => { const next = new Set(prev); next.has(rangeIdx) ? next.delete(rangeIdx) : next.add(rangeIdx); return next; }); };

  const hourToOffset = new Map<number, number>();
  let cumulativeOffset = 0;
  hourRanges.forEach((range, idx) => {
    const isExpanded = expandedRanges.has(idx);
    if (range.type === 'collapsed' && !isExpanded) {
      range.hours.forEach(h => hourToOffset.set(h, cumulativeOffset));
      cumulativeOffset += 20;
    } else {
      range.hours.forEach(h => { hourToOffset.set(h, cumulativeOffset); cumulativeOffset += 60; });
    }
  });

  return (
    <div className="overflow-auto h-full">
      <div className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div style={{ display: 'grid', gridTemplateColumns: gridCols }}>
          <div />
          {weekDates.map((d, i) => {
            const today = isDateToday(d);
            const dayEventCount = getEventsForDay(events, d).length;
            return (
              <div key={i} className={`py-2.5 text-center border-r border-gray-100 ${today ? 'bg-blue-50/60' : ''}`}>
                <p className={`text-xs font-medium ${today ? 'text-blue-600' : 'text-gray-500'}`}>{DAYS_HE[i]}</p>
                <p className={`text-lg font-bold mt-0.5 ${today ? 'bg-blue-500 text-white w-9 h-9 rounded-full flex items-center justify-center mx-auto' : 'text-gray-900'}`}>{d.getDate()}</p>
                {dayEventCount > 0 && !today && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mx-auto mt-1" />}
              </div>
            );
          })}
        </div>
        {/* Multi-day event banners */}
        {(() => {
          const hasAny = weekDates.some(d => getEventsForDay(events, d).some(isMultiDayEvent));
          if (!hasAny) return null;
          return (
            <div className="border-t border-gray-100 bg-gray-50/30" style={{ display: 'grid', gridTemplateColumns: gridCols }}>
              <div className="text-[9px] text-gray-400 flex items-center justify-center py-0.5">כל היום</div>
              {weekDates.map((d, i) => {
                const mdEvents = getEventsForDay(events, d).filter(isMultiDayEvent);
                return (
                  <div key={i} className="border-r border-gray-100 px-0.5 py-0.5 space-y-0.5">
                    {mdEvents.map(ev => {
                      const color = getPersonColor(ev.person);
                      return (
                        <button key={ev.id} onClick={() => onEventClick(ev)}
                          className="w-full text-right px-1.5 py-0.5 rounded text-[10px] font-bold truncate hover:brightness-90 transition-all pointer-events-auto text-white"
                          style={{ backgroundColor: color, borderRadius: '4px' }}>
                          {ev.title}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      <div className="relative">
        {hourRanges.map((range, rangeIdx) => {
          const isExpanded = expandedRanges.has(rangeIdx);
          if (range.type === 'collapsed' && !isExpanded) {
            return (
              <div key={`range-${rangeIdx}`} className="border-b border-gray-100 bg-gray-50/50" style={{ display: 'grid', gridTemplateColumns: gridCols, height: '20px' }}>
                <button onClick={() => toggleRange(rangeIdx)} className="text-[9px] text-gray-400 hover:text-gray-600 flex items-center justify-center"><ChevronDown size={12} /></button>
                <div className="col-span-7 flex items-center justify-center border-r border-gray-100">
                  <span className="text-[9px] text-gray-400">{range.hours[0]}:00 - {range.hours[range.hours.length - 1]}:00</span>
                </div>
              </div>
            );
          }
          return range.hours.map(h => (
            <div key={h} className="border-b border-gray-50" style={{ display: 'grid', gridTemplateColumns: gridCols, height: '60px' }}>
              <div className="text-[11px] text-gray-400 text-center pt-0.5 flex flex-col items-center">
                <span>{String(h).padStart(2, '0')}:00</span>
                {range.type === 'collapsed' && isExpanded && (
                  <button onClick={() => toggleRange(rangeIdx)} className="text-gray-400 hover:text-gray-600 mt-0.5"><ChevronUp size={10} /></button>
                )}
              </div>
              {weekDates.map((d, di) => {
                const key = `${d.toISOString()}-${h}`;
                return (
                  <div key={di} className={`border-r border-gray-50 cursor-pointer hover:bg-blue-50/30 ${isDateToday(d) ? 'bg-blue-50/20' : ''} ${dragOverCell === key ? 'bg-blue-200/40' : ''}`}
                    onClick={() => onCellClick(d, h)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverCell(key); }}
                    onDragLeave={() => setDragOverCell(null)}
                    onDrop={(e) => { e.preventDefault(); handleDrop(d, h); }} />
                );
              })}
            </div>
          ));
        })}
        <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: `${cumulativeOffset}px`, display: 'grid', gridTemplateColumns: gridCols, pointerEvents: 'none' }}>
          <div className="relative">
            <NowIndicator hourToOffset={hourToOffset} cumulativeOffset={cumulativeOffset} />
          </div>
          {weekDates.map((d, di) => {
            const dayEvts = getEventsForDay(timedEvents, d);
            const laid = layoutOverlappingEvents(dayEvts, minHour);
            const maxHour = hours[hours.length - 1] ?? 23;
            return (
              <div key={di} className="relative border-r border-gray-50">
                {isDateToday(d) && <NowIndicator hourToOffset={hourToOffset} cumulativeOffset={cumulativeOffset} />}
                {laid.map(ev => {
                  const { startH, endH } = getDisplayHoursForDay(ev, d, minHour, maxHour);
                  const startOffset = hourToOffset.get(Math.floor(startH)) || 0;
                  const endOffset = hourToOffset.get(Math.min(Math.floor(endH), maxHour)) || 0;
                  const top = startOffset + ((startH % 1) * 60);
                  const height = Math.max(endOffset - startOffset + ((endH % 1) * 60) - ((startH % 1) * 60), 24);
                  return renderInlineEvent(ev, { top, height, rightPct: ev.col * (100 / ev.totalCols), widthPct: (ev.colSpan * 100) / ev.totalCols, isConflict: conflicts.has(ev.id), onClick: () => onEventClick(ev), draggable: true, onDragStart: (e) => { e.stopPropagation(); setDraggedEvent(ev); } });
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Desktop Day View ---
function DesktopDayView({ events, date, conflicts, onCellClick, onEventClick, expandStart, expandEnd, onEventDrop }: {
  events: FamilyEvent[]; date: Date; conflicts: Set<string>;
  onCellClick: (d: Date, h: number) => void; onEventClick: (e: FamilyEvent) => void;
  expandStart: number; expandEnd: number;
  onEventDrop?: (e: FamilyEvent, d: Date, h: number) => void;
}) {
  const dayEvents = getEventsForDay(events, date);
  const multiDayEvents = dayEvents.filter(isMultiDayEvent);
  const timedEvents = dayEvents.filter(e => !isMultiDayEvent(e));
  const { hours, minHour } = getHoursRange(timedEvents, expandStart, expandEnd);
  const activeHours = new Set<number>();
  timedEvents.forEach(e => {
    const startH = getHours(new Date(e.start_time));
    const endH = getHours(new Date(e.end_time));
    const endM = getMinutes(new Date(e.end_time));
    const actualEndH = endM > 0 ? endH + 1 : endH;
    for (let h = startH; h <= actualEndH; h++) activeHours.add(h);
  });
  const hourRanges = groupHoursForDisplay(hours, activeHours);
  const laid = layoutOverlappingEvents(timedEvents, minHour);
  const [draggedEvent, setDraggedEvent] = useState<FamilyEvent | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [expandedRanges, setExpandedRanges] = useState<Set<number>>(new Set());
  const toggleRange = (rangeIdx: number) => { setExpandedRanges(prev => { const next = new Set(prev); next.has(rangeIdx) ? next.delete(rangeIdx) : next.add(rangeIdx); return next; }); };

  const hourToOffset = new Map<number, number>();
  let cumulativeOffset = 0;
  hourRanges.forEach((range, idx) => {
    const isExpanded = expandedRanges.has(idx);
    if (range.type === 'collapsed' && !isExpanded) {
      range.hours.forEach(h => hourToOffset.set(h, cumulativeOffset));
      cumulativeOffset += 20;
    } else {
      range.hours.forEach(h => { hourToOffset.set(h, cumulativeOffset); cumulativeOffset += 60; });
    }
  });

  return (
    <div className="overflow-auto h-full">
      <div className="text-center py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <p className="text-sm text-gray-500">{DAYS_HE[getDay(date)]}</p>
        <p className="text-xl font-semibold text-gray-900">{format(date, 'd/M')}</p>
      </div>
      <AllDayBanner events={multiDayEvents} conflicts={conflicts} onEventClick={onEventClick} />
      <div className="relative">
        {hourRanges.map((range, rangeIdx) => {
          const isExpanded = expandedRanges.has(rangeIdx);
          if (range.type === 'collapsed' && !isExpanded) {
            return (
              <div key={`range-${rangeIdx}`} className="flex border-b border-gray-100 bg-gray-50/50" style={{ height: '20px' }}>
                <button onClick={() => toggleRange(rangeIdx)} className="w-[60px] text-[9px] text-gray-400 hover:text-gray-600 flex items-center justify-center shrink-0"><ChevronDown size={12} /></button>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[9px] text-gray-400">{range.hours[0]}:00 - {range.hours[range.hours.length - 1]}:00</span>
                </div>
              </div>
            );
          }
          return range.hours.map(h => (
            <div key={h} className="flex border-b border-gray-50" style={{ height: '60px' }}>
              <div className="w-[60px] text-[11px] text-gray-400 text-center pt-0.5 shrink-0 flex flex-col items-center">
                <span>{String(h).padStart(2, '0')}:00</span>
                {range.type === 'collapsed' && isExpanded && (
                  <button onClick={() => toggleRange(rangeIdx)} className="text-gray-400 hover:text-gray-600 mt-0.5"><ChevronUp size={10} /></button>
                )}
              </div>
              <div className={`flex-1 cursor-pointer hover:bg-blue-50/30 ${dragOverHour === h ? 'bg-blue-200/40' : ''}`}
                onClick={() => onCellClick(date, h)}
                onDragOver={(e) => { e.preventDefault(); setDragOverHour(h); }}
                onDragLeave={() => setDragOverHour(null)}
                onDrop={(e) => { e.preventDefault(); if (draggedEvent && onEventDrop) onEventDrop(draggedEvent, date, h); setDraggedEvent(null); setDragOverHour(null); }} />
            </div>
          ));
        })}
        <div className="absolute top-0 left-0" style={{ right: '60px', height: `${cumulativeOffset}px` }}>
          {isDateToday(date) && <NowIndicator hourToOffset={hourToOffset} cumulativeOffset={cumulativeOffset} />}
          {(() => {
            const maxHour = hours[hours.length - 1] ?? 23;
            return laid.map(ev => {
              const { startH, endH } = getDisplayHoursForDay(ev, date, minHour, maxHour);
              const startOffset = hourToOffset.get(Math.floor(startH)) || 0;
              const endOffset = hourToOffset.get(Math.min(Math.floor(endH), maxHour)) || 0;
              const top = startOffset + ((startH % 1) * 60);
              const height = Math.max(endOffset - startOffset + ((endH % 1) * 60) - ((startH % 1) * 60), 24);
              return renderInlineEvent(ev, { top, height, rightPct: ev.col * (100 / ev.totalCols), widthPct: (ev.colSpan * 100) / ev.totalCols, isConflict: conflicts.has(ev.id), onClick: () => onEventClick(ev), draggable: true, onDragStart: (e) => { e.stopPropagation(); setDraggedEvent(ev); } });
            });
          })()}
        </div>
      </div>
    </div>
  );
}

// --- Month View ---
function MonthView({ events, currentDate, conflicts, onDayClick }: {
  events: FamilyEvent[]; currentDate: Date; conflicts: Set<string>; onDayClick: (d: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const dates = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAYS_HE.map(d => <div key={d} className="p-2 text-center text-xs font-medium text-gray-500">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {dates.map((d, i) => {
          const isCur = d.getMonth() === currentDate.getMonth();
          const dayEvts = getEventsForDay(events, d);
          return (
            <div key={i} className={`min-h-[80px] md:min-h-[100px] border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-gray-50 ${!isCur ? 'bg-gray-50/50' : ''}`} onClick={() => onDayClick(d)}>
              <p className={`text-xs font-medium mb-1 ${isDateToday(d) ? 'bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center' : isCur ? 'text-gray-900' : 'text-gray-300'}`}>{d.getDate()}</p>
              <div className="space-y-0.5">
                {dayEvts.slice(0, 3).map(ev => <EventBlockCompact key={ev.id} event={ev} isConflict={conflicts.has(ev.id)} viewDay={d} />)}
                {dayEvts.length > 3 && <p className="text-[9px] text-gray-400 text-center">+{dayEvts.length - 3}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Event Modal ---
function EventModal({ isOpen, onClose, onSave, onDelete, initialDate, initialHour, editEvent, categories, onAddCategory }: {
  isOpen: boolean; onClose: () => void; onSave: (e: Omit<FamilyEvent, 'id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>; initialDate?: Date; initialHour?: number;
  editEvent?: FamilyEvent | null; categories: string[]; onAddCategory: (c: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [person, setPerson] = useState('לורין');
  const [category, setCategory] = useState('אחר');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [recurring, setRecurring] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editEvent) {
      setTitle(editEvent.title); setPerson(editEvent.person); setCategory(editEvent.category);
      setStartDate(format(new Date(editEvent.start_time), 'yyyy-MM-dd'));
      setEndDate(format(new Date(editEvent.end_time), 'yyyy-MM-dd'));
      setStartTime(fmtTime(editEvent.start_time)); setEndTime(fmtTime(editEvent.end_time));
      setRecurring(editEvent.recurring);
      setReminderMinutes(editEvent.reminder_minutes ? String(editEvent.reminder_minutes) : '');
      setNotes(editEvent.notes || '');
    } else {
      const d = initialDate || new Date();
      setTitle(''); setPerson('לורין'); setCategory('אחר');
      setStartDate(format(d, 'yyyy-MM-dd')); setEndDate(format(d, 'yyyy-MM-dd'));
      setStartTime(initialHour !== undefined ? `${String(initialHour).padStart(2, '0')}:00` : '08:00');
      setEndTime(initialHour !== undefined ? `${String(Math.min(initialHour + 1, 23)).padStart(2, '0')}:00` : '09:00');
      setRecurring(false); setReminderMinutes(''); setNotes('');
    }
    setAiText(''); setAiError('');
  }, [isOpen, editEvent, initialDate, initialHour]);

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true); setAiError('');
    try {
      const res = await fetch('/api/family/parse-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: aiText }) });
      const data = await res.json();
      if (data.error) { setAiError(data.error); return; }
      const p: ParsedEvent = data.parsed;
      if (p.title) setTitle(p.title);
      if (p.person && PEOPLE.includes(p.person)) setPerson(p.person);
      if (p.category && categories.includes(p.category)) setCategory(p.category);
      if (p.date) { setStartDate(p.date); setEndDate(p.date); }
      if (p.start_time) setStartTime(p.start_time);
      if (p.end_time) setEndTime(p.end_time);
      if (p.recurring !== undefined) setRecurring(p.recurring);
      if (p.reminder_minutes !== undefined && p.reminder_minutes !== null) setReminderMinutes(String(p.reminder_minutes));
      if (p.notes) setNotes(p.notes);
    } catch { setAiError('שגיאה בפענוח'); } finally { setAiLoading(false); }
  };

  const handleSave = async () => {
    if (!title || !startDate || !endDate || !startTime || !endTime) return;
    setSaving(true);
    try {
      await onSave({
        title, person, category,
        start_time: new Date(`${startDate}T${startTime}:00`).toISOString(),
        end_time: new Date(`${endDate}T${endTime}:00`).toISOString(),
        recurring, reminder_minutes: reminderMinutes ? parseInt(reminderMinutes) : null, notes: notes || null,
      });
      onClose();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!editEvent || !onDelete) return;
    setDeleting(true);
    try { await onDelete(editEvent.id); onClose(); } finally { setDeleting(false); }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; document.body.style.top = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm overscroll-none touch-none" onClick={onClose} onTouchMove={e => e.preventDefault()}>
      <div className="bg-white w-full md:max-w-md md:rounded-xl rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain touch-auto" onClick={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} dir="rtl">
        <div className="sticky top-0 bg-white rounded-t-2xl md:rounded-t-xl border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{editEvent ? 'עריכת אירוע' : 'אירוע חדש'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {!editEvent && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-2"><Sparkles size={14} className="text-blue-500" /><span className="text-xs font-medium text-blue-700">הוספה חכמה</span></div>
              <div className="flex gap-2">
                <input type="text" value={aiText} onChange={e => setAiText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiParse()} className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none bg-white" placeholder='למשל: "מור כדורסל יום שני 19:00"' />
                <button onClick={handleAiParse} disabled={aiLoading || !aiText.trim()} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">
                  {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} פענח
                </button>
              </div>
              {aiError && <p className="text-xs text-red-500 mt-1">{aiError}</p>}
            </div>
          )}
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all" placeholder="כותרת האירוע" />

          {/* Person selector as avatar chips */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">למי?</p>
            <div className="flex flex-wrap gap-2">
              {PEOPLE.map(p => {
                const color = getPersonColor(p);
                const isSelected = person === p;
                return (
                  <button key={p} onClick={() => setPerson(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${isSelected ? 'shadow-sm' : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    style={isSelected ? { borderColor: color, backgroundColor: color + '15', color } : undefined}>
                    <span className="text-sm">{PERSON_EMOJI[p] || '👤'}</span> {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category selector as pills */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">קטגוריה</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {CATEGORY_EMOJI[c] && <span>{CATEGORY_EMOJI[c]}</span>} {c}
                </button>
              ))}
              {!showNewCat ? (
                <button onClick={() => setShowNewCat(true)} className="px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><Plus size={14} /></button>
              ) : (
                <div className="flex items-center gap-1">
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newCatName.trim()) { onAddCategory(newCatName.trim()); setCategory(newCatName.trim()); setNewCatName(''); setShowNewCat(false); } }} autoFocus className="border border-gray-300 rounded-full px-3 py-1 text-xs outline-none w-24" placeholder="חדשה..." />
                  <button onClick={() => { setShowNewCat(false); setNewCatName(''); }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">מתאריך</p>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(e.target.value); }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">עד תאריך</p>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">שעת התחלה</p>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">שעת סיום</p>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-200" rows={2} placeholder="הערות (אופציונלי)" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="rounded border-gray-300" />
              <RotateCcw size={12} /> חוזר כל שבוע
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">תזכורת</span>
              <select value={reminderMinutes} onChange={e => setReminderMinutes(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white outline-none">
                <option value="">ללא</option>
                <option value="5">5 דק&apos;</option>
                <option value="10">10 דק&apos;</option>
                <option value="15">15 דק&apos;</option>
                <option value="30">30 דק&apos;</option>
                <option value="60">שעה</option>
                <option value="120">שעתיים</option>
                <option value="1440">יום</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving || !title} className="flex-1 bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors shadow-sm">
              {saving && <Loader2 size={14} className="animate-spin" />} {editEvent ? 'עדכן' : 'שמור'}
            </button>
            {editEvent && onDelete && (
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-3 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-red-50 transition-colors">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} מחק
              </button>
            )}
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">ביטול</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Filter Bar ---
function FilterBar({ selectedPeople, onTogglePerson }: { selectedPeople: Set<string>; onTogglePerson: (p: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PEOPLE.map(p => {
        const color = getPersonColor(p);
        const isActive = selectedPeople.has(p);
        return (
          <button key={p} onClick={() => onTogglePerson(p)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${isActive ? '' : 'border-transparent bg-gray-100 text-gray-400 opacity-50'}`}
            style={isActive ? { borderColor: color + '60', backgroundColor: color + '12', color } : undefined}>
            <span className="text-xs">{PERSON_EMOJI[p] || '👤'}</span> {p}
          </button>
        );
      })}
    </div>
  );
}

// ====================
// MAIN COMPONENT
// ====================
export default function FamilyScheduleClient() {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState<Date>();
  const [modalHour, setModalHour] = useState<number>();
  const [editEvent, setEditEvent] = useState<FamilyEvent | null>(null);
  const [selectedPeople, setSelectedPeople] = useState(new Set(PEOPLE));
  const [isMobile, setIsMobile] = useState(false);
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [pendingUndoDelete, setPendingUndoDelete] = useState<{ event: FamilyEvent; secondsLeft: number } | null>(null);
  const pendingDeleteRef = useRef<FamilyEvent | null>(null);
  const deleteTimeoutRef = useRef<number | null>(null);
  const deleteIntervalRef = useRef<number | null>(null);
  const deleteDeadlineRef = useRef<number>(0);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnInput, setShowAnnInput] = useState(false);
  const [annText, setAnnText] = useState('');
  const [expandStart, setExpandStart] = useState(0);
  const [expandEnd, setExpandEnd] = useState(0);
  const [customCats, setCustomCats] = useState<string[]>([]);
  const categories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCats], [customCats]);

  useEffect(() => {
    const saved = localStorage.getItem('family-schedule-custom-categories');
    if (saved) try { setCustomCats(JSON.parse(saved)); } catch {}
  }, []);
  const addCustomCat = (c: string) => {
    if (!c.trim() || categories.includes(c.trim())) return;
    const u = [...customCats, c.trim()];
    setCustomCats(u);
    localStorage.setItem('family-schedule-custom-categories', JSON.stringify(u));
  };

  useEffect(() => { const check = () => setIsMobile(window.innerWidth < 768); check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check); }, []);
  useEffect(() => { if (isMobile) setView('day'); }, [isMobile]);
  useEffect(() => { setExpandStart(0); setExpandEnd(0); }, [view]);

  const fetchEvents = useCallback(async () => {
    try {
      const wk = getWeekDates(currentDate);
      const s = addDays(wk[0], -35), e = addDays(wk[6], 35);
      const res = await fetch(`/api/family/events?start=${s.toISOString()}&end=${e.toISOString()}`);
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch {} finally { setLoading(false); }
  }, [currentDate]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const fetchAnn = useCallback(async () => {
    try { const res = await fetch('/api/family/announcements'); const d = await res.json(); if (d.announcements) setAnnouncements(d.announcements); } catch {}
  }, []);
  useEffect(() => { fetchAnn(); }, [fetchAnn]);

  const addAnn = async () => {
    if (!annText.trim()) return;
    await fetch('/api/family/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: annText.trim(), color: Math.floor(Math.random() * ANNOUNCEMENT_COLORS.length) }) });
    setAnnText(''); setShowAnnInput(false); await fetchAnn();
  };
  const delAnn = async (id: string) => { await fetch(`/api/family/announcements/${id}`, { method: 'DELETE' }); await fetchAnn(); };

  const filteredEvents = useMemo(() => {
    const pendingId = pendingUndoDelete?.event.id;
    return events.filter(e => (selectedPeople.has(e.person) || (e.person === 'כולם' && selectedPeople.size > 0)) && e.id !== pendingId);
  }, [events, selectedPeople, pendingUndoDelete]);
  const conflicts = useMemo(() => findConflicts(filteredEvents), [filteredEvents]);
  const conflictPairs = useMemo(() => findConflictPairs(filteredEvents), [filteredEvents]);
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const hoursInfo = useMemo(() => {
    const evts = view === 'day' ? getEventsForDay(filteredEvents, currentDate) : filteredEvents;
    return getHoursRange(evts, expandStart, expandEnd);
  }, [filteredEvents, currentDate, view, expandStart, expandEnd]);

  const navBack = () => {
    if (view === 'day') setCurrentDate(d => addDays(d, -1));
    else if (view === 'week') setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subMonths(d, 1));
    setExpandStart(0); setExpandEnd(0);
  };
  const navForward = () => {
    if (view === 'day') setCurrentDate(d => addDays(d, 1));
    else if (view === 'week') setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addMonths(d, 1));
    setExpandStart(0); setExpandEnd(0);
  };

  const togglePerson = (p: string) => setSelectedPeople(s => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });

  const handleSave = async (data: Omit<FamilyEvent, 'id'>) => {
    if (editEvent) await fetch(`/api/family/events/${editEvent.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    else await fetch('/api/family/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    await fetchEvents();
  };
  const clearPendingDeleteTimers = () => {
    if (deleteTimeoutRef.current !== null) { window.clearTimeout(deleteTimeoutRef.current); deleteTimeoutRef.current = null; }
    if (deleteIntervalRef.current !== null) { window.clearInterval(deleteIntervalRef.current); deleteIntervalRef.current = null; }
  };
  const commitDeleteNow = async (id: string) => { await fetch(`/api/family/events/${id}`, { method: 'DELETE' }); await fetchEvents(); };
  const handleDelete = async (id: string) => {
    if (pendingDeleteRef.current) {
      const prevPending = pendingDeleteRef.current;
      clearPendingDeleteTimers(); pendingDeleteRef.current = null; setPendingUndoDelete(null);
      await commitDeleteNow(prevPending.id);
    }
    const target = events.find(e => e.id === id) || editEvent;
    if (!target) { await commitDeleteNow(id); return; }
    pendingDeleteRef.current = target;
    deleteDeadlineRef.current = Date.now() + 10000;
    setPendingUndoDelete({ event: target, secondsLeft: 10 });
    setEvents(prev => prev.filter(e => e.id !== id));
    deleteTimeoutRef.current = window.setTimeout(async () => {
      const pending = pendingDeleteRef.current;
      clearPendingDeleteTimers(); pendingDeleteRef.current = null; setPendingUndoDelete(null);
      if (pending) await commitDeleteNow(pending.id);
    }, 10000);
    deleteIntervalRef.current = window.setInterval(() => {
      const msLeft = Math.max(0, deleteDeadlineRef.current - Date.now());
      const secondsLeft = Math.ceil(msLeft / 1000);
      setPendingUndoDelete(prev => (prev ? { ...prev, secondsLeft } : null));
    }, 250);
  };
  const handleUndoDelete = () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    clearPendingDeleteTimers(); pendingDeleteRef.current = null; setPendingUndoDelete(null);
    setEvents(prev => [...prev, pending].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
  };
  useEffect(() => () => clearPendingDeleteTimers(), []);
  const handleDrop = async (ev: FamilyEvent, newDate: Date, newHour: number) => {
    const dur = differenceInMinutes(new Date(ev.end_time), new Date(ev.start_time));
    const ns = setMinutes(setHours(newDate, newHour), 0);
    const ne = addDays(ns, 0); ne.setMinutes(ne.getMinutes() + dur);
    await fetch(`/api/family/events/${ev.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ev, start_time: ns.toISOString(), end_time: ne.toISOString() }) });
    await fetchEvents();
  };

  const openAdd = (d?: Date, h?: number) => { setEditEvent(null); setModalDate(d); setModalHour(h); setShowModal(true); };
  const openEdit = (e: FamilyEvent) => { setEditEvent(e); setShowModal(true); };

  const getTitle = () => {
    if (view === 'day') return `${DAYS_HE[getDay(currentDate)]} ${format(currentDate, 'd/M')}`;
    if (view === 'week') return `${format(weekDates[0], 'd/M')} - ${format(weekDates[6], 'd/M')}`;
    return `${MONTHS_HE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const conflictCount = conflictPairs.length;

  // =====================
  // MOBILE LAYOUT
  // =====================
  if (isMobile) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden family-schedule-root" dir="rtl">
        <style>{`.family-schedule-root button,.family-schedule-root a,.family-schedule-root [role="button"]{min-height:unset!important;min-width:unset!important;}`}</style>

        <div className="bg-white px-3 py-2 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900">{getTitle()}</span>
            {conflictCount > 0 && (
              <button onClick={() => setShowConflictPanel(true)} className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {conflictCount}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowMobileFilters(f => !f)} className={`p-1.5 rounded-full ${showMobileFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}><Filter size={16} /></button>
            <div className="flex items-center gap-0.5">
              <button onClick={navBack} className="p-1.5 hover:bg-gray-100 rounded-full"><ChevronRight size={18} className="text-gray-600" /></button>
              <button onClick={navForward} className="p-1.5 hover:bg-gray-100 rounded-full"><ChevronLeft size={18} className="text-gray-600" /></button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded">היום</button>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(['day', 'week', 'month'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-2 py-0.5 rounded text-[10px] font-medium ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
                  {v === 'day' ? 'יום' : v === 'week' ? 'שבוע' : 'חודש'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showMobileFilters && (
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
            <FilterBar selectedPeople={selectedPeople} onTogglePerson={togglePerson} />
          </div>
        )}

        {view === 'day' && <MobileWeekStrip weekDates={weekDates} currentDate={currentDate} onSelectDate={setCurrentDate} events={filteredEvents} />}

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : (
          <>
            {view === 'day' && <MobileDayView events={filteredEvents} date={currentDate} conflicts={conflicts} onCellClick={openAdd} onEventClick={openEdit} minHour={hoursInfo.minHour} hours={hoursInfo.hours} />}
            {view === 'week' && <div className="flex-1 overflow-auto"><WeekView events={filteredEvents} weekDates={weekDates} conflicts={conflicts} onCellClick={openAdd} onEventClick={openEdit} expandStart={expandStart} expandEnd={expandEnd} /></div>}
            {view === 'month' && <div className="flex-1 overflow-auto"><MonthView events={filteredEvents} currentDate={currentDate} conflicts={conflicts} onDayClick={d => { setCurrentDate(d); setView('day'); }} /></div>}
          </>
        )}

        {view === 'day' && (
          <div className="bg-white border-t border-gray-100 px-4 py-1.5 flex items-center justify-center">
            <span className="text-sm text-gray-500">{DAYS_HE[getDay(currentDate)]}</span>
          </div>
        )}

        <button onClick={() => openAdd(currentDate)} className="fixed bottom-20 left-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-40 hover:shadow-2xl transition-shadow">
          <Plus size={28} />
        </button>

        <EventModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} onDelete={handleDelete} initialDate={modalDate} initialHour={modalHour} editEvent={editEvent} categories={categories} onAddCategory={addCustomCat} />
        <ConflictPanel isOpen={showConflictPanel} onClose={() => setShowConflictPanel(false)} conflictPairs={conflictPairs} onEventClick={openEdit} />
        {pendingUndoDelete && (
          <div className="fixed bottom-4 right-1/2 translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs">האירוע &quot;{pendingUndoDelete.event.title}&quot; נמחק ({pendingUndoDelete.secondsLeft})</span>
            <button onClick={handleUndoDelete} className="text-xs font-semibold text-blue-300 hover:text-blue-200">UNDO</button>
          </div>
        )}
      </div>
    );
  }

  // =====================
  // DESKTOP LAYOUT
  // =====================
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden family-schedule-root" dir="rtl">
      <style>{`.family-schedule-root button,.family-schedule-root a,.family-schedule-root [role="button"]{min-height:unset!important;min-width:unset!important;}`}</style>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">לוז משפחתי</h1>
              {conflictCount > 0 && (
                <button onClick={() => setShowConflictPanel(true)} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {conflictCount} קונפליקטים
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAnnInput(true)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"><Megaphone size={14} /> הודעה</button>
              <button onClick={() => openAdd()} className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 shadow-sm transition-colors"><Plus size={16} /> אירוע חדש</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-xl p-0.5">
                {(['day', 'week', 'month'] as ViewMode[]).map(v => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {v === 'day' ? 'יום' : v === 'week' ? 'שבוע' : 'חודש'}
                  </button>
                ))}
              </div>
              <div className="flex items-center">
                <button onClick={navBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={18} className="text-gray-600" /></button>
                <button onClick={navForward} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={18} className="text-gray-600" /></button>
              </div>
              <button onClick={() => setCurrentDate(new Date())} className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">היום</button>
              <span className="text-sm font-bold text-gray-900">{getTitle()}</span>
            </div>
            <FilterBar selectedPeople={selectedPeople} onTogglePerson={togglePerson} />
          </div>
        </div>
      </div>

      {(announcements.length > 0 || showAnnInput) && (
        <div className="max-w-7xl w-full mx-auto px-6 pt-2">
          <div className="flex flex-wrap gap-2 items-center">
            {announcements.map(a => {
              const c = ANNOUNCEMENT_COLORS[a.color] || ANNOUNCEMENT_COLORS[0];
              return <div key={a.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${c.bg} ${c.text} ${c.border}`}><span>{a.text}</span><button onClick={() => delAnn(a.id)} className="hover:opacity-60"><X size={14} /></button></div>;
            })}
            {showAnnInput && (
              <div className="flex items-center gap-1.5">
                <input type="text" value={annText} onChange={e => setAnnText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAnn()} autoFocus className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none w-48" placeholder="כתבו הודעה..." />
                <button onClick={addAnn} className="px-2 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium">שמור</button>
                <button onClick={() => { setShowAnnInput(false); setAnnText(''); }}><X size={14} className="text-gray-400" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex items-stretch relative">
        <button onClick={navBack} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white border border-gray-200 shadow-md rounded-l-lg p-2"><ChevronRight size={20} className="text-gray-600" /></button>
        <button onClick={navForward} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white border border-gray-200 shadow-md rounded-r-lg p-2"><ChevronLeft size={20} className="text-gray-600" /></button>

        <div className="flex-1 min-h-0 max-w-7xl w-full mx-auto flex flex-col">
          {!loading && view !== 'month' && hoursInfo.canExpandStart && (
            <div className="bg-white border-b border-gray-200 py-1.5 flex items-center justify-center rounded-t-lg">
              <button onClick={() => setExpandStart(s => s + 2)} className="bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-700 font-medium"><ChevronUp size={16} /> הוסף שעות מוקדם יותר</button>
            </div>
          )}
          <div className="flex-1 min-h-0 bg-white border border-gray-200 shadow-sm overflow-hidden rounded-lg">
            {loading ? <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-400" /></div> : (
              <>
                {view === 'week' && <WeekView events={filteredEvents} weekDates={weekDates} conflicts={conflicts} onCellClick={openAdd} onEventClick={openEdit} expandStart={expandStart} expandEnd={expandEnd} onEventDrop={handleDrop} />}
                {view === 'day' && <DesktopDayView events={filteredEvents} date={currentDate} conflicts={conflicts} onCellClick={openAdd} onEventClick={openEdit} expandStart={expandStart} expandEnd={expandEnd} onEventDrop={handleDrop} />}
                {view === 'month' && <MonthView events={filteredEvents} currentDate={currentDate} conflicts={conflicts} onDayClick={d => { setCurrentDate(d); setView('day'); }} />}
              </>
            )}
          </div>
          {!loading && view !== 'month' && hoursInfo.canExpandEnd && (
            <div className="bg-white border-t border-gray-200 py-1.5 flex items-center justify-center rounded-b-lg">
              <button onClick={() => setExpandEnd(s => s + 2)} className="bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-700 font-medium"><ChevronDown size={16} /> הוסף שעות מאוחר יותר</button>
            </div>
          )}
        </div>
      </div>

      <EventModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} onDelete={handleDelete} initialDate={modalDate} initialHour={modalHour} editEvent={editEvent} categories={categories} onAddCategory={addCustomCat} />
      <ConflictPanel isOpen={showConflictPanel} onClose={() => setShowConflictPanel(false)} conflictPairs={conflictPairs} onEventClick={openEdit} />
      {pendingUndoDelete && (
        <div className="fixed bottom-4 right-1/2 translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-xs">האירוע &quot;{pendingUndoDelete.event.title}&quot; נמחק ({pendingUndoDelete.secondsLeft})</span>
          <button onClick={handleUndoDelete} className="text-xs font-semibold text-blue-300 hover:text-blue-200">UNDO</button>
        </div>
      )}
    </div>
  );
}
