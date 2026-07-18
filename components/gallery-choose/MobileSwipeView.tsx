'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { publicPhotoUrl } from './config';
import { isHiddenFromReviewBrowsing } from './reviewState';
import type { PhotoFile, ReviewState } from './types';

const SWIPE_THRESHOLD = 72;

type SectionMode = 'yes' | 'pending' | 'no' | 'ai';

type Props = {
  files: PhotoFile[];
  review: ReviewState;
  onSetYes: (path: string) => void;
  onSetNo: (path: string) => void;
  loading?: boolean;
};

function sortQueue(files: PhotoFile[], review: ReviewState): PhotoFile[] {
  return [...files].sort((a, b) => {
    const aAi = review[a.path]?.auto ? 1 : 0;
    const bAi = review[b.path]?.auto ? 1 : 0;
    return bAi - aAi;
  });
}

export function MobileSwipeView({
  files,
  review,
  onSetYes,
  onSetNo,
  loading,
}: Props) {
  const [mode, setMode] = useState<SectionMode>('pending');
  const [pendingUploader, setPendingUploader] = useState('');
  const [aiUploader, setAiUploader] = useState('');
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<'x' | 'y' | null>(null);

  const picked = useMemo(
    () => files.filter((f) => review[f.path]?.human === 'yes'),
    [files, review],
  );
  const pending = useMemo(
    () => files.filter((f) => review[f.path]?.human == null),
    [files, review],
  );
  const rejected = useMemo(
    () => files.filter((f) => review[f.path]?.human === 'no'),
    [files, review],
  );
  const aiPicked = useMemo(
    () =>
      files.filter(
        (f) => review[f.path]?.auto && !isHiddenFromReviewBrowsing(review, f.path),
      ),
    [files, review],
  );

  const pendingByUploader = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of pending) {
      m.set(f.uploader, (m.get(f.uploader) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [pending]);

  const aiByUploader = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of aiPicked) {
      m.set(f.uploader, (m.get(f.uploader) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [aiPicked]);

  const pendingFiltered = useMemo(() => {
    if (!pendingUploader) return pending;
    return pending.filter((f) => f.uploader === pendingUploader);
  }, [pending, pendingUploader]);

  const aiFiltered = useMemo(() => {
    if (!aiUploader) return aiPicked;
    return aiPicked.filter((f) => f.uploader === aiUploader);
  }, [aiPicked, aiUploader]);

  const pool = useMemo(() => {
    if (mode === 'yes') return picked;
    if (mode === 'no') return rejected;
    if (mode === 'ai') return aiFiltered;
    return pendingFiltered;
  }, [mode, picked, pendingFiltered, rejected, aiFiltered]);

  useEffect(() => {
    if (pendingUploader && !pending.some((f) => f.uploader === pendingUploader)) {
      setPendingUploader('');
    }
  }, [pending, pendingUploader]);

  useEffect(() => {
    if (aiUploader && !aiPicked.some((f) => f.uploader === aiUploader)) {
      setAiUploader('');
    }
  }, [aiPicked, aiUploader]);

  const queue = useMemo(() => sortQueue(pool, review), [pool, review]);

  const activeFile = queue[index];

  useEffect(() => {
    setIndex(0);
  }, [mode, pendingUploader, aiUploader]);

  const switchMode = (next: SectionMode) => {
    setMode(next);
    setDragX(0);
    setExitDir(null);
  };

  useEffect(() => {
    const counts: Record<SectionMode, number> = {
      yes: picked.length,
      pending: pending.length,
      no: rejected.length,
      ai: aiPicked.length,
    };
    if (counts[mode] > 0) return;
    const fallback = (['pending', 'yes', 'no', 'ai'] as SectionMode[]).find(
      (m) => counts[m] > 0,
    );
    if (fallback) switchMode(fallback);
  }, [mode, picked.length, pending.length, rejected.length, aiPicked.length]);

  useEffect(() => {
    if (index >= queue.length && queue.length > 0) {
      setIndex(queue.length - 1);
    }
    if (queue.length === 0) setIndex(0);
  }, [queue.length, index]);

  const advance = useCallback(() => {
    setExitDir(null);
    setDragX(0);
    setIndex((i) => (queue.length ? (i + 1) % queue.length : 0));
  }, [queue.length]);

  const commit = useCallback(
    (dir: 'left' | 'right') => {
      if (!activeFile) return;
      setExitDir(dir);
      if (dir === 'right') onSetYes(activeFile.path);
      else onSetNo(activeFile.path);
      window.setTimeout(advance, 220);
    },
    [activeFile, onSetYes, onSetNo, advance],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (exitDir || !activeFile) return;
    locked.current = null;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || exitDir) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (locked.current == null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        locked.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      }
    }
    if (locked.current === 'x') setDragX(dx);
  };

  const onPointerUp = () => {
    if (!dragging || exitDir) return;
    setDragging(false);
    locked.current = null;
    if (dragX > SWIPE_THRESHOLD) commit('right');
    else if (dragX < -SWIPE_THRESHOLD) commit('left');
    else setDragX(0);
  };

  const rotate = Math.min(Math.max(dragX / 12, -12), 12);
  const opacityYes = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1);
  const opacityNo = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1);

  if (loading) {
    return <p className="mobile-swipe__empty">…</p>;
  }

  if (!files.length) {
    return null;
  }

  const mainTabs: { id: SectionMode; label: string; count: number; tone: string }[] = [
    { id: 'pending', label: 'עוד לא', count: pending.length, tone: 'pending' },
    { id: 'yes', label: 'נבחר', count: picked.length, tone: 'yes' },
    { id: 'no', label: 'לא נבחר', count: rejected.length, tone: 'no' },
    { id: 'ai', label: '✦ הצעות AI', count: aiPicked.length, tone: 'ai' },
  ];

  return (
    <div className="mobile-swipe">
      <div className="mobile-swipe__stage">
        <span
          className="mobile-swipe__stamp mobile-swipe__stamp--yes"
          style={{ opacity: opacityYes }}
          aria-hidden
        >
          ✓
        </span>
        <span
          className="mobile-swipe__stamp mobile-swipe__stamp--no"
          style={{ opacity: opacityNo }}
          aria-hidden
        >
          ✗
        </span>

        {activeFile ? (() => {
          const r = review[activeFile.path];
          const aiPick = !!r?.auto;
          const humanYes = r?.human === 'yes';
          const humanNo = r?.human === 'no';
          return (
          <article
            className={[
              'mobile-swipe__card',
              exitDir ? `mobile-swipe__card--exit-${exitDir}` : '',
              aiPick && !humanNo ? 'mobile-swipe__card--ai-pick' : '',
              humanYes ? 'mobile-swipe__card--human-yes' : '',
              humanNo ? 'mobile-swipe__card--human-no' : '',
            ].filter(Boolean).join(' ')}
            style={
              exitDir
                ? undefined
                : {
                    transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
                    transition: dragging ? 'none' : 'transform 0.2s ease',
                  }
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              src={publicPhotoUrl(activeFile.path)}
              alt=""
              className="mobile-swipe__img"
              draggable={false}
            />
            <div className="mobile-swipe__meta">
              {aiPick && (
                <div
                  className={`mobile-swipe__ai-badge${humanNo ? ' mobile-swipe__ai-badge--overridden' : ''}`}
                  aria-label="הצעת בחירה אוטומטית לאלבום"
                >
                  <span className="mobile-swipe__ai-badge-icon" aria-hidden>
                    ✦
                  </span>
                  <span className="mobile-swipe__ai-badge-title">הצעת AI</span>
                  <span className="mobile-swipe__ai-badge-dot" aria-hidden>
                    ·
                  </span>
                  <span className="mobile-swipe__ai-badge-sub">
                    {humanNo ? 'דחית — לא באלבום' : 'לספר המחזור'}
                  </span>
                </div>
              )}
              {(humanYes || humanNo) && (
                <div className="mobile-swipe__meta-row">
                  {humanYes && (
                    <span className="mobile-swipe__pill mobile-swipe__pill--yes">
                      ✓ בחרת לאלבום
                    </span>
                  )}
                  {humanNo && (
                    <span className="mobile-swipe__pill mobile-swipe__pill--no">
                      ✗ לא תיכנס לאלבום
                    </span>
                  )}
                </div>
              )}
              <p className="mobile-swipe__uploader">{activeFile.uploader}</p>
            </div>
          </article>
          );
        })() : (
          <div className="mobile-swipe__card mobile-swipe__card--placeholder">—</div>
        )}
      </div>

      <div className="mobile-swipe__footer">
        <div className="mobile-swipe__actions">
          <button
            type="button"
            className="mobile-swipe__btn mobile-swipe__btn--no"
            aria-label="לא"
            disabled={!activeFile}
            onClick={() => commit('left')}
          >
            ✗
          </button>
          <button
            type="button"
            className="mobile-swipe__btn mobile-swipe__btn--skip"
            aria-label="הבא"
            disabled={!queue.length}
            onClick={advance}
          >
            ↷
          </button>
          <button
            type="button"
            className="mobile-swipe__btn mobile-swipe__btn--yes"
            aria-label="כן"
            disabled={!activeFile}
            onClick={() => commit('right')}
          >
            ✓
          </button>
        </div>

      {mode === 'pending' && pendingByUploader.length > 0 && (
        <label className="mobile-swipe__uploader-pick">
          <span className="mobile-swipe__uploader-pick-label">מעלה</span>
          <select
            className="mobile-swipe__uploader-select"
            value={pendingUploader}
            onChange={(e) => setPendingUploader(e.target.value)}
          >
            <option value="">הכל ({pending.length})</option>
            {pendingByUploader.map(({ name, count }) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </label>
      )}

      {mode === 'ai' && aiByUploader.length > 0 && (
        <label className="mobile-swipe__uploader-pick">
          <span className="mobile-swipe__uploader-pick-label">קבוצת מעלה</span>
          <select
            className="mobile-swipe__uploader-select"
            value={aiUploader}
            onChange={(e) => setAiUploader(e.target.value)}
          >
            <option value="">הכל ({aiPicked.length})</option>
            {aiByUploader.map(({ name, count }) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </label>
      )}

        <div className="mobile-swipe__tabs" role="tablist">
          {mainTabs.map((t) => {
            const empty = t.count === 0;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={mode === t.id}
                aria-disabled={empty}
                disabled={empty}
                className={`mobile-swipe__tab mobile-swipe__tab--${t.tone}${mode === t.id ? ' mobile-swipe__tab--active' : ''}${empty ? ' mobile-swipe__tab--disabled' : ''}`}
                onClick={() => {
                  if (!empty) switchMode(t.id);
                }}
              >
                {t.label} ({t.count})
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
