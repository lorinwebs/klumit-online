'use client';

import { useViewerCount } from '@/lib/useViewerCount';
import { useLanguage } from '@/lib/LanguageContext';

export function ViewerCount() {
  const count = useViewerCount();
  const { t } = useLanguage();

  if (count === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span>{count} {t('footer.viewersOnSite')}</span>
    </div>
  );
}

