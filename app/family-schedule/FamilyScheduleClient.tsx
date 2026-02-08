'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Plus, X, AlertTriangle, Sparkles, Loader2, Trash2, RotateCcw, Megaphone, ChevronUp, ChevronDown } from 'lucide-react';

// --- Types ---
interface FamilyEvent {
  id: string;
  title: string;
  person: string;
  category: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  reminder_minutes?: number | null;
  notes?: string | null;
}

interface ParsedEvent {
  title: string;
  person: string;
  category: string;
  date: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  notes?: string;
}

type ViewMode = 'day' | 'week' | 'month';

// --- Constants ---
const PEOPLE = ['לורין', 'מור', 'רון', 'שי', 'שחר', 'כולם'];
const DEFAULT_CATEGORIES = ['אימון', 'חוג', 'עבודה', 'משפחה', 'אחר'];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'אימון': { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', dot: 'bg-blue-400' },
  'חוג': { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', dot: 'bg-purple-400' },
  'עבודה': { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  'משפחה': { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', dot: 'bg-orange-400' },
  'אחר': { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', dot: 'bg-gray-400' },
};

const PERSON_COLORS: Record<string, string> = {
  'לורין': 'bg-pink-100 text-pink-800',
  'מור': 'bg-sky-100 text-sky-800',
  'רון': 'bg-amber-100 text-amber-800',
  'שי': 'bg-lime-100 text-lime-800',
  'שחר': 'bg-violet-100 text-violet-800',
  'כולם': 'bg-gray-100 text-gray-800',
};

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAYS_HE_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const ANNOUNCEMENT_COLORS = [
  { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
];

interface Announcement {
  id: string;
  text: string;
  color: number;
  created_at: string;
}

// --- Helpers ---
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getWeekDates(date: Date): Date[] {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getEventsForDay(events: FamilyEvent[], day: Date): FamilyEvent[] {
  return events.filter(e => isSameDay(new Date(e.start_time), day));
}

function findConflicts(events: FamilyEvent[]): Set<string> {
  const conflictIds = new Set<string>();
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      if (a.person !== b.person && a.person !== 'כולם' && b.person !== 'כולם') continue;
      const aStart = new Date(a.start_time).getTime();
      const aEnd = new Date(a.end_time).getTime();
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      if (aStart < bEnd && bStart < aEnd) {
        conflictIds.add(a.id);
        conflictIds.add(b.id);
      }
    }
  }
  return conflictIds;
}

function getHoursRange(events: FamilyEvent[], expandStart = 0, expandEnd = 0): { hours: number[]; minHour: number; maxHour: number; canExpandStart: boolean; canExpandEnd: boolean } {
  let minHour = 8;
  let maxHour = 18;

  if (events.length > 0) {
    minHour = 23;
    maxHour = 0;

    events.forEach(event => {
      const startHour = new Date(event.start_time).getHours();
      const endHour = new Date(event.end_time).getHours();
      const endMinutes = new Date(event.end_time).getMinutes();
      const eventEndHour = endMinutes > 0 ? endHour + 1 : endHour;

      const actualMinHour = Math.min(startHour, endHour);
      const actualMaxHour = Math.max(startHour, eventEndHour);

      if (actualMinHour < minHour) minHour = actualMinHour;
      if (actualMaxHour > maxHour) maxHour = actualMaxHour;
    });
  }

  minHour = Math.max(0, minHour - expandStart);
  maxHour = Math.min(23, maxHour + expandEnd);

  if (maxHour - minHour < 6) {
    maxHour = Math.min(23, minHour + 6);
  }

  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  return { hours, minHour, maxHour, canExpandStart: minHour > 0, canExpandEnd: maxHour < 23 };
}

// --- Event Block ---
function EventBlock({ event, isConflict, compact = false, onClick, minHour = 6, onDragStart }: { event: FamilyEvent; isConflict: boolean; compact?: boolean; onClick?: () => void; minHour?: number; onDragStart?: (event: FamilyEvent) => void }) {
  const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['אחר'];
  const personColor = PERSON_COLORS[event.person] || 'bg-gray-100 text-gray-800';

  if (compact) {
    return (
      <button onClick={onClick} className={`w-full text-right px-1.5 py-0.5 rounded text-[10px] leading-tight border-r-2 ${colors.bg} ${colors.border} ${colors.text} ${isConflict ? 'ring-1 ring-red-400' : ''} hover:opacity-80 transition-opacity truncate`}>
        {isConflict && <AlertTriangle size={8} className="inline text-red-500 ml-0.5" />}
        <span className="font-medium">{formatTime(event.start_time)}</span> {event.title}
      </button>
    );
  }

  const startH = new Date(event.start_time).getHours() + new Date(event.start_time).getMinutes() / 60;
  const endH = new Date(event.end_time).getHours() + new Date(event.end_time).getMinutes() / 60;
  const duration = Math.abs(endH - startH);
  const top = (Math.min(startH, endH) - minHour) * 60;
  const height = Math.max(duration * 60, 28);

  return (
    <button
      draggable
      onDragStart={(e) => { e.stopPropagation(); if (onDragStart) onDragStart(event); }}
      onClick={onClick}
      style={{ top: `${top}px`, height: `${height}px` }}
      className={`absolute right-0.5 left-0.5 rounded-md border-r-[3px] px-1.5 py-0.5 overflow-hidden cursor-move transition-all hover:shadow-md pointer-events-auto ${colors.bg} ${colors.border} ${isConflict ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
    >
      {isConflict && <div className="absolute top-0.5 left-0.5"><AlertTriangle size={10} className="text-red-500" /></div>}
      <p className={`text-[10px] font-semibold truncate ${colors.text}`}>{event.title}</p>
      {height > 30 && <p className="text-[9px] text-gray-500">{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>}
      {height > 45 && <span className={`inline-block text-[8px] px-1 rounded mt-0.5 ${personColor}`}>{event.person}</span>}
    </button>
  );
}

// --- Add/Edit Event Modal ---
function EventModal({ isOpen, onClose, onSave, onDelete, initialDate, initialHour, editEvent, categories, onAddCategory }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<FamilyEvent, 'id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialDate?: Date;
  initialHour?: number;
  editEvent?: FamilyEvent | null;
  categories: string[];
  onAddCategory: (category: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [person, setPerson] = useState('לורין');
  const [category, setCategory] = useState('אחר');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [recurring, setRecurring] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // AI
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // New category
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editEvent) {
      setTitle(editEvent.title);
      setPerson(editEvent.person);
      setCategory(editEvent.category);
      const startDateStr = new Date(editEvent.start_time).toISOString().split('T')[0];
      const endDateStr = new Date(editEvent.end_time).toISOString().split('T')[0];
      setStartDate(startDateStr);
      setEndDate(endDateStr);
      setStartTime(formatTime(editEvent.start_time));
      setEndTime(formatTime(editEvent.end_time));
      setRecurring(editEvent.recurring);
      setReminderMinutes(editEvent.reminder_minutes ? String(editEvent.reminder_minutes) : '');
      setNotes(editEvent.notes || '');
    } else {
      const d = initialDate || new Date();
      const dateStr = d.toISOString().split('T')[0];
      setTitle('');
      setPerson('לורין');
      setCategory('אחר');
      setStartDate(dateStr);
      setEndDate(dateStr);
      setStartTime(initialHour !== undefined ? `${String(initialHour).padStart(2, '0')}:00` : '08:00');
      setEndTime(initialHour !== undefined ? `${String(Math.min(initialHour + 1, 23)).padStart(2, '0')}:00` : '09:00');
      setRecurring(false);
      setReminderMinutes('');
      setNotes('');
    }
    setAiText('');
    setAiError('');
  }, [isOpen, editEvent, initialDate, initialHour]);

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/family/parse-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });
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
      if (p.notes) setNotes(p.notes);
    } catch {
      setAiError('שגיאה בפענוח');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !startDate || !endDate || !startTime || !endTime) return;
    setSaving(true);
    try {
      const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endISO = new Date(`${endDate}T${endTime}:00`).toISOString();
      await onSave({
        title, person, category,
        start_time: startISO,
        end_time: endISO,
        recurring,
        reminder_minutes: reminderMinutes ? parseInt(reminderMinutes) : null,
        notes: notes || null,
      });
      onClose();
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editEvent || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(editEvent.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="sticky top-0 bg-white rounded-t-xl border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{editEvent ? 'עריכת אירוע' : 'אירוע חדש'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* AI Input */}
          {!editEvent && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-700">הוספה חכמה</span>
              </div>
              <div className="flex gap-2">
                <input type="text" value={aiText} onChange={e => setAiText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiParse()} className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white" placeholder='למשל: "מור כדורסל יום שני 19:00"' />
                <button onClick={handleAiParse} disabled={aiLoading || !aiText.trim()} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1">
                  {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  פענח
                </button>
              </div>
              {aiError && <p className="text-xs text-red-500 mt-1">{aiError}</p>}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none" placeholder="למשל: אימון פילאטיס" />
          </div>

          {/* Person + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מי</label>
              <select value={person} onChange={e => setPerson(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white">
                {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
              {!showNewCategory ? (
                <div className="flex gap-1">
                  <select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowNewCategory(true)} className="px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="הוסף קטגוריה חדשה">
                    <Plus size={16} className="text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newCategoryName.trim()) { onAddCategory(newCategoryName.trim()); setCategory(newCategoryName.trim()); setNewCategoryName(''); setShowNewCategory(false); } } }} placeholder="שם קטגוריה חדשה" autoFocus className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none" />
                  <button type="button" onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }} className="px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <X size={16} className="text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Start Date + End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התחלה</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(e.target.value); }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך סיום</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none" />
            </div>
          </div>

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעת התחלה</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעת סיום</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none" rows={2} placeholder="אופציונלי..." />
          </div>

          {/* Recurring + Reminder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="recurring" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="rounded border-gray-300 text-blue-500 focus:ring-blue-400" />
              <label htmlFor="recurring" className="text-sm text-gray-700 flex items-center gap-1"><RotateCcw size={12} /> חוזר כל שבוע</label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">תזכורת</label>
              <select value={reminderMinutes} onChange={e => setReminderMinutes(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white">
                <option value="">ללא</option>
                <option value="15">15 דק&apos;</option>
                <option value="30">30 דק&apos;</option>
                <option value="60">שעה</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving || !title} className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {editEvent ? 'עדכן' : 'שמור'}
            </button>
            {editEvent && onDelete && (
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                מחק
              </button>
            )}
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Week View ---
function WeekView({ events, weekDates, conflicts, onCellClick, onEventClick, expandStart, expandEnd, onEventDrop }: {
  events: FamilyEvent[]; weekDates: Date[]; conflicts: Set<string>;
  onCellClick: (date: Date, hour: number) => void; onEventClick: (event: FamilyEvent) => void;
  expandStart: number; expandEnd: number;
  onEventDrop?: (event: FamilyEvent, newDate: Date, newHour: number) => void;
}) {
  const today = new Date();
  const { hours, minHour } = getHoursRange(events, expandStart, expandEnd);
  const [draggedEvent, setDraggedEvent] = useState<FamilyEvent | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const handleDrop = (date: Date, hour: number) => {
    if (draggedEvent && onEventDrop) onEventDrop(draggedEvent, date, hour);
    setDraggedEvent(null);
    setDragOverCell(null);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const gridCols = isMobile ? '36px repeat(7, 1fr)' : '60px repeat(7, 1fr)';

  return (
    <div className="overflow-x-auto">
      <div>
        {/* Day headers */}
        <div className="border-b border-gray-200 sticky top-0 bg-white z-10" style={{ display: 'grid', gridTemplateColumns: gridCols }}>
          <div className="p-0.5 md:p-1" />
          {weekDates.map((date, i) => {
            const isToday = isSameDay(date, today);
            return (
              <div key={i} className={`py-1 md:p-2 text-center border-r border-gray-100 ${isToday ? 'bg-blue-50' : ''}`}>
                <p className="text-[9px] md:text-xs text-gray-500 leading-tight">{DAYS_HE_SHORT[i]}<span className="hidden md:inline"> {DAYS_HE[i]}</span></p>
                <p className={`text-xs md:text-base font-semibold ${isToday ? 'bg-blue-500 text-white w-5 h-5 md:w-7 md:h-7 rounded-full flex items-center justify-center mx-auto text-[10px] md:text-base' : 'text-gray-900'}`}>{date.getDate()}</p>
              </div>
            );
          })}
        </div>
        {/* Hour rows + events overlay */}
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="border-b border-gray-50" style={{ display: 'grid', gridTemplateColumns: gridCols, height: '60px' }}>
              <div className="text-[9px] md:text-[11px] text-gray-400 pt-0.5 leading-none text-center">{String(hour).padStart(2, '0')}:00</div>
              {weekDates.map((date, dayIdx) => {
                const cellKey = `${date.toISOString()}-${hour}`;
                const isDragOver = dragOverCell === cellKey;
                return (
                  <div key={dayIdx} className={`border-r border-gray-50 cursor-pointer hover:bg-blue-50/30 transition-colors ${isSameDay(date, today) ? 'bg-blue-50/20' : ''} ${isDragOver ? 'bg-blue-200/40 ring-2 ring-blue-400' : ''}`}
                    onClick={() => onCellClick(date, hour)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverCell(cellKey); }}
                    onDragLeave={() => setDragOverCell(null)}
                    onDrop={(e) => { e.preventDefault(); handleDrop(date, hour); }}
                  />
                );
              })}
            </div>
          ))}
          {/* Events overlay */}
          <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: `${hours.length * 60}px`, display: 'grid', gridTemplateColumns: gridCols, pointerEvents: 'none' }}>
            <div /> {/* spacer for hour column */}
            {weekDates.map((date, dayIdx) => (
              <div key={dayIdx} className="relative border-r border-gray-50">
                {getEventsForDay(events, date).map(event => (
                  <EventBlock key={event.id} event={event} isConflict={conflicts.has(event.id)} onClick={() => onEventClick(event)} minHour={minHour} onDragStart={setDraggedEvent} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

}

// --- Day View ---
function DayView({ events, date, conflicts, onCellClick, onEventClick, expandStart, expandEnd, onEventDrop }: {
  events: FamilyEvent[]; date: Date; conflicts: Set<string>;
  onCellClick: (date: Date, hour: number) => void; onEventClick: (event: FamilyEvent) => void;
  expandStart: number; expandEnd: number;
  onEventDrop?: (event: FamilyEvent, newDate: Date, newHour: number) => void;
}) {
  const dayEvents = getEventsForDay(events, date);
  const { hours, minHour } = getHoursRange(dayEvents, expandStart, expandEnd);
  const [draggedEvent, setDraggedEvent] = useState<FamilyEvent | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  const handleDrop = (hour: number) => {
    if (draggedEvent && onEventDrop) onEventDrop(draggedEvent, date, hour);
    setDraggedEvent(null);
    setDragOverHour(null);
  };

  return (
    <div>
      <div className="text-center py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <p className="text-sm text-gray-500">{DAYS_HE[date.getDay()]}</p>
        <p className="text-xl font-semibold text-gray-900">{date.getDate()}/{date.getMonth() + 1}</p>
      </div>
      <div className="relative">
        {hours.map(hour => {
          const isDragOver = dragOverHour === hour;
          return (
            <div key={hour} className="flex border-b border-gray-50" style={{ height: '60px' }}>
              <div className="w-[60px] text-[11px] text-gray-400 text-center pt-0.5 leading-none shrink-0">{String(hour).padStart(2, '0')}:00</div>
              <div className={`flex-1 cursor-pointer hover:bg-blue-50/30 transition-colors ${isDragOver ? 'bg-blue-200/40 ring-2 ring-blue-400' : ''}`}
                onClick={() => onCellClick(date, hour)}
                onDragOver={(e) => { e.preventDefault(); setDragOverHour(hour); }}
                onDragLeave={() => setDragOverHour(null)}
                onDrop={(e) => { e.preventDefault(); handleDrop(hour); }}
              />
            </div>
          );
        })}
        <div className="absolute top-0 left-0" style={{ right: '60px', height: `${hours.length * 60}px` }}>
          {dayEvents.map(event => (
            <EventBlock key={event.id} event={event} isConflict={conflicts.has(event.id)} onClick={() => onEventClick(event)} minHour={minHour} onDragStart={setDraggedEvent} />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Month View ---
function MonthView({ events, currentDate, conflicts, onDayClick }: {
  events: FamilyEvent[]; currentDate: Date; conflicts: Set<string>; onDayClick: (date: Date) => void;
}) {
  const monthDates = getMonthDates(currentDate);
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAYS_HE.map(day => <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {monthDates.map((date, i) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = isSameDay(date, today);
          const dayEvents = getEventsForDay(events, date);
          return (
            <div key={i} className={`min-h-[80px] md:min-h-[100px] border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`} onClick={() => onDayClick(date)}>
              <p className={`text-xs font-medium mb-1 ${isToday ? 'bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center' : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>{date.getDate()}</p>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => <EventBlock key={event.id} event={event} isConflict={conflicts.has(event.id)} compact />)}
                {dayEvents.length > 3 && <p className="text-[9px] text-gray-400 text-center">+{dayEvents.length - 3} עוד</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Filter Bar ---
function FilterBar({ selectedPeople, onTogglePerson }: { selectedPeople: Set<string>; onTogglePerson: (person: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PEOPLE.map(person => {
        const isSelected = selectedPeople.has(person);
        const color = PERSON_COLORS[person] || 'bg-gray-100 text-gray-800';
        return (
          <button key={person} onClick={() => onTogglePerson(person)} className={`px-2 py-1 rounded-full text-[11px] font-medium transition-all ${isSelected ? color : 'bg-gray-100 text-gray-300'}`}>
            {person}
          </button>
        );
      })}
    </div>
  );
}

// --- Main ---
export default function FamilyScheduleClient() {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState<Date | undefined>();
  const [modalHour, setModalHour] = useState<number | undefined>();
  const [editEvent, setEditEvent] = useState<FamilyEvent | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set(PEOPLE));

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementInput, setShowAnnouncementInput] = useState(false);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');

  // Hours expansion
  const [expandStart, setExpandStart] = useState(0);
  const [expandEnd, setExpandEnd] = useState(0);

  // Custom categories
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const categories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);

  useEffect(() => {
    const saved = localStorage.getItem('family-schedule-custom-categories');
    if (saved) { try { setCustomCategories(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

  const addCustomCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    localStorage.setItem('family-schedule-custom-categories', JSON.stringify(updated));
  };

  // Auto day view on mobile
  useEffect(() => {
    if (window.innerWidth < 768) setView('day');
  }, []);

  // Reset expansions when view changes
  useEffect(() => { setExpandStart(0); setExpandEnd(0); }, [view]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const weekDates = getWeekDates(currentDate);
      const start = new Date(weekDates[0]);
      start.setDate(start.getDate() - 35);
      const end = new Date(weekDates[6]);
      end.setDate(end.getDate() + 35);

      const res = await fetch(`/api/family/events?start=${start.toISOString()}&end=${end.toISOString()}`);
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [currentDate]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/family/announcements');
      const data = await res.json();
      if (data.announcements) setAnnouncements(data.announcements);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const addAnnouncement = async () => {
    if (!newAnnouncementText.trim()) return;
    const color = Math.floor(Math.random() * ANNOUNCEMENT_COLORS.length);
    await fetch('/api/family/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newAnnouncementText.trim(), color }) });
    setNewAnnouncementText('');
    setShowAnnouncementInput(false);
    await fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    await fetch(`/api/family/announcements/${id}`, { method: 'DELETE' });
    await fetchAnnouncements();
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => selectedPeople.has(e.person) || (e.person === 'כולם' && selectedPeople.size > 0));
  }, [events, selectedPeople]);

  const conflicts = useMemo(() => findConflicts(filteredEvents), [filteredEvents]);
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const hoursInfo = useMemo(() => {
    const eventsToCheck = view === 'day' ? getEventsForDay(filteredEvents, currentDate) : filteredEvents;
    return getHoursRange(eventsToCheck, expandStart, expandEnd);
  }, [filteredEvents, currentDate, view, expandStart, expandEnd]);

  const navigateBack = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
    setExpandStart(0);
    setExpandEnd(0);
  };
  const navigateForward = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
    setExpandStart(0);
    setExpandEnd(0);
  };

  const togglePerson = (person: string) => {
    const s = new Set(selectedPeople);
    if (s.has(person)) s.delete(person); else s.add(person);
    setSelectedPeople(s);
  };

  const handleSave = async (eventData: Omit<FamilyEvent, 'id'>) => {
    if (editEvent) {
      await fetch(`/api/family/events/${editEvent.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
    } else {
      await fetch('/api/family/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
    }
    await fetchEvents();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/family/events/${id}`, { method: 'DELETE' });
    await fetchEvents();
  };

  const handleEventDrop = async (event: FamilyEvent, newDate: Date, newHour: number) => {
    const oldStart = new Date(event.start_time);
    const oldEnd = new Date(event.end_time);
    const durationMs = oldEnd.getTime() - oldStart.getTime();
    const newStart = new Date(newDate);
    newStart.setHours(newHour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);
    await fetch(`/api/family/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }),
    });
    await fetchEvents();
  };

  const openAdd = (date?: Date, hour?: number) => {
    setEditEvent(null);
    setModalDate(date);
    setModalHour(hour);
    setShowModal(true);
  };

  const openEdit = (event: FamilyEvent) => {
    setEditEvent(event);
    setShowModal(true);
  };

  const getTitle = () => {
    if (view === 'day') return `${DAYS_HE[currentDate.getDay()]} ${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
    if (view === 'week') return `${weekDates[0].getDate()}/${weekDates[0].getMonth() + 1} - ${weekDates[6].getDate()}/${weekDates[6].getMonth() + 1}`;
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const conflictCount = Math.floor(conflicts.size / 2);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden family-schedule-root" dir="rtl">
      <style>{`
        .family-schedule-root button,
        .family-schedule-root a,
        .family-schedule-root [role="button"] {
          min-height: unset !important;
          min-width: unset !important;
        }
      `}</style>
      {/* Header - compact on mobile */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 md:px-6 py-2 md:py-3">
          {/* Row 1: Title + desktop buttons */}
          <div className="hidden md:flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">לוז משפחתי</h1>
              {conflictCount > 0 && (
                <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <AlertTriangle size={10} /> {conflictCount} קונפליקטים
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAnnouncementInput(true)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                <Megaphone size={14} /> הודעה
              </button>
              <button onClick={() => openAdd()} className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">
                <Plus size={16} /> אירוע חדש
              </button>
            </div>
          </div>

          {/* Mobile: single compact row - nav + view toggle + date */}
          <div className="md:hidden flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5">
              <button onClick={navigateForward} className="p-1.5 hover:bg-gray-100 rounded transition-colors"><ChevronRight size={18} className="text-gray-600" /></button>
              <button onClick={navigateBack} className="p-1.5 hover:bg-gray-100 rounded transition-colors"><ChevronLeft size={18} className="text-gray-600" /></button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors shrink-0">היום</button>
            <span className="text-sm font-semibold text-gray-900 truncate">{getTitle()}</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
              {(['day', 'week', 'month'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {v === 'day' ? 'יום' : v === 'week' ? 'שבוע' : 'חודש'}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: nav + view toggle + filters */}
          <div className="hidden md:flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {(['day', 'week', 'month'] as ViewMode[]).map(v => (
                  <button key={v} onClick={() => setView(v)} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {v === 'day' ? 'יום' : v === 'week' ? 'שבוע' : 'חודש'}
                  </button>
                ))}
              </div>
              <button onClick={navigateForward} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronRight size={16} className="text-gray-600" /></button>
              <button onClick={navigateBack} className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronLeft size={16} className="text-gray-600" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors">היום</button>
              <span className="text-sm font-semibold text-gray-900">{getTitle()}</span>
            </div>
            <FilterBar selectedPeople={selectedPeople} onTogglePerson={togglePerson} />
          </div>
        </div>
      </div>

      {/* Announcements Board - desktop only inline, mobile hidden unless has items */}
      {(announcements.length > 0 || showAnnouncementInput) && (
        <div className="hidden md:block max-w-7xl w-full mx-auto px-3 md:px-6 pt-2">
          <div className="flex flex-wrap gap-2 items-center">
            {announcements.map(a => {
              const c = ANNOUNCEMENT_COLORS[a.color] || ANNOUNCEMENT_COLORS[0];
              return (
                <div key={a.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${c.bg} ${c.text} ${c.border}`}>
                  <span>{a.text}</span>
                  <button onClick={() => deleteAnnouncement(a.id)} className="hover:opacity-60 transition-opacity"><X size={14} /></button>
                </div>
              );
            })}
            {showAnnouncementInput && (
              <div className="flex items-center gap-1.5">
                <input type="text" value={newAnnouncementText} onChange={e => setNewAnnouncementText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAnnouncement()} autoFocus className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none w-48" placeholder="כתבו הודעה..." />
                <button onClick={addAnnouncement} className="px-2 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600">שמור</button>
                <button onClick={() => { setShowAnnouncementInput(false); setNewAnnouncementText(''); }} className="p-1 hover:bg-gray-100 rounded"><X size={14} className="text-gray-400" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-h-0 flex items-stretch relative">
        {/* Floating arrows - desktop only */}
        <button onClick={navigateForward} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white border border-gray-200 shadow-md rounded-l-lg p-2 transition-all hover:shadow-lg">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
        <button onClick={navigateBack} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white border border-gray-200 shadow-md rounded-r-lg p-2 transition-all hover:shadow-lg">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <div className="flex-1 min-h-0 max-w-7xl w-full mx-auto flex flex-col">
          {/* Expand up - desktop only */}
          {!loading && view !== 'month' && hoursInfo.canExpandStart && (
            <div className="hidden md:flex bg-white border-b border-gray-200 py-1.5 items-center justify-center md:rounded-t-lg">
              <button onClick={() => setExpandStart(s => s + 2)} className="bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                <ChevronUp size={16} /> הוסף שעות מוקדם יותר
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0 bg-white md:border md:border-gray-200 md:shadow-sm overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
            ) : (
              <>
                {view === 'week' && <WeekView events={filteredEvents} weekDates={weekDates} conflicts={conflicts} onCellClick={openAdd} onEventClick={openEdit} expandStart={expandStart} expandEnd={expandEnd} onEventDrop={handleEventDrop} />}
                {view === 'day' && <DayView events={filteredEvents} date={currentDate} conflicts={conflicts} onCellClick={openAdd} onEventClick={openEdit} expandStart={expandStart} expandEnd={expandEnd} onEventDrop={handleEventDrop} />}
                {view === 'month' && <MonthView events={filteredEvents} currentDate={currentDate} conflicts={conflicts} onDayClick={(d) => { setCurrentDate(d); setView('day'); }} />}
              </>
            )}
          </div>

          {/* Expand down - desktop only */}
          {!loading && view !== 'month' && hoursInfo.canExpandEnd && (
            <div className="hidden md:flex bg-white border-t border-gray-200 py-1.5 items-center justify-center md:rounded-b-lg">
              <button onClick={() => setExpandEnd(s => s + 2)} className="bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                <ChevronDown size={16} /> הוסף שעות מאוחר יותר
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button onClick={() => openAdd()} className="md:hidden fixed bottom-6 left-6 bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors z-40">
        <Plus size={28} />
      </button>

      {/* Modal */}
      <EventModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleSave} onDelete={handleDelete} initialDate={modalDate} initialHour={modalHour} editEvent={editEvent} categories={categories} onAddCategory={addCustomCategory} />
    </div>
  );
}
