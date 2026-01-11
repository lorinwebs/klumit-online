import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET - קבלת שיחות של המשתמש
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    // אם משתמש מחובר - נשתמש ב-user_id
    if (user) {
      const { data: conversations, error } = await supabase
        .from('klumit_chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ conversations: conversations || [] });
    }

    // אם משתמש אנונימי - נשתמש ב-session_id עם Service Role
    if (sessionId) {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ 
          error: 'SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to .env.local' 
        }, { status: 500 });
      }

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ 
          error: 'NEXT_PUBLIC_SUPABASE_URL is missing' 
        }, { status: 500 });
      }

      const supabaseAdmin = createSupabaseAdminClient();
      
      const { data: conversations, error } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('last_message_at', { ascending: false });

      if (error) {
        // אם הטבלה לא קיימת - נחזיר שגיאה ברורה
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ 
            error: 'Table klumit_chat_conversations does not exist. Please run the SQL schema from supabase-chat-schema.sql' 
          }, { status: 500 });
        }
        return NextResponse.json({ 
          error: error.message, 
          code: error.code,
          details: error.details,
          hint: error.hint,
        }, { status: 500 });
      }

      return NextResponse.json({ conversations: conversations || [] });
    }

    return NextResponse.json({ conversations: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - יצירת שיחה חדשה
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { user_name, user_phone, user_email } = body;

    // יצירת session_id אם אין
    let sessionId = body.session_id;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // אם משתמש מחובר - נשתמש ב-user_id
    if (user) {
      const { data: conversation, error } = await supabase
        .from('klumit_chat_conversations')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          user_name: user_name || null,
          user_phone: user_phone || null,
          user_email: user_email || null,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ conversation, session_id: sessionId });
    }

    // אם משתמש אנונימי - נשתמש ב-Service Role
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to .env.local' 
      }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: conversation, error } = await supabaseAdmin
      .from('klumit_chat_conversations')
      .insert({
        session_id: sessionId,
        user_name: user_name || null,
        user_phone: user_phone || null,
        user_email: user_email || null,
        status: 'open',
      })
      .select()
      .single();

      if (error) {
      // אם הטבלה לא קיימת - נחזיר שגיאה ברורה
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Table klumit_chat_conversations does not exist. Please run the SQL schema from supabase-chat-schema.sql' 
        }, { status: 500 });
      }
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    if (!conversation || !conversation.id) {
      return NextResponse.json({ error: 'Failed to create conversation - missing ID' }, { status: 500 });
    }

    return NextResponse.json({ conversation, session_id: sessionId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
