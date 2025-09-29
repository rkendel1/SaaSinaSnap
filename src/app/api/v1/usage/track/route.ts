/**
 * Usage Tracking API
 * POST /api/v1/usage/track
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

import { UsageTrackingService } from '@/features/usage-tracking/services/usage-tracking-service';
import { ApiResponse, getRequestData, withAuth } from '@/libs/api-utils/api-wrapper';

const trackUsageSchema = z.object({
  meter_id: z.string().min(1, 'Meter ID is required'),
  event_name: z.string().min(1, 'Event name is required'),
  user_id: z.string().min(1, 'User ID is required'),
  event_value: z.number().optional().default(1),
  properties: z.record(z.any()).optional().nullable(),
  timestamp: z.string().optional()
});

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const data = await getRequestData(request);
    
    // Validate data with Zod schema
    const validatedData = trackUsageSchema.parse(data);

    // Check usage enforcement first
    const enforcement = await UsageTrackingService.checkUsageEnforcement(
      validatedData.user_id,
      validatedData.meter_id,
      validatedData.event_value || 1
    );

    if (!enforcement.allowed) {
      return ApiResponse.error(
        'Usage limit exceeded',
        429
      );
    }

    // Track the usage
    const event = await UsageTrackingService.trackUsage({
      meter_id: validatedData.meter_id,
      user_id: validatedData.user_id,
      event_name: validatedData.event_name,
      event_value: validatedData.event_value || 1,
      properties: validatedData.properties || null,
      timestamp: validatedData.timestamp
    });

    return ApiResponse.success({
      event,
      enforcement: {
        allowed: true,
        current_usage: (enforcement.current_usage || 0) + (validatedData.event_value || 1),
        limit: enforcement.limit,
        remaining: enforcement.remaining ? enforcement.remaining - (validatedData.event_value || 1) : null
      }
    });

  } catch (error) {
    console.error('Usage tracking error:', error);
    if (error instanceof z.ZodError) {
      return ApiResponse.validation(error.flatten().fieldErrors as any);
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};