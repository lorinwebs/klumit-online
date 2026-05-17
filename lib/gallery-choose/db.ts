import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { FaceEntry, ReviewEntry, ReviewState } from '@/components/gallery-choose/types';

type AnalysisRow = {
  file_path: string;
  face_count: number;
  description: string;
  score: number | null;
};

type ReviewRow = {
  file_path: string;
  auto_selected: boolean;
  human_choice: 'yes' | 'no' | null;
};

function rowToFaceEntry(row: AnalysisRow): FaceEntry {
  const entry: { count: number; desc: string; score?: number } = {
    count: row.face_count,
    desc: row.description || '',
  };
  if (row.score != null && row.score >= 1 && row.score <= 100) {
    entry.score = row.score;
  }
  return entry;
}

function faceEntryToRow(path: string, entry: FaceEntry): AnalysisRow {
  const obj = typeof entry === 'number' ? { count: entry, desc: '' } : entry;
  const score =
    typeof obj.score === 'number' && obj.score >= 1 && obj.score <= 100
      ? obj.score
      : null;
  return {
    file_path: path,
    face_count: obj.count ?? -1,
    description: obj.desc || '',
    score,
  };
}

export async function loadAnalysisCache(): Promise<Record<string, FaceEntry>> {
  const supabase = createSupabaseAdminClient();
  const out: Record<string, FaceEntry> = {};
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('reunion_photo_analysis')
      .select('file_path, face_count, description, score')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    for (const row of (data || []) as AnalysisRow[]) {
      out[row.file_path] = rowToFaceEntry(row);
    }
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return out;
}

export async function saveAnalysisBatch(
  batch: Record<string, FaceEntry>,
  replace = false,
): Promise<number> {
  const supabase = createSupabaseAdminClient();

  if (replace) {
    const { error: delErr } = await supabase
      .from('reunion_photo_analysis')
      .delete()
      .neq('file_path', '');
    if (delErr) throw delErr;
  }

  const rows = Object.entries(batch)
    .filter(([k]) => !k.startsWith('_'))
    .map(([path, entry]) => ({
      ...faceEntryToRow(path, entry),
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) return 0;

  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('reunion_photo_analysis').upsert(chunk, {
      onConflict: 'file_path',
    });
    if (error) throw error;
  }

  const { count } = await supabase
    .from('reunion_photo_analysis')
    .select('*', { count: 'exact', head: true });
  return count ?? rows.length;
}

/** Import large face_cache.json in batches (e.g. from choosePictures). */
export async function importAnalysisCache(
  data: Record<string, FaceEntry>,
  replace = false,
): Promise<number> {
  if (replace) await clearAnalysisCache();

  const entries = Object.entries(data).filter(([k]) => !k.startsWith('_'));
  if (!entries.length) return 0;

  const BATCH = 200;
  let imported = 0;
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = Object.fromEntries(entries.slice(i, i + BATCH));
    await saveAnalysisBatch(batch, false);
    imported += Object.keys(batch).length;
  }
  return imported;
}

export async function clearAnalysisCache(): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('reunion_photo_analysis')
    .delete()
    .neq('file_path', '');
  if (error) throw error;
}

export async function loadReviewState(): Promise<ReviewState> {
  const supabase = createSupabaseAdminClient();
  const out: ReviewState = {};
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('reunion_photo_review')
      .select('file_path, auto_selected, human_choice')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    for (const row of (data || []) as ReviewRow[]) {
      out[row.file_path] = {
        auto: row.auto_selected,
        human: row.human_choice,
      };
    }
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return out;
}

export async function saveReviewBatch(
  batch: Record<string, ReviewEntry>,
  replace = false,
): Promise<number> {
  const supabase = createSupabaseAdminClient();

  if (replace) {
    const { error: delErr } = await supabase
      .from('reunion_photo_review')
      .delete()
      .neq('file_path', '');
    if (delErr) throw delErr;
  }

  const rows = Object.entries(batch)
    .filter(([k]) => !k.startsWith('_'))
    .map(([path, entry]) => ({
      file_path: path,
      auto_selected: !!entry.auto,
      human_choice: entry.human,
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) return 0;

  const { error } = await supabase.from('reunion_photo_review').upsert(rows, {
    onConflict: 'file_path',
  });
  if (error) throw error;

  const { count } = await supabase
    .from('reunion_photo_review')
    .select('*', { count: 'exact', head: true });
  return count ?? rows.length;
}

export async function clearReviewState(): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('reunion_photo_review')
    .delete()
    .neq('file_path', '');
  if (error) throw error;
}
