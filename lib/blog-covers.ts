import { SITE_URL } from '@/lib/seo';

/**
 * Cover photos for magazine articles.
 *
 * An article normally shows the image set on it in Shopify. The articles listed below show a
 * cover from /public/blog instead, so changing their image in Shopify has no effect until
 * their entry here is removed. They are keyed by Shopify article id, which stays the same
 * when the title or the address of the article changes.
 *
 * Covers are portrait (3:4, at least 860px wide) and sit in portrait frames. A cover with the
 * product in the middle survives the small crop those frames make.
 */
const LOCAL_COVERS: Record<string, ArticleCover> = {
  // מה זה בכלל "קלומית"? הסיפור שמאחורי השם
  'gid://shopify/Article/604326691059': {
    src: '/blog/klumit-name.jpg',
    alt: 'תיק יד קטן מעור חום עם סמל חתול כסוף על שולחן שיש, לצידו לימון וקליפה מסולסלת',
  },
  // קיץ 2026 כבר כאן
  'gid://shopify/Article/604326232307': {
    src: '/blog/summer-2026.jpg',
    alt: 'תיק צד מעור כחול של Renato Angi על מעקה אבן מול הלגונה של ונציה, לצידו כובע קש ומשקפי שמש',
  },
  // לא עוד סתם תיק: למה התיק הבא שלך צריך להיות Renato Angi?
  'gid://shopify/Article/604044493043': {
    src: '/blog/renato-angi.jpg',
    alt: 'תיק יד מעור שחור של Renato Angi על שולחן עבודה בסדנת עור, בין גלילי עור וסלילי חוט',
  },
};

export interface ArticleCover {
  src: string;
  alt: string;
}

interface ArticleWithImage {
  id: string;
  title: string;
  image: { url: string; altText: string | null } | null;
}

export function getArticleCover(article: ArticleWithImage): ArticleCover | null {
  const local = LOCAL_COVERS[article.id];
  if (local) return local;
  if (article.image?.url) {
    return { src: article.image.url, alt: article.image.altText || article.title };
  }
  return null;
}

/** Full address of a cover, for sharing previews and search engines. */
export function coverAbsoluteUrl(cover: ArticleCover): string {
  return cover.src.startsWith('/') ? `${SITE_URL}${cover.src}` : cover.src;
}
