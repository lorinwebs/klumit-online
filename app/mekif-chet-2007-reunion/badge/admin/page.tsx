'use client';

import { useEffect, useState, useMemo } from 'react';
import { formatGrade, buildDisplayName, getMaritalLabel, type Gender, type MaritalStatus } from '../../../../lib/badge/schema';

interface BadgeRow {
  id:             string;
  first_name:     string;
  last_name:      string;
  gender:         string;
  marital_status: string;
  married_name?:  string;
  grade:          string;
  city:           string;
  occupation:     string;
  png_path:       string | null;
  signed_url:     string | null;
  created_at:     string;
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
    return getMaritalLabel(r.marital_status as MaritalStatus, r.gender as Gender);
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

export default function AdminPage() {
  const [rows, setRows]       = useState<BadgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

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
                            <img src={row.signed_url} alt={displayName} className="w-12 h-18 object-cover rounded shadow-sm border border-slate-100" style={{ aspectRatio: '2/3', width: 40 }} />
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
    </div>
  );
}
