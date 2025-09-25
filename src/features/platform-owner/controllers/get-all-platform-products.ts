'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getAllPlatformProducts() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
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