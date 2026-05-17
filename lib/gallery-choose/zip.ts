import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'mekif-chet-reunion';

function safeZipPart(name: string): string {
  return (name || 'unknown').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || 'unknown';
}

export type ZipItem = { path: string; name?: string; uploader?: string };

export async function buildSelectedZip(
  items: ZipItem[],
): Promise<{ data: Uint8Array; ok: number; fail: number }> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const supabase = createSupabaseAdminClient();
  const used = new Set<string>();
  let ok = 0;
  let fail = 0;

  for (const item of items) {
    const path = item.path;
    if (!path) {
      fail++;
      continue;
    }
    const uploader = item.uploader || 'unknown';
    const name = item.name || path.split('/').pop() || 'photo.jpg';

    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) {
      fail++;
      continue;
    }

    const folder = safeZipPart(uploader);
    const fname = safeZipPart(name);
    let arc = `${folder}/${fname}`;
    const base = arc.replace(/\.[^.]+$/, '');
    const ext = arc.includes('.') ? arc.slice(arc.lastIndexOf('.')) : '';
    let n = 1;
    while (used.has(arc)) {
      arc = `${base}_${n}${ext}`;
      n++;
    }
    used.add(arc);

    const buf = Buffer.from(await data.arrayBuffer());
    zip.file(arc, buf);
    ok++;
  }

  if (ok === 0) throw new Error('no images could be downloaded');

  const data = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return { data, ok, fail };
}
