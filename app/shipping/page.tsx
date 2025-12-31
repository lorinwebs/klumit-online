import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-12 text-right">
          משלוחים
        </h1>
        
        <div className="prose prose-lg max-w-none text-right space-y-8">
          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">זמני משלוח</h2>
            <p className="font-light leading-relaxed text-gray-700">
              אנו מספקים משלוחים מהירים ואמינים לכל רחבי הארץ. זמן המשלוח הסטנדרטי הוא 3-5 ימי עסקים מרגע אישור ההזמנה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">עלויות משלוח</h2>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>משלוח חינם להזמנות מעל 500 ₪</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>משלוח סטנדרטי: 25 ₪</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>משלוח אקספרס (1-2 ימי עסקים): 50 ₪</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">משלוח יוקרתי</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              כל התיקים שלנו נשלחים באריזה יוקרתית עם:
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>קופסת מתנה מעוצבת</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>שקית בד יוקרתית</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>מעטפת הגנה נוספת</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">מעקב אחר משלוח</h2>
            <p className="font-light leading-relaxed text-gray-700">
              לאחר ביצוע ההזמנה, תקבלו אימייל עם מספר מעקב. תוכלו לעקוב אחר סטטוס המשלוח דרך הקישור באימייל או באזור האישי שלכם.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">שאלות נוספות</h2>
            <p className="font-light leading-relaxed text-gray-700">
              לשאלות נוספות בנושא משלוחים, אנא צרו קשר עם שירות הלקוחות שלנו במייל או בטלפון.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}




