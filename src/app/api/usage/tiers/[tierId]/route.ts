import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';

const updateTierSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  billing_cycle: z.enum(['monthly', 'yearly', 'weekly', 'daily']).optional(),
  feature_entitlements: z.array(z.string()).optional(),
  usage_caps: z.record(z.string(), z.number().min(0)).optional(),
  active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  sort_order: z.number().optional(),
  trial_period_days: z.number().min(0).optional()
});

/**
 * GET /api/usage/tiers/[tierId]
 * Get a specific tier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
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

    const tier = await TierManagementService.getTier(params.tierId, creator.id);
    
    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      tier 
    });
  } catch (error) {
    console.error('Error fetching tier:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tier' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/usage/tiers/[tierId]
 * Update a tier
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
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
    const validatedData = updateTierSchema.parse(body);

    const tier = await TierManagementService.updateTier(params.tierId, creator.id, validatedData);
    
    return NextResponse.json({ 
      success: true, 
      tier 
    });
  } catch (error) {
    console.error('Error updating tier:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to update tier' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/usage/tiers/[tierId]
 * Delete a tier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
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

    await TierManagementService.deleteTier(params.tierId, creator.id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Tier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tier:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete tier' 
      },
      { status: 500 }
    );
  }
}