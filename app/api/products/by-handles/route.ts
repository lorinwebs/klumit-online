import { NextRequest, NextResponse } from 'next/server';
import { shopifyClient, PRODUCT_QUERY } from '@/lib/shopify';
import { isDevOnlyProductHidden } from '@/lib/dev-only-products';

export async function POST(request: NextRequest) {
  try {
    const { handles } = await request.json();

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json({ error: 'Handles array required' }, { status: 400 });
    }

    // Filter out empty handles
    const validHandles = handles.filter((h: string) => h && h.trim() !== '');

    if (validHandles.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch all products in parallel
    const productPromises = validHandles.map(async (handle: string) => {
      try {
        const productData = await shopifyClient.request<{
          product: {
            id: string;
            title: string;
            handle: string;
            tags?: string[];
            images: {
              edges: Array<{
                node: {
                  url: string;
                  altText: string | null;
                };
              }>;
            };
          } | null;
        }>(PRODUCT_QUERY, { handle });

        if (productData.product && !isDevOnlyProductHidden(productData.product)) {
          return {
            handle: productData.product.handle,
            title: productData.product.title,
            image: productData.product.images.edges[0]?.node.url || null,
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching product ${handle}:`, error);
        return null;
      }
    });

    const products = await Promise.all(productPromises);
    const productsMap = products
      .filter((p) => p !== null)
      .reduce((acc, product) => {
        if (product) {
          acc[product.handle] = product;
        }
        return acc;
      }, {} as Record<string, { handle: string; title: string; image: string | null }>);

    return NextResponse.json({ products: productsMap });
  } catch (error: any) {
    console.error('Error in /api/products/by-handles:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
