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

export async function upsertProduct(product: Stripe.Product) {
  const tenantId = getTenantIdFromHeaders();
  // If tenantId is null, it means we are likely on a non-tenant route (e.g., main platform pages)
  // In such cases, we can still upsert the product, but RLS might not apply.
  // For simplicity, we'll proceed without tenantId if it's not present.

  const productData: Database['public']['Tables']['products']['Insert'] = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
    created_at: toDateTime(product.created).toISOString(),
    tenant_id: tenantId, // Add tenant_id
  };

  const supabaseAdmin = await createSupabaseAdminClient(tenantId || undefined); // Pass tenantId if available
  const { error } = await supabaseAdmin.from('products').upsert([productData]);

  if (error) {
    throw error;
  } else {
    console.info(`Product inserted/updated: ${product.id}`);
  }
}