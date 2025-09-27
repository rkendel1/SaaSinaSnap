import { NextRequest, NextResponse } from 'next/server';

import { EnhancedUsageService } from '@/features/usage-tracking/services/enhanced-usage-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, creatorId, eventType, quantity, metadata } = await request.json();

    if (!userId || !creatorId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, creatorId, eventType' },
        { status: 400 }
      );
    }

    // Track the usage event
    const eventId = await EnhancedUsageService.trackUsageEvent(
      userId,
      creatorId,
      eventType,
      quantity || 1,
      metadata
    );

    return NextResponse.json({
      success: true,
      eventId,
      message: 'Usage event tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking usage event:', error);
    return NextResponse.json(
      { error: 'Failed to track usage event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const userId = searchParams.get('userId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId parameter is required' },
        { status: 400 }
      );
    }

    if (userId) {
      // Get subscriber usage profile
      const profile = await EnhancedUsageService.getSubscriberUsageProfile(userId, creatorId);
      return NextResponse.json({ profile });
    } else {
      // Get creator usage analytics
      const analytics = await EnhancedUsageService.getCreatorUsageAnalytics(creatorId);
      return NextResponse.json({ analytics });
    }
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}