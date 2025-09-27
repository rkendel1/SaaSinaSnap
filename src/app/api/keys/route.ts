import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

// Simple API key generation function
function generateApiKey(): string {
  const prefix = 'sk_test_';
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const base64 = Buffer.from(randomBytes).toString('base64url').slice(0, 32);
  return prefix + base64;
}

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
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

    const apiKey = generateApiKey();
    const keyId = crypto.randomUUID();
    
    // Here you would typically store this in a database
    // For now, we'll just return the key (in production, store in Supabase)
    const keyData = {
      id: keyId,
      key: apiKey,
      email,
      purpose: purpose || 'testing',
      created_at: new Date().toISOString(),
      last_used: null,
      permissions: ['read:basic', 'post:extraction'],
      rate_limit: 100, // requests per hour
      active: true
    };

    return NextResponse.json({
      success: true,
      message: 'API key generated successfully',
      data: {
        id: keyData.id,
        key: keyData.key,
        permissions: keyData.permissions,
        rate_limit: keyData.rate_limit,
        created_at: keyData.created_at
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
    message: 'API Key Management',
    endpoints: {
      'POST /api/keys': 'Generate a new API key (requires email)',
    },
    authentication: {
      header: 'X-API-Key',
      example: 'sk_test_abcd1234...'
    },
    rateLimit: {
      testing: '100 requests per hour',
      production: 'Contact support for higher limits'
    }
  });
}