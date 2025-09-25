'use server';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { CreatorWebhook, CreatorWebhookInsert } from '../types';

export async function saveCreatorWebhooks(
  creatorId: string,
  webhooks: Omit<CreatorWebhookInsert, 'creator_id'>[]
): Promise<CreatorWebhook[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  // First, delete all existing webhooks for this creator to prevent duplicates
  const { error: deleteError } = await supabaseAdmin
    .from('creator_webhooks')
    .delete()
    .eq('creator_id', creatorId);

  if (deleteError) {
    console.error('Error deleting existing webhooks:', deleteError);
    throw deleteError;
  }

  if (webhooks.length === 0) {
    return []; // Nothing to insert
  }

  // Now, insert the new webhooks
  const webhooksToInsert = webhooks.map((webhook) => ({
    ...webhook,
    creator_id: creatorId,
  }));

  const { data, error: insertError } = await supabaseAdmin
    .from('creator_webhooks')
    .insert(webhooksToInsert)
    .select();

  if (insertError) {
    console.error('Error inserting new webhooks:', insertError);
    throw insertError;
  }

  return data || [];
}