import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroMinimal from '@/components/HeroMinimal';
import ValuePropsBar from '@/components/ValuePropsBar';
import MytheresaGrid from '@/components/MytheresaGrid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תיקים יוקרתיים | קלומית',
  description: 'יבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP. תיקים יוקרתיים מעור איטלקי איכותי, חגורות ואביזרי אופנה היישר מאיטליה.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeroMinimal />
      <ValuePropsBar />
      <main id="main-content" className="flex-grow" role="main">
        <MytheresaGrid category="bags" maxProducts={8} showViewAll={true} />
      </main>
      <Footer />
    </div>
  );
}




