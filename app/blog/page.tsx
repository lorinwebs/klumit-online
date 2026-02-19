import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { shopifyClient, ARTICLES_QUERY } from '@/lib/shopify';

export const metadata: Metadata = {
  title: 'המגזין | קלומית - טיפים, השראה ועולם העור האיטלקי',
  description: 'מגזין קלומית - מאמרים על תיקי עור, טיפים לטיפוח עור, טרנדים באופנה איטלקית, ועוד. הישארו מעודכנים עם החדשות האחרונות.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/blog',
  },
};

interface Article {
  id: string;
  title: string;
  handle: string;
  excerpt: string | null;
  publishedAt: string;
  image: { url: string; altText: string | null } | null;
  blog: { handle: string };
  authorV2: { name: string } | null;
}

export default async function BlogPage() {
  let articles: Article[] = [];

  try {
    const data = await shopifyClient.request<{
      articles: { edges: Array<{ node: Article }> };
    }>(ARTICLES_QUERY, { first: 50 });
    articles = data.articles.edges.map((e) => e.node);
  } catch (error) {
    console.error('Failed to fetch blog articles:', error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow max-w-[1200px] mx-auto px-4 py-12 md:py-20 w-full">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-light luxury-font text-[#1a1a1a] tracking-[0.15em] uppercase mb-4">
            המגזין
          </h1>
          <p className="text-sm md:text-base font-light text-gray-500 max-w-lg mx-auto">
            טיפים, השראה ועולם העור האיטלקי
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-light">אין מאמרים עדיין. חזרו בקרוב!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.handle}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-4">
                  {article.image?.url ? (
                    <Image
                      src={article.image.url}
                      alt={article.image.altText || article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <span className="text-gray-300 text-4xl luxury-font">K</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-light text-gray-400 tracking-wider uppercase">
                    {new Date(article.publishedAt).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <h2 className="text-lg md:text-xl font-light text-[#1a1a1a] group-hover:text-[#c9a962] transition-colors leading-snug">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-sm font-light text-gray-500 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                  <span className="inline-block text-xs font-light text-[#c9a962] tracking-wider uppercase mt-2 group-hover:underline">
                    קראו עוד &larr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
