'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronDown, MapPin, Briefcase, Users, BookOpen, Sparkles, Star } from 'lucide-react';

interface ShaalonPerson {
  id: string;
  name: string;
  nameOld: string;
  kita: string;
  status: string;
  kids: string;
  kidsAges: string;
  city: string;
  contacts: string;
  job: string;
  weirdJob: string;
  embarrass: string;
  teacher: string;
  highschoolStory: string;
  mostChanged: string;
  changedInMe: string;
  breakfriends: string;
  classChar: string;
  strongMemory: string;
  secret: string;
  blessing: string;
  drinksAlcohol: boolean;
  teacherQuotes: string;
  drinkPrefs: string;
}

const CLASS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'יב1':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  dot: 'bg-blue-500' },
  'יב3':  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200',dot: 'bg-violet-500' },
  'יב4':  { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200',  dot: 'bg-pink-500' },
  'יב5':  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', dot: 'bg-amber-500' },
  'יב6':  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200',dot: 'bg-indigo-500' },
  'יב8':  { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',  dot: 'bg-teal-500' },
  'יב9':  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200',dot: 'bg-orange-500' },
  'יב10': { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',  dot: 'bg-cyan-500' },
};

const getClassStyle = (kita: string) =>
  CLASS_COLORS[kita] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };

const DRINK_EMOJI: Record<string, string> = {
  'בירה': '🍺', 'יין אדום': '🍷', 'יין לבן': '🥂', 'רוזה': '🌸',
  'וודקה': '🍸', 'ערק': '🥃', 'ג׳ין': '🍸', 'קוקטיילים': '🍹',
  'ויסקי': '🥃', 'רום': '🥃', 'מבעבע/קאווה/שמפניה': '🥂',
};

function Field({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function DrinkBadges({ prefs }: { prefs: string }) {
  if (!prefs?.trim()) return null;
  const items = prefs.split(',').map(s => s.trim()).filter(Boolean);
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">שתייה מועדפת</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(d => (
          <span key={d} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            {DRINK_EMOJI[d] ? `${DRINK_EMOJI[d]} ` : ''}{d}
          </span>
        ))}
      </div>
    </div>
  );
}

