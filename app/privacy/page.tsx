import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-12 text-right">
          מדיניות פרטיות
        </h1>
        
        <div className="prose prose-lg max-w-none text-right space-y-8">
          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">הקדמה</h2>
            <p className="font-light leading-relaxed text-gray-700">
              קלומית בע&quot;מ (KLOMIT LTD.) מתחייבת להגן על הפרטיות שלכם. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים, מגנים ומחש�ים את המידע האישי שלכם בעת שימוש באתר שלנו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">איזה מידע אנו אוספים</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              אנו אוספים את המידע הבא:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span><strong>מידע אישי:</strong> שם, כתובת אימייל, מספר טלפון, כתובת משלוח</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span><strong>מידע תשלום:</strong> פרטי תשלום מועברים דרך Grow-il המאובטחים ומאובטחים</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מערכת הפעלה, דפים שביקרת בהם</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span><strong>מידע שימוש:</strong> כיצד אתה משתמש באתר, מוצרים שאתה צופה בהם</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">כיצד אנו משתמשים במידע</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              אנו משתמשים במידע האישי שלכם למטרות הבאות:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>ביצוע והשלמת הזמנות</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>שירות לקוחות ותמיכה</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>שליחת עדכונים והזמנות (רק אם הסכמתם לכך)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>שיפור החוויה באתר ושירות הלקוחות</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>מניעת הונאות ואבטחת האתר</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">שיתוף מידע עם צדדים שלישיים</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              אנו לא נמכור, נשכיר או נשתף את המידע האישי שלכם עם צדדים שלישיים למטרות שיווקיות, אלא אם:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>נדרש לעשות כן על פי חוק או צו בית משפט</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>קיבלנו את הסכמתכם המפורשת</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>המידע נדרש לספק שירותים חיוניים (כמו חברות משלוחים או מערכות תשלום מאובטחות)</span>
              </li>
            </ul>
            <p className="font-light leading-relaxed text-gray-700 mt-4">
              אנו משתמשים בשירותים של Shopify לאחסון נתונים, Grow-il לתשלומים, ו-Supabase לאימות משתמשים. כל השירותים הללו עומדים בתקני אבטחה מחמירים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">אבטחת מידע</h2>
            <p className="font-light leading-relaxed text-gray-700">
              אנו נוקטים באמצעי אבטחה טכנולוגיים וארגוניים מתקדמים כדי להגן על המידע האישי שלכם מפני גישה לא מורשית, שימוש לרעה, שינוי או הרס. המידע נשמר במערכות מאובטחות ומוגנות, והגישה אליו מוגבלת לעובדים מורשים בלבד.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">זכויותיכם</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              יש לכם זכויות הבאות ביחס למידע האישי שלכם:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>זכות לעיין במידע האישי שלכם</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>זכות לתקן מידע שגוי או לא מעודכן</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>זכות למחוק את המידע האישי שלכם (בכפוף למגבלות חוקיות)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>זכות להתנגד לעיבוד המידע האישי שלכם</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>זכות לבטל הסכמה לשימוש במידע למטרות שיווקיות</span>
              </li>
            </ul>
            <p className="font-light leading-relaxed text-gray-700 mt-4">
              כדי לממש את זכויותיכם, אנא צרו קשר עם שירות הלקוחות שלנו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">עוגיות (Cookies)</h2>
            <p className="font-light leading-relaxed text-gray-700">
              האתר שלנו משתמש בעוגיות כדי לשפר את החוויה שלכם. עוגיות הן קבצים קטנים שנשמרים במחשב שלכם ומסייעים לנו לזכור את ההעדפות שלכם ולשפר את הביצועים של האתר. תוכלו להגדיר את הדפדפן שלכם לדחות עוגיות, אך זה עלול להשפיע על הפונקציונליות של האתר.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">שינויים במדיניות הפרטיות</h2>
            <p className="font-light leading-relaxed text-gray-700">
              אנו שומרים לעצמנו את הזכות לעדכן את מדיניות הפרטיות בכל עת. שינויים ייכנסו לתוקף מייד עם פרסומם באתר. מומלץ לעיין במדיניות הפרטיות מעת לעת כדי להישאר מעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">יצירת קשר</h2>
            <div className="font-light leading-relaxed text-gray-700 space-y-3">
              <p>
                לשאלות או בקשות בנוגע למדיניות הפרטיות או למימוש זכויותיכם, אנא צרו קשר עם שירות הלקוחות שלנו:
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


