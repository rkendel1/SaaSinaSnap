"use server";

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import type { ProductSearchOptions, ProductStatus } from '@/features/creator/types'; // Corrected import path
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { getCreatorProfile } from './creator-profile'; // Import getCreatorProfile
import { createStripePrice, createStripeProduct, deleteStripeProduct, updateStripeProduct, archiveStripeProduct } from './stripe-connect'; // Import Stripe API functions
import type { CreatorProduct, CreatorProductInsert, CreatorProductUpdate } from '../types';

export async function getCreatorProducts(creatorId: string, options?: { includeInactive?: boolean }): Promise<CreatorProduct[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  let query = supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (!options?.includeInactive) {
    query = query.eq('active', true).is('metadata->deleted_at', null); // Only active, non-deleted by default
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

// New function to get a single creator product by ID
export async function getCreatorProduct(productId: string, options?: { includeInactive?: boolean }): Promise<CreatorProduct | null> {
  const supabaseAdmin = await createSupabaseAdminClient();
  let query = supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('id', productId);

  if (!options?.includeInactive) {
    query = query.eq('active', true).is('metadata->deleted_at', null); // Only active, non-deleted by default
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    throw error;
  }

  return data || null;
}

// Enhanced search and filtering function
export async function searchCreatorProducts(
  creatorId: string, 
  options: ProductSearchOptions = {}
): Promise<{ products: CreatorProduct[], total: number }> {
  const supabaseAdmin = await createSupabaseAdminClient();
  let query = supabaseAdmin
    .from('creator_products')
    .select('*', { count: 'exact' })
    .eq('creator_id', creatorId);

  // Apply text search
  if (options.query) {
    query = query.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%`);
  }

  // Apply filters
  if (options.filters) {
    const { status, product_type, category, tags, price_range, created_after, created_before } = options.filters;
    
    if (status && status.length > 0) {
      // Handle different status types
      const conditions = status.map((s: ProductStatus) => {
        switch (s) {
          case 'active':
            return 'active.eq.true';
          case 'archived':
            return 'active.eq.false';
          case 'deleted':
            return 'metadata->deleted_at.not.is.null';
          default:
            return null;
        }
      }).filter(Boolean);
      
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }
    }

    if (product_type && product_type.length > 0) {
      query = query.in('product_type', product_type);
    }

    if (category) {
      query = query.like('metadata->category', `%${category}%`);
    }

    if (tags && tags.length > 0) {
      const tagConditions = tags.map((tag: string) => `metadata->tags.like.%${tag}%`);
      query = query.or(tagConditions.join(','));
    }

    if (price_range) {
      if (price_range.min !== undefined) {
        query = query.gte('price', price_range.min);
      }
      if (price_range.max !== undefined) {
        query = query.lte('price', price_range.max);
      }
    }

    if (created_after) {
      query = query.gte('created_at', created_after);
    }

    if (created_before) {
      query = query.lte('created_at', created_before);
    }
  }

  // Apply sorting
  const sortBy = options.sort_by || 'created_at';
  const sortOrder = options.sort_order || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    products: data || [],
    total: count || 0
  };
}

export async function createCreatorProduct(productData: CreatorProductInsert): Promise<CreatorProduct> {
  console.log('[createCreatorProduct] Starting product creation in DB and Stripe', { productName: productData.name, creatorId: productData.creator_id });
  const supabaseAdmin = await createSupabaseAdminClient();

  // Get creator's Stripe account ID
  const creatorProfile = await getCreatorProfile(productData.creator_id);
  if (!creatorProfile?.stripe_account_id) {
    throw new Error('Creator Stripe account not connected.');
  }
  const stripeAccountId = creatorProfile.stripe_account_id;

  let stripeProductId: string | undefined;
  let stripePriceId: string | undefined;

  try {
    // 1. Create product in Stripe
    console.log('[createCreatorProduct] Creating Stripe product for account:', stripeAccountId);
    stripeProductId = await createStripeProduct(stripeAccountId, {
      name: productData.name,
      description: productData.description || undefined,
      images: productData.image_url ? [productData.image_url] : [],
      active: productData.active ?? true,
      metadata: productData.metadata || {},
    });
    console.log('[createCreatorProduct] Stripe product created:', stripeProductId);

    // 2. Create price in Stripe
    console.log('[createCreatorProduct] Creating Stripe price for product:', stripeProductId);
    stripePriceId = await createStripePrice(stripeAccountId, {
      product: stripeProductId,
      unit_amount: Math.round(productData.price! * 100), // Ensure price is not null
      currency: productData.currency || 'usd',
      recurring: productData.product_type === 'subscription' ? { interval: 'month' } : undefined,
      metadata: productData.metadata || {},
    });
    console.log('[createCreatorProduct] Stripe price created:', stripePriceId);

    // 3. Insert into Supabase
    console.log('[createCreatorProduct] Inserting product into Supabase DB');
    const { data, error } = await supabaseAdmin
      .from('creator_products')
      .insert({
        ...productData,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
      })
      .select()
      .single();

    if (error) {
      console.error('[createCreatorProduct] Supabase insert error:', error);
      throw error;
    }
    console.log('[createCreatorProduct] Product successfully created in Supabase DB');
    return data;
  } catch (error) {
    console.error('[createCreatorProduct] Error during product creation:', error);
    // Attempt to clean up Stripe resources if creation failed mid-way
    if (stripeProductId && stripeAccountId) {
      try {
        console.warn('[createCreatorProduct] Attempting to clean up Stripe product due to error:', stripeProductId);
        await archiveStripeProduct(stripeAccountId, stripeProductId); // Archive instead of delete
      } catch (cleanupError) {
        console.error('[createCreatorProduct] Failed to clean up Stripe product:', cleanupError);
      }
    }
    throw error;
  }
}

export async function updateCreatorProduct(productId: string, updates: CreatorProductUpdate): Promise<CreatorProduct> {
  console.log('[updateCreatorProduct] Starting product update in DB and Stripe', { productId, updates });
  const supabaseAdmin = await createSupabaseAdminClient();

  // Get existing product to retrieve Stripe IDs and creator's Stripe account
  const { data: existingProduct, error: fetchError } = await supabaseAdmin
    .from('creator_products')
    .select('*, creator_profiles(stripe_account_id)')
    .eq('id', productId)
    .single();

  if (fetchError || !existingProduct) {
    throw new Error('Product not found or creator profile missing.');
  }

  const stripeAccountId = (existingProduct.creator_profiles as any)?.stripe_account_id;
  if (!stripeAccountId) {
    throw new Error('Creator Stripe account not connected.');
  }

  let newStripePriceId: string | undefined = existingProduct.stripe_price_id || undefined;

  try {
    // 1. Update product in Stripe
    console.log('[updateCreatorProduct] Updating Stripe product:', existingProduct.stripe_product_id);
    if (existingProduct.stripe_product_id) {
      await updateStripeProduct(stripeAccountId, existingProduct.stripe_product_id, {
        name: updates.name || existingProduct.name,
        description: updates.description || existingProduct.description || undefined,
        images: updates.image_url ? [updates.image_url] : existingProduct.image_url ? [existingProduct.image_url] : [],
        active: updates.active ?? existingProduct.active ?? true,
        metadata: updates.metadata || existingProduct.metadata || {},
      });
      console.log('[updateCreatorProduct] Stripe product updated successfully.');
    }

    // 2. If price or currency changed, create a new Stripe price and archive the old one
    if (
      (updates.price !== undefined && updates.price !== existingProduct.price) ||
      (updates.currency !== undefined && updates.currency !== existingProduct.currency) ||
      (updates.product_type !== undefined && updates.product_type !== existingProduct.product_type)
    ) {
      console.log('[updateCreatorProduct] Price or product type changed, creating new Stripe price.');
      if (existingProduct.stripe_price_id) {
        console.log('[updateCreatorProduct] Archiving old Stripe price:', existingProduct.stripe_price_id);
        await archiveStripePrice(stripeAccountId, existingProduct.stripe_price_id);
      }

      newStripePriceId = await createStripePrice(stripeAccountId, {
        product: existingProduct.stripe_product_id!, // Ensure product ID is not null
        unit_amount: Math.round(updates.price! * 100), // Ensure price is not null
        currency: updates.currency || existingProduct.currency || 'usd',
        recurring: updates.product_type === 'subscription' ? { interval: 'month' } : undefined,
        metadata: updates.metadata || existingProduct.metadata || {},
      });
      console.log('[updateCreatorProduct] New Stripe price created:', newStripePriceId);
    }

    // 3. Update in Supabase
    console.log('[updateCreatorProduct] Updating product in Supabase DB');
    const { data, error } = await supabaseAdmin
      .from('creator_products')
      .update({
        ...updates,
        stripe_price_id: newStripePriceId, // Update with new price ID
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('[updateCreatorProduct] Supabase update error:', error);
      throw error;
    }
    console.log('[updateCreatorProduct] Product successfully updated in Supabase DB');
    return data;
  } catch (error) {
    console.error('[updateCreatorProduct] Error during product update:', error);
    throw error;
  }
}

export async function deleteCreatorProduct(productId: string): Promise<void> {
  console.log('[deleteCreatorProduct] Starting product deletion in DB and Stripe', { productId });
  const supabaseAdmin = await createSupabaseAdminClient();

  // Get existing product to retrieve Stripe IDs and creator's Stripe account
  const { data: existingProduct, error: fetchError } = await supabaseAdmin
    .from('creator_products')
    .select('*, creator_profiles(stripe_account_id)')
    .eq('id', productId)
    .single();

  if (fetchError || !existingProduct) {
    throw new Error('Product not found or creator profile missing.');
  }

  const stripeAccountId = (existingProduct.creator_profiles as any)?.stripe_account_id;
  if (!stripeAccountId) {
    throw new Error('Creator Stripe account not connected.');
  }

  try {
    // 1. Delete product in Stripe
    console.log('[deleteCreatorProduct] Deleting Stripe product:', existingProduct.stripe_product_id);
    if (existingProduct.stripe_product_id) {
      await deleteStripeProduct(stripeAccountId, existingProduct.stripe_product_id);
      console.log('[deleteCreatorProduct] Stripe product deleted successfully.');
    }

    // 2. Delete from Supabase
    console.log('[deleteCreatorProduct] Deleting product from Supabase DB');
    const { error } = await supabaseAdmin
      .from('creator_products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('[deleteCreatorProduct] Supabase delete error:', error);
      throw error;
    }
    console.log('[deleteCreatorProduct] Product successfully deleted from Supabase DB');
  } catch (error) {
    console.error('[deleteCreatorProduct] Error during product deletion:', error);
    throw error;
  }
}

export async function getActiveCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', true)
    .is('metadata->deleted_at', null) // Exclude soft-deleted products
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// New function to get archived products
export async function getArchivedCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', false)
    .is('metadata->deleted_at', null) // Exclude soft-deleted products
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// New function to get deleted products (soft-deleted)
export async function getDeletedCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .not('metadata->deleted_at', 'is', null)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// Function to get product statistics
export async function getCreatorProductStats(creatorId: string): Promise<{
  total: number;
  active: number;
  archived: number;
  deleted: number;
}> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const [total, active, archived, deleted] = await Promise.all([
    supabaseAdmin
      .from('creator_products')
      .select('id', { count: 'exact' })
      .eq('creator_id', creatorId),
    supabaseAdmin
      .from('creator_products')
      .select('id', { count: 'exact' })
      .eq('creator_id', creatorId)
      .eq('active', true)
      .is('metadata->deleted_at', null),
    supabaseAdmin
      .from('creator_products')
      .select('id', { count: 'exact' })
      .eq('creator_id', creatorId)
      .eq('active', false)
      .is('metadata->deleted_at', null),
    supabaseAdmin
      .from('creator_products')
      .select('id', { count: 'exact' })
      .eq('creator_id', creatorId)
      .not('metadata->deleted_at', 'is', null)
  ]);

  return {
    total: total.count || 0,
    active: active.count || 0,
    archived: archived.count || 0,
    deleted: deleted.count || 0
  };
}