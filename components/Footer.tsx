import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#fdfcfb] border-t border-gray-200 mt-8 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 md:gap-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl md:text-2xl font-light luxury-font mb-2 md:mb-4 text-[#1a1a1a]">
              קלומית
            </h3>
            <p className="text-xs md:text-sm font-light text-gray-600 leading-relaxed mb-3 md:mb-6">
              יבואן בלעדי של תיקים יוקרתיים היישר מאיטליה
            </p>
            <div className="text-xs font-light text-gray-500 tracking-luxury hidden md:block">
              RENTAO ANGI • CARLINO GROUP
            </div>
          </div>
          
          {/* Navigation */}
          <div>
            <h4 className="text-xs font-light tracking-luxury uppercase mb-3 md:mb-6 text-[#1a1a1a]">
              ניווט
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  בית
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  תיקים
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  אודות
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-light tracking-luxury uppercase mb-3 md:mb-6 text-[#1a1a1a]">
              שירות לקוחות
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/shipping" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  משלוחים
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  החזרות
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  תקנון
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-xs font-light tracking-luxury uppercase mb-3 md:mb-6 text-[#1a1a1a]">
              יצירת קשר
            </h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm font-light text-gray-600">
              <li>
                <a href="mailto:klumitltd@gmail.com" className="hover:text-[#1a1a1a] transition-colors">
                  klumitltd@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+97235178502" className="hover:text-[#1a1a1a] transition-colors">
                  03-5178502
                </a>
              </li>
              <li className="text-gray-500">
                פקס: 03-5106781
              </li>
            </ul>
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
              <p className="text-xs font-light text-gray-500 leading-relaxed mb-2 md:mb-3">
                <span className="font-medium text-gray-600">כתובת:</span><br />
                גאולה 45, תל אביב יפו 6330447
              </p>
              <p className="text-xs font-light text-gray-500 leading-relaxed hidden md:block">
                שעות פעילות<br />
                א׳-ה׳: 10:00-17:00
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-6 md:mt-12 pt-4 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
            <p className="text-xs font-light text-gray-500 text-center md:text-right">
              &copy; {new Date().getFullYear()} כל הזכויות שמורות <span className="luxury-font text-[#1a1a1a]">קלומית בע&quot;מ</span>
            </p>
            <div className="flex gap-4 md:gap-6 text-xs font-light text-gray-500">
              <Link href="/terms" className="hover:text-[#1a1a1a] transition-colors">
                תקנון
              </Link>
              <Link href="/privacy" className="hover:text-[#1a1a1a] transition-colors">
                פרטיות
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

