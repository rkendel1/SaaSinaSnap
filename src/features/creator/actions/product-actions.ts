'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import Stripe from 'stripe'; // Correctly import Stripe

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import type { EnhancedProductData } from '@/features/creator/types';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { 
  archiveStripePrice, 
  archiveStripeProduct,
  createStripePrice, 
  createStripeProduct, 
  deleteStripeProduct,
  updateStripePrice,
  updateStripeProduct} from '@/features/creator-onboarding/controllers/stripe-connect';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

interface ProductData {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  active: boolean;
  product_type: 'one_time' | 'subscription';
}

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

// Enhanced product creation/update with full Stripe capabilities
export async function createOrUpdateEnhancedProductAction(productData: EnhancedProductData) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const tenantId = getTenantIdFromHeaders();
  if (!tenantId) throw new Error('Tenant context not found');

  const creatorProfile = await getCreatorProfile(user.id); // Removed tenantId argument
  if (!creatorProfile?.stripe_account_id) {
    throw new Error('Stripe account not connected');
  }

  const { 
    id, 
    name, 
    description, 
    images, 
    price, 
    currency = 'usd',
    active, 
    product_type,
    metadata = {},
    billing_interval = 'month',
    billing_interval_count = 1,
    trial_period_days,
    statement_descriptor,
    unit_label,
    features,
    category,
    tags
  } = productData;

  // Add creator context to metadata
  const enhancedMetadata = {
    ...metadata,
    creator_id: user.id,
    features: features?.join(',') || '',
    category: category || '',
    tags: tags?.join(',') || ''
  };

  const supabaseAdmin = await createSupabaseAdminClient(tenantId);

  if (id) {
    // Update existing product
    const { data: existingProduct, error } = await supabaseAdmin
      .from('creator_products')
      .select('stripe_product_id, stripe_price_id')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (existingProduct?.stripe_product_id) {
      // Prepare Stripe product update data, omitting description if empty
      const stripeProductUpdate: Stripe.ProductUpdateParams = {
        name,
        metadata: enhancedMetadata as Stripe.MetadataParam, // Cast to MetadataParam
        images: images || [],
        statement_descriptor,
        unit_label,
        active,
      };
      if (description && description.trim() !== '') {
        stripeProductUpdate.description = description;
      } else {
        // If description is empty, and Stripe doesn't allow unsetting,
        // we simply don't include it in the update payload.
        // If it was previously set, it will remain.
      }

      // Update Stripe product
      await updateStripeProduct(creatorProfile.stripe_account_id, existingProduct.stripe_product_id, stripeProductUpdate);

      // Handle price updates (create new price if needed)
      const newPriceData: Stripe.PriceCreateParams = {
        product: existingProduct.stripe_product_id,
        unit_amount: Math.round(price * 100),
        currency,
      };

      if (product_type === 'subscription') {
        newPriceData.recurring = { 
          interval: billing_interval,
          interval_count: billing_interval_count,
          trial_period_days
        };
      }

      // Create new price and archive old one
      const newStripePriceId = await createStripePrice(creatorProfile.stripe_account_id, newPriceData);
      
      if (existingProduct.stripe_price_id) {
        await archiveStripePrice(creatorProfile.stripe_account_id, existingProduct.stripe_price_id);
      }

      // Update database record
      const { error: updateError } = await supabaseAdmin
        .from('creator_products')
        .update({ 
          name, 
          description: description || null, // Store null in DB if empty
          price, 
          image_url: images?.[0] || null, 
          active, 
          product_type,
          currency,
          metadata: enhancedMetadata,
          stripe_price_id: newStripePriceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;
    }
  } else {
    // Prepare Stripe product create data, omitting description if empty
    const stripeProductCreate: Stripe.ProductCreateParams = {
      name,
      metadata: enhancedMetadata as Stripe.MetadataParam, // Cast to MetadataParam
      images: images || [],
      statement_descriptor,
      unit_label,
      active,
    };
    if (description && description.trim() !== '') {
      stripeProductCreate.description = description;
    }

    // Create new product
    const stripeProductId = await createStripeProduct(creatorProfile.stripe_account_id, stripeProductCreate);

    const priceData: Stripe.PriceCreateParams = {
      product: stripeProductId,
      unit_amount: Math.round(price * 100),
      currency,
    };

    if (product_type === 'subscription') {
      priceData.recurring = { 
        interval: billing_interval,
        interval_count: billing_interval_count,
        trial_period_days
      };
    }

    const stripePriceId = await createStripePrice(creatorProfile.stripe_account_id, priceData);

    const { error } = await supabaseAdmin.from('creator_products').insert({
      creator_id: user.id,
      name,
      description: description || null, // Store null in DB if empty
      price,
      image_url: images?.[0] || null,
      active,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      currency,
      product_type,
      metadata: enhancedMetadata,
    });

    if (error) throw error;
  }

  revalidatePath('/creator/products-and-tiers'); // Revalidate new central hub
}

// Legacy function for backward compatibility
export async function createOrUpdateCreatorProductAction(productData: ProductData) {
  const enhancedData: EnhancedProductData = {
    ...productData,
    images: productData.image_url ? [productData.image_url] : [],
    currency: 'usd',
  };
  
  return createOrUpdateEnhancedProductAction(enhancedData);
}

export async function archiveCreatorProductAction(productId: string, reason?: string) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const tenantId = getTenantIdFromHeaders();
  if (!tenantId) throw new Error('Tenant context not found');

  const creatorProfile = await getCreatorProfile(user.id); // Removed tenantId argument
  if (!creatorProfile?.stripe_account_id) throw new Error('Stripe account not connected');

  const supabaseAdmin = await createSupabaseAdminClient(tenantId);
  const { data: productToArchive, error } = await supabaseAdmin
    .from('creator_products')
    .update({ 
      active: false,
      metadata: { archived_at: new Date().toISOString(), archived_reason: reason || 'Manual archive' }
    })
    .eq('id', productId)
    .select('stripe_product_id')
    .single();

  if (error) throw error;

  if (productToArchive?.stripe_product_id) {
    await archiveStripeProduct(creatorProfile.stripe_account_id, productToArchive.stripe_product_id);
  }

  revalidatePath('/creator/products-and-tiers'); // Revalidate new central hub
}

