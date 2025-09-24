import { NextRequest, NextResponse } from 'next/server';

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
  context: { params: { creatorId: string; } } // Corrected params type
) {
  const { creatorId } = context.params;

  try {
    // Fetch the CreatorProfile
    const creator = await getCreatorProfile(creatorId);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Return only necessary data for the embed to keep payload small
    return NextResponse.json(
      {
        creator: {
          id: creator.id,
          business_name: creator.business_name,
          business_logo_url: creator.business_logo_url,
          brand_color: creator.brand_color,
          custom_domain: creator.custom_domain,
        },
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