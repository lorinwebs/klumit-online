'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Upload,
  Camera,
  Video,
  Trophy,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
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

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

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
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-indigo-400" size={20} />
            </div>
          </div>
          <p className="text-slate-400 text-sm tracking-wide">טוען גלריה...</p>
        </div>
      </div>
    );
  }

  const totalUploads = (gallery?.imageCount || 0) + (gallery?.videoCount || 0);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden" dir="rtl">


      {/* Hero */}
      <div className="bg-white border-b border-slate-100 px-6 py-12 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
          <Camera size={13} />
          מקיף ח&#x27; 2007
        </div>
        <h1 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight mb-2">
          גלריית האיחוד
        </h1>
        <p className="text-slate-400 text-base mb-8">תמונות וסרטונים מהמפגש שלנו</p>

        {/* Stats row */}
        <div className="inline-flex items-center gap-6 bg-slate-50 border border-slate-200 rounded-2xl px-8 py-4 mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{gallery?.imageCount || 0}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1 justify-center mt-0.5">
              <Camera size={11} /> תמונות
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{gallery?.videoCount || 0}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1 justify-center mt-0.5">
              <Video size={11} /> סרטונים
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{totalUploads}</div>
            <div className="text-xs text-slate-400 mt-0.5">סה&#x22;כ</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Name selector + Upload — side by side on desktop */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Name selector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1">השם שלך</label>
            <p className="text-xs text-slate-400 mb-4">רק משתתפים ששילמו יכולים להעלות</p>
            <div className="relative" ref={dropdownRef}>
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input
                type="text"
                value={showDropdown ? searchQuery : selectedName || searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (!showDropdown) setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="חפש את השם שלך..."
                className="w-full pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-slate-800 placeholder:text-slate-300 bg-slate-50"
              />
              {showDropdown && (
                <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map(p => (
                      <button
                        key={p.name}
                        onClick={() => selectName(p.name)}
                        className={`w-full text-right px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between first:rounded-t-xl last:rounded-b-xl ${
                          p.name === selectedName ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700'
                        }`}
                      >
                        {p.name}
                        {p.name === selectedName && <CheckCircle2 size={14} className="text-indigo-500" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-400 text-sm">לא נמצא</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upload zone */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <label className="block text-sm font-semibold text-slate-700 mb-1">העלאת קבצים</label>
            <p className="text-xs text-slate-400 mb-4">תמונות עד 20MB • סרטונים עד 1GB</p>
            <div
              onDragOver={e => { e.preventDefault(); if (isPaid) setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => isPaid && fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all min-h-[120px] ${
                !selectedName || !isPaid
                  ? 'border-slate-100 bg-slate-50 cursor-not-allowed'
                  : dragOver
                    ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer'
              }`}
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
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                  <p className="text-sm text-slate-500">מעלה...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <div className={`p-3 rounded-full ${isPaid ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                    <Upload className={isPaid ? 'text-indigo-500' : 'text-slate-300'} size={22} />
                  </div>
                  <p className={`text-sm font-medium ${isPaid ? 'text-slate-700' : 'text-slate-300'}`}>
                    {!selectedName ? 'בחר שם תחילה' : !isPaid ? 'העלאה נעולה' : 'גרור או לחץ לבחירה'}
                  </p>
                </div>
              )}
            </div>
            {uploadMsg && (
              <div className={`mt-3 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                uploadMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {uploadMsg.type === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {uploadMsg.text}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        {gallery?.leaderboard && gallery.leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Trophy size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">טבלת מובילים</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {gallery.leaderboard.map((entry, idx) => (
                <div
                  key={entry.name}
                  className={`flex items-center justify-between px-6 py-3.5 ${
                    idx === 0 ? 'bg-yellow-50/60' : idx === 1 ? 'bg-slate-50/60' : idx === 2 ? 'bg-orange-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-7 text-center">
                      {MEDAL_ICONS[idx] ?? <span className="text-sm text-slate-400 font-bold">{idx + 1}</span>}
                    </span>
                    <span className={`font-medium text-sm ${idx < 3 ? 'text-slate-800' : 'text-slate-600'}`}>
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                    <ImageIcon size={12} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{entry.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery grid */}
        {gallery?.recentUploads && gallery.recentUploads.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">העלאות אחרונות</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {gallery.recentUploads.length} קבצים
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {gallery.recentUploads.map((upload, idx) => (
                <a
                  key={idx}
                  href={upload.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-slate-100 rounded-xl overflow-hidden aspect-square border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                >
                  {upload.file_type === 'image' ? (
                    <img
                      src={upload.url}
                      alt={`by ${upload.uploader_name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-100">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Video className="text-purple-500" size={24} />
                      </div>
                      <span className="text-xs text-slate-400">סרטון</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <p className="text-white text-xs truncate font-medium">{upload.uploader_name}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!gallery?.recentUploads || gallery.recentUploads.length === 0) && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Camera className="text-slate-300" size={28} />
            </div>
            <p className="text-slate-400 font-medium">עדיין אין תמונות בגלריה</p>
            <p className="text-slate-300 text-sm mt-1">היו הראשונים להעלות!</p>
          </div>
        )}

      </div>
    </div>
  );
}
