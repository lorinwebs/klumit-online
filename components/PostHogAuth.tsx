'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { supabase } from '@/lib/supabase';

export default function PostHogAuth() {
  useEffect(() => {
    // No-op when PostHog or Supabase aren't configured
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const identifyUser = (user: {
      id: string;
      email?: string;
      user_metadata?: { first_name?: string; last_name?: string; phone?: string };
    }) => {
      const firstName = user.user_metadata?.first_name;
      const lastName = user.user_metadata?.last_name;
      posthog.identify(user.id, {
        email: user.email,
        name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
        phone: user.user_metadata?.phone,
      });
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) identifyUser(user);
    }).catch(() => {
      // Ignore auth lookup failures when Supabase is unavailable
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        posthog.reset();
      } else if (session?.user) {
        identifyUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
