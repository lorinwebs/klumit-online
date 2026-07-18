import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Avoid crashing at build time when env vars are unset (e.g. CI)
  if (!url || !key) {
    return NextResponse.json({ count: 0 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc('reunion_badges_count');
  if (error) return NextResponse.json({ count: 0 });
  return NextResponse.json({ count: data ?? 0 }, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
  });
}
