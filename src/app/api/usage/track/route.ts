import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { UsageTrackingService } from '@/features/usage-tracking/services/usage-tracking-service-simple';

const trackUsageSchema = z.object({
  event_name: z.string().min(1, 'Event name is required'),
  user_id: z.string().min(1, 'User ID is required'),
  value: z.number().optional().default(1),
  properties: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (creator)
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get creator profile
    const creatorProfile = await getCreatorProfile(user.id);
    if (!creatorProfile) {
      return NextResponse.json(
        { success: false, error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = trackUsageSchema.parse(body);

    // Track the usage event
    const eventId = await UsageTrackingService.trackUsage(user.id, validatedData);

    return NextResponse.json({
      success: true,
      event_id: eventId,
      message: 'Usage event tracked successfully'
    });

  } catch (error) {
    console.error('Usage tracking error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to track usage'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Usage Tracking API',
    endpoints: {
      'POST /api/usage/track': 'Track a usage event',
      'POST /api/usage/meters': 'Create a usage meter',
      'GET /api/usage/meters': 'List usage meters',
      'GET /api/usage/summary/:meterId/:userId': 'Get usage summary'
    },
    example: {
      event_name: 'api_calls',
      user_id: 'user_123',
      value: 5,
      properties: {
        endpoint: '/api/data',
        method: 'GET'
      }
    }
  });
}