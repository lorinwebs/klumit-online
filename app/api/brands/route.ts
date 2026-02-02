import { NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

interface Product {
  title: string;
  vendor: string;
  featuredImage?: {
    url: string;
  };
}

interface VendorBrand {
  name: string;
  displayName: string;
  image: string;
  hoverImage: string;
  productCount: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'bags';
  
  try {
    // Build the query filter based on category
    let queryFilter = '';
    switch (category) {
      case 'bags':
        queryFilter = '(product_type:תיק OR product_type:bag OR product_type:תיקים OR product_type:bags)';
        break;
      case 'belts':
        queryFilter = '(product_type:חגורה OR product_type:belt OR product_type:חגורות OR product_type:belts)';
        break;
      case 'wallets':
        queryFilter = '(product_type:ארנק OR product_type:wallet OR product_type:ארנקים OR product_type:wallets)';
        break;
      default:
        queryFilter = '';
    }

    const query = `
      query GetProducts($query: String!) {
        products(first: 250, query: $query) {
          edges {
            node {
              title
              vendor
              featuredImage {
                url
              }
            }
          }
        }
      }
    `;

    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}.myshopify.com/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
        },
        body: JSON.stringify({
          query,
          variables: { query: queryFilter },
        }),
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Shopify');
    }

    const data = await response.json();
    const products: Product[] = data.data.products.edges.map((edge: any) => edge.node);

    // Group products by vendor
    const vendorMap = new Map<string, Product[]>();
    
    products.forEach(product => {
      if (!product.vendor) return;
      
      if (!vendorMap.has(product.vendor)) {
        vendorMap.set(product.vendor, []);
      }
      vendorMap.get(product.vendor)!.push(product);
    });

    // Create brand objects with TWO random images from each vendor
    const brands: VendorBrand[] = Array.from(vendorMap.entries())
      .map(([vendor, vendorProducts]) => {
        // Filter products that have images
        const productsWithImages = vendorProducts.filter(p => p.featuredImage?.url);
        
        if (productsWithImages.length === 0) {
          return null;
        }

        // Pick TWO random product images (or same if only one available)
        const firstIndex = Math.floor(Math.random() * productsWithImages.length);
        let secondIndex = firstIndex;
        
        // Try to get a different image for hover
        if (productsWithImages.length > 1) {
          do {
            secondIndex = Math.floor(Math.random() * productsWithImages.length);
          } while (secondIndex === firstIndex && productsWithImages.length > 1);
        }

        return {
          name: vendor,
          displayName: vendor,
          image: productsWithImages[firstIndex]?.featuredImage?.url || '',
          hoverImage: productsWithImages[secondIndex]?.featuredImage?.url || '',
          productCount: vendorProducts.length,
        };
      })
      .filter((brand): brand is VendorBrand => brand !== null && !!brand.image) // Only include brands with images
      .sort((a, b) => b.productCount - a.productCount); // Sort by product count

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
