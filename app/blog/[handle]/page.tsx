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
          <style dangerouslySetInnerHTML={{ __html: `
            .blog-content { font-size: 1.05rem; line-height: 1.9; color: #374151; }
            .blog-content h1 { font-size: 2rem; font-weight: 300; color: #1a1a1a; margin: 2.5rem 0 1rem; line-height: 1.3; }
            .blog-content h2 { font-size: 1.5rem; font-weight: 400; color: #1a1a1a; margin: 2rem 0 0.75rem; line-height: 1.35; }
            .blog-content h3 { font-size: 1.25rem; font-weight: 500; color: #1a1a1a; margin: 1.75rem 0 0.5rem; line-height: 1.4; }
            .blog-content p { margin: 0 0 1.25rem; }
            .blog-content a { color: #c9a962; text-decoration: none; transition: color 0.2s; }
            .blog-content a:hover { color: #a17d4f; text-decoration: underline; }
            .blog-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem auto; display: block; }
            .blog-content ul, .blog-content ol { padding-right: 1.5rem; margin: 1rem 0; }
            .blog-content li { margin: 0.4rem 0; }
            .blog-content ul li { list-style-type: disc; }
            .blog-content ol li { list-style-type: decimal; }
            .blog-content strong, .blog-content b { font-weight: 600; color: #1a1a1a; }
            .blog-content em, .blog-content i { font-style: italic; }
            .blog-content blockquote { border-right: 3px solid #c9a962; padding: 0.75rem 1.25rem; margin: 1.5rem 0; color: #6b7280; background: #fafaf9; border-radius: 4px; }
            .blog-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
            .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
            .blog-content th, .blog-content td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: right; }
            .blog-content th { background: #f9fafb; font-weight: 500; }
            .blog-content iframe, .blog-content video { max-width: 100%; margin: 1.5rem auto; display: block; border-radius: 8px; }
          `}} />
          <div
            className="blog-content max-w-none"
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
