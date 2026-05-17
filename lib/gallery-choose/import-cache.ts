import type { FaceEntry } from '@/components/gallery-choose/types';
import { importAnalysisCache } from './db';

export function parseFaceCacheJson(
  raw: Record<string, FaceEntry | number | unknown>,
): Record<string, FaceEntry> {
  const out: Record<string, FaceEntry> = {};
  for (const [file_path, entry] of Object.entries(raw)) {
    if (file_path.startsWith('_')) continue;
    if (typeof entry === 'number') {
      out[file_path] = { count: entry, desc: '' };
      continue;
    }
    if (entry && typeof entry === 'object' && 'count' in entry) {
      const obj = entry as { count: number; desc?: string; score?: number };
      const score =
        typeof obj.score === 'number' && obj.score >= 1 && obj.score <= 100
          ? obj.score
          : undefined;
      out[file_path] = {
        count: obj.count ?? -1,
        desc: obj.desc || '',
        ...(score != null ? { score } : {}),
      };
    }
  }
  return out;
}

export async function importFaceCacheObject(
  raw: Record<string, FaceEntry | number | unknown>,
  replace = true,
): Promise<number> {
  const parsed = parseFaceCacheJson(raw);
  return importAnalysisCache(parsed, replace);
}
