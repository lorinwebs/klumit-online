'use client';

import { useEffect, useState, useMemo } from 'react';
import { formatGrade, GRADES, GENDERS, MARITAL_STATUSES, buildDisplayName, getMaritalLabel, type Gender, type MaritalStatus } from '../../../../lib/badge/schema';

interface BadgeRow {
  id:             string;
  first_name:     string;
  last_name:      string;
  gender:         string;
  marital_status: string;
  married_name?:  string;
  other_status?:  string;
  grade:          string;
  city:           string;
  occupation:     string;
  num_children?:  number;
  png_path:       string | null;
  signed_url:     string | null;
  created_at:     string;
  monday_name?:   string;
  // legacy
  full_name?:     string;
  status?:        string;
}

function getDisplayName(r: BadgeRow): string {
  if (r.first_name) return buildDisplayName(r);
  return r.full_name ?? '';
}

function getStatusLabel(r: BadgeRow): string {
  if (r.marital_status && r.gender) {
    return getMaritalLabel(r.marital_status as MaritalStatus, r.gender as Gender, r.other_status, r.num_children);
  }
  return r.status ?? '';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function statsFromRows(rows: BadgeRow[]) {
  const now = Date.now();
  const today  = rows.filter(r => now - new Date(r.created_at).getTime() < 86400000).length;
  const week   = rows.filter(r => now - new Date(r.created_at).getTime() < 7 * 86400000).length;
  const byGrade: Record<string, number> = {};
  rows.forEach(r => { byGrade[r.grade] = (byGrade[r.grade] ?? 0) + 1; });
  return { total: rows.length, today, week, byGrade };
}

function downloadCSV(rows: BadgeRow[]) {
  const headers = ['שם', 'כיתה', 'עיר', 'עיסוק', 'סטטוס', 'נוצר'];
  const csvRows = rows.map(r => [
    getDisplayName(r), formatGrade(r.grade), r.city, r.occupation, getStatusLabel(r), formatDate(r.created_at),
  ].map(v => `"${v}"`).join(','));
  const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'reunion-badges.csv'; a.click();
  URL.revokeObjectURL(url);
}

function EditModal({ row, onClose, onSaved }: { row: BadgeRow; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    first_name: row.first_name,
    last_name: row.last_name,
    gender: row.gender,
    marital_status: row.marital_status,
    married_name: row.married_name ?? '',
    other_status: row.other_status ?? '',
    grade: row.grade,
    city: row.city,
    occupation: row.occupation,
    num_children: row.num_children ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/badge/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert('שגיאה בשמירה');
      }
    } catch {
      alert('שגיאת רשת');
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" dir="rtl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-purple-900 mb-4">עריכת תג - {getDisplayName(row)}</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">שם פרטי</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500">שם משפחה</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">מגדר</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.gender} onChange={e => set('gender', e.target.value)}>
                {GENDERS.map(g => <option key={g} value={g}>{g === 'male' ? 'זכר' : 'נקבה'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">כיתה</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.grade} onChange={e => set('grade', e.target.value)}>
                <option value="">ללא</option>
                {GRADES.map(g => <option key={g} value={g}>{formatGrade(g)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">עיר</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500">עיסוק</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.occupation} onChange={e => set('occupation', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">סטטוס</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.marital_status} onChange={e => set('marital_status', e.target.value)}>
                {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s === 'single' ? 'רווק/ה' : s === 'married' ? 'נשוי/אה' : 'אחר'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">ילדים</label>
              <input type="number" min={0} max={20} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.num_children} onChange={e => set('num_children', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">שם משפחה לאחר נישואין</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.married_name} onChange={e => set('married_name', e.target.value)} />
          </div>
          {form.marital_status === 'other' && (
            <div>
              <label className="text-xs text-slate-500">סטטוס אחר</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.other_status} onChange={e => set('other_status', e.target.value)} />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            {saving ? 'שומר...' : 'שמור ויצר תג מחדש'}
          </button>
          <button
            onClick={onClose}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

function Lightbox({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-pointer" onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl" />
    </div>
  );
}

export default function AdminPage() {
  const [rows, setRows]       = useState<BadgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing]   = useState<BadgeRow | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/badge');
      const json = await res.json();
      setRows(json.rows ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const stats = useMemo(() => statsFromRows(rows), [rows]);

  const duplicates = useMemo(() =>
    rows.filter(r => {
      const name = getDisplayName(r);
      const words = name.trim().split(/\s+/);
      const seen = new Set<string>();
      for (const w of words) {
        if (w.length > 1 && seen.has(w)) return true;
        seen.add(w);
      }
      return false;
    }), [rows]);

  const filtered = useMemo(() =>
    rows.filter(r => {
      if (!search) return true;
      const name = getDisplayName(r);
      return name.includes(search) || r.city.includes(search) || r.grade.includes(search);
    }), [rows, search]);

  async function handleDelete(id: string) {
    if (!confirm('למחוק את התג?')) return;
    setDeleting(id);
    await fetch(`/api/badge/${id}`, { method: 'DELETE' });
    setRows(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

  const EVENT_DATE = new Date('2026-06-10T18:00:00+03:00');
  const daysLeft = Math.max(0, Math.ceil((EVENT_DATE.getTime() - Date.now()) / 86400000));

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">אדמין - תגי שם</h1>
            <p className="text-slate-500 text-sm mt-0.5">מפגש מחזור האיחוד מקיף ח׳</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRows}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
            >
              רענן
            </button>
            <button
              onClick={() => downloadCSV(rows)}
              disabled={rows.length === 0}
              className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              ייצוא CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'סה"כ',  val: stats.total, color: 'text-purple-800 bg-purple-50 border-purple-100' },
            { label: 'היום',  val: stats.today, color: 'text-blue-800 bg-blue-50 border-blue-100' },
            { label: 'השבוע', val: stats.week,  color: 'text-green-800 bg-green-50 border-green-100' },
            { label: `ימים ל-10.6`, val: daysLeft, color: 'text-orange-800 bg-orange-50 border-orange-100' },
          ].map(({ label, val, color }) => (
            <div key={label} className={`rounded-2xl border px-5 py-4 ${color}`}>
              <div className="text-3xl font-bold">{val}</div>
              <div className="text-sm mt-0.5 opacity-75">{label}</div>
            </div>
          ))}
        </div>

        {/* Grade breakdown */}
        {rows.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
            <h2 className="text-sm font-semibold text-slate-500 mb-3">לפי כיתה</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byGrade).sort((a, b) => b[1] - a[1]).map(([g, n]) => (
                <span key={g} className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-sm font-medium px-3 py-1 rounded-full border border-purple-100">
                  {formatGrade(g)} <span className="font-bold">{n}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Duplicate names alert */}
        {duplicates.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-5 mb-6">
            <h2 className="text-sm font-semibold text-amber-800 mb-3">שמות כפולים לטיפול ({duplicates.length})</h2>
            <div className="space-y-2">
              {duplicates.map(row => {
                const displayName = getDisplayName(row);
                return (
                  <div key={row.id} className="flex items-center justify-between bg-white rounded-xl border border-amber-100 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {row.signed_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.signed_url}
                          alt={displayName}
                          className="w-8 rounded shadow-sm cursor-pointer hover:opacity-80"
                          style={{ aspectRatio: '2/3' }}
                          onClick={() => setLightbox({ url: row.signed_url!, alt: displayName })}
                        />
                      )}
                      <span className="font-medium text-slate-800 text-sm">{displayName}</span>
                      <span className="text-xs text-slate-400">{formatGrade(row.grade)}</span>
                    </div>
                    <button
                      onClick={() => setEditing(row)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                    >
                      ערוך
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="חיפוש לפי שם / עיר / כיתה..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            dir="rtl"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">אין תוצאות</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['תג', 'שם', 'כיתה', 'עיר', 'עיסוק', 'סטטוס', 'נוצר', 'פעולות'].map(h => (
                      <th key={h} className="px-4 py-3 font-semibold text-slate-600 text-right whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(row => {
                    const displayName = getDisplayName(row);
                    const statusLabel = getStatusLabel(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          {row.signed_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.signed_url}
                              alt={displayName}
                              className="w-12 h-18 object-cover rounded shadow-sm border border-slate-100 cursor-pointer hover:opacity-80 transition"
                              style={{ aspectRatio: '2/3', width: 40 }}
                              onClick={() => setLightbox({ url: row.signed_url!, alt: displayName })}
                            />
                          ) : (
                            <div className="w-10 bg-slate-100 rounded" style={{ aspectRatio: '2/3' }} />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{displayName}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatGrade(row.grade)}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.city}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.occupation}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{statusLabel}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDate(row.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditing(row)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                            >
                              ערוך
                            </button>
                            {row.signed_url && (
                              <a
                                href={row.signed_url}
                                download={`badge-${displayName}.png`}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                              >
                                הורד
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(row.id)}
                              disabled={deleting === row.id}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 whitespace-nowrap"
                            >
                              {deleting === row.id ? '...' : 'מחק'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          {filtered.length} תגים מוצגים מתוך {rows.length}
        </p>
      </div>

      {/* Lightbox */}
      {lightbox && <Lightbox url={lightbox.url} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {/* Edit Modal */}
      {editing && <EditModal row={editing} onClose={() => setEditing(null)} onSaved={fetchRows} />}
    </div>
  );
}
