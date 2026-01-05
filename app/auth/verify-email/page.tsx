'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Check, X } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verifyEmail() {
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const email = searchParams.get('email');
      const type = searchParams.get('type');

      // Supabase שולח token_hash בקישור האימות
      if (!tokenHash && !token) {
        setStatus('error');
        setMessage('קישור אימות לא תקין');
        return;
      }

      try {
        // נסה עם token_hash (הפורמט החדש)
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email',
          });

          if (error) {
            setStatus('error');
            setMessage('קישור אימות פג תוקף או לא תקין');
            return;
          }
        } else if (token) {
          // נסה עם token (פורמט ישן) - צריך אימייל
          if (!email) {
            // ננסה לקבל את האימייל מה-session הנוכחי
            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email || email;
            
            if (!userEmail) {
              setStatus('error');
              setMessage('קישור אימות לא תקין - חסר אימייל');
              return;
            }

            const { error } = await supabase.auth.verifyOtp({
              token: token,
              type: 'email',
              email: userEmail,
            });

            if (error) {
              setStatus('error');
              setMessage('קישור אימות פג תוקף או לא תקין');
              return;
            }
          } else {
            const { error } = await supabase.auth.verifyOtp({
              token: token,
              type: 'email',
              email: email,
            });

            if (error) {
              setStatus('error');
              setMessage('קישור אימות פג תוקף או לא תקין');
              return;
            }
          }
        }

        setStatus('success');
        setMessage('האימייל אומת בהצלחה!');

        // עדכן את המשתמש המקומי
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // בדוק אם יש pending_email ב-user_metadata שצריך לעדכן
          const pendingEmail = session.user.user_metadata?.pending_email;
          const newEmailParam = searchParams.get('new_email');
          
          // אם יש pending_email או new_email param, עדכן את האימייל
          const emailToUpdate = pendingEmail || newEmailParam;
          
          if (emailToUpdate && emailToUpdate !== session.user.email) {
            // עדכן את האימייל ב-user.email
            const { error: updateError } = await supabase.auth.updateUser({
              email: emailToUpdate,
              data: {
                email_verified: true,
                pending_email: null, // נקה את pending_email
              },
            });

            if (updateError) {
              console.error('Error updating email:', updateError);
            }
          } else if (session.user.user_metadata?.email && session.user.user_metadata.email !== session.user.email) {
            // אם יש אימייל ב-user_metadata שעדיין לא עודכן ב-user.email, עדכן אותו
            await supabase.auth.updateUser({
              email: session.user.user_metadata.email,
              data: {
                email_verified: true,
              },
            });
          }
          
          // רענן את הנתונים
          window.location.href = '/account';
        } else {
          // מעבר לדף החשבון אחרי 2 שניות
          setTimeout(() => {
            router.push('/account');
          }, 2000);
        }
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'שגיאה באימות האימייל');
      }
    }

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow max-w-md mx-auto px-4 py-20 w-full" role="main">
        <div className="bg-white border border-gray-200 p-8 md:p-12 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-gray-400 animate-pulse" />
              </div>
              <h1 className="text-2xl font-light luxury-font mb-2">
                מאמת את האימייל...
              </h1>
              <p className="text-sm font-light text-gray-600">
                אנא המתן
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-light luxury-font mb-2">
                האימייל אומת בהצלחה!
              </h1>
              <p className="text-sm font-light text-gray-600 mb-6">
                {message}
              </p>
              <p className="text-xs font-light text-gray-500">
                מעבר לדף החשבון...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} className="text-red-600" />
              </div>
              <h1 className="text-2xl font-light luxury-font mb-2">
                שגיאה באימות
              </h1>
              <p className="text-sm font-light text-gray-600 mb-6">
                {message}
              </p>
              <Link
                href="/account"
                className="inline-block bg-[#1a1a1a] text-white py-3 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury"
              >
                חזרה לחשבון
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
        <Header />
        <main id="main-content" className="flex-grow max-w-md mx-auto px-4 py-20 w-full" role="main">
          <div className="bg-white border border-gray-200 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-gray-400 animate-pulse" />
            </div>
            <h1 className="text-2xl font-light luxury-font mb-2">
              מאמת את האימייל...
            </h1>
            <p className="text-sm font-light text-gray-600">
              אנא המתן
            </p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

