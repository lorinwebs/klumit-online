import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  const response = NextResponse.json({ success: true });
  const cookieStore = await cookies();
  
  // נקה את כל ה-cookies של Supabase
  const allCookies = cookieStore.getAll();
  allCookies.forEach(cookie => {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
      response.cookies.delete(cookie.name);
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        expires: new Date(0)
      });
    }
  });
  
  return response;
}





