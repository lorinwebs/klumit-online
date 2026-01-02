import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

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
              ברוכים הבאים לאתר קלומית בע&quot;מ (KLUMIT LTD.). השימוש באתר זה כפוף לתנאים המפורטים להלן. שימוש באתר מהווה הסכמה מלאה לתנאים אלה.
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
            <h2 className="text-2xl font-light luxury-font mb-4">מדיניות אספקת המוצר/שירות</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              המוצרים יישלחו ללקוח באמצעות חברת שליחויות מוכרת. זמן המשלוח המקסימלי מהרגע שבו בוצעה הרכישה ועד הגעת המוצר ליעד הוא עד 14 ימי עסקים.
            </p>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              משלוח חינם מוצע להזמנות מעל 500 ₪. משלוח סטנדרטי עולה 25 ₪ ומשלוח אקספרס (1-2 ימי עסקים) עולה 50 ₪.
            </p>
            <p className="font-light leading-relaxed text-gray-700">
              לאחר ביצוע ההזמנה, תקבלו אימייל עם מספר מעקב למעקב אחר סטטוס המשלוח. לפרטים נוספים, עיינו בעמוד <Link href="/shipping" className="text-[#1a1a1a] underline hover:no-underline">משלוחים</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">הגבלת ניל</h2>
            <p className="font-light leading-relaxed text-gray-700">
              רכישה באשראי באתר זה מותרת רק למי שגילו 18 שנים ומעלה. בעת ביצוע רכישה, אתם מאשרים כי גילכם הוא 18 שנים ומעלה וכי יש לכם את הזכות החוקית לבצע את הרכישה. אנו שומרים לעצמנו את הזכות לבטל הזמנות אם יתברר שהרוכש אינו עומד בדרישות הגיל.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">אחריות בית העסק</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              אנו עושים כמיטב יכולתנו להציג מידע מדויק על המוצרים. עם זאת, איננו אחראים לשגיאות או אי-דיוקים במידע המוצג באתר.
            </p>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              החברה ו/או מי מטעמה לא יהיו אחראים לכל נזק ישיר ו/או עקיף שיגרם כתוצאה משימוש בשירות ו/או שימוש במוצר שנרכש באתר, לרבות אך לא רק:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>נזקים הנובעים משימוש לא תקין במוצר</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>נזקים הנובעים מאובדן מידע או נתונים</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>נזקים הנובעים מבעיות טכניות או תקלות באתר</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>נזקים הנובעים מעיכובים במשלוח או אובדן משלוח</span>
              </li>
            </ul>
            <p className="font-light leading-relaxed text-gray-700">
              האחריות על המוצרים מוגבלת לתקופת האחריות שצוינה על ידי היצרן בלבד.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">תנאים לביטול עסקה</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              ביטול עסקה יתבצע על-פי חוק הגנת הצרכן, התשמ&quot;א-1981. ניתן לבטל עסקה בתוך 14 ימים מיום קבלת המוצר או מיום ביצוע הרכישה, לפי המאוחר מביניהם.
            </p>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              על מנת לבטל עסקה, יש לשלוח הודעה בכתב (במייל או בדואר) לחברה. המוצר חייב להיות במצבו המקורי, ללא שימוש, עם כל התוויות והאריזה המקורית.
            </p>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              לאחר ביטול העסקה, החברה תחזיר ללקוח את סכום התשלום בתוך 14 ימים מיום קבלת המוצר בחזרה או מיום קבלת ההודעה על הביטול, לפי המאוחר מביניהם.
            </p>
            <p className="font-light leading-relaxed text-gray-700">
              עלויות המשלוח לא יוחזרו ללקוח, אלא אם בוטלה העסקה מסיבה הקשורה לחברה. לפרטים נוספים, עיינו בעמוד <Link href="/returns" className="text-[#1a1a1a] underline hover:no-underline">החזרות</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">מדיניות פרטיות</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              הגנת הפרטיות שלכם חשובה לנו. כל המידע שאתם מספקים לנו נשמר בצורה מאובטחת ומשמש רק למטרות הבאות:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700 mb-4">
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
                <span>שיפור החוויה באתר</span>
              </li>
            </ul>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              אנו לא נמכור, נשכיר או נשתף את המידע האישי שלכם עם צדדים שלישיים למטרות שיווקיות, אלא אם נדרש לעשות כן על פי חוק או אם קיבלנו את הסכמתכם המפורשת.
            </p>
            <p className="font-light leading-relaxed text-gray-700">
              המידע נשמר במערכות מאובטחות ומוגנות. לפרטים נוספים, עיינו ב<Link href="/privacy" className="text-[#1a1a1a] underline hover:no-underline">מדיניות הפרטיות</Link> המלאה שלנו.
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
                  <strong>קלומית בע&quot;מ (KLUMIT LTD.)</strong>
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
                  אימייל: <a href="mailto:info@klumit.com" className="hover:text-[#1a1a1a] transition-colors">info@klumit.com</a>
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


