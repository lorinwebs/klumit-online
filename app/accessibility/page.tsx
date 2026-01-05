import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הצהרת נגישות | קלומית',
  description: 'הצהרת נגישות אתר קלומית - מחויבות לנגישות דיגיטלית לכלל הציבור',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow max-w-4xl mx-auto px-4 py-12 md:py-20" role="main">
        <h1 className="text-3xl md:text-4xl font-light luxury-font mb-8 text-right">
          הצהרת נגישות
        </h1>

        <div className="prose prose-lg max-w-none text-right space-y-6 font-light text-gray-700">
          <section aria-labelledby="commitment">
            <h2 id="commitment" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              המחויבות שלנו לנגישות
            </h2>
            <p>
              קלומית בע&quot;מ מחויבת להנגשת האתר לאנשים עם מוגבלויות, ופועלת להתאמתו לדרישות התקן הישראלי (ת&quot;י 5568) ולהנחיות WCAG 2.1 ברמה AA.
            </p>
          </section>

          <section aria-labelledby="actions">
            <h2 id="actions" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              פעולות הנגשה שבוצעו
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>התאמה לניווט באמצעות מקלדת בלבד</li>
              <li>תמיכה בקוראי מסך ותוכנות עזר</li>
              <li>הוספת תיאורים חלופיים (alt) לתמונות</li>
              <li>מבנה כותרות היררכי ונכון</li>
              <li>ניגודיות צבעים מתאימה</li>
              <li>אפשרות לדילוג ישיר לתוכן העמוד הראשי</li>
              <li>סימון שדות טפסים בצורה ברורה</li>
              <li>הודעות שגיאה נגישות</li>
            </ul>
          </section>

          <section aria-labelledby="keyboard">
            <h2 id="keyboard" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              ניווט באמצעות מקלדת
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li><kbd className="bg-gray-100 px-2 py-1 rounded">Tab</kbd> - מעבר לאלמנט הבא</li>
              <li><kbd className="bg-gray-100 px-2 py-1 rounded">Shift + Tab</kbd> - מעבר לאלמנט הקודם</li>
              <li><kbd className="bg-gray-100 px-2 py-1 rounded">Enter</kbd> - הפעלת קישור או כפתור</li>
              <li><kbd className="bg-gray-100 px-2 py-1 rounded">Escape</kbd> - סגירת חלונות קופצים</li>
            </ul>
          </section>

          <section aria-labelledby="browsers">
            <h2 id="browsers" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              דפדפנים נתמכים
            </h2>
            <p>
              האתר מותאם לגלישה בדפדפנים Chrome, Firefox, Safari ו-Edge בגרסאותיהם העדכניות.
            </p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              יצירת קשר בנושא נגישות
            </h2>
            <p>
              במידה ונתקלתם בבעיית נגישות או שיש לכם הצעות לשיפור, נשמח לשמוע מכם:
            </p>
            <ul className="list-none space-y-2 mr-4 mt-4">
              <li>
                <strong>אימייל:</strong>{' '}
                <a href="mailto:klumitltd@gmail.com" className="text-[#1a1a1a] underline hover:no-underline">
                  klumitltd@gmail.com
                </a>
              </li>
              <li>
                <strong>טלפון:</strong>{' '}
                <a href="tel:+97235178502" className="text-[#1a1a1a] underline hover:no-underline">
                  03-5178502
                </a>
              </li>
            </ul>
          </section>

          <section aria-labelledby="update">
            <h2 id="update" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              עדכון אחרון
            </h2>
            <p>
              הצהרת נגישות זו עודכנה לאחרונה בתאריך: ינואר 2026
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

