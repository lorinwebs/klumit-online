'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import MembershipTopBar from './MembershipTopBar';
import SkipToMain from './SkipToMain';
import ChatWidgetWrapper from './ChatWidgetWrapper';
import MembershipPopup from './MembershipPopup';
import MembershipFloatingButton from './MembershipFloatingButton';
import CouponModal from './CouponModal';

export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // דפים שלא צריכים את הקומפוננטות של קלומית
  const excludedPaths = ['/mekif-chet-availability-check', '/mekif-chet-2007-reunion'];
  const isExcluded = excludedPaths.includes(pathname);

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
      <MembershipTopBar />
      <SkipToMain />
      {children}
      <ChatWidgetWrapper />
      <MembershipPopup />
      <MembershipFloatingButton />
      <CouponModal />
    </>
  );
}
