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
              משלוח עד הבית תוך 2-5 ימי עסקים מרגע אישור ההזמנה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">עלויות משלוח</h2>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span><strong>משלוח חינם</strong> להזמנות מעל 500 ₪</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1a1a1a] mt-1">•</span>
                <span>משלוח עד הבית: <strong>39 ₪</strong></span>
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
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              לשאלות בנושא משלוחים, צרו קשר עם מור:
            </p>
            <a 
              href="tel:0542600177" 
              className="inline-flex items-center gap-2 text-lg font-light text-[#1a1a1a] hover:opacity-70 transition-opacity"
            >
              📞 054-260-0177
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
