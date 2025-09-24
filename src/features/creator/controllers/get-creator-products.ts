import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { CreatorProduct } from '../types';

export async function getCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabase = await createSupabaseServerClient();

  console.log(`[getCreatorProducts] Attempting to fetch products for creatorId: ${creatorId}`);

  const { data, error } = await supabase
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getCreatorProducts] Error fetching creator products:', error);
    return [];
  }

  console.log(`[getCreatorProducts] Found ${data?.length || 0} products for creatorId: ${creatorId}. Data:`, data);

  return (data || []) as CreatorProduct[];
}