// New function for permanent product deletion
export async function deleteCreatorProductAction(productId: string, reason?: string) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const tenantId = getTenantIdFromHeaders();
  if (!tenantId) throw new Error('Tenant context not found');

  const creatorProfile = await getCreatorProfile(user.id); // Removed tenantId argument
  if (!creatorProfile?.stripe_account_id) throw new Error('Stripe account not connected');

  const supabaseAdmin = await createSupabaseAdminClient(tenantId);
  // Check if product has active subscriptions
  const { data: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('price_id', productId)
    .eq('status', 'active')
    .limit(1);

  if (activeSubscriptions && activeSubscriptions.length > 0) {
    throw new Error('Cannot delete product with active subscriptions. Archive it instead.');
  }

  const { data: productToDelete, error } = await supabaseAdmin
    .from('creator_products')
    .select('stripe_product_id')
    .eq('id', productId)
    .single();

  if (error) throw error;

  // Delete from Stripe first
  if (productToDelete?.stripe_product_id) {
    try {
      await deleteStripeProduct(creatorProfile.stripe_account_id, productToDelete.stripe_product_id);
    } catch (stripeError) {
      // If Stripe deletion fails, we still want to mark as deleted in our DB
      console.error('Failed to delete from Stripe:', stripeError);
    }
  }

  // Soft delete in our database (mark as deleted instead of actually deleting)
  const { error: deleteError } = await supabaseAdmin
    .from('creator_products')
    .update({
      active: false,
      metadata: { 
        deleted_at: new Date().toISOString(), 
        deletion_reason: reason || 'Manual deletion',
        stripe_product_deleted: true
      }
    })
    .eq('id', productId);

  if (deleteError) throw deleteError;

  revalidatePath('/creator/products-and-tiers'); // Revalidate new central hub
}

// New function for product duplication
export async function duplicateCreatorProductAction(productId: string, newName?: string) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const tenantId = getTenantIdFromHeaders();
  if (!tenantId) throw new Error('Tenant context not found');

  const supabaseAdmin = await createSupabaseAdminClient(tenantId);
  const { data: originalProduct, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('id', productId)
    .eq('creator_id', user.id) // Use user.id directly
    .single();

  if (error) throw error;

  const duplicatedProduct: EnhancedProductData = {
    name: newName || `${originalProduct.name} (Copy)`,
    description: originalProduct.description || '',
    price: originalProduct.price || 0,
    currency: originalProduct.currency || 'usd',
    product_type: (originalProduct.product_type as any) || 'one_time',
    active: false, // Start as inactive
    images: originalProduct.image_url ? [originalProduct.image_url] : [],
    metadata: typeof originalProduct.metadata === 'object' && originalProduct.metadata !== null 
      ? originalProduct.metadata as Record<string, string>
      : {},
  };

  return createOrUpdateEnhancedProductAction(duplicatedProduct);
}

// Get product statistics for dashboard
export async function getCreatorProductStatsAction() {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const tenantId = getTenantIdFromHeaders();
  if (!tenantId) throw new Error('Tenant context not found');

  const supabaseAdmin = await createSupabaseAdminClient(tenantId);
  const { data: products, error } = await supabaseAdmin
    .from('creator_products')
    .select('active, metadata')
    .eq('creator_id', user.id);

  if (error) throw error;

  const stats = {
    total: products.length,
    active: 0,
    archived: 0,
    deleted: 0
  };

  products.forEach(product => {
    const isDeleted = product.metadata && 
      typeof product.metadata === 'object' && 
      'deleted_at' in (product.metadata as any);
    
    if (isDeleted) {
      stats.deleted++;
    } else if (product.active) {
      stats.active++;
    } else {
      stats.archived++;
    }
  });

  return stats;
}