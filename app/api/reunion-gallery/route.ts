import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: uploads, error } = await supabase
      .from('reunion_uploads')
      .select('uploader_name, file_type, file_path, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const imageCount = uploads?.filter(u => u.file_type === 'image').length || 0;
    const videoCount = uploads?.filter(u => u.file_type === 'video').length || 0;

    const uploaderCounts: Record<string, number> = {};
    uploads?.forEach(u => {
      uploaderCounts[u.uploader_name] = (uploaderCounts[u.uploader_name] || 0) + 1;
    });

    const leaderboard = Object.entries(uploaderCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const recentUploads = (uploads || []).slice(0, 50).map(u => ({
      ...u,
      url: `${supabaseUrl}/storage/v1/object/public/mekif-chet-reunion/${u.file_path}`,
    }));

    return NextResponse.json({
      imageCount,
      videoCount,
      leaderboard,
      recentUploads,
    });
  } catch (error: any) {
    console.error('Error fetching gallery data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
