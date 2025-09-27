import { NextRequest, NextResponse } from 'next/server';

import { ApiKeyService } from '@/features/api-key-management/services/api-key-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const keyId = params.id;
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    const stats = await ApiKeyService.getUsageStats(keyId, days);

    return NextResponse.json({
      success: true,
      data: stats,
      period: {
        days,
        start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch usage statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}