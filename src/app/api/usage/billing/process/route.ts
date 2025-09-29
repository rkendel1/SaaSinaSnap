import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { BillingAutomationService } from '@/features/usage-tracking/services/billing-automation-service';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const processBillingSchema = z.object({
  creatorId: z.string().uuid(),
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
  action: z.enum(['process_overages', 'calculate_analytics', 'send_warnings'])
});

/**
 * POST /api/usage/billing/process
 * Process billing automation tasks
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user (this should be called by a cron job or admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { creatorId, billingPeriod, action } = processBillingSchema.parse(body);

    // Verify creator exists and user has access
    const { data: creator, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Check if user is the creator or has admin access
    if (creator && (creator as any).id !== user.id) {
      // In a real implementation, you'd check for admin permissions here
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let result: any = {};

    switch (action) {
      case 'process_overages':
        result = await BillingAutomationService.processBillingCycle(creatorId, billingPeriod);
        break;
      
      case 'calculate_analytics':
        const periodStart = `${billingPeriod}-01`;
        const periodEnd = new Date(billingPeriod + '-01');
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0); // Last day of the month
        
        await BillingAutomationService.calculateTierAnalytics(
          creatorId,
          periodStart,
          periodEnd.toISOString().split('T')[0],
          'monthly'
        );
        result = { message: 'Analytics calculated successfully' };
        break;
      
      case 'send_warnings':
        await BillingAutomationService.sendUsageWarnings(creatorId);
        result = { message: 'Usage warnings sent' };
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing billing automation:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to process billing' 
      },
      { status: 500 }
    );
  }
}