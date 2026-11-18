import CategoryLandingPage, { categoryMetadata } from '@/components/seo/CategoryLandingPage';

// Must be a numeric literal for Next.js segment config static analysis
export const revalidate = 60;

export const metadata = categoryMetadata('belts');

export default function BeltsPage() {
  return <CategoryLandingPage category="belts" />;
}
