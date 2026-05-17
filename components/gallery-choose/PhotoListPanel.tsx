'use client';

import { useCallback, useMemo, useState } from 'react';
import type { FaceEntry, PhotoFile, PhotoType, ReviewState } from './types';
import { isFinallySelected, isHiddenFromReviewBrowsing } from './reviewState';
import { getCount, getDesc, getScore, getType } from './utils';
import { PhotoRow } from './PhotoRow';

type Filter = 'all' | 'ai' | 'not-ai' | 'human' | 'final';

function sortAiFirst(files: PhotoFile[], review: ReviewState): PhotoFile[] {
  return [...files].sort((a, b) => {
    const aAi = review[a.path]?.auto ? 1 : 0;
    const bAi = review[b.path]?.auto ? 1 : 0;
    return bAi - aAi;
  });
}

type Props = {
  files: PhotoFile[];
  cache: Record<string, FaceEntry>;
  review: ReviewState;
  onYes: (path: string) => void;
  onNo: (path: string) => void;
  loading?: boolean;
};

export function PhotoListPanel({
  files,
  cache,
  review,
  onYes,
  onNo,
  loading,
}: Props) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [typeFilter, setTypeFilter] = useState<'' | PhotoType>('');
  const [openUploaders, setOpenUploaders] = useState<Set<string> | null>(null);

  const stats = useMemo(() => {
    let ai = 0;
    let human = 0;
    let final = 0;
    for (const f of files) {
      const r = review[f.path];
      if (r?.auto) ai++;
      if (r?.human != null) human++;
      if (isFinallySelected(review, f.path)) final++;
    }
    return { ai, human, final, total: files.length };
  }, [files, review]);

  const matchesSearchAndType = useCallback(
    (f: PhotoFile, statusFilter: Filter) => {
      const r = review[f.path];
      if (
        statusFilter !== 'final' &&
        isHiddenFromReviewBrowsing(review, f.path)
      ) {
        return false;
      }
      const t = getType(cache, f);
      if (statusFilter === 'ai' && !r?.auto) return false;
      if (statusFilter === 'not-ai' && r?.auto) return false;
      if (statusFilter === 'human' && r?.human == null) return false;
      if (statusFilter === 'final' && !isFinallySelected(review, f.path)) return false;
      if (typeFilter === 'group' && t !== 'group') return false;
      if (typeFilter === 'solo' && t !== 'solo') return false;
      if (typeFilter === 'unknown' && t !== 'unknown') return false;
      const qq = q.trim().toLowerCase();
      if (qq && !f.uploader.toLowerCase().includes(qq) && !f.name.toLowerCase().includes(qq)) {
        return false;
      }
      return true;
    },
    [review, cache, typeFilter, q],
  );

  const statusCounts = useMemo(() => {
    const n = (status: Filter) =>
      files.filter((f) => matchesSearchAndType(f, status)).length;
    return {
      all: n('all'),
      ai: n('ai'),
      notAi: n('not-ai'),
      human: n('human'),
      final: n('final'),
    };
  }, [files, matchesSearchAndType]);

  const matchesSearchAndStatus = useCallback(
    (f: PhotoFile, type: '' | PhotoType) => {
      const r = review[f.path];
      if (filter !== 'final' && isHiddenFromReviewBrowsing(review, f.path)) {
        return false;
      }
      const t = getType(cache, f);
      if (filter === 'ai' && !r?.auto) return false;
      if (filter === 'not-ai' && r?.auto) return false;
      if (filter === 'human' && r?.human == null) return false;
      if (filter === 'final' && !isFinallySelected(review, f.path)) return false;
      if (type === 'group' && t !== 'group') return false;
      if (type === 'solo' && t !== 'solo') return false;
      if (type === 'unknown' && t !== 'unknown') return false;
      const qq = q.trim().toLowerCase();
      if (qq && !f.uploader.toLowerCase().includes(qq) && !f.name.toLowerCase().includes(qq)) {
        return false;
      }
      return true;
    },
    [review, cache, filter, q],
  );

  const typeCounts = useMemo(() => {
    const n = (type: '' | PhotoType) =>
      files.filter((f) => matchesSearchAndStatus(f, type)).length;
    return {
      all: n(''),
      group: n('group'),
      solo: n('solo'),
      unknown: n('unknown'),
    };
  }, [files, matchesSearchAndStatus]);

  const filtered = useMemo(
    () => files.filter((f) => matchesSearchAndType(f, filter)),
    [files, matchesSearchAndType, filter],
  );

  const groups = useMemo(() => {
    const m: Record<string, PhotoFile[]> = {};
    for (const f of filtered) {
      (m[f.uploader] ??= []).push(f);
    }
    return Object.entries(m)
      .map(([uploader, list]) => [uploader, sortAiFirst(list, review)] as const)
      .sort((a, b) => {
        const aAi = a[1].filter((f) => review[f.path]?.auto).length;
        const bAi = b[1].filter((f) => review[f.path]?.auto).length;
        if (bAi !== aAi) return bAi - aAi;
        return b[1].length - a[1].length;
      });
  }, [filtered, review]);

  const uploaderNames = useMemo(() => groups.map(([u]) => u), [groups]);

  const firstUploader = uploaderNames[0] ?? null;
  const expanded =
    openUploaders ?? (firstUploader ? new Set([firstUploader]) : new Set());

  const expandAll = () => setOpenUploaders(new Set(uploaderNames));
  const collapseAll = () => setOpenUploaders(new Set());

  return (
    <section className="review-panel">
      <header className="review-panel__head">
        <h2>כל התמונות</h2>
        <span className="review-panel__sub">
          {stats.total} סה״כ · 🤖 {stats.ai} AI · ✋ {stats.human} ידני · ✓ {stats.final} סופי
        </span>
        <p className="review-panel__hint">
          סופי / אלבום = אישור ידני ✓ בלבד · 🤖 AI הוא הצעה בלבד
        </p>
        <input
          className="review-panel__search"
          placeholder="חיפוש מעלה / קובץ..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="review-panel__filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
        >
          <option value="all">הצג: הכל ({statusCounts.all})</option>
          <option value="ai">רק מה ש-AI בחר ({statusCounts.ai})</option>
          <option value="not-ai">לא נבחר על ידי AI ({statusCounts.notAi})</option>
          <option value="human">נבחר/נדחה אנושית ({statusCounts.human})</option>
          <option value="final">סופי — נכנס לאלבום ({statusCounts.final})</option>
        </select>
        <select
          className="review-panel__filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as '' | PhotoType)}
        >
          <option value="">סוג: הכל ({typeCounts.all})</option>
          <option value="group">🟢 קבוצות 4+ ({typeCounts.group})</option>
          <option value="solo">🟡 יחיד/זוג 1–3 ({typeCounts.solo})</option>
          <option value="unknown">לא נותח ({typeCounts.unknown})</option>
        </select>
        <div className="review-panel__accordion">
          <button
            type="button"
            className="review-panel__accordion-btn"
            disabled={loading || uploaderNames.length === 0}
            onClick={expandAll}
          >
            ▼ פתח הכל
          </button>
          <button
            type="button"
            className="review-panel__accordion-btn"
            disabled={loading || uploaderNames.length === 0}
            onClick={collapseAll}
          >
            ▶ קבץ הכל
          </button>
        </div>
      </header>

      <div className="review-panel__body">
        {loading ? (
          <p className="empty">טוען מ-Supabase...</p>
        ) : filtered.length === 0 ? (
          <p className="empty">אין תמונות להצגה</p>
        ) : (
          groups.map(([uploader, list]) => {
            const isOpen = expanded.has(uploader);
            const aiInGroup = list.filter((f) => review[f.path]?.auto).length;
            const selInGroup = list.filter((f) =>
              isFinallySelected(review, f.path),
            ).length;
            return (
              <div key={uploader} className="review__section">
                <button
                  type="button"
                  className="review__section-title"
                  onClick={() => {
                    setOpenUploaders((prev) => {
                      const s = new Set(prev ?? expanded);
                      if (s.has(uploader)) s.delete(uploader);
                      else s.add(uploader);
                      return s;
                    });
                  }}
                >
                  {isOpen ? '▼' : '▶'} {uploader} ({list.length})
                  {aiInGroup > 0 ? ` · 🤖 ${aiInGroup}` : ''}
                  {selInGroup > 0 ? ` · ✓ ${selInGroup}` : ''}
                </button>
                {isOpen && (
                  <div className="review__rows">
                    {list.map((f) => {
                      const r = review[f.path] ?? { auto: false, human: null };
                      return (
                        <PhotoRow
                          key={f.path}
                          file={f}
                          count={getCount(cache, f)}
                          score={getScore(cache, f)}
                          desc={getDesc(cache, f)}
                          type={getType(cache, f)}
                          auto={r.auto}
                          human={r.human}
                          selected={isFinallySelected(review, f.path)}
                          onYes={() => onYes(f.path)}
                          onNo={() => onNo(f.path)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
