import { NextRequest, NextResponse } from 'next/server';

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
  context: { params: Promise<{ creatorId: string; productId: string }> }
) {
  const resolvedParams = await context.params;
  const { creatorId, productId } = resolvedParams;

  if (!creatorId || !productId) {
    return NextResponse.json(
      { error: 'Missing creatorId or productId in the URL path.' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Mock creator data
    const creator = {
      id: creatorId,
      business_name: 'Demo SaaS Platform',
      business_description: 'Experience our amazing platform',
      brand_color: '#3b82f6',
      custom_domain: null,
      business_logo_url: null,
    };

    // Mock product data
    const product = {
      id: productId,
      name: 'Premium Plan',
      description: 'Get access to all premium features, advanced analytics, and priority support.',
      price: 29.99,
      currency: 'usd',
      product_type: 'subscription',
      stripe_product_id: productId,
      stripe_price_id: `price_${productId}`,
      active: true,
      image_url: null,
      creator_id: creatorId
    };

    return NextResponse.json({ product, creator }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error in embed product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}