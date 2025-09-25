'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

import type { CreateEmbedAssetRequest, EmbedAsset, EmbedAssetInsert, EmbedAssetUpdate, UpdateEmbedAssetRequest } from '../types/embed-assets';

export async function createEmbedAssetAction(request: CreateEmbedAssetRequest): Promise<EmbedAsset> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase: SupabaseClient<Database> = await createSupabaseServerClient();

  const insertData: EmbedAssetInsert = {
    creator_id: session.user.id,
    name: request.name,
    description: request.description,
    asset_type: request.asset_type,
    embed_config: request.embed_config as EmbedAssetInsert['embed_config'],
    tags: request.tags,
    is_public: request.is_public || false,
    featured: request.featured || false,
    share_token: crypto.randomUUID(),
  };

  const { data, error } = await supabase
    .from('embed_assets')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error creating embed asset:', error);
    throw new Error('Failed to create embed asset');
  }
  if (!data) {
    throw new Error('Failed to create embed asset: No data returned.');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
  return data as EmbedAsset;
}

export async function updateEmbedAssetAction(assetId: string, request: UpdateEmbedAssetRequest): Promise<EmbedAsset> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase: SupabaseClient<Database> = await createSupabaseServerClient();

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

  const updateData: EmbedAssetUpdate = { 
    ...request,
    embed_config: request.embed_config as EmbedAssetUpdate['embed_config'],
  };
  
  if (request.share_enabled && !updateData.share_token) {
    updateData.share_token = crypto.randomUUID();
  }

  const { data: updatedData, error } = await supabase
    .from('embed_assets')
    .update(updateData)
    .eq('id', assetId)
    .select()
    .single();

  if (error) {
    console.error('Error updating embed asset:', error);
    throw new Error('Failed to update embed asset');
  }
  if (!updatedData) {
    throw new Error('Failed to update embed asset: No data returned.');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
  return updatedData as EmbedAsset;
}

export async function deleteEmbedAssetAction(assetId: string): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase: SupabaseClient<Database> = await createSupabaseServerClient();

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

export async function toggleAssetShareAction(assetId: string, enabled: boolean): Promise<EmbedAsset> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase: SupabaseClient<Database> = await createSupabaseServerClient();

  const updateData: Partial<EmbedAssetUpdate> = { share_enabled: enabled };
  
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
  if (!data) {
    throw new Error('Failed to toggle asset sharing: No data returned.');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
  return data as EmbedAsset;
}

export async function duplicateEmbedAssetAction(assetId: string): Promise<EmbedAsset> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase: SupabaseClient<Database> = await createSupabaseServerClient();

  const { data: originalAsset, error: fetchError } = await supabase
    .from('embed_assets')
    .select('*')
    .eq('id', assetId)
    .eq('creator_id', session.user.id)
    .single();

  if (fetchError || !originalAsset) {
    throw new Error('Asset not found');
  }

  const insertData: EmbedAssetInsert = {
    creator_id: session.user.id,
    name: `${originalAsset.name} (Copy)`,
    description: originalAsset.description,
    asset_type: originalAsset.asset_type,
    embed_config: originalAsset.embed_config as EmbedAssetInsert['embed_config'],
    tags: originalAsset.tags,
    is_public: false,
    featured: false,
    share_token: crypto.randomUUID(),
  };

  const { data: duplicatedData, error } = await supabase
    .from('embed_assets')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error duplicating embed asset:', error);
    throw new Error('Failed to duplicate embed asset');
  }
  if (!duplicatedData) {
    throw new Error('Failed to duplicate embed asset: No data returned.');
  }

  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/dashboard/assets');
  return duplicatedData as EmbedAsset;
}