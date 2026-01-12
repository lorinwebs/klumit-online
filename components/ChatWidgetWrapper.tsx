'use client';

import { usePathname } from 'next/navigation';
import ChatWidget from '@/components/ChatWidget';

export default function ChatWidgetWrapper() {
  const pathname = usePathname();
  
  // Hide chat widget on austria, ischia, and reunion pages
  if (pathname === '/austria' || pathname === '/ischia' || pathname === '/mekif-chet-2007-reunion') {
    return null;
  }
  
  return <ChatWidget />;
}
