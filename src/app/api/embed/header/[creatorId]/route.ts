import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getCreatorEmbedAssets } from '@/features/creator/controllers/embed-assets';
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
    const [creator, headerAssets] = await Promise.all([
      getCreatorProfile(creatorId),
      getCreatorEmbedAssets(creatorId, { assetType: 'header', activeOnly: true, limit: 1 }),
    ]);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const headerAsset = headerAssets[0]; // Get the first active header asset

    return NextResponse.json(
      {
        creator: {
          id: creator.id,
          business_name: creator.business_name,
          business_logo_url: creator.business_logo_url,
          brand_color: creator.brand_color,
          brand_gradient: creator.brand_gradient,
          brand_pattern: creator.brand_pattern,
          custom_domain: creator.custom_domain, // Use custom_domain from database
        },
        embedData: headerAsset ? headerAsset.embed_config : null, // Return the embed_config
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in embed header API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}