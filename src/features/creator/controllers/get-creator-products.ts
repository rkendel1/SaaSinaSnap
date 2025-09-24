import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { CreatorProduct } from '../types';

export async function getCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching creator products:', error);
    return [];
  }

  return (data || []) as CreatorProduct[];
}