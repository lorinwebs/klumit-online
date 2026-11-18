import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomeHero from '@/components/home/HomeHero';
import HomeProductSection from '@/components/home/HomeProductSection';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import {
  fetchCatalogProducts,
  fetchCollectionProducts,
  type CatalogProduct,
} from '@/lib/products-server';
import { SHOPIFY_COLLECTION_HOME_HANDLE } from '@/lib/shopify';
import { matchesCatalogCategory, type ProductCategory } from '@/lib/product-search';
import { measureProductBounds } from '@/lib/image-bounds';
import type { BrandTileImage } from '@/components/home/HomeBrandSplit';
import type { CategoryTileImage } from '@/components/home/HomeCategoryGrid';

const HomeEditorialSplit = dynamic(() => import('@/components/home/HomeEditorialSplit'));
const HomeBrandSplit = dynamic(() => import('@/components/home/HomeBrandSplit'));
const HomeCategoryGrid = dynamic(() => import('@/components/home/HomeCategoryGrid'));

export const metadata: Metadata = {
  title: {
    absolute: 'תיקים יוקרתיים מאיטליה | קלומית - Klumit',
  },
  description:
    'קלומית - יבואן בלעדי בישראל לתיקי RENATO ANGI ו-CARLINO GROUP. קולקציית Renato Angi מעור אמיתי; מותגים נוספים לפי המצוין בכל מוצר. משלוח חינם מעל 500₪.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il',
  },
};

/** First photo of the first product from a brand, for the brand tiles */
function brandImage(products: CatalogProduct[], vendorPart: string): BrandTileImage | undefined {
  const product = products.find(
    (p) => p.vendor?.toLowerCase().includes(vendorPart) && p.images.edges[0]
  );
  const image = product?.images.edges[0]?.node;
  return image && product ? { url: image.url, alt: image.altText || product.title } : undefined;
}

/**
 * First photo of the first product in each category, for the category tiles.
 * Skips photos already shown in the brand tiles just above them, and measures where
 * the product sits in each photo so the three tiles line up.
 */
async function categoryImages(
  products: CatalogProduct[],
  alreadyShown: Array<BrandTileImage | undefined>
): Promise<Partial<Record<ProductCategory, CategoryTileImage>>> {
  const used = new Set(alreadyShown.map((image) => image?.url));
  const picked: Array<[ProductCategory, { url: string; alt: string }]> = [];
  for (const category of ['bags', 'belts', 'wallets'] as const) {
    for (const product of products) {
      const image = product.images.edges[0]?.node;
      if (!image || used.has(image.url) || !matchesCatalogCategory(product, category)) continue;
      used.add(image.url);
      picked.push([category, { url: image.url, alt: image.altText || product.title }]);
      break;
    }
  }
  const tiles = await Promise.all(
    picked.map(
      async ([category, image]) =>
        [category, { ...image, bounds: await measureProductBounds(image.url) }] as const
    )
  );
  return Object.fromEntries(tiles);
}

export default async function Home() {
  // The homepage collection may lack a category (e.g. belts), so the tiles can fall back to the full catalog
  const [initialProducts, catalogProducts] = await Promise.all([
    fetchCollectionProducts(SHOPIFY_COLLECTION_HOME_HANDLE),
    fetchCatalogProducts('all'),
  ]);
  const leatherImage = brandImage(initialProducts, 'renato');
  const otherImage = brandImage(initialProducts, 'valentino');
  const categoryTiles = await categoryImages(
    [...initialProducts, ...catalogProducts],
    [leatherImage, otherImage]
  );

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main id="main-content" className="flex-grow" role="main">
        <HomeHero />
        <HomeProductSection initialProducts={initialProducts} />
        <HomeEditorialSplit />
        <HomeBrandSplit leatherImage={leatherImage} otherImage={otherImage} />
        <HomeCategoryGrid images={categoryTiles} />
      </main>
      <Footer />
    </div>
  );
}
