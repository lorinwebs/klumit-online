'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useSyncExternalStore } from 'react';
import SkipToMain from './SkipToMain';
import ChatWidgetWrapper from './ChatWidgetWrapper';
import CouponModal from './CouponModal';

export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // דפים שלא צריכים את הקומפוננטות של קלומית
  const excludedPaths = ['/mekif-chet-availability-check', '/mekif-chet-2007-reunion'];
  const isExcluded = excludedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  // עד ש-component mounted, נציג רק את children (למנוע hydration mismatch)
  if (!isMounted) {
    return <>{children}</>;
  }

  // אם זה דף excluded, רק children
  if (isExcluded) {
    return <>{children}</>;
  }

  // דפי קלומית רגילים - עם כל הקומפוננטות
  return (
    <>
      <SkipToMain />
      {children}
      <ChatWidgetWrapper />
      <CouponModal />
    </>
  );
}
