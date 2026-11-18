import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { shopifyClient, ARTICLES_QUERY } from '@/lib/shopify';
import { getArticleCover } from '@/lib/blog-covers';

// Must be a numeric literal for Next.js segment config static analysis
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'המגזין | KLUMIT - טיפים, השראה ועולם העור האיטלקי' },
  description: 'מגזין KLUMIT - מאמרים על תיקי עור, טיפים לטיפוח עור, טרנדים באופנה איטלקית, ועוד. הישארו מעודכנים עם החדשות האחרונות.',
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

/** "Headline: subtitle" or "Question? subtitle" → two lines on the card */
function splitTitle(title: string): { headline: string; subtitle: string | null } {
  const match = title.trim().match(/^(.+?[?:])\s+(.+)$/);
  if (!match) return { headline: title.trim(), subtitle: null };
  return { headline: match[1].replace(/:$/, ''), subtitle: match[2] };
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
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-grow max-w-[1200px] mx-auto px-4 py-12 md:py-20 w-full">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-display text-3xl md:text-5xl font-light text-espresso tracking-editorial uppercase mb-4">
            המגזין
          </h1>
          <div className="w-12 h-[1px] bg-terracotta mx-auto mb-4" />
          <p className="text-sm md:text-base font-light text-stone max-w-lg mx-auto">
            טיפים, השראה ועולם העור האיטלקי
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone font-light">אין מאמרים עדיין. חזרו בקרוב!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-8 lg:grid-cols-3">
            {articles.map((article, index) => {
              const cover = getArticleCover(article);
              // Some articles have their own title saved as the summary; showing it twice adds nothing
              const excerpt = article.excerpt?.trim();
              const showExcerpt = Boolean(excerpt) && excerpt !== article.title.trim();
              // Every card gets a second line: titles without a split borrow it from the excerpt
              const { headline, subtitle: titleSubtitle } = splitTitle(article.title);
              const subtitle = titleSubtitle ?? (showExcerpt ? excerpt : null);
              return (
                <Link key={article.id} href={`/blog/${article.handle}`} className="group flex flex-col">
                  {/* Portrait frame: covers are portrait, so a wide frame would cut them in half */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-cream-warm border border-sand/60 mb-3 md:mb-4">
                    {cover ? (
                      <Image
                        src={cover.src}
                        alt={cover.alt}
                        fill
                        // First row is above the fold (LCP) – load it eagerly
                        priority={index < 3}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 1024px) 50vw, 400px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-cream-warm">
                        <span className="text-sand-dark text-4xl font-display">K</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-2 flex flex-col gap-1.5 md:gap-2">
                    <p className="text-[10px] font-medium text-stone tracking-editorial uppercase">
                      {new Date(article.publishedAt).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {/* Headline and subtitle read as one block: no gap and no reserved height between them.
                        One line each from md; narrow phone columns may wrap to two. */}
                    <div>
                      <h2 className="font-display text-sm md:text-xl font-bold text-espresso group-hover:text-terracotta transition-colors duration-500 leading-snug line-clamp-2 md:line-clamp-1">
                        {headline}
                      </h2>
                      {subtitle && (
                        <p className="text-xs md:text-sm font-light text-stone-dark leading-snug line-clamp-2 md:line-clamp-1">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Fills the card, so "read more" sits on one line across the row whatever the title length */}
                  <div className="flex flex-1 flex-col gap-2">
                    <span className="mt-auto inline-flex items-center gap-1 self-start pt-2 text-[10px] font-medium text-terracotta tracking-editorial uppercase group-hover:underline underline-offset-4">
                      קראו עוד &larr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
