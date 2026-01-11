import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// POST - מיזוג שיחות אורח למשתמש רשום
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // שימוש ב-Service Role לעדכון
    const supabaseAdmin = createSupabaseAdminClient();

    // קבלת פרטי המשתמש מ-auth.users
    const { data: userProfile } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const userEmail = userProfile?.user?.email || null;
    const userName = userProfile?.user?.user_metadata?.first_name && userProfile?.user?.user_metadata?.last_name
      ? `${userProfile.user.user_metadata.first_name} ${userProfile.user.user_metadata.last_name}`
      : userProfile?.user?.user_metadata?.name || null;

    // קבלת טלפון מטבלת user_shopify_sync
    const { data: syncData } = await supabaseAdmin
      .from('user_shopify_sync')
      .select('phone')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const userPhone = syncData?.phone || userProfile?.user?.user_metadata?.phone || null;

    // אם אין session_id, נמזג רק לפי user_id (שיחות ישנות)
    // זה מאפשר מיזוג שיחות ישנות גם בלי session_id
    if (!session_id) {
      // מיזוג שיחות ישנות לפי user_id בלבד - עדכון פרטי משתמש
      const { data: userMerged, error: userError } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .update({ 
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
        })
        .eq('user_id', user.id)
        .select();

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        merged_count: userMerged?.length || 0,
        conversations: userMerged || [],
      });
    }

    // עדכון כל השיחות מה-session_id ל-user_id (כולל פרטי משתמש)
    const { data: sessionMerged, error: sessionError } = await supabaseAdmin
      .from('klumit_chat_conversations')
      .update({ 
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
      })
      .eq('session_id', session_id)
      .is('user_id', null)
      .select();

    // מיזוג שיחות ישנות לפי user_id - עדכון פרטי משתמש בשיחות שכבר משויכות ל-user_id
    // זה מבטיח שכל השיחות של המשתמש יהיו מעודכנות עם הפרטים האחרונים
    const { data: userMerged, error: userError } = await supabaseAdmin
      .from('klumit_chat_conversations')
      .update({ 
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
      })
      .eq('user_id', user.id)
      .select();

    const error = sessionError || userError;
    const data = [...(sessionMerged || []), ...(userMerged || [])];

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // מציאת השיחה הפעילה או האחרונה
    const activeConversation = data?.find((c: any) => c.status === 'open') || data?.[0];
    
    return NextResponse.json({
      success: true,
      merged: true,
      merged_count: data?.length || 0,
      conversations: data || [],
      conversation_id: activeConversation?.id || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
