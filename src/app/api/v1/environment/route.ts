import { NextRequest, NextResponse } from 'next/server';

import { getActiveEnvironment, getEnvironmentConfig, switchEnvironment } from '@/features/platform-owner-onboarding/services/stripe-environment-service';
import { ApiResponse, getRequestData, withAuth } from '@/libs/api-utils/api-wrapper';

/**
 * GET /api/v1/environment
 * Get current environment configuration
 */
export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const currentEnvironment = await getActiveEnvironment();
    
    const testConfig = await getEnvironmentConfig('test');
    const prodConfig = await getEnvironmentConfig('production');
    
    return ApiResponse.success({
      currentEnvironment,
      environments: {
        test: {
          enabled: !!testConfig?.is_active,
          accountId: testConfig?.stripe_account_id,
          syncStatus: testConfig?.sync_status,
        },
        production: {
          enabled: !!prodConfig?.is_active,
          accountId: prodConfig?.stripe_account_id,
          syncStatus: prodConfig?.sync_status,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching environment config:', error);
    return ApiResponse.error('Failed to fetch environment configuration');
  }
});

/**
 * POST /api/v1/environment
 * Switch active environment
 */
export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const data = await getRequestData(request);
    const { environment } = data;
    
    if (!environment || !['test', 'production'].includes(environment)) {
      return ApiResponse.error('Invalid environment. Must be "test" or "production"', 400);
    }
    
    await switchEnvironment(
      environment,
      context.user.id
    );
    
    return ApiResponse.success({ 
      message: `Switched to ${environment} environment`,
      environment 
    });
  } catch (error) {
    console.error('Error switching environment:', error);
    return ApiResponse.error('Failed to switch environment');
  }
});