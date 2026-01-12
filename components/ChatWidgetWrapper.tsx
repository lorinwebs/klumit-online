'use client';

import { usePathname } from 'next/navigation';
import ChatWidget from '@/components/ChatWidget';

export default function ChatWidgetWrapper() {
  const pathname = usePathname();
  
  // Hide chat widget on austria and ischia pages
  if (pathname === '/austria' || pathname === '/ischia') {
    return null;
  }
  
  return <ChatWidget />;
}
