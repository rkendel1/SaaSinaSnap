'use server';

import { headers } from 'next/headers';
import Stripe from 'stripe';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
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

export async function upsertPlatformProduct(
  product: Stripe.Product, 
  options: {
    approved?: boolean;
    isPlatformProduct?: boolean;
    platformOwnerId?: string;
  } = {}
) {
  const user = await getAuthenticatedUser();
  
  const productData: Database['public']['Tables']['products']['Insert'] = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
    created_at: toDateTime(product.created).toISOString(),
    approved: options.approved ?? true, // Default to approved for platform products
    is_platform_product: options.isPlatformProduct ?? true,
    platform_owner_id: options.platformOwnerId ?? user?.id,
  };

  const supabaseAdmin = await createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from('products').upsert([productData]);

  if (error) {
    throw error;
  } else {
    console.info(`Platform product inserted/updated: ${product.id}`);
  }
}