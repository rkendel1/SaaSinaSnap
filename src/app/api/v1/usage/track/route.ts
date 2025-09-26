/**
 * Multi-tenant Usage Tracking API
 * POST /api/v1/usage/track
 */

import { NextRequest } from 'next/server';
import { withTenantContext, getRequestData, ApiResponse } from '@/libs/api-utils/tenant-api-wrapper';
import { TenantUsageTrackingService } from '@/features/usage-tracking/services/tenant-usage-tracking-service';

export const POST = withTenantContext(async (request: NextRequest, context) => {
  try {
    const data = await getRequestData(request);
    
    // Validate required fields
    if (!data.meter_id || !data.user_id) {
      return ApiResponse.validation({
        meter_id: data.meter_id ? '' : 'Meter ID is required',
        user_id: data.user_id ? '' : 'User ID is required'
      });
    }

    // Check usage enforcement first
    const enforcement = await TenantUsageTrackingService.checkUsageEnforcement(
      data.user_id,
      data.meter_id,
      data.event_value || 1
    );

    if (!enforcement.allowed) {
      return ApiResponse.error(
        'Usage limit exceeded',
        429,
        {
          enforcement: {
            current_usage: enforcement.current_usage,
            limit: enforcement.limit,
            remaining: enforcement.remaining,
            reason: enforcement.reason
          }
        }
      );
    }

    // Track the usage
    const event = await TenantUsageTrackingService.trackUsage({
      meter_id: data.meter_id,
      user_id: data.user_id,
      event_value: data.event_value || 1,
      properties: data.properties || {}
    });

    return ApiResponse.success({
      event,
      enforcement: {
        allowed: true,
        current_usage: enforcement.current_usage + (data.event_value || 1),
        limit: enforcement.limit,
        remaining: enforcement.remaining ? enforcement.remaining - (data.event_value || 1) : null
      }
    });

  } catch (error) {
    console.error('Usage tracking error:', error);
    return ApiResponse.error(
      error instanceof Error ? error.message : 'Failed to track usage',
      500
    );
  }
});

// Handle preflight requests
export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
    },
  });
};