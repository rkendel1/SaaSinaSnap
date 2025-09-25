'use server';

import Stripe from 'stripe';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';
import { toDateTime } from '@/utils/to-date-time';

export async function upsertProduct(product: Stripe.Product) {
  const productData: Database['public']['Tables']['products']['Insert'] = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
    created_at: toDateTime(product.created).toISOString(),
  };

  const supabaseAdmin = await createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from('products').upsert([productData]);

  if (error) {
    throw error;
  } else {
    console.info(`Product inserted/updated: ${product.id}`);
  }
}