import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { shopifyClient, ARTICLES_QUERY } from '@/lib/shopify';

interface Article {
  id: string;
  title: string;
  handle: string;
  contentHtml: string;
  excerpt: string | null;
  publishedAt: string;
  image: { url: string; altText: string | null } | null;
  authorV2: { name: string } | null;
  blog: { handle: string; title: string };
}

interface PageProps {
  params: Promise<{ handle: string }>;
}

const ALL_ARTICLES_WITH_CONTENT_QUERY = `
  query getAllArticlesWithContent($first: Int!) {
    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          contentHtml
          excerpt
          publishedAt
          image {
            url
            altText
          }
          authorV2 {
            name
          }
          blog {
            handle
            title
          }
        }
      }
    }
  }
`;

async function getArticle(rawHandle: string): Promise<Article | null> {
  const handle = decodeURIComponent(rawHandle);

  // Fetch all articles with content and match by handle
  try {
    const data = await shopifyClient.request<{
      articles: { edges: Array<{ node: Article }> };
    }>(ALL_ARTICLES_WITH_CONTENT_QUERY, { first: 50 });

    const match = data.articles.edges.find((e) => {
      const articleHandle = decodeURIComponent(e.node.handle);
      return articleHandle === handle || e.node.handle === rawHandle;
    });

    return match?.node ?? null;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const article = await getArticle(handle);

  if (!article) {
    return { title: 'מאמר לא נמצא | קלומית' };
  }

  return {
    title: `${article.title} | המגזין - קלומית`,
    description: article.excerpt?.slice(0, 160) || `${article.title} - מגזין קלומית`,
    alternates: {
      canonical: `https://www.klumit-online.co.il/blog/${handle}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      type: 'article',
      url: `https://www.klumit-online.co.il/blog/${handle}`,
      images: article.image?.url ? [{ url: article.image.url, alt: article.title }] : [],
      publishedTime: article.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { handle } = await params;
  const article = await getArticle(handle);

  if (!article) {
    notFound();
  }

  let moreArticles: Array<{ id: string; title: string; handle: string; image: { url: string; altText: string | null } | null }> = [];
  try {
    const data = await shopifyClient.request<{
      articles: { edges: Array<{ node: typeof moreArticles[0] }> };
    }>(ARTICLES_QUERY, { first: 4 });
    moreArticles = data.articles.edges
      .map((e) => e.node)
      .filter((a) => a.id !== article.id)
      .slice(0, 3);
  } catch {
    // continue without related articles
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow">
        {/* Hero image */}
        {article.image?.url && (
          <div className="relative w-full h-[300px] md:h-[500px] bg-gray-100">
            <Image
              src={article.image.url}
              alt={article.image.altText || article.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Article content */}
        <article className="max-w-[800px] mx-auto px-4 py-10 md:py-16">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-xs font-light text-gray-400">
              <li><Link href="/" className="hover:text-[#1a1a1a] transition-colors">בית</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-[#1a1a1a] transition-colors">המגזין</Link></li>
              <li>/</li>
              <li className="text-gray-600 truncate max-w-[200px]">{article.title}</li>
            </ol>
          </nav>

          {/* Meta */}
          <div className="mb-6 space-y-2">
            <p className="text-xs font-light text-gray-400 tracking-wider uppercase">
              {new Date(article.publishedAt).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {article.authorV2?.name && ` • ${article.authorV2.name}`}
            </p>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-light luxury-font text-[#1a1a1a] leading-snug mb-8">
            {article.title}
          </h1>

          {/* Body */}
          <div
            className="prose prose-lg max-w-none font-light text-gray-700 leading-relaxed
              prose-headings:font-light prose-headings:text-[#1a1a1a] prose-headings:luxury-font
              prose-a:text-[#c9a962] prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:mx-auto
              prose-strong:font-medium prose-strong:text-[#1a1a1a]
              prose-blockquote:border-[#c9a962] prose-blockquote:text-gray-500 prose-blockquote:font-light"
            dir="rtl"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-light text-[#c9a962] hover:text-[#a17d4f] transition-colors tracking-wider uppercase"
            >
              &rarr; חזרה למגזין
            </Link>
          </div>
        </article>

        {/* More articles */}
        {moreArticles.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-4 pb-16">
            <h2 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a] tracking-[0.1em] uppercase text-center mb-8">
              עוד במגזין
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {moreArticles.map((a) => (
                <Link key={a.id} href={`/blog/${a.handle}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-3">
                    {a.image?.url ? (
                      <Image
                        src={a.image.url}
                        alt={a.image.altText || a.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <span className="text-gray-300 text-4xl luxury-font">K</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-light text-[#1a1a1a] group-hover:text-[#c9a962] transition-colors">
                    {a.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
