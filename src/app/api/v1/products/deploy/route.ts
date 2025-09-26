import { NextRequest, NextResponse } from 'next/server';

import { 
  deployProductToProduction, 
  getProductDeploymentHistory, 
  scheduleProductDeployment,
  validateProductForDeployment,
  getDeploymentStatus,
  cancelScheduledDeployment 
} from '@/features/platform-owner-onboarding/services/stripe-environment-service';
import { ApiResponse, getRequestData, withTenantAuth } from '@/libs/api-utils/tenant-api-wrapper';

/**
 * POST /api/v1/products/deploy
 * Deploy product(s) from test to production or schedule deployment
 */
export const POST = withTenantAuth(async (request: NextRequest, context) => {
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
        return ApiResponse.badRequest('productId and scheduleFor are required for scheduling');
      }

      const deployment = await scheduleProductDeployment(
        context.tenantId,
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
        return ApiResponse.badRequest('productId is required for validation');
      }

      const validationResults = await validateProductForDeployment(
        context.tenantId,
        productId
      );

      return ApiResponse.success({ validationResults });
    }

    // Handle status check
    if (action === 'status') {
      const { deploymentId } = data;
      if (!deploymentId) {
        return ApiResponse.badRequest('deploymentId is required for status check');
      }

      const status = await getDeploymentStatus(context.tenantId, deploymentId);
      return ApiResponse.success({ deployment: status });
    }

    // Handle cancellation
    if (action === 'cancel') {
      const { deploymentId } = data;
      if (!deploymentId) {
        return ApiResponse.badRequest('deploymentId is required for cancellation');
      }

      await cancelScheduledDeployment(context.tenantId, deploymentId, context.user.id);
      return ApiResponse.success({ message: 'Deployment cancelled successfully' });
    }

    // Handle immediate deployment (default behavior)
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
    console.error('Error in products deploy API:', error);
    return ApiResponse.error('Failed to process deployment request');
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
