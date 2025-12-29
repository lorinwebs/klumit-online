import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-12 text-right">
          מדיניות החזרות
        </h1>
        
        <div className="prose prose-lg max-w-none text-right space-y-8">
          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">זכות החזרה</h2>
            <p className="font-light leading-relaxed text-gray-700">
              אנו מציעים החזרה או החלפה של מוצרים תוך 14 ימים ממועד המשלוח, בתנאי שהמוצר לא נעשה בו שימוש, נשמר באריזה המקורית ובמצב חדש.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">תהליך החזרה</h2>
            <ol className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold font-light">1.</span>
                <span>היכנסו לאזור האישי שלכם באתר</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold font-light">2.</span>
                <span>בחרו את ההזמנה שברצונכם להחזיר</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold font-light">3.</span>
                <span>מלאו את טופס ההחזרה</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold font-light">4.</span>
                <span>החזירו את המוצר באריזה המקורית</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold font-light">5.</span>
                <span>נבדוק את המוצר ונחזיר את הכסף תוך 5-7 ימי עסקים</span>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">תנאי החזרה</h2>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>המוצר חייב להיות במצב חדש, ללא שימוש</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>כל התוויות והאריזה המקורית חייבות להישמר</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>אין אפשרות להחזיר מוצרים מותאמים אישית</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>עלות המשלוח להחזרה היא על חשבון הלקוח, אלא אם המוצר פגום</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">החלפה</h2>
            <p className="font-light leading-relaxed text-gray-700">
              ניתן להחליף מוצר בגודל או צבע אחר, בכפוף לזמינות המלאי. תהליך ההחלפה זהה לתהליך ההחזרה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">החזרת כסף</h2>
            <p className="font-light leading-relaxed text-gray-700">
              לאחר קבלת המוצר ובדיקתו, נחזיר את הכסף לאותו אמצעי תשלום שבו בוצעה הרכישה. ההחזרה תתבצע תוך 5-7 ימי עסקים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">מוצרים פגומים</h2>
            <p className="font-light leading-relaxed text-gray-700">
              אם קיבלתם מוצר פגום או לא תקין, אנא צרו קשר איתנו מיד. נשלח לכם מוצר חלופי ללא עלות נוספת, כולל משלוח חינם.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


