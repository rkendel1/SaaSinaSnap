import { NextRequest, NextResponse } from 'next/server';

import { ApiKeyService } from '@/features/api-key-management/services/api-key-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const keyId = params.id;
    const { reason } = await request.json().catch(() => ({}));
    
    // For now, we'll use a placeholder user ID
    // In production, this should come from authentication
    const userId = 'placeholder-user-id';
    
    const { newKey, newApiKey } = await ApiKeyService.rotateApiKey(keyId, userId, reason);

    return NextResponse.json({
      success: true,
      message: 'API key rotated successfully',
      data: {
        id: newApiKey.id,
        key: newKey,
        name: newApiKey.name,
        environment: newApiKey.environment,
        key_hint: newApiKey.key_hint,
        scopes: newApiKey.scopes,
        rate_limits: {
          per_hour: newApiKey.rate_limit_per_hour,
          per_day: newApiKey.rate_limit_per_day,
          per_month: newApiKey.rate_limit_per_month
        },
        expires_at: newApiKey.expires_at,
        next_rotation_at: newApiKey.next_rotation_at,
        updated_at: newApiKey.updated_at
      }
    });
  } catch (error) {
    console.error('Rotate API key error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to rotate API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}