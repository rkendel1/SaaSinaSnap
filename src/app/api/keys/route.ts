import { NextRequest, NextResponse } from 'next/server';

import { ApiKeyService } from '@/features/api-key-management/services/api-key-service';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const { email, purpose, environment = 'test', name, scopes } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll create a key for a default creator
    // In production, this would be tied to the authenticated user
    const defaultCreatorId = crypto.randomUUID(); // This should come from auth
    
    const keyRequest = {
      creator_id: defaultCreatorId,
      name: name || `API Key for ${email}`,
      description: `Generated for ${purpose || 'testing'} by ${email}`,
      environment: environment as 'test' | 'production' | 'sandbox',
      scopes: scopes || ['read:basic', 'post:extraction'],
      rate_limit_per_hour: 100,
      rate_limit_per_day: 1000,
      rate_limit_per_month: 10000
    };

    const { apiKey, fullKey } = await ApiKeyService.createApiKey(keyRequest);

    return NextResponse.json({
      success: true,
      message: 'API key generated successfully',
      data: {
        id: apiKey.id,
        key: fullKey,
        name: apiKey.name,
        environment: apiKey.environment,
        scopes: apiKey.scopes,
        rate_limit_per_hour: apiKey.rate_limit_per_hour,
        rate_limit_per_day: apiKey.rate_limit_per_day,
        rate_limit_per_month: apiKey.rate_limit_per_month,
        created_at: apiKey.created_at,
        expires_at: apiKey.expires_at
      }
    });
  } catch (error) {
    console.error('API key generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API Key Management System',
    version: '2.0',
    endpoints: {
      'POST /api/keys': 'Generate a new API key (requires email, name)',
      'GET /api/keys/[id]': 'Get API key details',
      'PUT /api/keys/[id]': 'Update API key settings',
      'DELETE /api/keys/[id]': 'Revoke API key',
      'POST /api/keys/[id]/rotate': 'Rotate API key',
      'GET /api/keys/[id]/usage': 'Get usage statistics'
    },
    authentication: {
      header: 'X-API-Key',
      example: 'sk_test_abcd1234...',
      environments: ['test', 'production', 'sandbox']
    },
    scopes: {
      'read:basic': 'Basic read access',
      'read:products': 'Read product information',
      'read:analytics': 'Read analytics data',
      'write:products': 'Create and update products',
      'write:usage': 'Track usage events',
      'admin:all': 'Full administrative access'
    },
    rateLimit: {
      default: {
        hourly: 1000,
        daily: 10000,
        monthly: 100000
      },
      note: 'Rate limits are configurable per key and can be upgraded'
    },
    features: {
      autoRotation: true,
      usageTracking: true,
      scopeManagement: true,
      expirationPolicies: true,
      customerDashboard: true
    }
  });
}