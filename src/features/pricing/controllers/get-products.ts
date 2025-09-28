'use server';

import { headers } from 'next/headers';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

export async function getProducts({ 
  includeInactive = false, 
  approvedOnly = true 
}: { 
  includeInactive?: boolean;
  approvedOnly?: boolean;
} = {}) {
  const supabase = await createSupabaseServerClient();
  const tenantId = getTenantIdFromHeaders();

  let query = supabase
    .from('products')
    .select('*, prices(*)')
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  if (!includeInactive) {
    query = query.eq('active', true).eq('prices.active', true);
  }

  if (approvedOnly) {
    query = query.eq('approved', true);
  }

  // Conditionally apply tenant_id filter if available
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error.message);
  }

  return data ?? [];
}