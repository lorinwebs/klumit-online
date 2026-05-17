import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const all: {
      path: string;
      name: string;
      uploader: string;
      created_at: string;
    }[] = [];
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from('reunion_uploads')
        .select('file_path, uploader_name, created_at')
        .eq('file_type', 'image')
        .order('created_at', { ascending: true })
        .range(offset, offset + 999);

      if (error) throw error;
      for (const row of data || []) {
        all.push({
          path: row.file_path,
          name: row.file_path.split('/').pop() || row.file_path,
          uploader: row.uploader_name || 'לא ידוע',
          created_at: row.created_at || '',
        });
      }
      if (!data || data.length < 1000) break;
      offset += 1000;
    }

    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed' },
      { status: 500 },
    );
  }
}
