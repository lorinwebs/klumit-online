import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { shopifyClient, PRODUCT_QUERY, PRODUCTS_QUERY } from '@/lib/shopify';
import ProductClient from './ProductClient';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
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
  const { handle } = await params;
  
  try {
    const productData = await shopifyClient.request<{ product: Product }>(
      PRODUCT_QUERY,
      { handle }
    );
    
    if (!productData.product) {
      return {
        title: 'מוצר לא נמצא',
      };
    }
    
    const product = productData.product;
    const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(0);
    const image = product.images.edges[0]?.node.url;
    
    return {
      title: product.title,
      description: product.description?.slice(0, 160) || `${product.title} - תיק יוקרתי מאיטליה. מחיר: ₪${price}. משלוח חינם מעל 500₪.`,
      alternates: {
        canonical: `https://www.klumit-online.co.il/products/${handle}`,
      },
      openGraph: {
        title: `${product.title} | קלומית`,
        description: product.description?.slice(0, 160) || `${product.title} - תיק יוקרתי מאיטליה`,
        type: 'website',
        url: `https://www.klumit-online.co.il/products/${handle}`,
        images: image ? [{ url: image, alt: product.title }] : [],
      },
    };
  } catch {
    return {
      title: 'מוצר',
    };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;

  try {
    // Fetch product data on server
    const productData = await shopifyClient.request<{ product: Product }>(
      PRODUCT_QUERY,
      { handle }
    );

    if (!productData.product) {
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
      // Filter out current product
      relatedProducts = allProducts.filter((p) => p.id !== productData.product.id);
    } catch (error) {
      // Continue without related products
    }

    return (
      <div className="min-h-screen flex flex-col bg-[#fdfcfb] overflow-x-hidden">
        <Header />
        <ProductClient product={productData.product} relatedProducts={relatedProducts} />
        <Footer />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
