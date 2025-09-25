import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';

/**
 * GET /api/usage/customer/tier?creatorId=xxx
 * Get customer's current tier information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creatorId from query params
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    
    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    // Verify creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const tierInfo = await TierManagementService.getCustomerTierInfo(user.id, creatorId);
    
    if (!tierInfo) {
      return NextResponse.json({ 
        success: true, 
        tier_info: null,
        message: 'No active subscription found' 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      tier_info: tierInfo 
    });
  } catch (error) {
    console.error('Error fetching customer tier info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tier information' 
      },
      { status: 500 }
    );
  }
}