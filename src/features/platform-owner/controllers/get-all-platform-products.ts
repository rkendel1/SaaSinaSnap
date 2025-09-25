'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getAllPlatformProducts() {
  const supabaseAdmin = await createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, prices(*)')
    // No longer filtering by active status for products or prices
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  if (error) {
    console.error(error.message);
  }

  return data ?? [];
}