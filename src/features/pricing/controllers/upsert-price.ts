'use server';

import { headers } from 'next/headers';
import Stripe from 'stripe';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';
import { toDateTime } from '@/utils/to-date-time';

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

export async function upsertPrice(price: Stripe.Price) {
  const tenantId = getTenantIdFromHeaders();
  // If tenantId is null, it means we are likely on a non-tenant route (e.g., main platform pages)
  // In such cases, we can still upsert the price, but RLS might not apply.
  // For simplicity, we'll proceed without tenantId if it's not present.

  const priceData: Database['public']['Tables']['prices']['Insert'] = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
    created_at: toDateTime(price.created).toISOString(),
    tenant_id: tenantId, // Add tenant_id
  };

  const supabaseAdmin = await createSupabaseAdminClient(); // Pass tenantId if available
  const { error } = await supabaseAdmin.from('prices').upsert([priceData]);

  if (error) {
    throw error;
  } else {
    console.info(`Price inserted/updated: ${price.id}`);
  }
}