import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
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
          business_description: creator.business_description,
          business_logo_url: creator.business_logo_url,
          brand_color: creator.brand_color,
          brand_gradient: creator.brand_gradient,
          brand_pattern: creator.brand_pattern,
          page_slug: creator.page_slug, // Changed from custom_domain to page_slug
          extracted_branding_data: creator.extracted_branding_data,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in embed creator API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}