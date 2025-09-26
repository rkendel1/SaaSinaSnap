'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { SubscribedProduct } from '../types';

/**
 * Retrieves the product details a user subscribed to, from the snapshot stored in `subscribed_products`.
 */
export async function getSubscriberProductDetails(subscriptionId: string): Promise<SubscribedProduct | null> {
  const supabaseAdmin = await createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from('subscribed_products')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      return null;
    }
    console.error('Error fetching subscribed product details:', error);
    throw new Error('Failed to fetch subscribed product details.');
  }

  return data as SubscribedProduct;
}