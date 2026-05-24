/**
 * Download all photos marked human_choice='yes' in reunion_photo_review,
 * pull them from Supabase Storage and pack into a local ZIP.
 *
 * Usage:
 *   npx tsx scripts/download-selected-zip.ts [output.zip] [--concurrency=12]
 *
 * Output defaults to reunion_selected_<N>.zip in the current directory.
 */
import { writeFileSync } from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BUCKET = 'mekif-chet-reunion';

const args = process.argv.slice(2);
let outFile = '';
let concurrency = 12;
for (const a of args) {
  if (a.startsWith('--concurrency=')) concurrency = Math.max(1, parseInt(a.split('=')[1], 10));
  else if (!a.startsWith('--')) outFile = a;
}

function safeZipPart(name: string): string {
  return (name || 'unknown').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || 'unknown';
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type SelectedItem = { path: string; name: string; uploader: string };

async function fetchSelected(): Promise<SelectedItem[]> {
  const paths: string[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('reunion_photo_review')
      .select('file_path, human_choice')
      .eq('human_choice', 'yes')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    for (const row of data || []) paths.push(row.file_path as string);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  const uploaderByPath = new Map<string, string>();
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('reunion_uploads')
      .select('file_path, uploader_name')
      .eq('file_type', 'image')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    for (const row of data || []) {
      uploaderByPath.set(row.file_path as string, (row.uploader_name as string) || 'unknown');
    }
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return paths.map((p) => ({
    path: p,
    name: p.split('/').pop() || 'photo.jpg',
    uploader: uploaderByPath.get(p) || 'unknown',
  }));
}

async function downloadOne(item: SelectedItem): Promise<{ buf: Buffer; item: SelectedItem } | null> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(item.path);
    if (error || !data) return null;
    return { buf: Buffer.from(await data.arrayBuffer()), item };
  } catch {
    return null;
  }
}

async function runPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  console.log('Fetching selected list from Supabase...');
  const selected = await fetchSelected();
  console.log(`Found ${selected.length} photos with human_choice = 'yes'`);
  if (!selected.length) {
    console.error('Nothing to download. Exiting.');
    process.exit(1);
  }

  console.log(`Downloading with concurrency=${concurrency}...`);
  let done = 0;
  const results = await runPool(selected, concurrency, async (item) => {
    const r = await downloadOne(item);
    done++;
    if (done % 10 === 0 || done === selected.length) {
      process.stdout.write(`\r  ${done}/${selected.length}`);
    }
    return r;
  });
  process.stdout.write('\n');

  const zip = new JSZip();
  const used = new Set<string>();
  let ok = 0;
  let fail = 0;
  for (const r of results) {
    if (!r) {
      fail++;
      continue;
    }
    const folder = safeZipPart(r.item.uploader);
    const fname = safeZipPart(r.item.name);
    let arc = `${folder}/${fname}`;
    const base = arc.replace(/\.[^.]+$/, '');
    const ext = arc.includes('.') ? arc.slice(arc.lastIndexOf('.')) : '';
    let n = 1;
    while (used.has(arc)) {
      arc = `${base}_${n}${ext}`;
      n++;
    }
    used.add(arc);
    zip.file(arc, r.buf);
    ok++;
  }

  if (!ok) {
    console.error('No images could be downloaded.');
    process.exit(1);
  }

  const target = outFile || `reunion_selected_${ok}.zip`;
  console.log(`Building ZIP (${ok} ok, ${fail} failed)...`);
  const data = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  writeFileSync(target, data);
  const mb = (data.length / 1024 / 1024).toFixed(1);
  console.log(`Wrote ${path.resolve(target)} (${mb} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
