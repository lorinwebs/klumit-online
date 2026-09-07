'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA4, trackPageView, trackFirstVisit, trackUserEngagement } from '@/lib/analytics';

/**
 * Analytics tracker — must sit alone inside Suspense (uses useSearchParams).
 * Do NOT wrap page children with this component or static routes will bail out to CSR.
 */
export function AnalyticsProvider() {
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

  return null;
}

export default AnalyticsProvider;
