import { NextRequest, NextResponse } from 'next/server';

import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
  try {
    const { tierId } = params;
    const supabase = await createSupabaseServerClient();
    
    // Get the current user (creator)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator profile
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ success: false, error: 'Creator profile not found' }, { status: 404 });
    }

    // Parse request body for clone customizations
    const body = await request.json().catch(() => ({}));
    
    const clonedTier = await TierManagementService.cloneTier((creator as any)?.id, tierId, body);
    return NextResponse.json({ success: true, tier: clonedTier });
  } catch (error) {
    console.error('Tier clone error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clone tier' },
      { status: 500 }
    );
  }
}