import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // נשתמש ב-getSession כדי לקבל את ה-session המלא (כולל tokens)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return NextResponse.json({ session: null, user: null });
    }
    
    // נחזיר את ה-session המלא (כולל access_token ו-refresh_token)
    // כך שנוכל לסנכרן אותו ל-localStorage בצד הלקוח
    return NextResponse.json({ 
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user
      },
      user: session.user
    });
  } catch (error) {
    return NextResponse.json({ session: null, user: null }, { status: 500 });
  }
}

