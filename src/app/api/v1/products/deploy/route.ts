import { NextRequest, NextResponse } from 'next/server';

import { withTenantAuth, ApiResponse, getRequestData } from '@/libs/api-utils/tenant-api-wrapper';
import { deployProductToProduction, getProductDeploymentHistory } from '@/features/platform-owner-onboarding/services/stripe-environment-service';

/**
 * POST /api/v1/products/deploy
 * Deploy product(s) from test to production
 */
export const POST = withTenantAuth(async (request: NextRequest, context) => {
  try {
    const data = await getRequestData(request);
    const { productIds, productId } = data;
    
    // Support both single product and bulk deployment
    const idsToDeployArray = productIds || (productId ? [productId] : []);
    
    if (!idsToDeployArray.length) {
      return ApiResponse.badRequest('At least one productId is required');
    }
    
    const deployments = [];
    const errors = [];
    
    // Deploy products sequentially to avoid overwhelming Stripe API
    for (const id of idsToDeployArray) {
      try {
        const deployment = await deployProductToProduction(
          context.tenantId,
          id,
          context.user.id
        );
        deployments.push(deployment);
      } catch (error) {
        console.error(`Failed to deploy product ${id}:`, error);
        errors.push({
          productId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return ApiResponse.success({
      deployments,
      errors,
      summary: {
        total: idsToDeployArray.length,
        successful: deployments.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error('Error deploying products:', error);
    return ApiResponse.error('Failed to deploy products');
  }
});

/**
 * GET /api/v1/products/deploy?productId=...
 * Get deployment history for a product
 */
export const GET = withTenantAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return ApiResponse.badRequest('productId query parameter is required');
    }
    
    const history = await getProductDeploymentHistory(
      context.tenantId,
      productId
    );
    
    return ApiResponse.success({ deployments: history });
  } catch (error) {
    console.error('Error fetching deployment history:', error);
    return ApiResponse.error('Failed to fetch deployment history');
  }
});
