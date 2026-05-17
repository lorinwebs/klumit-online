const BUCKET = 'mekif-chet-reunion';

export function publicPhotoUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
