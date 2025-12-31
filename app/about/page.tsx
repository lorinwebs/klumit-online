import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light mb-4 block">
                About Klomit
              </span>
              <h1 className="text-5xl md:text-7xl font-light luxury-font text-[#1a1a1a] mb-6 leading-tight">
                אודות קלומית
              </h1>
              <p className="text-lg md:text-xl font-light text-gray-600 leading-relaxed max-w-2xl mx-auto">
                מורשת של אומנות, מסורת איטלקית ואיכות ללא פשרות
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-right space-y-6">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light block">
                Our Story
              </span>
              <h2 className="text-4xl md:text-5xl font-light luxury-font text-[#1a1a1a] mb-6">
                המורשת שלנו
              </h2>
              <div className="space-y-4 text-base md:text-lg font-light text-gray-700 leading-relaxed">
                <p>
                  חברת &quot;קלומית&quot;, בבעלות משה חייט, היא מהחברות הוותיקות והמוערכות בישראל בתחום ייבוא אביזרי האופנה. עם ניסיון של מעל ל-40 שנה, החברה מתמחה ביבוא של תיקים וארנקים ממותגים איטלקיים.
                </p>
                <p>
                  קלומית נולדה מתוך אהבה עמוקה לאומנות העור האיטלקית המסורתית. כל תיק שאנו מייבאים נושא עמו את המורשת של מאות שנות עבודת יד איטלקית, המשולבת עם עיצוב מודרני ופונקציונלי.
                </p>
                <p>
                  אנו מתמחים ביצירת קולקציות יוקרתיות שמשלבות בין איכות בלתי מתפשרת, עיצוב אלגנטי וקלאסי, ופונקציונליות מושלמת. כל תיק מיוצר בקפידה עם תשומת לב לפרטים הקטנים ביותר, תוך שימוש בעור איטלקי משובח ותפירה ידנית מדויקת.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-white border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light mb-4 block">
                What Makes Us Unique
              </span>
              <h2 className="text-4xl md:text-5xl font-light luxury-font text-[#1a1a1a] mb-6">
                מה שמייחד אותנו
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light block">
                  01
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a]">
                  נבחרת מותגים
                </h3>
                <p className="text-sm md:text-base font-light text-gray-600 leading-relaxed">
                  ייצוג בלעדי של בתי אופנה איטלקיים מובילים כמו <span className="font-medium">Renato Angi</span> ו-<span className="font-medium">Carlino Group</span>.
                </p>
              </div>
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light block">
                  02
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a]">
                  התאמה לצו האופנה
                </h3>
                <p className="text-sm md:text-base font-light text-gray-600 leading-relaxed">
                  עדכון מתמיד של הקולקציות בהתאם למגמות הבינלאומיות, תוך שמירה על עיצוב קלאסי על-זמני.
                </p>
              </div>
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light block">
                  03
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a]">
                  סטנדרט שירות
                </h3>
                <p className="text-sm md:text-base font-light text-gray-600 leading-relaxed">
                  הפצה רחבה לחנויות בוטיק ויוקרה, המבוססת על מקצועיות ואמינות ללא פשרות.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light mb-4 block">
              Our Commitment
            </span>
            <h2 className="text-4xl md:text-5xl font-light luxury-font text-[#1a1a1a] mb-6">
              המחויבות שלנו
            </h2>
            <p className="text-lg md:text-xl font-light text-gray-700 leading-relaxed">
              אנו מתחייבים להעניק לך חווית קנייה יוצאת דופן ותיק שילווה אותך שנים רבות. כל תיק שאנו מייבאים הוא ביטוי לאהבתנו לאומנות העור ולמסורת האיטלקית המפוארת.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
