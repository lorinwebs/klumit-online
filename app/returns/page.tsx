import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow max-w-4xl mx-auto px-4 py-20" role="main">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-8 text-right">
          מדיניות החזרות והחלפות
        </h1>
        
        <div className="prose prose-lg max-w-none text-right space-y-10">
          <section className="mb-8">
            <p className="font-light leading-relaxed text-gray-700 text-lg">
              אתר &quot;קלומית&quot; עושה הכל כדי שתהיי מרוצה מהרכישה. עם זאת, במידה ואת מעוניינת לבצע שינוי בהזמנה, להלן המדיניות הרשמית של האתר הפועלת על פי חוק הגנת הצרכן:
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">1. תנאי סף לביצוע החלפה או החזרה</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              כל בקשה להחלפה או החזרה תיבחן אך ורק אם המוצר עומד בתנאים הבאים:
            </p>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>המוצר חדש לחלוטין, לא נעשה בו כל שימוש, לא נפגם והוא נמצא באריזתו המקורית.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>התווית המקורית מחוברת למוצר ולא הוסרה.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>
                  בדיקת תקינות: כל פריט המוחזר עובר בדיקה קפדנית. מוצר שיגיע עם ריח של בושם, סיגריות, סימני איפור או ללא אריזתו המקורית (כולל מגני פלסטיק על אבזמים במידה והיו) – לא יתקבל. במקרה כזה, המוצר יישלח בחזרה ללקוחה והיא תישא בעלות המשלוח.
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">2. ביטול עסקה והחזר כספי (המסלול היקר)</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              ביטול עסקה לקבלת החזר כספי יתאפשר בתוך 14 ימים מיום קבלת המוצר, בכפוף לניכויים הבאים:
            </p>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span><strong>דמי ביטול:</strong> בהתאם לחוק, ינוכו דמי ביטול בשיעור של 5% ממחיר המוצר או 100 ש&quot;ח – הנמוך מביניהם.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span><strong>דמי סליקה:</strong> במידה והעסקה בוצעה בכרטיס אשראי, ינוכו בנוסף דמי סליקת האשראי שנגבו מהחברה בגין העסקה (בשיעור של עד 2.5%).</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span><strong>עלויות שילוח:</strong> דמי המשלוח המקוריים (ככל ששולמו) אינם מוחזרים. עלות השילוח חזרה למחסני החברה חלה על הלקוחה בלבד.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">3. החלפת פריט או קבלת שובר זיכוי (המסלול המשתלם)</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              כדי להימנע מתשלום דמי ביטול ועמלות סליקה, אנו מאפשרים להחליף את הפריט או לקבל שובר זיכוי (Credit) לרכישה עתידית באתר בשווי מלא של המוצר (ללא ניכוי דמי ביטול).
            </p>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>החלפה/זיכוי יתאפשר בתוך 14 יום ממועד קבלת הפריט.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>על פריטים שנרכשו במבצעי סוף עונה (Sale) או ב-Outlet, תינתן אפשרות להחלפה/זיכוי בתוך יומיים (48 שעות) בלבד ממועד קבלתם.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">4. אופן ביצוע הפעולה</h2>
            <div className="bg-[#f9f9f9] border border-[#e5e5e5] p-6 mb-6">
              <p className="font-medium text-[#1a1a1a] mb-4">
                שימי לב: לא תתקבל כל החזרה או החלפה ללא תיאום מראש מול שירות הלקוחות.
              </p>
              <p className="font-light leading-relaxed text-gray-700 mb-4">
                יש לפנות לשירות הלקוחות בווטסאפ למספר: <a href="https://wa.me/972549903139" target="_blank" rel="noopener noreferrer" className="text-[#1a1a1a] underline underline-offset-2">054-990-3139</a> (וואטסאפ) לצורך פתיחת בקשה וקבלת אישור.
              </p>
            </div>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              אפשרויות החזרה/החלפה לאחר אישור:
            </p>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span><strong>הגעה פיזית:</strong> הגעה ל-Showroom שלנו ברחוב גאולה 45, תל אביב, בתיאום מראש בלבד.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span><strong>שירות שליחים:</strong> ניתן לתאם שליח שיאסוף ממך את הפריט בעלות של 29.90 ש&quot;ח (עלות זו לא תוחזר ותקוזז מהזיכוי/ההחזר).</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">5. דגשים נוספים</h2>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>אין החזר כספי על מוצר שערכו נמוך מ-50 ש&quot;ח.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>אביזרים שהוצאו מאריזתם אינם ניתנים להחזרה.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>אין אחריות על איבוד/נפילה של אבנים, ניטים או אבזמים דקורטיביים לאחר השימוש במוצר.</span>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}



