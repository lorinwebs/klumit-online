import type { FaceEntry, PhotoFile, PhotoType } from './types';

function toCacheObject(entry: FaceEntry | undefined): { count: number; desc: string; score?: number } | undefined {
  if (entry == null) return undefined;
  if (typeof entry === 'number') return { count: entry, desc: '' };
  return entry;
}

export function getCacheEntry(
  cache: Record<string, FaceEntry>,
  path: string,
): FaceEntry | undefined {
  const direct = cache[path];
  if (direct != null) return direct;
  const base = path.split('/').pop();
  if (base && cache[base] != null) return cache[base];
  if (!path.startsWith('uploads/')) {
    const u = `uploads/${path}`;
    if (cache[u] != null) return cache[u];
  }
  const idx = path.indexOf('uploads/');
  if (idx >= 0) {
    const tail = path.slice(idx);
    if (cache[tail] != null) return cache[tail];
  }
  return undefined;
}

export function mergeTwoCacheEntries(
  a: FaceEntry | undefined,
  b: FaceEntry | undefined,
): FaceEntry | undefined {
  const A = toCacheObject(a);
  const B = toCacheObject(b);
  if (!A && !B) return undefined;
  if (!A) return B;
  if (!B) return A;
  const count = isCacheOk(B) ? B.count : A.count;
  const desc = B.desc || A.desc;
  const score = hasScore(B) ? B.score : hasScore(A) ? A.score : B.score ?? A.score;
  return { count, desc, ...(score != null ? { score } : {}) };
}

export function mergeCacheRecords(
  ...sources: Record<string, FaceEntry>[]
): Record<string, FaceEntry> {
  const out: Record<string, FaceEntry> = {};
  for (const src of sources) {
    for (const [path, entry] of Object.entries(src)) {
      out[path] = mergeTwoCacheEntries(out[path], entry) ?? entry;
    }
  }
  return out;
}

export function isCacheOk(entry: FaceEntry | undefined): boolean {
  if (entry == null) return false;
  const c = typeof entry === 'number' ? entry : entry.count;
  return typeof c === 'number' && c >= 0;
}

export function getCount(cache: Record<string, FaceEntry>, f: PhotoFile): number | undefined {
  const v = getCacheEntry(cache, f.path);
  if (v == null) return undefined;
  return typeof v === 'object' ? v.count : v;
}

export function getDesc(cache: Record<string, FaceEntry>, f: PhotoFile): string {
  const v = getCacheEntry(cache, f.path);
  return v && typeof v === 'object' ? v.desc || '' : '';
}

export function getScore(cache: Record<string, FaceEntry>, f: PhotoFile): number | undefined {
  const v = getCacheEntry(cache, f.path);
  if (!v || typeof v !== 'object') return undefined;
  const s = v.score;
  return typeof s === 'number' && s >= 1 && s <= 100 ? s : undefined;
}

export function hasScore(entry: FaceEntry | undefined): boolean {
  if (!entry || typeof entry !== 'object') return false;
  const s = entry.score;
  return typeof s === 'number' && s >= 1 && s <= 100;
}

export function mergeCacheEntry(
  prev: FaceEntry | undefined,
  patch: Partial<{ count: number; desc: string; score: number }>,
): FaceEntry {
  const base =
    prev && typeof prev === 'object'
      ? { ...prev }
      : { count: typeof prev === 'number' ? prev : -1, desc: '' };
  return { ...base, ...patch };
}

export function sortByScoreDesc(files: PhotoFile[], cache: Record<string, FaceEntry>): PhotoFile[] {
  return [...files].sort((a, b) => (getScore(cache, b) ?? 0) - (getScore(cache, a) ?? 0));
}

export function getType(cache: Record<string, FaceEntry>, f: PhotoFile): PhotoType {
  const c = getCount(cache, f);
  if (c == null || c < 0) return 'unknown';
  if (c >= 4) return 'group';
  if (c >= 1) return 'solo';
  return 'unknown';
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function autoSelectPaths(
  allFiles: PhotoFile[],
  cache: Record<string, FaceEntry>,
  target: number,
  minPer: number,
): Set<string> {
  const targetGroup = Math.round(target * 0.8);
  const targetSolo = target - targetGroup;

  const groupPool = allFiles.filter((f) => (getCount(cache, f) ?? 0) >= 4);
  const soloPool = allFiles.filter((f) => {
    const c = getCount(cache, f);
    return c != null && c >= 1 && c <= 3;
  });
  const unknownPool = shuffle(
    allFiles.filter((f) => {
      const c = getCount(cache, f);
      return c == null || c < 0;
    }),
  );
  const split = Math.floor(unknownPool.length * 0.8);
  const finalGroup = shuffle([...groupPool, ...unknownPool.slice(0, split)]);
  const finalSolo = shuffle([...soloPool, ...unknownPool.slice(split)]);

  const used = new Set<string>();
  function pick(pool: PhotoFile[], targetCount: number) {
    const byUploader: Record<string, PhotoFile[]> = {};
    pool.forEach((f) => {
      (byUploader[f.uploader] ??= []).push(f);
    });
    const sel: PhotoFile[] = [];
    Object.values(byUploader).forEach((files) => {
      let n = 0;
      for (const f of sortByScoreDesc(files, cache)) {
        if (n >= minPer || sel.length >= targetCount) break;
        if (!used.has(f.path)) {
          sel.push(f);
          used.add(f.path);
          n++;
        }
      }
    });
    for (const f of sortByScoreDesc(
      pool.filter((x) => !used.has(x.path)),
      cache,
    )) {
      if (sel.length >= targetCount) break;
      sel.push(f);
      used.add(f.path);
    }
    return sel;
  }

  const selGroup = pick(finalGroup, targetGroup);
  const selSolo = pick(finalSolo, targetSolo);
  return new Set([...selGroup, ...selSolo].map((f) => f.path));
}
