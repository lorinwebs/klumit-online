'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  analyzeImage,
  clearCache,
  downloadSelectedZip,
  fetchUploads,
  importCacheJsonFile,
  importLegacyCache,
  loadCache,
  loadReview,
  saveCache,
  saveReview,
  scoreImage,
} from './api';
import { MobileSwipeView } from './MobileSwipeView';
import { PhotoListPanel } from './PhotoListPanel';
import { publicPhotoUrl } from './config';
import {
  applyAutoSelect,
  clearHumanChoices,
  isFinallySelected,
  setHuman,
} from './reviewState';
import type { FaceEntry, PhotoFile, ReviewState } from './types';
import { isRateLimitError, withRateLimitRetry } from './rateLimit';
import {
  autoSelectPaths,
  getCount,
  getDesc,
  getScore,
  getType,
  hasScore,
  isCacheOk,
  mergeCacheEntry,
  mergeCacheRecords,
} from './utils';

type StatusKind = '' | 'ok' | 'err' | 'warn';

const CACHE_LS = 'reunion_face_cache_v2';
const UI_VIEW_LS = 'reunion_ui_view_v1';

type UiView = 'list' | 'swipe';

function loadUiView(): UiView {
  try {
    const v = localStorage.getItem(UI_VIEW_LS);
    if (v === 'list' || v === 'swipe') return v;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
    return 'swipe';
  }
  return 'list';
}

