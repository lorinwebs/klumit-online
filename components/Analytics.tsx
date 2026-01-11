'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA4, trackPageView, trackFirstVisit, trackUserEngagement } from '@/lib/analytics';

/**
 * Analytics Provider Component
 * הוסף ל-layout.tsx כדי להפעיל מעקב אוטומטי
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize GA4 on mount
  useEffect(() => {
    initGA4();
    // Track first visit for unique users
    trackFirstVisit();
    // Track user engagement
    trackUserEngagement();
  }, []);

  // Track page views on route change
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  return <>{children}</>;
}

export default AnalyticsProvider;
