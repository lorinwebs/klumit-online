import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-12 text-right">
          תקנון
        </h1>
        
        <div className="prose prose-lg max-w-none text-right space-y-8">
          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">הקדמה</h2>
            <p className="font-light leading-relaxed text-gray-700">
              ברוכים הבאים לאתר קלומית בע&quot;מ (KLOMIT LTD.). השימוש באתר זה כפוף לתנאים המפורטים להלן. שימוש באתר מהווה הסכמה מלאה לתנאים אלה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">שימוש באתר</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              אתם מתחייבים להשתמש באתר למטרות חוקיות בלבד ולא:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>להפר זכויות יוצרים או זכויות קניין רוחני אחרות</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>להעלות או להפיץ תוכן מזיק, פוגעני או בלתי חוקי</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>לנסות לגשת לאזורים מוגנים באתר ללא הרשאה</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">הזמנות ותשלומים</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              כל הזמנה באתר כפופה לאישור שלנו. אנו שומרים לעצמנו את הזכות לבטל הזמנה בכל עת, כולל במקרים של:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>חוסר זמינות של המוצר</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>שגיאה במחיר המוצר</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>בעיות טכניות או אבטחה</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">מחירים</h2>
            <p className="font-light leading-relaxed text-gray-700">
              כל המחירים באתר מצוינים בשקלים חדשים (₪) וכוללים מע&quot;מ, אלא אם צוין אחרת. אנו שומרים לעצמנו את הזכות לשנות מחירים בכל עת ללא הודעה מוקדמת.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">זכויות יוצרים</h2>
            <p className="font-light leading-relaxed text-gray-700">
              כל התוכן באתר, כולל טקסטים, תמונות, לוגואים ועיצוב, מוגן בזכויות יוצרים וקניין רוחני. אסור להעתיק, לשכפל או להשתמש בתוכן ללא רשות מפורשת בכתב.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">אחריות</h2>
            <p className="font-light leading-relaxed text-gray-700">
              אנו עושים כמיטב יכולתנו להציג מידע מדויק על המוצרים. עם זאת, איננו אחראים לשגיאות או אי-דיוקים במידע. אנו לא נהיה אחראים לכל נזק ישיר או עקיף הנובע משימוש באתר.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">פרטיות</h2>
            <p className="font-light leading-relaxed text-gray-700">
              הגנת הפרטיות שלכם חשובה לנו. כל המידע שאתם מספקים לנו נשמר בצורה מאובטחת ומשמש רק למטרות שירות הלקוחות ולשיפור החוויה באתר. לפרטים נוספים, עיינו במדיניות הפרטיות שלנו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">שינויים בתקנון</h2>
            <p className="font-light leading-relaxed text-gray-700">
              אנו שומרים לעצמנו את הזכות לעדכן את התקנון בכל עת. שינויים ייכנסו לתוקף מייד עם פרסומם באתר. מומלץ לעיין בתקנון מעת לעת.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">דין שולט</h2>
            <p className="font-light leading-relaxed text-gray-700">
              תקנון זה כפוף לחוקי מדינת ישראל. כל סכסוך הנובע משימוש באתר ייפתר בפני בתי המשפט המוסמכים בישראל.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">יצירת קשר</h2>
            <div className="font-light leading-relaxed text-gray-700 space-y-3">
              <p>
                לשאלות או הבהרות בנוגע לתקנון זה, אנא צרו קשר עם שירות הלקוחות שלנו:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>קלומית בע&quot;מ (KLOMIT LTD.)</strong>
                </p>
                <p>
                  כתובת: גאולה 45, תל אביב יפו 6330447
                </p>
                <p>
                  טלפון: <a href="tel:+97235178502" className="hover:text-[#1a1a1a] transition-colors">03-5178502</a>
                </p>
                <p>
                  פקס: 03-5106781
                </p>
                <p>
                  אימייל: <a href="mailto:info@klomit.com" className="hover:text-[#1a1a1a] transition-colors">info@klomit.com</a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


