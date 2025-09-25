import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { UsageTrackingService } from '@/features/usage-tracking/services/usage-tracking-service-simple';

const createMeterSchema = z.object({
  event_name: z.string().min(1, 'Event name is required'),
  display_name: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  aggregation_type: z.enum(['count', 'sum', 'unique', 'duration', 'max']),
  unit_name: z.string().optional().default('units'),
  billing_model: z.enum(['metered', 'licensed', 'hybrid']).optional().default('metered'),
  plan_limits: z.array(z.object({
    plan_name: z.string(),
    limit_value: z.number().positive().optional(),
    overage_price: z.number().min(0).optional(),
    soft_limit_threshold: z.number().min(0).max(1).optional().default(0.8),
    hard_cap: z.boolean().optional().default(false)
  })).optional()
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
    const validatedData = createMeterSchema.parse(body);

    // Create the meter
    const meter = await UsageTrackingService.createMeter(user.id, validatedData);

    return NextResponse.json({
      success: true,
      meter,
      message: 'Usage meter created successfully'
    });

  } catch (error) {
    console.error('Create meter error:', error);

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
        error: error instanceof Error ? error.message : 'Failed to create meter'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get all meters for the creator
    const meters = await UsageTrackingService.getMeters(user.id);

    return NextResponse.json({
      success: true,
      meters,
      count: meters.length
    });

  } catch (error) {
    console.error('Get meters error:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch meters'
      },
      { status: 500 }
    );
  }
}