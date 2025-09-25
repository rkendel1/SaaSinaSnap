import { NextRequest, NextResponse } from 'next/server';

import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: { creatorId: string } }
) {
  const { creatorId } = context.params;

  try {
    const [creator, products] = await Promise.all([
      getCreatorProfile(creatorId),
      getCreatorProducts(creatorId), // Fetch all active products for the creator
    ]);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        creator: {
          id: creator.id,
          business_name: creator.business_name,
          business_logo_url: creator.business_logo_url,
          brand_color: creator.brand_color,
          brand_gradient: creator.brand_gradient,
          brand_pattern: creator.brand_pattern,
          page_slug: creator.page_slug, // Changed from custom_domain to page_slug
        },
        products: products.map(p => ({ // Return simplified product data
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          currency: p.currency,
          product_type: p.product_type,
          stripe_price_id: p.stripe_price_id,
          image_url: p.image_url,
        })),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in embed pricing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}