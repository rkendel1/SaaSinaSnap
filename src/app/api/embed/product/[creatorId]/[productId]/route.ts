import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProduct } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getEnvironmentEmbedConfig } from '@/features/creator-onboarding/services/creator-environment-service';

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
      getCreatorProduct(productId, { includeInactive: true }), // Fetch product regardless of active status
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

    // Determine the appropriate environment to use
    // Priority: production if available, otherwise test
    const environment = product.stripe_production_product_id ? 'production' : 'test';
    
    // Get environment-specific configuration
    const embedConfig = await getEnvironmentEmbedConfig(creatorId, environment);
    
    // Find the specific product in the embed config
    const embedProduct = embedConfig.products.find(p => p.id === productId);
    
    if (!embedProduct) {
      return NextResponse.json(
        { error: 'Product not available in current environment' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Enhanced response with environment information
    const response = {
      product: {
        ...product,
        // Override with environment-specific IDs
        stripe_product_id: embedProduct.stripeProductId,
        stripe_price_id: embedProduct.stripePriceId,
        environment: environment,
        is_deployed: embedProduct.isDeployed,
      },
      creator: {
        ...creator,
        // Add environment context
        current_environment: environment,
      },
      embedConfig: {
        environment,
        isProduction: environment === 'production',
        testModeNotice: environment === 'test' ? 'This product is in test mode. No real payments will be processed.' : null,
        // Provide fallback URLs in case of environment issues
        fallbackEnvironment: product.stripe_test_product_id ? 'test' : null,
      },
    };

    return NextResponse.json(response, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error in embed product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}