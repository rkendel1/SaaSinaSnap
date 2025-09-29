import { NextRequest, NextResponse } from 'next/server';

import { 
  cancelScheduledDeployment, 
  deployProductToProduction, 
  getDeploymentStatus,
  getProductDeploymentHistory, 
  scheduleProductDeployment,
  validateProductForDeployment} from '@/features/platform-owner-onboarding/services/stripe-environment-service';
import { ApiResponse, getRequestData, withAuth } from '@/libs/api-utils/api-wrapper';

/**
 * POST /api/v1/products/deploy
 * Deploy product(s) from test to production or schedule deployment
 */
export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const data = await getRequestData(request);
    const { 
      productIds, 
      productId, 
      scheduleFor, 
      timezone, 
      notificationSettings,
      action = 'deploy' 
    } = data;
    
    // Handle scheduling
    if (action === 'schedule') {
      if (!productId || !scheduleFor) {
        return ApiResponse.error('productId and scheduleFor are required for scheduling', 400);
      }

      const deployment = await scheduleProductDeployment(
        productId,
        scheduleFor,
        timezone || 'UTC',
        context.user.id,
        notificationSettings
      );

      return ApiResponse.success({ deployment });
    }

    // Handle validation
    if (action === 'validate') {
      if (!productId) {
        return ApiResponse.error('productId is required for validation', 400);
      }

      const validationResults = await validateProductForDeployment(
        productId
      );

      return ApiResponse.success({ validationResults });
    }

    // Handle status check
    if (action === 'status') {
      const { deploymentId } = data;
      if (!deploymentId) {
        return ApiResponse.error('deploymentId is required for status check', 400);
      }

      const status = await getDeploymentStatus(deploymentId);
      return ApiResponse.success({ deployment: status });
    }

    // Handle cancellation
    if (action === 'cancel') {
      const { deploymentId } = data;
      if (!deploymentId) {
        return ApiResponse.error('deploymentId is required for cancellation', 400);
      }

      await cancelScheduledDeployment(deploymentId, context.user.id);
      return ApiResponse.success({ message: 'Deployment cancelled successfully' });
    }

    // Handle immediate deployment (default behavior)
    const idsToDeployArray = productIds || (productId ? [productId] : []);
    
    if (!idsToDeployArray.length) {
      return ApiResponse.error('At least one productId is required', 400);
    }
    
    const deployments = [];
    const errors = [];
    
    // Deploy products sequentially to avoid overwhelming Stripe API
    for (const id of idsToDeployArray) {
      try {
        const deployment = await deployProductToProduction(
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
    console.error('Error in products deploy API:', error);
    return ApiResponse.error('Failed to process deployment request');
  }
});

/**
 * GET /api/v1/products/deploy?productId=...
 * Get deployment history for a product
 */
export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return ApiResponse.error('productId query parameter is required', 400);
    }
    
    const history = await getProductDeploymentHistory(
      productId
    );
    
    return ApiResponse.success({ deployments: history });
  } catch (error) {
    console.error('Error fetching deployment history:', error);
    return ApiResponse.error('Failed to fetch deployment history');
  }
});
