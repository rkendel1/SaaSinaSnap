import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';

const enforcementCheckSchema = z.object({
  creatorId: z.string().uuid(),
  metricName: z.string().min(1),
  requestedUsage: z.number().min(1).default(1)
});

/**
 * POST /api/usage/customer/enforcement
 * Check if customer can perform an action based on tier limits
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { creatorId, metricName, requestedUsage } = enforcementCheckSchema.parse(body);

    // Verify creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const enforcementResult = await TierManagementService.checkTierEnforcement(
      user.id,
      creatorId,
      metricName,
      requestedUsage
    );
    
    return NextResponse.json({ 
      success: true, 
      enforcement: enforcementResult 
    });
  } catch (error) {
    console.error('Error checking tier enforcement:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to check enforcement' 
      },
      { status: 500 }
    );
  }
}