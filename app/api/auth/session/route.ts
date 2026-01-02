import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // משתמש ב-getUser() בדיוק כמו שהדף account עושה
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ session: null, user: null });
    }
    
    // נחזיר את ה-user ישירות, בדיוק כמו שהדף account עושה
    return NextResponse.json({ 
      session: { user },
      user
    });
  } catch (error) {
    console.error('Error getting user from cookies:', error);
    return NextResponse.json({ session: null, user: null }, { status: 500 });
  }
}

