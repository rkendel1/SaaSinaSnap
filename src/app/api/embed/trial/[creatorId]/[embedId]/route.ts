import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getEmbedAssetById } from '@/features/creator/controllers/embed-assets';
import { TrialEmbedService } from '@/features/creator/services/trial-embed-service';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
  request: NextRequest,
  context: { params: { creatorId: string; embedId: string } }
) {
  const { creatorId, embedId } = context.params;

  if (!creatorId || !embedId) {
    return NextResponse.json(
      { error: 'Missing creatorId or embedId in the URL path.' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const [creator, embedAsset] = await Promise.all([
      getCreatorProfile(creatorId),
      getEmbedAssetById(embedId), // Fetch the specific embed asset
    ]);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!embedAsset || embedAsset.creator_id !== creatorId || embedAsset.asset_type !== 'trial_embed') {
      return NextResponse.json(
        { error: 'Trial embed asset not found or does not belong to this creator' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Use the TrialEmbedService to process the embed_config and get trial data
    const trialEmbedData = TrialEmbedService.getTrialEmbedData(embedAsset.embed_config);

    return NextResponse.json(
      { 
        creator: {
          id: creator.id,
          business_name: creator.business_name,
          business_description: creator.business_description,
          brand_color: creator.brand_color,
          brand_gradient: creator.brand_gradient,
          brand_pattern: creator.brand_pattern,
          custom_domain: creator.custom_domain, // Use custom_domain instead of page_slug
        }, 
        embedData: trialEmbedData,
        product: { // Include basic product info if available in embed_config
          id: embedAsset.id,
          name: embedAsset.embed_config.productName || embedAsset.name,
          description: embedAsset.embed_config.description || embedAsset.description,
        }
      }, 
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in trial embed API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}