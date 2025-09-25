'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getProducts({ includeInactive = false }: { includeInactive?: boolean } = {}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('products')
    .select('*, prices(*)')
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  if (!includeInactive) {
    query = query.eq('active', true).eq('prices.active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error.message);
  }

  return data ?? [];
}