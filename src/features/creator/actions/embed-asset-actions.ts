'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database, Json, Tables, TablesInsert, TablesUpdate } from '@/libs/supabase/types';
import { EmbedVersioningService } from '../services/embed-versioning';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { CreateEmbedAssetRequest, EmbedAsset, EmbedAssetInsert, EmbedAssetUpdate, UpdateEmbedAssetRequest } from '../types/embed-assets';

export async function createEmbedAssetAction(request: CreateEmbedAssetRequest): Promise<EmbedAsset> {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createSupabaseAdminClient();

  const initialVersion = EmbedVersioningService.createInitialVersion(request.embed_config, user.id); // Use user.id

  const insertData: Database['public']['Tables']['embed_assets']['Insert'] = {
    creator_id: user.id, // Use user.id
    name: request.name,
    description: request.description,
    asset_type: request.asset_type,
    embed_config: request.embed_config as Json, // Cast to Json as it's a JSONB column
    tags: request.tags,
    is_public: request.is_public || false,
    featured: request.featured || false,
    share_token: crypto.randomUUID(),
    metadata: {
      versions: [initialVersion],
      current_version_id: initialVersion.id
    } as unknown as Json,
  };

  const { data, error } = await supabaseAdmin
    .from('embed_assets')
    .insert([insertData]) // No need for explicit cast here, type is direct
    .select()
    .single();

  if (error) {
    console.error('Error creating embed asset:', error);
    throw new Error('Failed to create embed asset');
  }
  if (!data) {
    throw new Error('Failed to create embed asset: No data returned.');
  }

  revalidatePath('/creator/dashboard/assets');
  return data as EmbedAsset;
}

export async function updateEmbedAssetAction(assetId: string, request: UpdateEmbedAssetRequest): Promise<EmbedAsset> {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createSupabaseAdminClient();

  const { data: existingAsset, error: fetchError } = await supabaseAdmin
    .from('embed_assets')
    .select('creator_id, metadata')
    .eq('id', assetId)
    .single();

  if (fetchError || !existingAsset) {
    throw new Error('Asset not found');
  }

  if ((existingAsset as Tables<'embed_assets'>).creator_id !== user.id) { // Use user.id
    throw new Error('Not authorized to update this asset');
  }

  const newVersion = EmbedVersioningService.createVersion(
    request.embed_config!,
    (existingAsset as Tables<'embed_assets'>).metadata as any,
    user.id // Use user.id
  );

  const updateData: Database['public']['Tables']['embed_assets']['Update'] = {
    name: request.name,
    description: request.description,
    embed_config: request.embed_config as Json, // Cast to Json
    tags: request.tags,
    active: request.active,
    is_public: request.is_public,
    featured: request.featured,
    share_enabled: request.share_enabled,
    metadata: newVersion.newMetadata as unknown as Json,
  };

  const { data: updatedData, error } = await supabaseAdmin
    .from('embed_assets')
    .update(updateData) // No need for explicit cast here, type is direct
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

  revalidatePath('/creator/dashboard/assets');
  return updatedData as EmbedAsset;
}

export async function deleteEmbedAssetAction(assetId: string): Promise<void> {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createSupabaseAdminClient();

  const { error } = await supabaseAdmin
    .from('embed_assets')
    .delete()
    .eq('id', assetId)
    .eq('creator_id', user.id); // Use user.id

  if (error) {
    console.error('Error deleting embed asset:', error);
    throw new Error('Failed to delete embed asset');
  }

  revalidatePath('/creator/dashboard/assets');
}

export async function toggleAssetShareAction(assetId: string, enabled: boolean): Promise<EmbedAsset> {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createSupabaseAdminClient();

  const updateData: Database['public']['Tables']['embed_assets']['Update'] = { share_enabled: enabled };
  
  if (enabled) {
    updateData.share_token = crypto.randomUUID();
  }

  const { data, error } = await supabaseAdmin
    .from('embed_assets')
    .update(updateData) // No need for explicit cast here, type is direct
    .eq('id', assetId)
    .eq('creator_id', user.id) // Use user.id
    .select()
    .single();

  if (error) {
    console.error('Error toggling asset share:', error);
    throw new Error('Failed to toggle asset sharing');
  }
  if (!data) {
    throw new Error('Failed to toggle asset sharing: No data returned.');
  }

  revalidatePath('/creator/dashboard/assets');
  return data as EmbedAsset;
}

export async function duplicateEmbedAssetAction(assetId: string): Promise<EmbedAsset> {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createSupabaseAdminClient();

  const { data: originalAsset, error: fetchError } = await supabaseAdmin
    .from('embed_assets')
    .select('*')
    .eq('id', assetId)
    .eq('creator_id', user.id) // Use user.id
    .single();

  if (fetchError || !originalAsset) {
    throw new Error('Asset not found');
  }

  const typedOriginalAsset = originalAsset as Tables<'embed_assets'>;

  const insertData: Database['public']['Tables']['embed_assets']['Insert'] = {
    creator_id: user.id, // Use user.id
    name: `${typedOriginalAsset.name} (Copy)`,
    description: typedOriginalAsset.description,
    asset_type: typedOriginalAsset.asset_type,
    embed_config: typedOriginalAsset.embed_config as Json, // Cast to Json
    tags: typedOriginalAsset.tags,
    is_public: false,
    featured: false,
    share_token: crypto.randomUUID(),
    metadata: typedOriginalAsset.metadata,
  };

  const { data: duplicatedData, error } = await supabaseAdmin
    .from('embed_assets')
    .insert([insertData]) // No need for explicit cast here, type is direct
    .select()
    .single();

  if (error) {
    console.error('Error duplicating embed asset:', error);
    throw new Error('Failed to duplicate embed asset');
  }
  if (!duplicatedData) {
    throw new Error('Failed to duplicate embed asset: No data returned.');
  }

  revalidatePath('/creator/dashboard/assets');
  return duplicatedData as EmbedAsset;
}