import { notFound } from 'next/navigation';
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
      console.error('Error fetching related products:', error);
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
    console.error('Error fetching product:', error);
    notFound();
  }
}
