import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';
import { ApiResponse, withCreator } from '@/libs/api-utils/api-wrapper';

const createTierSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().length(3).default('usd'),
  billing_cycle: z.enum(['monthly', 'yearly', 'weekly', 'daily']).default('monthly'),
  feature_entitlements: z.array(z.string()).default([]),
  usage_caps: z.record(z.string(), z.number().min(0)).default({}),
  is_default: z.boolean().default(false),
  trial_period_days: z.number().min(0).default(0)
});

/**
 * GET /api/usage/tiers
 * Get all tiers for a creator
 */
export const GET = withCreator(async (request: NextRequest, context) => {
  try {
    const tiers = await TierManagementService.getCreatorTiers(context.user.id);
    
    return ApiResponse.success({ tiers });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return ApiResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch tiers'
    );
  }
});

/**
 * POST /api/usage/tiers
 * Create a new tier
 */
export const POST = withCreator(async (request: NextRequest, context) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTierSchema.parse(body);

    const tier = await TierManagementService.createTier(context.user.id, validatedData);
    
    return ApiResponse.success({ tier }, 201);
  } catch (error) {
    console.error('Error creating tier:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.validation(
        error.errors.reduce((acc, err) => ({
          ...acc,
          [err.path.join('.')]: err.message
        }), {})
      );
    }
    
    return ApiResponse.error(
      error instanceof Error ? error.message : 'Failed to create tier'
    );
  }
});