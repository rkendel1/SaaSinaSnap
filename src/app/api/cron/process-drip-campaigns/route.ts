import { NextRequest, NextResponse } from 'next/server';

import { processDripCampaigns } from '@/features/creator/controllers/drip-campaign-service';

/**
 * API route to process drip campaigns
 * This should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * 
 * Example cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-drip-campaigns",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * 
 * This would run every hour to process pending drip campaign emails
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job (optional, but recommended)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Processing drip campaigns...');
    
    await processDripCampaigns();
    
    console.log('[Cron] Drip campaigns processed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Drip campaigns processed successfully' 
    });
  } catch (error) {
    console.error('[Cron] Error processing drip campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to process drip campaigns' }, 
      { status: 500 }
    );
  }
}

// Disable static optimization for this route
export const dynamic = 'force-dynamic';
