/**
 * Multi-tenant Usage Tracking API
 * POST /api/v1/usage/track
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

import { TenantUsageTrackingService } from '@/features/usage-tracking/services/tenant-usage-tracking-service';
import { ApiResponse, getRequestData, withTenantContext } from '@/libs/api-utils/tenant-api-wrapper';

const trackUsageSchema = z.object({
  meter_id: z.string().min(1, 'Meter ID is required'), // Added meter_id
  event_name: z.string().min(1, 'Event name is required'),
  user_id: z.string().min(1, 'User ID is required'),
  event_value: z.number().optional().default(1),
  properties: z.record(z.any()).optional().nullable(), // Allow null
  timestamp: z.string().optional()
});

export const POST = withTenantContext(async (request: NextRequest, context) => {
  try {
    const data = await getRequestData(request);
    
    // Validate data with Zod schema
    const validatedData = trackUsageSchema.parse(data);

    // Check usage enforcement first
    const enforcement = await TenantUsageTrackingService.checkUsageEnforcement(
      validatedData.user_id,
      validatedData.meter_id,
      validatedData.event_value || 1
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
      meter_id: validatedData.meter_id,
      user_id: validatedData.user_id,
      event_name: validatedData.event_name, // Pass event_name
      event_value: validatedData.event_value || 1,
      properties: validatedData.properties || null, // Ensure null if undefined
      timestamp: validatedData.timestamp
    });

    return ApiResponse.success({
      event,
      enforcement: {
        allowed: true,
        current_usage: enforcement.current_usage + (validatedData.event_value || 1),
        limit: enforcement.limit,
        remaining: enforcement.remaining ? enforcement.remaining - (validatedData.event_value || 1) : null
      }
    });

  } catch (error) {
    console.error('Usage tracking error:', error);
    if (error instanceof z.ZodError) {
      return ApiResponse.validation(error.flatten().fieldErrors as Record<string, string | string[] | undefined>);
    }
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