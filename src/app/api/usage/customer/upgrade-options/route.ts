import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';

/**
 * GET /api/usage/customer/upgrade-options?creatorId=xxx
 * Get upgrade options for customer based on their current tier and usage
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

    const upgradeOptions = await TierManagementService.getTierUpgradeOptions(user.id, creatorId);
    
    return NextResponse.json({ 
      success: true, 
      upgrade_options: upgradeOptions 
    });
  } catch (error) {
    console.error('Error fetching upgrade options:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch upgrade options' 
      },
      { status: 500 }
    );
  }
}