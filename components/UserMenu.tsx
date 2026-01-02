'use client';

import { useEffect, useState } from 'react';
import { supabase, type User } from '@/lib/supabase';
import { User as UserIcon } from 'lucide-react';
import Link from 'next/link';

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="p-2 hover:opacity-70 transition-opacity"
        aria-label="התחברות"
      >
        <UserIcon size={24} className="text-[#1a1a1a]" />
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="p-2 hover:opacity-70 transition-opacity"
      aria-label="החשבון שלי"
    >
      <UserIcon size={24} className="text-[#1a1a1a]" />
    </Link>
  );
}


