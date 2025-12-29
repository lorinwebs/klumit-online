import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#fdfcfb] border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-light luxury-font mb-4 text-[#1a1a1a]">
              Klomit
            </h3>
            <p className="text-sm font-light text-gray-600 leading-relaxed mb-6">
              תיקים יוקרתיים בעיצוב איטלקי
            </p>
            <div className="text-xs font-light text-gray-500 tracking-luxury">
              עור איטלקי איכותי<br />
              תפירה ידנית
            </div>
          </div>
          
          {/* Navigation */}
          <div>
            <h4 className="text-xs font-light tracking-luxury uppercase mb-6 text-[#1a1a1a]">
              ניווט
            </h4>
            <ul className="space-y-3">
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
                <Link href="/sales" className="text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors">
                  מבצעים
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
            <h4 className="text-xs font-light tracking-luxury uppercase mb-6 text-[#1a1a1a]">
              שירות לקוחות
            </h4>
            <ul className="space-y-3">
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
          <div>
            <h4 className="text-xs font-light tracking-luxury uppercase mb-6 text-[#1a1a1a]">
              יצירת קשר
            </h4>
            <ul className="space-y-3 text-sm font-light text-gray-600">
              <li>
                <a href="mailto:info@klomit.com" className="hover:text-[#1a1a1a] transition-colors">
                  info@klomit.com
                </a>
              </li>
              <li>
                <a href="tel:+972501234567" className="hover:text-[#1a1a1a] transition-colors">
                  +972 50-123-4567
                </a>
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-light text-gray-500 leading-relaxed">
                שעות פעילות<br />
                א׳-ה׳: 09:00-18:00<br />
                ו׳: 09:00-14:00
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-light text-gray-500">
              &copy; {new Date().getFullYear()} Klomit. כל הזכויות שמורות.
            </p>
            <div className="flex gap-6 text-xs font-light text-gray-500">
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

