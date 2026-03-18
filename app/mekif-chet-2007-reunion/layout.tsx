'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Camera } from 'lucide-react';

export default function ReunionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGallery = pathname?.includes('/gallery');

  return (
    <>
      <div className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <img
            src="https://mekifh.mashov.info/wp-content/uploads/sites/82/2021/06/Semel-MekifH-%D7%A9%D7%9C%D7%95%D7%9D-%D7%95%D7%90%D7%A0%D7%95%D7%A0%D7%95.png"
            alt="לוגו מקיף ח'"
            className="h-12 w-auto object-contain"
          />
          <nav className="flex items-center gap-1" dir="rtl">
            <Link
              href="/mekif-chet-2007-reunion"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors ${
                !isGallery
                  ? 'font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100'
                  : 'font-medium text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users size={15} />
              נרשמים
            </Link>
            <Link
              href="/mekif-chet-2007-reunion/gallery"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors ${
                isGallery
                  ? 'font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100'
                  : 'font-medium text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Camera size={15} />
              גלריה
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </>
  );
}
