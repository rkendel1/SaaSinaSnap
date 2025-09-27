import { NextRequest, NextResponse } from 'next/server';

import { ApiKeyService } from '@/features/api-key-management/services/api-key-service';

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Get client IP for tracking
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    const validation = await ApiKeyService.validateApiKey(key, ip);

    if (!validation.valid) {
      return NextResponse.json(
        { 
          valid: false, 
          error: validation.error,
          details: {
            expired: validation.expired || false,
            revoked: validation.revoked || false,
            rate_limit_exceeded: validation.rate_limit_exceeded || false
          }
        },
        { status: 401 }
      );
    }

    const apiKey = validation.api_key!;

    return NextResponse.json({
      valid: true,
      api_key: {
        id: apiKey.id,
        name: apiKey.name,
        environment: apiKey.environment,
        scopes: apiKey.scopes,
        rate_limits: {
          per_hour: apiKey.rate_limit_per_hour,
          per_day: apiKey.rate_limit_per_day,
          per_month: apiKey.rate_limit_per_month
        },
        usage_count: apiKey.usage_count,
        last_used_at: apiKey.last_used_at,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at
      }
    });
  } catch (error) {
    console.error('API key validation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to validate API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}