function PersonCard({ person, expanded, onToggle }: {
  person: ShaalonPerson;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cs = getClassStyle(person.kita);
  const initials = person.name.split(' ').slice(0, 2).map(w => w[0]).join('');

  const hasDetails = !!(
    person.job || person.weirdJob || person.embarrass || person.teacher ||
    person.highschoolStory || person.changedInMe || person.secret ||
    person.blessing || person.strongMemory || person.classChar ||
    person.teacherQuotes || person.contacts || person.breakfriends
  );

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
      expanded ? 'border-indigo-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow'
    }`}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        disabled={!hasDetails}
        className="w-full text-right px-5 pt-4 pb-3 flex items-start gap-3 group"
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${cs.bg} ${cs.text}`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Row 1: name + old name */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{person.name}</span>
            {person.nameOld && person.nameOld !== person.name && (
              <span className="text-xs text-slate-400">({person.nameOld})</span>
            )}
          </div>

          {/* Row 2: kita + city + status + kids */}
          <div className="flex items-center gap-2 flex-wrap">
            {person.kita && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cs.bg} ${cs.text}`}>
                {person.kita}
              </span>
            )}
            {person.city && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <MapPin size={10} />
                {person.city}
              </span>
            )}
            {person.status && (
              <span className="text-xs text-slate-400">{person.status}</span>
            )}
            {person.kids && person.kids !== 'אין' && (
              <span className="text-xs text-slate-400">{person.kids} ילדים</span>
            )}
          </div>

          {/* Row 3: job */}
          {person.job && (
            <div className="flex items-start gap-1 text-xs text-slate-500">
              <Briefcase size={11} className="shrink-0 mt-0.5 text-slate-300" />
              <span className="leading-snug">{person.job.split('\n')[0]}</span>
            </div>
          )}

          {/* Row 4: preview snippets when collapsed */}
          {!expanded && (
            <div className="flex flex-col gap-0.5">
              {person.teacher && (
                <p className="text-xs text-slate-400 leading-snug line-clamp-1">
                  <span className="text-slate-300 ml-1">מורה:</span>{person.teacher}
                </p>
              )}
              {person.embarrass && (
                <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                  <span className="text-slate-300 ml-1">סיפור:</span>{person.embarrass}
                </p>
              )}
              {person.changedInMe && (
                <p className="text-xs text-slate-400 leading-snug line-clamp-1">
                  <span className="text-slate-300 ml-1">השתנה:</span>{person.changedInMe}
                </p>
              )}
              {person.secret && (
                <p className="text-xs text-slate-400 leading-snug line-clamp-1">
                  <span className="text-slate-300 ml-1">סוד:</span>{person.secret}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        {hasDetails && (
          <ChevronDown
            size={16}
            className={`shrink-0 text-slate-300 group-hover:text-slate-500 transition-transform duration-200 mt-1 ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="עיסוק היום" value={person.job} />
            <Field label="עבודה הכי מוזרה" value={person.weirdJob} />
            <Field label="בקשר עם" value={person.contacts} />
            <Field label="ישב בהפסקות עם" value={person.breakfriends} />

            {(person.embarrass || person.highschoolStory || person.strongMemory) && (
              <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <Field label="אירוע מביך / נועז בתיכון" value={person.embarrass} />
                <Field label="חוויה משמעותית מהתיכון" value={person.highschoolStory} />
                <Field label="הזיכרון הכי חזק מהשכבה" value={person.strongMemory} />
                <Field label="דמות השכבה" value={person.classChar} />
              </div>
            )}

            {(person.teacher || person.teacherQuotes) && (
              <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <Field label="המורה הכי זכור" value={person.teacher} />
                <Field label="ציטוט מורה" value={person.teacherQuotes} />
              </div>
            )}

            {(person.changedInMe || person.mostChanged || person.secret || person.blessing) && (
              <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <Field label="מה השתנה בי" value={person.changedInMe} />
                <Field label="מי השתנה הכי קיצוני" value={person.mostChanged} />
                <Field label="דבר שהרבה לא יודעים עליי" value={person.secret} />
                <Field label="ברכה למפגש" value={person.blessing} />
              </div>
            )}

            {person.drinkPrefs && (
              <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-1">
                <DrinkBadges prefs={person.drinkPrefs} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ALL_CLASSES = ['הכל', 'יב1', 'יב3', 'יב4', 'יב5', 'יב6', 'יב8', 'יב9', 'יב10'];

export default function ShaalonPage() {
  const [people, setPeople] = useState<ShaalonPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeClass, setActiveClass] = useState('הכל');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/monday/shaalon')
      .then(r => { if (!r.ok) throw new Error('שגיאה בטעינה'); return r.json(); })
      .then(data => { setPeople(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter(p => {
      const matchClass = activeClass === 'הכל' || p.kita === activeClass;
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.nameOld.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.job.toLowerCase().includes(q);
      return matchClass && matchSearch;
    });
  }, [people, search, activeClass]);

  const stats = useMemo(() => {
    const cities = new Set(people.map(p => p.city.trim()).filter(Boolean)).size;
    const married = people.filter(p => p.status === 'נשוי/אה').length;
    const withKids = people.filter(p => p.kids && p.kids !== 'אין' && p.kids !== '0').length;
    return { total: people.length, cities, married, withKids };
  }, [people]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={18} />
          </div>
          <p className="text-slate-400 text-sm">טוען שאלונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center p-10 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700">
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">

      {/* Hero */}
      <div className="bg-white border-b border-slate-100 px-6 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen size={20} className="text-indigo-400" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">שאלון מחזור</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8">20 שנה אחרי — מה קרה לכולם?</p>

        {/* Stats */}
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            { value: stats.total, label: 'מילאו שאלון', icon: <Users size={14} /> },
            { value: stats.married, label: 'נשואים' },
            { value: stats.withKids, label: 'עם ילדים' },
            { value: stats.cities, label: 'ערים שונות', icon: <MapPin size={14} /> },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-2xl font-bold text-slate-800">
                {s.icon && <span className="text-indigo-400">{s.icon}</span>}
                {s.value}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חפש לפי שם, עיר, עיסוק..."
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 shadow-sm"
            />
          </div>

          {/* Class pills */}
          <div className="flex flex-wrap gap-2">
            {ALL_CLASSES.map(k => (
              <button
                key={k}
                onClick={() => setActiveClass(k)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all ${
                  activeClass === k
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {k}
                {k !== 'הכל' && (
                  <span className="mr-1 opacity-60">
                    {people.filter(p => p.kita === k).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            {filtered.length} {filtered.length === 1 ? 'תוצאה' : 'תוצאות'}
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {filtered.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              expanded={expandedId === person.id}
              onToggle={() => setExpandedId(expandedId === person.id ? null : person.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-300">
              <Star size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">לא נמצאו תוצאות</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
