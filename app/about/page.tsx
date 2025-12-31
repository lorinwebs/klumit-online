import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-8 text-center">אודות Klomit</h1>
          <div className="prose prose-lg mx-auto">
            <p className="text-xl mb-6">
              Klomit מציעה קולקציה יוקרתית של תיקים בעיצוב איטלקי קלאסי.
            </p>
            <p className="mb-6">
              כל תיק מיוצר בקפידה עם תשומת לב לפרטים הקטנים ביותר, תוך שימוש בחומרים
              איכותיים ועיצוב אלגנטי וקלאסי.
            </p>
            <p>
              אנו מתמחים ביצירת תיקים יוקרתיים שמשלבים בין איכות, עיצוב ופונקציונליות,
              ומתאימים לכל אירוע ולכל סגנון.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}



