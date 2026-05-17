import { RateLimitError } from './rateLimit';
import type { FaceEntry, PhotoFile, ReviewEntry, ReviewState } from './types';

const API = '/api/gallery-choose';

async function postOpenAiRoute(
  route: 'analyze' | 'score',
  body: object,
): Promise<Record<string, unknown>> {
  const r = await fetch(`${API}/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: Record<string, unknown> = {};
  try {
    data = await r.json();
  } catch {
    data = {};
  }
  const errMsg = typeof data.error === 'string' ? data.error : '';
  if (r.status === 429 || errMsg.includes('429')) {
    const retryAfter =
      typeof data.retry_after === 'number' && data.retry_after > 0
        ? data.retry_after
        : 30;
    throw new RateLimitError(errMsg || 'OpenAI rate limit (429)', retryAfter);
  }
  if (!r.ok) {
    throw new Error(errMsg || `${route} failed (${r.status})`);
  }
  if (data.error) throw new Error(String(data.error));
  return data;
}

export async function fetchUploads(): Promise<PhotoFile[]> {
  const r = await fetch(`${API}/uploads`);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'uploads failed');
  if (!Array.isArray(data)) throw new Error(JSON.stringify(data).slice(0, 200));
  return data;
}

export async function loadCache(): Promise<Record<string, FaceEntry>> {
  const r = await fetch(`${API}/cache`);
  if (!r.ok) throw new Error('cache failed');
  return r.json();
}

export async function saveCache(
  batch: Record<string, FaceEntry>,
  replace = false,
): Promise<void> {
  await fetch(`${API}/cache`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(replace ? { ...batch, _replace: true } : batch),
  });
}

export async function clearCache(): Promise<void> {
  await fetch(`${API}/cache`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _clear: true }),
  });
}

export async function loadReview(): Promise<ReviewState> {
  const r = await fetch(`${API}/review`);
  if (!r.ok) throw new Error('review failed');
  return r.json();
}

export async function saveReview(
  batch: Record<string, ReviewEntry>,
  replace = false,
): Promise<void> {
  await fetch(`${API}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(replace ? { ...batch, _replace: true } : batch),
  });
}

export async function clearReview(): Promise<void> {
  await fetch(`${API}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _clear: true }),
  });
}

export type ZipItem = { path: string; name: string; uploader: string };

export async function downloadSelectedZip(
  items: ZipItem[],
): Promise<{ blob: Blob; ok: number; fail: number }> {
  const r = await fetch(`${API}/download-zip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!r.ok) {
    let msg = 'download failed';
    try {
      const j = await r.json();
      if (j.error) msg = j.error;
    } catch {
      msg = await r.text();
    }
    throw new Error(msg);
  }
  const ok = parseInt(r.headers.get('X-Downloaded-Count') || '0', 10);
  const fail = parseInt(r.headers.get('X-Failed-Count') || '0', 10);
  return { blob: await r.blob(), ok, fail };
}

export async function analyzeImage(
  path: string,
  image_b64: string,
  content_type: string,
): Promise<{ count: number; desc: string }> {
  const data = await postOpenAiRoute('analyze', { path, image_b64, content_type });
  return data as { count: number; desc: string };
}

export async function importLegacyCache(): Promise<{
  ok: boolean;
  imported: number;
  source?: string;
  error?: string;
}> {
  const r = await fetch(`${API}/import-legacy`, { method: 'POST' });
  const data = await r.json();
  if (!r.ok) {
    return { ok: false, imported: 0, error: data.error || 'import failed' };
  }
  return { ok: true, imported: data.imported ?? 0, source: data.source };
}

export async function importCacheJsonFile(file: File): Promise<number> {
  const text = await file.text();
  const data = JSON.parse(text);
  const r = await fetch(`${API}/import-legacy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || 'import failed');
  return json.imported ?? 0;
}

export async function scoreImage(
  path: string,
  image_b64: string,
  content_type: string,
): Promise<{ score: number }> {
  const data = await postOpenAiRoute('score', { path, image_b64, content_type });
  return data as { score: number };
}
