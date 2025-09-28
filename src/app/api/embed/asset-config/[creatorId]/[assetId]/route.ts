import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getEmbedAssetById } from '@/features/creator/controllers/embed-assets';
import { getCreatorProduct } from '@/features/creator-onboarding/controllers/creator-products';
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
  context: { params: { creatorId: string; assetId: string } }
) {
  const { creatorId, assetId } = context.params;

  if (!creatorId || !assetId) {
    return NextResponse.json(
      { error: 'Missing creatorId or assetId in the URL path.' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const [creator, embedAsset] = await Promise.all([
      getCreatorProfile(creatorId),
      getEmbedAssetById(assetId),
    ]);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!embedAsset || embedAsset.creator_id !== creatorId) {
      return NextResponse.json(
        { error: 'Embed asset not found or does not belong to this creator' },
        { status: 404, headers: corsHeaders }
      );
    }

    let product = null;
    if (embedAsset.embed_config.productId) {
      product = await getCreatorProduct(embedAsset.embed_config.productId);
    }

    return NextResponse.json(
      {
        creator: {
          id: (creator as any).id,
          business_name: creator.business_name,
          business_description: creator.business_description,
          business_logo_url: creator.business_logo_url,
          brand_color: creator.brand_color,
          brand_gradient: creator.brand_gradient,
          brand_pattern: creator.brand_pattern,
          page_slug: creator.page_slug,
          extracted_branding_data: creator.extracted_branding_data,
        },
        product: product,
        embedConfig: embedAsset.embed_config,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in embed asset config API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}