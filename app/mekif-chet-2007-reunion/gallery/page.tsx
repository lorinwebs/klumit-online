'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Upload,
  Camera,
  Video,
  Trophy,
  Medal,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ImageIcon,
  Loader2,
} from 'lucide-react';

interface Participant {
  name: string;
  paid?: boolean;
}

interface LeaderboardEntry {
  name: string;
  count: number;
}

interface GalleryUpload {
  uploader_name: string;
  file_type: string;
  file_path: string;
  created_at: string;
  url: string;
}

interface GalleryData {
  imageCount: number;
  videoCount: number;
  leaderboard: LeaderboardEntry[];
  recentUploads: GalleryUpload[];
}

const MEDAL_STYLES = [
  { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', icon: '🥇' },
  { bg: 'bg-slate-100', border: 'border-slate-400', text: 'text-slate-700', icon: '🥈' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', icon: '🥉' },
  { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', icon: '4' },
  { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', icon: '5' },
];

export default function GalleryPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedParticipant = participants.find(p => p.name === selectedName);
  const isPaid = selectedParticipant?.paid === true;

  useEffect(() => {
    document.title = 'גלריה - מקיף ח\' 2007';
    const saved = localStorage.getItem('mekif_gallery_name');
    if (saved) setSelectedName(saved);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [reunionRes, galleryRes] = await Promise.all([
        fetch('/api/monday/reunion'),
        fetch('/api/reunion-gallery'),
      ]);

      if (reunionRes.ok) {
        const reunionData = await reunionRes.json();
        const allParticipants: Participant[] = [];
        Object.values(reunionData.byClass as Record<string, Participant[]>).forEach(list => {
          list.forEach(p => allParticipants.push({ name: p.name, paid: p.paid }));
        });
        allParticipants.sort((a, b) => a.name.localeCompare(b.name, 'he'));
        setParticipants(allParticipants);
      }

      if (galleryRes.ok) {
        setGallery(await galleryRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectName(name: string) {
    setSelectedName(name);
    setSearchQuery('');
    setShowDropdown(false);
    localStorage.setItem('mekif_gallery_name', name);
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !selectedName) return;

    setUploading(true);
    setUploadMsg(null);

    let successCount = 0;
    let errorMsg = '';

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploader_name', selectedName);

      try {
        const res = await fetch('/api/reunion-gallery/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          successCount++;
        } else {
          errorMsg = data.error || 'Upload failed';
        }
      } catch {
        errorMsg = 'שגיאה בהעלאה';
      }
    }

    if (successCount > 0) {
      setUploadMsg({ type: 'success', text: `${successCount} קבצים הועלו בהצלחה!` });
      fetchData();
    } else {
      setUploadMsg({ type: 'error', text: errorMsg });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (isPaid) handleUpload(e.dataTransfer.files);
  }

  const filteredParticipants = participants.filter(p =>
    p.paid && p.name.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-6" />
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={24} />
          </div>
          <p className="text-slate-600 text-lg font-light">טוען גלריה...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 md:py-12 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center">
            <img
              src="https://mekifh.mashov.info/wp-content/uploads/sites/82/2021/06/Semel-MekifH-%D7%A9%D7%9C%D7%95%D7%9D-%D7%95%D7%90%D7%A0%D7%95%D7%A0%D7%95.png"
              alt="לוגו מקיף ח'"
              className="h-24 md:h-32 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-light text-slate-900 mb-3 tracking-tight">
            גלריית האיחוד
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-6" />
          <a
            href="/mekif-chet-2007-reunion"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
          >
            <ArrowRight size={18} />
            חזרה לדף האיחוד
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
          <div className="bg-white shadow-md border border-slate-200 p-5 text-center">
            <Camera className="mx-auto text-indigo-600 mb-2" size={28} />
            <div className="text-3xl font-bold text-slate-900">{gallery?.imageCount || 0}</div>
            <div className="text-sm text-slate-500">תמונות</div>
          </div>
          <div className="bg-white shadow-md border border-slate-200 p-5 text-center">
            <Video className="mx-auto text-purple-600 mb-2" size={28} />
            <div className="text-3xl font-bold text-slate-900">{gallery?.videoCount || 0}</div>
            <div className="text-sm text-slate-500">סרטונים</div>
          </div>
        </div>

        {/* Name Selector */}
        <div className="bg-white shadow-md border border-slate-200 p-6 mb-8 max-w-lg mx-auto">
          <label className="block text-lg font-medium text-slate-800 mb-3">בחר/י את השם שלך</label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={showDropdown ? searchQuery : selectedName || searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (!showDropdown) setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="חפש את השם שלך..."
                className="w-full pr-10 pl-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800"
              />
            </div>
            {showDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map(p => (
                    <button
                      key={p.name}
                      onClick={() => selectName(p.name)}
                      className={`w-full text-right px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                        p.name === selectedName ? 'bg-indigo-50 font-semibold' : ''
                      }`}
                    >
                      <span className="text-slate-800">{p.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-400 text-sm">לא נמצא</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mb-10 max-w-lg mx-auto">
          <div
            onDragOver={e => { e.preventDefault(); if (isPaid) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              !selectedName || !isPaid
                ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                : dragOver
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer'
            }`}
            onClick={() => isPaid && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
              disabled={!isPaid}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-slate-600">מעלה קבצים...</p>
              </div>
            ) : (
              <>
                <Upload className={`mx-auto mb-3 ${isPaid ? 'text-indigo-500' : 'text-slate-300'}`} size={40} />
                <p className="text-lg font-medium text-slate-700 mb-1">
                  {isPaid ? 'גרור קבצים לכאן או לחץ לבחירה' : 'העלאת קבצים נעולה'}
                </p>
                <p className="text-sm text-slate-400">
                  תמונות (עד 20MB) וסרטונים (עד 100MB)
                </p>
              </>
            )}
          </div>
          {uploadMsg && (
            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
              uploadMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {uploadMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {uploadMsg.text}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {gallery?.leaderboard && gallery.leaderboard.length > 0 && (
          <div className="bg-white shadow-md border border-slate-200 overflow-hidden mb-10 max-w-lg mx-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center gap-3">
              <Trophy size={24} />
              <h2 className="text-xl font-semibold">טבלת מובילים</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {gallery.leaderboard.map((entry, idx) => {
                const style = MEDAL_STYLES[idx] || MEDAL_STYLES[4];
                return (
                  <div key={entry.name} className={`flex items-center justify-between px-6 py-4 ${style.bg}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl w-8 text-center">{style.icon}</span>
                      <span className={`font-semibold text-lg ${style.text}`}>{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{entry.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Gallery Grid */}
        {gallery?.recentUploads && gallery.recentUploads.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-light text-slate-900 mb-6 text-center">העלאות אחרונות</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.recentUploads.map((upload, idx) => (
                <a
                  key={idx}
                  href={upload.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all aspect-square"
                >
                  {upload.file_type === 'image' ? (
                    <img
                      src={upload.url}
                      alt={`by ${upload.uploader_name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                      <Video className="text-purple-500 mb-2" size={36} />
                      <span className="text-xs text-slate-500">סרטון</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{upload.uploader_name}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
