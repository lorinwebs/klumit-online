import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// DELETE - מחיקת שיחה (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const conversationId = resolvedParams.id;

    const supabaseAdmin = createSupabaseAdminClient();
    
    // עדכון deleted_at (soft delete) - השיחה תיעלם מה-UI אבל תישאר ב-DB
    // אם המשתמש ישלח הודעה חדשה, השיחה תצוף שוב (עדכון deleted_at ל-null)
    const { data, error } = await supabaseAdmin
      .from('klumit_chat_conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversation: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
