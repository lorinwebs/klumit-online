import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-12 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light mb-3 block">
                About Klumit
              </span>
              <h1 className="text-4xl md:text-5xl font-light luxury-font text-[#1a1a1a] mb-4 leading-tight">
                אודות קלומית (Klumit)
              </h1>
              <p className="text-base md:text-lg font-light text-gray-600 leading-relaxed max-w-2xl mx-auto">
                מורשת של אומנות, מסורת איטלקית ואיכות ללא פשרות.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section with Image */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
              <div className="relative aspect-[4/3] order-2 md:order-1">
                <Image
                  src="/about-image-3.jpg"
                  alt="שני גברים הולכים בחוץ"
                  fill
                  className="object-contain object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="text-right space-y-4 order-1 md:order-2">
                <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light block">
                  Our Story
                </span>
                <h2 className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-4">
                  המורשת שלנו
                </h2>
                <div className="space-y-4 text-base font-light text-gray-700 leading-relaxed">
                  <p className="text-lg font-light text-gray-800 italic">
                    למקום בו נמצאים הדברים החשובים לנו ביותר, נדרשת תשומת הלב הגדולה ביותר.
                  </p>
                  <p>
                    סיפורה של חברת &quot;קלומית&quot;, בבעלות משה חייט, מתחיל לפני למעלה מ-40 שנה. כמי שצמח מתוך עולם האופנה הישראלי, זיהה משה את הצורך בחיבור בין הקהל המקומי לבין הסטנדרט הבינלאומי הגבוה ביותר – אומנות העור האיטלקית המסורתית.
                  </p>
                  <p>
                    במהלך עשורים של פעילות, הפכה קלומית לאחת החברות הוותיקות והמוערכות בישראל בתחום ייבוא אביזרי האופנה. אנו מתמחים ביבוא של תיקים וארנקים ממותגים איטלקיים מובילים, מתוך אמונה שכל תיק הוא לא רק אביזר, אלא ביטוי של מורשת, איכות וסטייל אישי.
                  </p>
                  <p className="text-lg font-light text-gray-800 mt-6">
                    המשפחה שלנו, התיק שלכם
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-right space-y-4">
                <div className="space-y-3 text-base font-light text-gray-700 leading-relaxed">
                  <p>
                    אנו מתמחים ביצירת קולקציות יוקרתיות שמשלבות בין איכות בלתי מתפשרת, עיצוב אלגנטי וקלאסי, ופונקציונליות מושלמת. כל תיק מיוצר בקפידה עם תשומת לב לפרטים הקטנים ביותר, תוך שימוש בעור איטלקי משובח ותפירה ידנית מדויקת.
                  </p>
                </div>
              </div>
              <div className="relative aspect-[4/3]">
                <Image
                  src="/about-image-2.jpg"
                  alt="שני גברים עומדים זה לצד זה"
                  fill
                  className="object-contain object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center mt-12">
              <div className="relative aspect-[4/3] order-2 md:order-1">
                <Image
                  src="/about-image-1.jpg"
                  alt="תמונה נוספת"
                  fill
                  className="object-contain object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="text-right space-y-4 order-1 md:order-2">
                <div className="space-y-3 text-base font-light text-gray-700 leading-relaxed">
                  <p>
                    הקולקציות שלנו משקפות את המסורת האיטלקית העתיקה, המשולבת עם עיצוב עכשווי ופונקציונלי. כל פריט שאנו מייבאים עובר בחירה קפדנית כדי להבטיח איכות ללא פשרות.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-20 bg-white border-t border-gray-200 mt-16 md:mt-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light mb-3 block">
                What Makes Us Unique
              </span>
              <h2 className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-6">
                מה שמייחד אותנו
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light block">
                  01
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a] mb-3">
                  נבחרת מותגים
                </h3>
                <p className="text-sm md:text-base font-light text-gray-600 leading-relaxed">
                  ייצוג בלעדי של בתי אופנה איטלקיים מובילים כמו <span className="font-medium text-amber-700">Renato Angi</span> ו-<span className="font-medium text-amber-700">Carlino Group</span>.
                </p>
              </div>
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light block">
                  02
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a] mb-3">
                  התאמה לצו האופנה
                </h3>
                <p className="text-sm md:text-base font-light text-gray-600 leading-relaxed">
                  עדכון מתמיד של הקולקציות בהתאם למגמות הבינלאומיות, תוך שמירה על עיצוב קלאסי על-זמני.
                </p>
              </div>
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light block">
                  03
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a] mb-3">
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
        <section className="pt-12 pb-6">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light mb-3 block">
              Our Commitment
            </span>
            <h2 className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-4">
              המחויבות שלנו
            </h2>
            <p className="text-base md:text-lg font-light text-gray-700 leading-relaxed">
              אנו מתחייבים להעניק לך חווית קנייה יוצאת דופן ותיק שילווה אותך שנים רבות. כל תיק שאנו מייבאים הוא ביטוי לאהבתנו לאומנות העור ולמסורת האיטלקית המפוארת.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
