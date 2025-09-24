import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { CreatorProduct, CreatorProductInsert, CreatorProductUpdate } from '../types';

export async function getCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const { data, error } = await supabaseAdminClient
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createCreatorProduct(product: CreatorProductInsert): Promise<CreatorProduct> {
  const { data, error } = await supabaseAdminClient
    .from('creator_products')
    .insert(product)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCreatorProduct(productId: string, updates: CreatorProductUpdate): Promise<CreatorProduct> {
  const { data, error } = await supabaseAdminClient
    .from('creator_products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteCreatorProduct(productId: string): Promise<void> {
  const { error } = await supabaseAdminClient
    .from('creator_products')
    .delete()
    .eq('id', productId);

  if (error) {
    throw error;
  }
}

export async function getActiveCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const { data, error } = await supabaseAdminClient
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}