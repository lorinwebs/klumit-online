import Link from 'next/link';
import FaqList from '@/components/seo/FaqList';
import { BRAND_PAGES, brandPath } from '@/lib/brand-pages';
import { CATEGORY_PAGES, type GuideSection } from '@/lib/category-pages';
import type { FaqItem } from '@/lib/seo';

/** Internal links to the other landing and help pages */
export function siteGuideLinks(currentPath: string) {
  return [
    ...Object.values(CATEGORY_PAGES).map((page) => ({ href: page.path, label: page.name })),
    ...BRAND_PAGES.map((brand) => ({ href: brandPath(brand), label: brand.name })),
    { href: '/faq', label: 'שאלות נפוצות' },
    { href: '/shipping', label: 'משלוחים' },
    { href: '/returns', label: 'החזרות והחלפות' },
  ].filter((link) => link.href !== currentPath);
}

interface SeoGuideProps {
  title?: string;
  sections?: GuideSection[];
  faq: FaqItem[];
  links: Array<{ href: string; label: string }>;
}

/** Buying guide + FAQ under a catalog grid; the FAQ must match the page's FAQPage structured data. */
export default function SeoGuide({ title, sections = [], faq, links }: SeoGuideProps) {
  const heading = 'font-display text-2xl md:text-3xl font-light text-espresso';

  return (
    <section className="border-t border-sand bg-cream">
      <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
        {title && sections.length > 0 && (
          <div className="mb-14">
            <h2 className={`${heading} mb-8`}>{title}</h2>
            {sections.map((section) => (
              <div key={section.heading} className="mb-8 last:mb-0">
                <h3 className="mb-3 text-lg font-medium text-espresso">{section.heading}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-3 text-[15px] leading-relaxed text-stone-dark last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        <h2 className={`${heading} mb-6`}>שאלות נפוצות</h2>
        <FaqList items={faq} />

        <GuideLinks links={links} />
      </div>
    </section>
  );
}

export function GuideLinks({ links }: { links: Array<{ href: string; label: string }> }) {
  if (links.length === 0) return null;
  return (
    <nav aria-label="עוד באתר" className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-[15px] text-stone-dark underline underline-offset-4 decoration-sand-dark transition-colors duration-300 hover:text-espresso"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