export default function GalleryChooseApp() {
  const [files, setFiles] = useState<PhotoFile[]>([]);
  const [cache, setCache] = useState<Record<string, FaceEntry>>({});
  const [review, setReview] = useState<ReviewState>({});
  const reviewSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scanned, setScanned] = useState(false);
  const [target, setTarget] = useState(200);
  const [minPer, setMinPer] = useState(10);
  const [status, setStatus] = useState('טוען...');
  const [statusKind, setStatusKind] = useState<StatusKind>('');
  const [progress, setProgress] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const abortRef = useRef(false);
  const scoreAbortRef = useRef(false);
  const legacyImportTried = useRef(false);
  const cacheFileRef = useRef<HTMLInputElement>(null);
  const [importingCache, setImportingCache] = useState(false);
  const [uiView, setUiView] = useState<UiView>(loadUiView);

  const setUiViewPersist = (view: UiView) => {
    setUiView(view);
    try {
      localStorage.setItem(UI_VIEW_LS, view);
    } catch {
      /* ignore */
    }
  };

  const setMsg = (msg: string, kind: StatusKind = '') => {
    setStatus(msg);
    setStatusKind(kind);
  };

  const scheduleReviewSave = useCallback((next: ReviewState) => {
    if (reviewSaveTimer.current) clearTimeout(reviewSaveTimer.current);
    reviewSaveTimer.current = setTimeout(() => {
      saveReview(next, true).catch(() => {});
    }, 600);
  }, []);

  const applyFileList = useCallback(
    (list: PhotoFile[]) => {
      setFiles(list);
      setReview((prev) => {
        const next = { ...prev };
        for (const f of list) {
          if (!next[f.path]) next[f.path] = { auto: false, human: null };
        }
        scheduleReviewSave(next);
        return next;
      });
      setScanned(true);
    },
    [scheduleReviewSave],
  );

  const loadFromSupabase = useCallback(
    async (quiet = false) => {
      setScanning(true);
      if (!quiet) setProgress(0);
      try {
        const list = await fetchUploads();
        applyFileList(list);
        setProgress(null);
        const need = list.filter((f) => !isCacheOk(cache[f.path])).length;
        setMsg(
          quiet
            ? `נטענו ${list.length} תמונות מ-Supabase`
            : `נמצאו ${list.length} תמונות` + (need ? ` (${need} ללא ניתוח)` : ''),
          'ok',
        );
      } catch (e) {
        setProgress(null);
        setMsg('שגיאה: ' + (e instanceof Error ? e.message : String(e)), 'err');
      }
      setScanning(false);
    },
    [applyFileList, cache],
  );

  useEffect(() => {
    (async () => {
      let local: Record<string, FaceEntry> = {};
      try {
        const raw = localStorage.getItem(CACHE_LS);
        if (raw) local = JSON.parse(raw) as Record<string, FaceEntry>;
      } catch {
        /* ignore */
      }
      let merged: Record<string, FaceEntry> = local;
      try {
        const [server, serverReview] = await Promise.all([loadCache(), loadReview()]);
        merged = mergeCacheRecords(server, local);
        setCache(merged);
        setReview(serverReview);
        try {
          localStorage.setItem(CACHE_LS, JSON.stringify(merged));
        } catch {
          /* ignore */
        }
      } catch {
        if (Object.keys(local).length) {
          merged = local;
          setCache(local);
        }
      }

      if (Object.keys(merged).length < 100 && !legacyImportTried.current) {
        legacyImportTried.current = true;
        setMsg('מייבא ניתוח ישן מ-face_cache.json...', '');
        const res = await importLegacyCache();
        if (res.ok && res.imported > 0) {
          const server = await loadCache();
          merged = mergeCacheRecords(server, local);
          setCache(merged);
          try {
            localStorage.setItem(CACHE_LS, JSON.stringify(merged));
          } catch {
            /* ignore */
          }
          setMsg(`יובאו ${res.imported} רשומות ניתוח מהפרויקט הישן ✓`, 'ok');
        } else if (!res.ok && res.error) {
          setMsg(
            `${res.error} — לחצי «ייבא קאש» או העלי את הקובץ ידנית`,
            'warn',
          );
        }
      }

      await loadFromSupabase(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadCacheFromServer = async () => {
    try {
      const server = await loadCache();
      const merged = mergeCacheRecords(server, cache);
      await persistCache(merged, true);
      const n = files.filter((f) => hasScore(merged[f.path])).length;
      setMsg(`קאש עודכן מהשרת — ${n} תמונות עם ציון`, 'ok');
    } catch (e) {
      setMsg('לא נטען קאש מהשרת', 'err');
    }
  };

  const uploaderCount = useMemo(() => {
    const s = new Set(files.map((f) => f.uploader));
    return s.size;
  }, [files]);

  const analyzedValid = useMemo(
    () => files.filter((f) => isCacheOk(cache[f.path])).length,
    [files, cache],
  );

  const scoredValid = useMemo(
    () => files.filter((f) => hasScore(cache[f.path])).length,
    [files, cache],
  );

  const cacheTotal = Object.keys(cache).length;
  const cacheBad = cacheTotal - Object.values(cache).filter(isCacheOk).length;

  const isSelected = useCallback(
    (path: string) => isFinallySelected(review, path),
    [review],
  );

  const selectedCount = useMemo(
    () => files.filter((f) => isSelected(f.path)).length,
    [files, isSelected],
  );

  const humanCount = useMemo(
    () => files.filter((f) => review[f.path]?.human != null).length,
    [files, review],
  );

  const gCount = files.filter(
    (f) => isSelected(f.path) && getType(cache, f) === 'group',
  ).length;
  const sCount = files.filter(
    (f) => isSelected(f.path) && getType(cache, f) === 'solo',
  ).length;

  const updateReview = useCallback(
    (updater: (prev: ReviewState) => ReviewState) => {
      setReview((prev) => {
        const next = updater(prev);
        scheduleReviewSave(next);
        return next;
      });
    },
    [scheduleReviewSave],
  );

  const handleYes = useCallback(
    (path: string) => {
      updateReview((prev) => {
        const human = prev[path]?.human === 'yes' ? null : 'yes';
        return setHuman(prev, path, human);
      });
    },
    [updateReview],
  );

  const handleNo = useCallback(
    (path: string) => {
      updateReview((prev) => {
        const human = prev[path]?.human === 'no' ? null : 'no';
        return setHuman(prev, path, human);
      });
    },
    [updateReview],
  );

  /** סווייפ — תמיד מגדיר ✓/✗ (לא toggle) */
  const handleSetYes = useCallback(
    (path: string) => updateReview((prev) => setHuman(prev, path, 'yes')),
    [updateReview],
  );

  const handleSetNo = useCallback(
    (path: string) => updateReview((prev) => setHuman(prev, path, 'no')),
    [updateReview],
  );

  const persistCache = async (next: Record<string, FaceEntry>, replace = false) => {
    setCache(next);
    try {
      localStorage.setItem(CACHE_LS, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    await saveCache(next, replace);
  };

  const handleScan = () => loadFromSupabase(false);

  const handleImportLegacy = async () => {
    setImportingCache(true);
    setMsg('מייבא קאש ישן...', '');
    try {
      const res = await importLegacyCache();
      if (!res.ok) throw new Error(res.error || 'ייבוא נכשל');
      const server = await loadCache();
      const merged = mergeCacheRecords(server, cache);
      await persistCache(merged, true);
      const n = files.filter((f) => isCacheOk(merged[f.path])).length;
      setMsg(`יובאו ${res.imported} רשומות — ${n} תואמות לתמונות הנוכחיות ✓`, 'ok');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e), 'err');
    }
    setImportingCache(false);
  };

  const handleCacheFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportingCache(true);
    setMsg(`מייבא ${file.name}...`, '');
    try {
      const imported = await importCacheJsonFile(file);
      const server = await loadCache();
      const merged = mergeCacheRecords(server, cache);
      await persistCache(merged, true);
      setMsg(`יובאו ${imported} רשומות מקובץ ✓`, 'ok');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err), 'err');
    }
    setImportingCache(false);
  };

  const aiPickCount = useMemo(
    () => files.filter((f) => review[f.path]?.auto).length,
    [files, review],
  );

  const loadImageB64 = async (path: string) => {
    const imgRes = await fetch(publicPhotoUrl(path));
    if (!imgRes.ok) throw new Error('image fetch ' + imgRes.status);
    const blob = await imgRes.blob();
    const image_b64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return { image_b64, content_type: blob.type || 'image/jpeg' };
  };

  const waitForRateLimit = (seconds: number, label: string) => {
    setMsg(`⏸ ${label} — מגבלת OpenAI (429), ממתין ${seconds} שניות...`, 'warn');
  };

  const analyzeOne = async (path: string, prev?: FaceEntry): Promise<FaceEntry> => {
    return withRateLimitRetry(
      async () => {
        const { image_b64, content_type } = await loadImageB64(path);
        const data = await analyzeImage(path, image_b64, content_type);
        return mergeCacheEntry(prev ?? cache[path], {
          count: parseInt(String(data.count), 10) || 0,
          desc: data.desc || '',
        });
      },
      {
        onWait: (sec) => waitForRateLimit(sec, 'ניתוח פנים'),
        shouldAbort: () => abortRef.current,
      },
    );
  };

  const scoreOne = async (path: string, prev?: FaceEntry): Promise<FaceEntry> => {
    return withRateLimitRetry(
      async () => {
        const { image_b64, content_type } = await loadImageB64(path);
        const data = await scoreImage(path, image_b64, content_type);
        const score = parseInt(String(data.score), 10);
        return mergeCacheEntry(prev ?? cache[path], {
          score: score >= 1 && score <= 100 ? score : 0,
        });
      },
      {
        onWait: (sec) => waitForRateLimit(sec, 'ציון'),
        shouldAbort: () => scoreAbortRef.current,
      },
    );
  };

  const handleAnalyze = async () => {
    if (analyzing) {
      abortRef.current = true;
      return;
    }
    abortRef.current = false;
    const toAnalyze = files.filter((f) => !isCacheOk(cache[f.path]));
    const okCount = files.length - toAnalyze.length;
    if (!toAnalyze.length) {
      setMsg('כל התמונות כבר נותחו ✓', 'ok');
      return;
    }
    setAnalyzing(true);
    setMsg(
      `מנתח ${toAnalyze.length} תמונות (${okCount} כבר תקינות, ${cacheTotal} רשומות בקובץ)`,
    );
    let next = { ...cache };
    let errors = 0;
    const BATCH = 3;
    for (let i = 0; i < toAnalyze.length; i += BATCH) {
      if (abortRef.current) break;
      const batch = toAnalyze.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (f) => {
          if (abortRef.current) return;
          try {
            next[f.path] = await analyzeOne(f.path, next[f.path]);
          } catch (e) {
            if (abortRef.current || isRateLimitError(e)) return;
            next[f.path] = mergeCacheEntry(next[f.path], { count: -1, desc: '' });
            errors++;
          }
          const total = Object.keys(next).length;
          setProgress((total / files.length) * 100);
          setStatus(
            `מנתח... ${total}/${files.length}` + (errors ? ` (${errors} שגיאות)` : ''),
          );
          setCache({ ...next });
        }),
      );
      if ((i + BATCH) % 50 === 0) await saveCache(next);
    }
    await persistCache(next, true);
    setProgress(null);
    setAnalyzing(false);
    setMsg(
      abortRef.current
        ? `ניתוח הופסק – ${Object.keys(next).length} נותחו`
        : `ניתוח הסתיים! ${Object.keys(next).length} תמונות ✓`,
      abortRef.current ? 'warn' : 'ok',
    );
  };

  const handleScore = async () => {
    if (scoring) {
      scoreAbortRef.current = true;
      return;
    }
    scoreAbortRef.current = false;
    const toScore = files.filter((f) => !hasScore(cache[f.path]));
    const okCount = files.length - toScore.length;
    if (!toScore.length) {
      setMsg('לכל התמונות כבר יש ציון ✓', 'ok');
      return;
    }
    setScoring(true);
    setMsg(`מדרג ${toScore.length} תמונות (${okCount} כבר עם ציון)`, '');
    let next = { ...cache };
    let errors = 0;
    let done = 0;
    const BATCH = 2;
    for (let i = 0; i < toScore.length; i += BATCH) {
      if (scoreAbortRef.current) break;
      const batch = toScore.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (f) => {
          if (scoreAbortRef.current) return;
          try {
            next[f.path] = await scoreOne(f.path, next[f.path]);
          } catch (e) {
            if (scoreAbortRef.current || isRateLimitError(e)) return;
            next[f.path] = mergeCacheEntry(next[f.path], { score: 0 });
            errors++;
          }
          done++;
          setProgress((done / files.length) * 100);
          setStatus(
            `מדרג... ${done}/${toScore.length}` + (errors ? ` (${errors} שגיאות)` : ''),
          );
          setCache({ ...next });
        }),
      );
      if ((i + BATCH) % 50 === 0) await saveCache(next);
    }
    await persistCache(next, true);
    setProgress(null);
    setScoring(false);
    setMsg(
      scoreAbortRef.current
        ? `דירוג הופסק – ${scoredValid} עם ציון`
        : `דירוג הסתיים! ${files.filter((f) => hasScore(next[f.path])).length} ציונים ✓`,
      scoreAbortRef.current ? 'warn' : 'ok',
    );
  };

  const handleAutoSelect = () => {
    const paths = autoSelectPaths(files, cache, target, minPer);
    updateReview((prev) =>
      applyAutoSelect(
        prev,
        files.map((f) => f.path),
        paths,
      ),
    );
    const g = [...paths].filter((p) => {
      const f = files.find((x) => x.path === p);
      return f && getType(cache, f) === 'group';
    }).length;
    setMsg(`בחירה אוטומטית: ${paths.size} תמונות (קבוצות: ~${g}) — אפשר לדרוס ב-✓/✗`, 'ok');
  };

  const handleCopy = () => {
    const sel = files.filter((f) => isSelected(f.path));
    const text = sel.map((f) => publicPhotoUrl(f.path)).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setMsg(`הועתקו ${sel.length} קישורים ✓`, 'ok');
    });
  };

  const downloadCsv = (rows: string[][], filename: string) => {
    const csv =
      '\uFEFF' +
      rows
        .map((r) =>
          r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','),
        )
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setMsg(`${filename} הורד ✓`, 'ok');
  };

  const handleDownloadImages = async () => {
    const sel = files.filter((f) => review[f.path]?.human === 'yes');
    if (!sel.length) {
      setMsg('אין תמונות עם ✓ ידני — רק הן נכנסות ל-ZIP', 'warn');
      return;
    }
    if (
      !confirm(
        `להוריד ${sel.length} תמונות עם אישור ידני ✓ בלבד?\n(לא כולל הצעות AI · עשוי לקחת כמה דקות)`,
      )
    ) {
      return;
    }
    setDownloadingZip(true);
    setMsg(`מוריד ${sel.length} תמונות...`, '');
    try {
      const { blob, ok, fail } = await downloadSelectedZip(
        sel.map((f) => ({ path: f.path, name: f.name, uploader: f.uploader })),
      );
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `reunion_selected_${ok}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(
        fail > 0
          ? `הורדו ${ok} תמונות (${fail} נכשלו) ✓`
          : `הורדו ${ok} תמונות ב-ZIP ✓`,
        fail > 0 ? 'warn' : 'ok',
      );
    } catch (e) {
      setMsg(
        'שגיאה בהורדה: ' + (e instanceof Error ? e.message : String(e)),
        'err',
      );
    }
    setDownloadingZip(false);
  };

  const handleDownloadSelected = () => {
    const sel = files.filter((f) => isSelected(f.path));
    downloadCsv(
      [
        [
          'url',
          'סוג',
          'מספר_אנשים',
          'ציון_1_100',
          'תיאור',
          'אוטומטי',
          'אנושי',
          'סופי',
          'uploader',
          'filename',
          'created_at',
        ],
        ...sel.map((f) => {
          const r = review[f.path];
          return [
            publicPhotoUrl(f.path),
            getType(cache, f) === 'group' ? 'קבוצה' : 'יחיד/זוג',
            String(getCount(cache, f) ?? ''),
            String(getScore(cache, f) ?? ''),
            getDesc(cache, f),
            r?.auto ? 'כן' : 'לא',
            r?.human === 'yes' ? '✓' : r?.human === 'no' ? '✗' : '',
            'כן',
            f.uploader,
            f.name,
            f.created_at,
          ];
        }),
      ],
      'reunion_selected.csv',
    );
  };

  const handleExportDb = () => {
    downloadCsv(
      [
        [
          'file_path',
          'url',
          'uploader',
          'מספר_אנשים',
          'ציון_1_100',
          'תיאור',
          'סוג',
          'אוטומטי',
          'אנושי',
          'סופי',
          'created_at',
        ],
        ...files.map((f) => {
          const r = review[f.path];
          const final = isSelected(f.path);
          return [
            f.path,
            publicPhotoUrl(f.path),
            f.uploader,
            String(getCount(cache, f) ?? ''),
            String(getScore(cache, f) ?? ''),
            getDesc(cache, f),
            getType(cache, f),
            r?.auto ? 'כן' : 'לא',
            r?.human === 'yes' ? '✓' : r?.human === 'no' ? '✗' : '',
            final ? 'כן' : 'לא',
            f.created_at,
          ];
        }),
      ],
      'reunion_db.csv',
    );
  };

  const handlePurgeBad = async () => {
    const bad = Object.keys(cache).filter((p) => !isCacheOk(cache[p]));
    if (!bad.length) {
      setMsg('אין רשומות פגומות בקאש', 'ok');
      return;
    }
    if (!confirm(`למחוק ${bad.length} רשומות פגומות (count=-1)?`)) return;
    const next = { ...cache };
    bad.forEach((p) => delete next[p]);
    await persistCache(next, true);
    setMsg(`נמחקו ${bad.length} פגומים`, 'warn');
  };

  const handleClearCache = async () => {
    if (!confirm('למחוק את כל נתוני הניתוח השמורים?')) return;
    await clearCache();
    localStorage.removeItem(CACHE_LS);
    setCache({});
    setMsg('Cache נוקה', 'warn');
  };

  const handleResetHuman = () => {
    if (!humanCount) {
      setMsg('אין בחירות אנושיות לאפס', 'ok');
      return;
    }
    if (
      !confirm(
        `לאפס ${humanCount} בחירות אנושיות (✓/✗)?\nבחירת ה-AI (🤖) והציונים נשארים.`,
      )
    ) {
      return;
    }
    updateReview(clearHumanChoices);
    setMsg(`אופסו ${humanCount} בחירות אנושיות — נשאר רק AI`, 'ok');
  };

  const hasSelection = selectedCount > 0;

  return (
    <div className={`app${uiView === 'swipe' ? ' app--swipe' : ''}`}>
      <nav className="view-tabs" aria-label="מצב תצוגה">
        <button
          type="button"
          className={`view-tabs__btn${uiView === 'list' ? ' view-tabs__btn--active' : ''}`}
          onClick={() => setUiViewPersist('list')}
        >
          📋 רשימה
        </button>
        <button
          type="button"
          className={`view-tabs__btn${uiView === 'swipe' ? ' view-tabs__btn--active' : ''}`}
          onClick={() => setUiViewPersist('swipe')}
        >
          📱 סווייפ
        </button>
      </nav>

      {uiView === 'list' && (
      <header className="topbar">
        <h1>📸 מפגש מחזור</h1>
        <div className="badges">
          <span className="badge badge--blue">
            {scanned ? `סה״כ: ${files.length} | מעלים: ${uploaderCount}` : 'טוען...'}
          </span>
          <span className="badge badge--green">סופי באלבום: {selectedCount}</span>
          <span className="badge badge--gray">בדקת ידנית: {humanCount}</span>
          {selectedCount > 0 && (
            <>
              <span className="badge badge--green">🟢 קבוצות: {gCount}</span>
              <span className="badge badge--orange">🟡 יחידים: {sCount}</span>
            </>
          )}
          <span className="badge badge--gray">
            {cacheBad > 0
              ? `נותחו: ${analyzedValid} (+${cacheBad} פגומים)`
              : `נותחו: ${analyzedValid}`}
          </span>
          <span className="badge badge--gray">
            ציון: {scoredValid}
            {scanned && files.length > 0 ? ` / ${files.length}` : ''}
          </span>
        </div>
        <div className="actions">
          <button type="button" disabled={scanning} onClick={handleScan}>
            {scanning ? '⏳ טוען...' : '🔄 רענן רשימת תמונות'}
          </button>
          <button
            type="button"
            disabled={importingCache}
            onClick={handleImportLegacy}
          >
            {importingCache ? '⏳ מייבא...' : '📥 ייבא קאש ישן'}
          </button>
          <button
            type="button"
            disabled={importingCache}
            onClick={() => cacheFileRef.current?.click()}
          >
            📂 קובץ JSON
          </button>
          <input
            ref={cacheFileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={handleCacheFile}
          />
          <button
            type="button"
            disabled={!scanned || scoring}
            onClick={handleAnalyze}
          >
            {analyzing ? '⏹ עצור' : '🔍 נתח פנים'}
          </button>
          <button
            type="button"
            disabled={!scanned || analyzing}
            onClick={handleScore}
          >
            {scoring ? '⏹ עצור' : '⭐ ציון (1–100)'}
          </button>
          <button type="button" disabled={!scanned} onClick={handleAutoSelect}>
            ✨ בחירה אוטומטית
          </button>
          <button
            type="button"
            disabled={!scanned || humanCount === 0}
            onClick={handleResetHuman}
          >
            ✋ אפס בחירה אנושית
          </button>
          <button type="button" disabled={!hasSelection} onClick={handleCopy}>
            📋 העתק קישורים
          </button>
          <button
            type="button"
            disabled={!hasSelection || downloadingZip}
            onClick={handleDownloadImages}
          >
            {downloadingZip ? '⏳ מוריד...' : '🖼️ ZIP — סופי ✓ בלבד'}
          </button>
          <button
            type="button"
            disabled={!hasSelection}
            onClick={handleDownloadSelected}
          >
            ⬇️ CSV נבחרים
          </button>
          <button type="button" disabled={!scanned} onClick={handleExportDb}>
            📊 DB מלא
          </button>
          <button type="button" disabled={scanning} onClick={reloadCacheFromServer}>
            🔄 רענן קאש
          </button>
          <button type="button" className="btn-danger" onClick={handlePurgeBad}>
            🧹 פגומים
          </button>
          <button type="button" className="btn-danger" onClick={handleClearCache}>
            🗑 הכל
          </button>
        </div>
      </header>
      )}

      <div className={`statusbar${statusKind ? ` statusbar--${statusKind}` : ''}`}>
        <span>{status}</span>
        {progress != null && (
          <div className="progress">
            <div className="progress__bar" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        )}
      </div>

      <main className={`main${uiView === 'swipe' ? ' main--swipe' : ' main--single'}`}>
        {uiView === 'swipe' ? (
          <MobileSwipeView
            files={files}
            review={review}
            onSetYes={handleSetYes}
            onSetNo={handleSetNo}
            loading={scanning && files.length === 0}
          />
        ) : (
          <PhotoListPanel
            files={files}
            cache={cache}
            review={review}
            onYes={handleYes}
            onNo={handleNo}
            loading={scanning && files.length === 0}
          />
        )}
      </main>

      {uiView === 'list' && (
      <section className="setup setup--inline">
          <label>יעד: {target}</label>
          <input
            type="range"
            min={50}
            max={400}
            step={10}
            value={target}
            onChange={(e) => setTarget(+e.target.value)}
          />
          <label>מינ׳ מעלה: {minPer}</label>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={minPer}
            onChange={(e) => setMinPer(+e.target.value)}
          />
      </section>
      )}
    </div>
  );
}
