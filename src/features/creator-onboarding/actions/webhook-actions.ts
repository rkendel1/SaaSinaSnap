'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { saveCreatorWebhooks } from '../controllers/creator-webhooks';
import type { CreatorWebhookInsert } from '../types';

export async function saveCreatorWebhooksAction(webhooks: Omit<CreatorWebhookInsert, 'creator_id' | 'secret_key'>[]) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // In a real app, you'd generate a unique secret for each webhook endpoint.
  // For now, we'll leave it null.
  const webhooksWithSecrets = webhooks.map((wh) => ({ ...wh, secret_key: null }));

  return saveCreatorWebhooks(user.id, webhooksWithSecrets);
}