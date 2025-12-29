import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Phone authentication will not work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Type for Supabase User with metadata
export type User = SupabaseUser & {
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    email_verified?: boolean;
  };
};


