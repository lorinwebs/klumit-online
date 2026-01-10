import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import ValueProps from '@/components/ValueProps';
import FeaturedProducts from '@/components/FeaturedProducts';
import InstagramFeed from '@/components/InstagramFeed';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-grow" role="main">
        <Hero />
        <ValueProps />
        <FeaturedProducts />
        <InstagramFeed />
      </main>
      <Footer />
    </div>
  );
}




