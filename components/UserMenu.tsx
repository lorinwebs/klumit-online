'use client';

import { useEffect, useState } from 'react';
import { supabase, type User } from '@/lib/supabase';
import { User as UserIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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

  // חיפוש מספר טלפון במקומות שונים
  const phoneNumber = 
    user.phone || 
    user.user_metadata?.phone || 
    user.identities?.find((identity: any) => identity.identity_data?.phone)?.identity_data?.phone;

  return (
    <div className="relative group">
      <button className="p-2 hover:opacity-70 transition-opacity">
        <UserIcon size={24} className="text-[#1a1a1a]" />
      </button>
      <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm font-light text-[#1a1a1a] text-right">
            {user.user_metadata?.first_name && user.user_metadata?.last_name
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
              : 'משתמש'}
          </p>
          {phoneNumber && (
            <p className="text-xs font-light text-gray-500 text-right mt-1 ml-1">
              {phoneNumber}
            </p>
          )}
        </div>
        <div className="p-2">
          <Link
            href="/account"
            className="block px-4 py-2 text-sm font-light text-gray-700 hover:bg-gray-50 text-right transition-colors"
          >
            החשבון שלי
          </Link>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm font-light text-gray-700 hover:bg-gray-50 text-right transition-colors flex items-center justify-end gap-2"
          >
            <LogOut size={16} />
            התנתק
          </button>
        </div>
      </div>
    </div>
  );
}


