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
  context: { params: Promise<{ creatorId: string; embedId: string }> }
) {
  const resolvedParams = await context.params;
  const { creatorId, embedId } = resolvedParams;

  if (!creatorId || !embedId) {
    return NextResponse.json(
      { error: 'Missing creatorId or embedId in the URL path.' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Mock creator data for testing
    const creator = {
      id: creatorId,
      business_name: 'Demo SaaSinaSnap',
      business_description: 'Experience our amazing platform with a free trial',
      brand_color: '#3b82f6',
      custom_domain: null,
    };

    // Mock trial embed data - simulate different states based on embedId
    let embedData;
    
    if (embedId === 'trial1') {
      // Active trial
      embedData = {
        isExpired: false,
        daysRemaining: 7,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        trialFeatures: [
          'Full access to all features',
          '24/7 customer support',
          'Advanced analytics dashboard',
          'No credit card required',
          'Cancel anytime'
        ],
        expiredConfig: {
          title: 'Trial Expired - Subscribe Now!',
          description: 'Your free trial has ended. Subscribe now to continue accessing all features.',
          buttonText: 'Subscribe Now',
          subscriptionUrl: `/c/${creatorId}/pricing`
        }
      };
    } else if (embedId === 'trial2') {
      // Expired trial
      embedData = {
        isExpired: true,
        daysRemaining: 0,
        trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        trialFeatures: [
          'Full access to all features',
          '24/7 customer support',
          'Advanced analytics dashboard'
        ],
        expiredConfig: {
          title: 'Free Trial Has Ended',
          description: 'Thanks for trying our platform! Subscribe now to unlock all features and continue your journey.',
          buttonText: 'Get Full Access',
          subscriptionUrl: `/c/${creatorId}/pricing`
        }
      };
    } else {
      // Default active trial
      embedData = {
        isExpired: false,
        daysRemaining: 14,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        trialFeatures: [
          'Full access to all features',
          '24/7 customer support',
          'No credit card required',
          'Cancel anytime'
        ],
        expiredConfig: {
          title: 'Trial Expired - Subscribe Now!',
          description: 'Your free trial has ended. Subscribe now to continue accessing all features.',
          buttonText: 'Subscribe Now',
          subscriptionUrl: `/c/${creatorId}/pricing`
        }
      };
    }

    return NextResponse.json(
      { 
        creator, 
        embedData,
        product: {
          id: embedId,
          name: 'Premium Service',
          description: 'Get access to all our premium features and tools.',
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