import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types'; // Import Tables type

import type { EmbedAsset, EmbedAssetType } from '../types/embed-assets';

export async function getCreatorEmbedAssets(creatorId: string, options?: {
  assetType?: EmbedAssetType;
  activeOnly?: boolean;
  publicOnly?: boolean;
  limit?: number;
}): Promise<EmbedAsset[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('embed_assets')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (options?.assetType) {
    query = query.eq('asset_type', options.assetType);
  }

  if (options?.activeOnly) {
    query = query.eq('active', true);
  }

  if (options?.publicOnly) {
    query = query.eq('is_public', true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching embed assets:', error);
    throw new Error('Failed to fetch embed assets');
  }

  return data || [];
}

export async function getEmbedAssetById(assetId: string): Promise<EmbedAsset | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('embed_assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching embed asset:', error);
    throw new Error('Failed to fetch embed asset');
  }

  return data;
}

export async function getSharedEmbedAsset(shareToken: string): Promise<EmbedAsset | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('embed_assets')
    .select('*')
    .eq('share_token', shareToken)
    .eq('share_enabled', true)
    .eq('active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching shared embed asset:', error);
    throw new Error('Failed to fetch shared embed asset');
  }

  return data;
}

export async function getPublicEmbedAssets(options?: {
  assetType?: EmbedAssetType;
  limit?: number;
  offset?: number;
}): Promise<EmbedAsset[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('embed_assets')
    .select('*')
    .eq('is_public', true)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (options?.assetType) {
    query = query.eq('asset_type', options.assetType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching public embed assets:', error);
    throw new Error('Failed to fetch public embed assets');
  }

  return data || [];
}

export async function incrementAssetViewCount(assetId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Fetch current count, increment, and update
  const { data, error: fetchError } = await supabase
    .from('embed_assets')
    .select('view_count')
    .eq('id', assetId)
    .single();

  const currentAsset = data as Pick<Tables<'embed_assets'>, 'view_count'> | null;

  if (fetchError || !currentAsset) {
    console.error('Error fetching asset for view count increment:', fetchError);
    return;
  }

  const newViewCount = (currentAsset.view_count || 0) + 1;

  const { error: updateError } = await supabase
    .from('embed_assets')
    .update({ view_count: newViewCount })
    .eq('id', assetId);

  if (updateError) {
    console.error('Error incrementing asset view count:', updateError);
    // Don't throw error for analytics - it shouldn't break the flow
  }
}

export async function incrementAssetUsageCount(assetId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Fetch current count, increment, and update
  const { data, error: fetchError } = await supabase
    .from('embed_assets')
    .select('usage_count')
    .eq('id', assetId)
    .single();

  const currentAsset = data as Pick<Tables<'embed_assets'>, 'usage_count'> | null;

  if (fetchError || !currentAsset) {
    console.error('Error fetching asset for usage count increment:', fetchError);
    return;
  }

  const newUsageCount = (currentAsset.usage_count || 0) + 1;

  const { error: updateError } = await supabase
    .from('embed_assets')
    .update({ usage_count: newUsageCount })
    .eq('id', assetId);

  if (updateError) {
    console.error('Error incrementing asset usage count:', updateError);
    // Don't throw error for analytics - it shouldn't break the flow
  }
}