'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import SkipToMain from './SkipToMain';

const ChatWidgetWrapper = dynamic(() => import('./ChatWidgetWrapper'), {
  ssr: false,
  loading: () => null,
});

const CouponModal = dynamic(() => import('./CouponModal'), {
  ssr: false,
  loading: () => null,
});

export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const excludedPaths = ['/mekif-chet-availability-check', '/mekif-chet-2007-reunion', '/moving-sale', '/loricountdown'];
  const isExcluded = excludedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (!isMounted) {
    return <>{children}</>;
  }

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <>
      <SkipToMain />
      {children}
      <ChatWidgetWrapper />
      <CouponModal />
    </>
  );
}
