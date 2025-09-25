'use server';

import Stripe from 'stripe';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';
import { toDateTime } from '@/utils/to-date-time';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser

export async function upsertPrice(price: Stripe.Price) {
  const priceData: Database['public']['Tables']['prices']['Insert'] = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
    created_at: toDateTime(price.created).toISOString(),
  };

  const supabaseAdmin = await createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from('prices').upsert([priceData]);

  if (error) {
    throw error;
  } else {
    console.info(`Price inserted/updated: ${price.id}`);
  }
}