/**
 * Tier Management API
 * GET /api/v1/tiers - List tiers
 * POST /api/v1/tiers - Create tier
 */

import { NextRequest } from 'next/server';

import { ApiResponse, getRequestData, withAuth } from '@/libs/api-utils/api-wrapper';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// GET /api/v1/tiers - List subscription tiers
export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to fetch tiers: ${error.message}`);
    }
    
    return ApiResponse.success(tiers);
    
  } catch (error) {
    console.error('Get tiers error:', error);
    return ApiResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch tiers',
      500
    );
  }
});

// POST /api/v1/tiers - Create new subscription tier
export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const data = await getRequestData(request);
    const supabase = await createSupabaseServerClient();
    
    // Validate required fields
    if (!data.name || typeof data.price !== 'number') {
      return ApiResponse.validation({
        name: data.name ? '' : 'Tier name is required',
        price: typeof data.price === 'number' ? '' : 'Price is required and must be a number'
      });
    }

    // Check if user is creator (has creator profile)
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('id', context.user.id)
      .single();
    
    if (!creatorProfile) {
      return ApiResponse.forbidden('Only creators can create tiers');
    }

    // Create the tier
    const { data: tier, error } = await supabase
      .from('subscription_tiers')
      .insert({
        creator_id: context.user.id,
        name: data.name,
        description: data.description || null,
        price: data.price,
        currency: data.currency || 'usd',
        billing_cycle: data.billing_cycle || 'monthly',
        feature_entitlements: data.feature_entitlements || [],
        usage_caps: data.usage_caps || {},
        is_default: data.is_default || false,
        trial_period_days: data.trial_period_days || 0,
        sort_order: data.sort_order || 0
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create tier: ${error.message}`);
    }
    
    return ApiResponse.success(tier, 201);
    
  } catch (error) {
    console.error('Create tier error:', error);
    return ApiResponse.error(
      error instanceof Error ? error.message : 'Failed to create tier',
      500
    );
  }
});

// Handle preflight requests
export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};