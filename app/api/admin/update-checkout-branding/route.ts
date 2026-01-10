import { NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

const storeDomain = domain.includes('.myshopify.com') 
  ? domain 
  : `${domain}.myshopify.com`;

// Site colors to match checkout
const BRAND_COLORS = {
  background: '#fdfcfb',    // cream background
  text: '#1a1a1a',          // dark text
  accent: '#D4AF37',        // gold accent
  buttonBackground: '#1a1a1a',
  buttonText: '#ffffff',
};

export async function POST(request: Request) {
  if (!adminApiToken) {
    return NextResponse.json(
      { error: 'SHOPIFY_ADMIN_API_TOKEN not configured' },
      { status: 500 }
    );
  }

  const client = new GraphQLClient(
    `https://${storeDomain}/admin/api/2024-01/graphql.json`,
    {
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json',
      },
    }
  );

  try {
    // Step 1: Get checkout profile ID
    const profileQuery = `
      query {
        checkoutProfiles(first: 1, query: "is_published:true") {
          edges {
            node {
              id
              name
              isPublished
            }
          }
        }
      }
    `;

    const profileResult = await client.request<{
      checkoutProfiles: {
        edges: Array<{ node: { id: string; name: string; isPublished: boolean } }>;
      };
    }>(profileQuery);

    const checkoutProfile = profileResult.checkoutProfiles.edges[0]?.node;
    
    if (!checkoutProfile) {
      return NextResponse.json(
        { error: 'No checkout profile found' },
        { status: 404 }
      );
    }

    // Step 2: Update checkout branding
    const brandingMutation = `
      mutation checkoutBrandingUpsert($checkoutProfileId: ID!, $checkoutBrandingInput: CheckoutBrandingInput!) {
        checkoutBrandingUpsert(checkoutProfileId: $checkoutProfileId, checkoutBrandingInput: $checkoutBrandingInput) {
          checkoutBranding {
            designSystem {
              colors {
                global {
                  brand
                  accent
                }
                schemes {
                  scheme1 {
                    base {
                      background
                      text
                    }
                    primaryButton {
                      background
                      hover {
                        background
                      }
                    }
                  }
                }
              }
              typography {
                primary {
                  name
                  base {
                    weight
                  }
                }
                secondary {
                  name
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const brandingResult = await client.request<{
      checkoutBrandingUpsert: {
        checkoutBranding: any;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(brandingMutation, {
      checkoutProfileId: checkoutProfile.id,
      checkoutBrandingInput: {
        designSystem: {
          colors: {
            global: {
              brand: BRAND_COLORS.buttonBackground,
              accent: BRAND_COLORS.accent,
            },
            schemes: {
              scheme1: {
                base: {
                  background: BRAND_COLORS.background,
                  text: BRAND_COLORS.text,
                },
                primaryButton: {
                  background: BRAND_COLORS.buttonBackground,
                  hover: {
                    background: '#333333',
                  },
                },
                control: {
                  background: '#ffffff',
                  border: '#e5e7eb',
                },
              },
            },
          },
          typography: {
            primary: {
              // Assistant is a Google Font - Shopify supports it
              name: 'Assistant',
              base: {
                weight: 400,
              },
            },
            secondary: {
              name: 'Assistant',
            },
          },
          cornerRadius: {
            base: 4,
          },
        },
        customizations: {
          global: {
            cornerRadius: 'BASE',
          },
          header: {
            alignment: 'CENTER',
            position: 'START',
          },
          main: {
            colorScheme: 'SCHEME1',
          },
          orderSummary: {
            colorScheme: 'SCHEME1',
          },
        },
      },
    });

    if (brandingResult.checkoutBrandingUpsert.userErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Branding update failed',
          details: brandingResult.checkoutBrandingUpsert.userErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Checkout branding updated successfully',
      checkoutProfileId: checkoutProfile.id,
      branding: brandingResult.checkoutBrandingUpsert.checkoutBranding,
    });

  } catch (error: any) {
    console.error('Checkout branding error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update checkout branding',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Check current branding
export async function GET() {
  if (!adminApiToken) {
    return NextResponse.json(
      { error: 'SHOPIFY_ADMIN_API_TOKEN not configured' },
      { status: 500 }
    );
  }

  const client = new GraphQLClient(
    `https://${storeDomain}/admin/api/2024-01/graphql.json`,
    {
      headers: {
        'X-Shopify-Access-Token': adminApiToken,
        'Content-Type': 'application/json',
      },
    }
  );

  try {
    const query = `
      query {
        checkoutProfiles(first: 1, query: "is_published:true") {
          edges {
            node {
              id
              name
              isPublished
            }
          }
        }
      }
    `;

    const result = await client.request<{
      checkoutProfiles: {
        edges: Array<{ node: { id: string; name: string; isPublished: boolean } }>;
      };
    }>(query);

    const profile = result.checkoutProfiles.edges[0]?.node;

    if (!profile) {
      return NextResponse.json({ 
        error: 'No checkout profile found',
        hint: 'Make sure your store is on Shopify Plus or is a Development store',
      });
    }

    // Get current branding
    const brandingQuery = `
      query checkoutBranding($checkoutProfileId: ID!) {
        checkoutBranding(checkoutProfileId: $checkoutProfileId) {
          designSystem {
            colors {
              global {
                brand
                accent
              }
            }
            typography {
              primary {
                name
              }
            }
          }
        }
      }
    `;

    const brandingResult = await client.request<{
      checkoutBranding: any;
    }>(brandingQuery, { checkoutProfileId: profile.id });

    return NextResponse.json({
      checkoutProfile: profile,
      currentBranding: brandingResult.checkoutBranding,
      targetColors: BRAND_COLORS,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
