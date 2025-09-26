'use server';

import { headers } from 'next/headers';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Corrected import path

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

export async function getSubscription() {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!user?.id) {
    return null;
  }

  const tenantId = getTenantIdFromHeaders();
  // If tenantId is null, it means we are likely on a non-tenant route (e.g., main platform pages)
  // In such cases, we can still fetch the subscription, but RLS might not apply.
  // For simplicity, we'll proceed without tenantId if it's not present.
  // If RLS is strictly enforced on 'subscriptions' table, this query might fail without tenant context.

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .eq('user_id', user.id); // Filter by authenticated user's ID

  // Conditionally apply tenant_id filter if available
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error(error);
  }

  return data;
}