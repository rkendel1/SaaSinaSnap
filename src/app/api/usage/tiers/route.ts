import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

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
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const tiers = await TierManagementService.getCreatorTiers((creator as any).id);
    
    return NextResponse.json({ 
      success: true, 
      tiers 
    });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tiers' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/usage/tiers
 * Create a new tier
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTierSchema.parse(body);

    const tier = await TierManagementService.createTier((creator as any).id, validatedData);
    
    return NextResponse.json({ 
      success: true, 
      tier 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tier:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to create tier' 
      },
      { status: 500 }
    );
  }
}