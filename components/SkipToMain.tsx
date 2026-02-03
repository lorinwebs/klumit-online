'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function SkipToMain() {
  const { t } = useLanguage();
  
  return (
    <a href="#main-content" className="skip-to-main">
      {t('skipToMain')}
    </a>
  );
}
