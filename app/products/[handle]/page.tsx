import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { shopifyClient, PRODUCT_QUERY, PRODUCTS_QUERY } from '@/lib/shopify';
import ProductClient from './ProductClient';
import JsonLd from '@/components/seo/JsonLd';
import { CATEGORY_PAGES } from '@/lib/category-pages';
import { SITE_URL, generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import { isProductSoldOut } from '@/lib/product-availability';
import { isDevOnlyProductHidden } from '@/lib/dev-only-products';
import { matchesCatalogCategory } from '@/lib/product-search';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        sku?: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        quantityAvailable: number;
        selectedOptions?: Array<{
          name: string;
          value: string;
        }>;
        image?: {
          url: string;
          altText: string | null;
        } | null;
      };
    }>;
  };
}

interface PageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);
  
  try {
    const productData = await shopifyClient.request<{ product: Product }>(
      PRODUCT_QUERY,
      { handle }
    );
    
    if (!productData.product || isDevOnlyProductHidden(productData.product)) {
      return {
        title: 'מוצר לא נמצא',
      };
    }
    
    const product = productData.product;
    const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(0);
    const image = product.images.edges[0]?.node.url;
    
    const description =
      product.description?.slice(0, 160) ||
      `${product.title} - תיק יוקרתי מאיטליה. מחיר: ₪${price}. משלוח חינם מעל 500₪.`;

    return {
      title: product.title,
      description,
      alternates: {
        canonical: `https://www.klumit-online.co.il/products/${handle}`,
      },
      openGraph: {
        title: `${product.title} | קלומית`,
        description,
        type: 'website',
        locale: 'he_IL',
        siteName: 'Klumit - קלומית',
        url: `https://www.klumit-online.co.il/products/${handle}`,
        images: image ? [{ url: image, width: 1200, height: 1200, alt: product.title }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.title} | קלומית`,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {
      title: 'מוצר',
    };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);

  try {
    // Fetch product data on server
    const productData = await shopifyClient.request<{ product: Product }>(
      PRODUCT_QUERY,
      { handle }
    );

    if (!productData.product || isDevOnlyProductHidden(productData.product)) {
      notFound();
    }

    // Fetch related products (all other products)
    let relatedProducts: Product[] = [];
    try {
      const productsData = await shopifyClient.request<{
        products: { edges: Array<{ node: Product }> };
      }>(PRODUCTS_QUERY, {
        first: 50,
      });
      const allProducts = productsData.products.edges.map((edge) => edge.node);
      // Exclude current product and anything sold out
      relatedProducts = allProducts.filter(
        (p) => p.id !== productData.product.id && !isProductSoldOut(p)
      );
    } catch (error) {
      // Continue without related products
    }

    const product = productData.product;
    const firstVariant = product.variants.edges[0]?.node;
    const productJsonLd = generateProductJsonLd({
      title: product.title,
      description: product.description,
      handle: product.handle,
      images: product.images.edges.map((e) => ({ url: e.node.url, altText: e.node.altText || undefined })),
      brand: product.vendor || undefined,
      sku: firstVariant?.sku || undefined,
      price: product.priceRange.minVariantPrice.amount,
      currency: product.priceRange.minVariantPrice.currencyCode,
      available: product.variants.edges.some((edge) => edge.node.availableForSale),
      productType: product.productType || '',
      tags: product.tags || [],
    });

    const categoryPage = Object.values(CATEGORY_PAGES).find((page) =>
      matchesCatalogCategory(product, page.category)
    );
    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
      { name: 'בית', url: SITE_URL },
      categoryPage
        ? { name: categoryPage.name, url: `${SITE_URL}${categoryPage.path}` }
        : { name: 'מוצרים', url: `${SITE_URL}/products` },
      { name: product.title, url: `${SITE_URL}/products/${handle}` },
    ]);

    return (
      <div className="min-h-screen flex flex-col bg-cream overflow-x-clip">
        <JsonLd data={productJsonLd} />
        <JsonLd data={breadcrumbJsonLd} />
        <Header />
        <ProductClient product={product} relatedProducts={relatedProducts} />
        <Footer />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
