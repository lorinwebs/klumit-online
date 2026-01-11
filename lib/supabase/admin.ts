import { createClient as createAdminClient } from '@supabase/supabase-js';

/**
 * יוצר Supabase Admin Client עם טיפול ב-SSL issues
 * עבור development - מאפשר self-signed certificates
 */
export function createSupabaseAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  // עבור development - הגדרת NODE_TLS_REJECT_UNAUTHORIZED
  // זה מאפשר self-signed certificates ב-development בלבד
  if (process.env.NODE_ENV === 'development' && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
