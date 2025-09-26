import { NextRequest, NextResponse } from 'next/server';

import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function POST(request: NextRequest) {
  try {
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

    // Parse tier data from request
    const tierData = await request.json();
    
    const preview = await TierManagementService.previewUsageImpact(creator.id, tierData);
    return NextResponse.json({ success: true, preview });
  } catch (error) {
    console.error('Tier preview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to preview tier impact' },
      { status: 500 }
    );
  }
}