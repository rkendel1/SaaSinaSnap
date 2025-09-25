'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import type { CreateEmbedAssetRequest, EmbedAsset, UpdateEmbedAssetRequest } from '../types/embed-assets';

export async function createEmbedAssetAction(request: CreateEmbedAssetRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('embed_assets')
    .insert({
      creator_id: session.user.id,
      name: request.name,
      description: request.description,
      asset_type: request.asset_type,
      embed_config: request.embed_config,
      tags: request.tags,
      is_public: request.is_public || false,
      featured: request.featured || false,
      share_token: crypto.randomUUID(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating embed asset:', error);
    throw new Error('Failed to create embed asset');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
  return data;
}

export async function updateEmbedAssetAction(assetId: string, request: UpdateEmbedAssetRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();

  // First verify the asset belongs to the user
  const { data: existingAsset, error: fetchError } = await supabase
    .from('embed_assets')
    .select('creator_id')
    .eq('id', assetId)
    .single();

  if (fetchError || !existingAsset) {
    throw new Error('Asset not found');
  }

  if (existingAsset.creator_id !== session.user.id) {
    throw new Error('Not authorized to update this asset');
  }

  const updateData: any = { ...request };
  
  // Generate share token if share is being enabled and no token exists
  if (request.share_enabled && !updateData.share_token) {
    updateData.share_token = crypto.randomUUID();
  }

  const { data, error } = await supabase
    .from('embed_assets')
    .update(updateData)
    .eq('id', assetId)
    .select()
    .single();

  if (error) {
    console.error('Error updating embed asset:', error);
    throw new Error('Failed to update embed asset');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
  return data;
}

export async function deleteEmbedAssetAction(assetId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();

  // First verify the asset belongs to the user
  const { data: existingAsset, error: fetchError } = await supabase
    .from('embed_assets')
    .select('creator_id')
    .eq('id', assetId)
    .single();

  if (fetchError || !existingAsset) {
    throw new Error('Asset not found');
  }

  if (existingAsset.creator_id !== session.user.id) {
    throw new Error('Not authorized to delete this asset');
  }

  const { error } = await supabase
    .from('embed_assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    console.error('Error deleting embed asset:', error);
    throw new Error('Failed to delete embed asset');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
}

export async function toggleAssetShareAction(assetId: string, enabled: boolean) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();

  const updateData: any = { share_enabled: enabled };
  
  // Generate share token if enabling share and no token exists
  if (enabled) {
    updateData.share_token = crypto.randomUUID();
  }

  const { data, error } = await supabase
    .from('embed_assets')
    .update(updateData)
    .eq('id', assetId)
    .eq('creator_id', session.user.id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling asset share:', error);
    throw new Error('Failed to toggle asset sharing');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
  return data;
}

export async function duplicateEmbedAssetAction(assetId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();

  // First get the original asset
  const { data: originalAsset, error: fetchError } = await supabase
    .from('embed_assets')
    .select('*')
    .eq('id', assetId)
    .eq('creator_id', session.user.id)
    .single();

  if (fetchError || !originalAsset) {
    throw new Error('Asset not found');
  }

  // Create duplicate with modified name
  const { data, error } = await supabase
    .from('embed_assets')
    .insert({
      creator_id: session.user.id,
      name: `${originalAsset.name} (Copy)`,
      description: originalAsset.description,
      asset_type: originalAsset.asset_type,
      embed_config: originalAsset.embed_config,
      tags: originalAsset.tags,
      is_public: false, // Duplicates are private by default
      featured: false,
      share_token: crypto.randomUUID(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error duplicating embed asset:', error);
    throw new Error('Failed to duplicate embed asset');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
  return data;
}