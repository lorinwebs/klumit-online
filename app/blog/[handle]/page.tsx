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
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-grow">
        {/* Hero image */}
        {article.image?.url && (
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[70vh] bg-cream-warm">
            <Image
              src={article.image.url}
              alt={article.image.altText || article.title}
              fill
              className="object-cover"
              style={{ objectPosition: 'center 40%' }}
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 via-espresso/10 to-transparent" />
          </div>
        )}

        {/* Article content */}
        <article className="max-w-[800px] mx-auto px-4 py-10 md:py-16">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-xs font-light text-stone">
              <li><Link href="/" className="hover:text-espresso transition-colors">בית</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-espresso transition-colors">המגזין</Link></li>
              <li>/</li>
              <li className="text-stone-dark truncate max-w-[200px]">{article.title}</li>
            </ol>
          </nav>

          {/* Meta */}
          <div className="mb-6 space-y-2">
            <p className="text-[10px] font-medium text-stone tracking-editorial uppercase">
              {new Date(article.publishedAt).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {article.authorV2?.name && ` • ${article.authorV2.name}`}
            </p>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-light font-display text-espresso leading-snug mb-8">
            {article.title}
          </h1>

          {/* Body */}
          <style dangerouslySetInnerHTML={{ __html: `
            .blog-content { font-size: 1.05rem; line-height: 1.9; color: #8C7E73; }
            .blog-content h1 { font-size: 2rem; font-weight: 300; color: #2C2420; margin: 2.5rem 0 1rem; line-height: 1.3; }
            .blog-content h2 { font-size: 1.5rem; font-weight: 400; color: #2C2420; margin: 2rem 0 0.75rem; line-height: 1.35; }
            .blog-content h3 { font-size: 1.25rem; font-weight: 500; color: #2C2420; margin: 1.75rem 0 0.5rem; line-height: 1.4; }
            .blog-content p { margin: 0 0 1.25rem; }
            .blog-content a { color: #C4956A; text-decoration: none; transition: color 0.3s; }
            .blog-content a:hover { color: #A67B52; text-decoration: underline; }
            .blog-content img { max-width: 100%; height: auto; margin: 1.5rem auto; display: block; }
            .blog-content ul, .blog-content ol { padding-right: 1.5rem; margin: 1rem 0; }
            .blog-content li { margin: 0.4rem 0; }
            .blog-content ul li { list-style-type: disc; }
            .blog-content ol li { list-style-type: decimal; }
            .blog-content strong, .blog-content b { font-weight: 600; color: #2C2420; }
            .blog-content em, .blog-content i { font-style: italic; }
            .blog-content blockquote { border-right: 3px solid #C4956A; padding: 0.75rem 1.25rem; margin: 1.5rem 0; color: #A69585; background: #F2ECE4; }
            .blog-content hr { border: none; border-top: 1px solid #E8E2DB; margin: 2rem 0; }
            .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
            .blog-content th, .blog-content td { border: 1px solid #E8E2DB; padding: 0.5rem 0.75rem; text-align: right; }
            .blog-content th { background: #F2ECE4; font-weight: 500; }
            .blog-content iframe, .blog-content video { max-width: 100%; margin: 1.5rem auto; display: block; }
          `}} />
          <div
            className="blog-content max-w-none"
            dir="rtl"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-sand">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[11px] font-medium text-terracotta hover:text-terracotta-dark transition-colors duration-300 tracking-editorial uppercase"
            >
              &rarr; חזרה למגזין
            </Link>
          </div>
        </article>

        {/* More articles */}
        {moreArticles.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-4 pb-16">
            <h2 className="font-display text-xl md:text-2xl font-light text-espresso tracking-editorial uppercase text-center mb-8">
              עוד במגזין
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {moreArticles.map((a) => (
                <Link key={a.id} href={`/blog/${a.handle}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-cream-warm border border-sand/60 mb-3">
                    {a.image?.url ? (
                      <Image
                        src={a.image.url}
                        alt={a.image.altText || a.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-cream-warm">
                        <span className="text-sand-dark text-4xl font-display">K</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-light text-espresso group-hover:text-terracotta transition-colors duration-500">
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
