import { NextRequest, NextResponse } from 'next/server';

import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getCreatorProduct } from '@/features/creator-onboarding/controllers/creator-products';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser

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
  context: { params: { creatorId: string; productId: string } }
) {
  const { creatorId, productId } = context.params;

  if (!creatorId || !productId) {
    return NextResponse.json(
      { error: 'Missing creatorId or productId in the URL path.' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const [creator, product] = await Promise.all([
      getCreatorProfile(creatorId),
      getCreatorProduct(productId), // Assuming getCreatorProduct can fetch by ID
    ]);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!product || product.creator_id !== creatorId) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to this creator' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ product, creator }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error in embed product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}