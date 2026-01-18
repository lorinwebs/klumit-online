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
    // Wait for Next.js to update the document title
    const timeoutId = setTimeout(() => {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      // Get page title from document or use pathname as fallback
      const pageTitle = typeof document !== 'undefined' ? document.title : pathname;
      trackPageView(url, pageTitle);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pathname, searchParams]);

  return <>{children}</>;
}

export default AnalyticsProvider;
