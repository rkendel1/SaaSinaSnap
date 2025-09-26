'use server';

import { headers } from 'next/headers';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

export async function getCustomerId({ userId }: { userId: string }) {
  const tenantId = getTenantIdFromHeaders();
  if (!tenantId) throw new Error('Tenant context not found');

  const supabaseAdmin = await createSupabaseAdminClient(tenantId);
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Error fetching stripe_customer_id');
  }

  return data.stripe_customer_id;
}