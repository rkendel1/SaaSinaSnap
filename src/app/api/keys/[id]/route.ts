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
    
    // For now, we'll use a placeholder user ID
    // In production, this should come from authentication
    const userId = 'placeholder-user-id';
    
    const keys = await ApiKeyService.getApiKeys(userId);
    const apiKey = keys.find(key => key.id === keyId);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Don't return sensitive data
    const safeKey = {
      id: apiKey.id,
      name: apiKey.name,
      description: apiKey.description,
      environment: apiKey.environment,
      key_hint: apiKey.key_hint,
      scopes: apiKey.scopes,
      rate_limits: {
        per_hour: apiKey.rate_limit_per_hour,
        per_day: apiKey.rate_limit_per_day,
        per_month: apiKey.rate_limit_per_month
      },
      usage_count: apiKey.usage_count,
      last_used_at: apiKey.last_used_at,
      expires_at: apiKey.expires_at,
      active: apiKey.active,
      auto_rotate_enabled: apiKey.auto_rotate_enabled,
      rotate_every_days: apiKey.rotate_every_days,
      created_at: apiKey.created_at,
      updated_at: apiKey.updated_at
    };

    return NextResponse.json({ api_key: safeKey });
  } catch (error) {
    console.error('Get API key error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const keyId = params.id;
    const { reason } = await request.json().catch(() => ({}));
    
    // For now, we'll use a placeholder user ID
    // In production, this should come from authentication
    const userId = 'placeholder-user-id';
    
    await ApiKeyService.revokeApiKey(keyId, userId, reason);

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Revoke API key error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to revoke API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}