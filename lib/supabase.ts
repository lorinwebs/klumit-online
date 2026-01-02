import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase credentials check - will fail gracefully if missing

// Create a custom storage adapter that uses localStorage
const localStorageAdapter = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Error writing to localStorage - ignore
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      // Error removing from localStorage - ignore
    }
  },
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: localStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Type for Supabase User with metadata
export type User = SupabaseUser & {
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    email_verified?: boolean;
    // Shipping address
    shipping_address?: string;
    shipping_city?: string;
    shipping_zip_code?: string;
    shipping_apartment?: string;
    shipping_floor?: string;
    shipping_notes?: string;
  };
};


