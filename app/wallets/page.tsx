import CategoryLandingPage, { categoryMetadata } from '@/components/seo/CategoryLandingPage';

// Must be a numeric literal for Next.js segment config static analysis
export const revalidate = 60;

export const metadata = categoryMetadata('wallets');

export default function WalletsPage() {
  return <CategoryLandingPage category="wallets" />;
}
