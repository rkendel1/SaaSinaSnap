'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { 
  createStripePrice, 
  createStripeProduct, 
  updateStripeProduct, 
  archiveStripeProduct,
  deleteStripeProduct,
  updateStripePrice,
  archiveStripePrice 
} from '@/features/creator-onboarding/controllers/stripe-connect';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { EnhancedProductData } from '@/features/creator/types';

interface ProductData {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  active: boolean;
  product_type: 'one_time' | 'subscription';
}

// Enhanced product creation/update with full Stripe capabilities
export async function createOrUpdateEnhancedProductAction(productData: EnhancedProductData) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const creatorProfile = await getCreatorProfile(user.id);
  if (!creatorProfile?.stripe_access_token) {
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

  if (id) {
    // Update existing product
    const { data: existingProduct, error } = await supabaseAdminClient
      .from('creator_products')
      .select('stripe_product_id, stripe_price_id')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (existingProduct?.stripe_product_id) {
      // Update Stripe product
      await updateStripeProduct(creatorProfile.stripe_access_token, existingProduct.stripe_product_id, {
        name,
        description,
        metadata: enhancedMetadata,
        images: images || [],
        statement_descriptor,
        unit_label,
        active,
      });

      // Handle price updates (create new price if needed)
      const newPriceData: any = {
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
      const newStripePriceId = await createStripePrice(creatorProfile.stripe_access_token, newPriceData);
      
      if (existingProduct.stripe_price_id) {
        await archiveStripePrice(creatorProfile.stripe_access_token, existingProduct.stripe_price_id);
      }

      // Update database record
      const { error: updateError } = await supabaseAdminClient
        .from('creator_products')
        .update({ 
          name, 
          description, 
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
    // Create new product
    const stripeProductId = await createStripeProduct(creatorProfile.stripe_access_token, {
      name,
      description,
      metadata: enhancedMetadata,
      images: images || [],
      statement_descriptor,
      unit_label,
      active,
    });

    const priceData: any = {
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

    const stripePriceId = await createStripePrice(creatorProfile.stripe_access_token, priceData);

    const { error } = await supabaseAdminClient.from('creator_products').insert({
      creator_id: user.id,
      name,
      description,
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

  revalidatePath('/creator/dashboard/products');
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

  const creatorProfile = await getCreatorProfile(user.id);
  if (!creatorProfile?.stripe_access_token) throw new Error('Stripe account not connected');

  const { data: productToArchive, error } = await supabaseAdminClient
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
    await archiveStripeProduct(creatorProfile.stripe_access_token, productToArchive.stripe_product_id);
  }

  revalidatePath('/creator/dashboard/products');
}

// New function for permanent product deletion
export async function deleteCreatorProductAction(productId: string, reason?: string) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const creatorProfile = await getCreatorProfile(user.id);
  if (!creatorProfile?.stripe_access_token) throw new Error('Stripe account not connected');

  // Check if product has active subscriptions
  const { data: activeSubscriptions } = await supabaseAdminClient
    .from('subscriptions')
    .select('id')
    .eq('price_id', productId)
    .eq('status', 'active')
    .limit(1);

  if (activeSubscriptions && activeSubscriptions.length > 0) {
    throw new Error('Cannot delete product with active subscriptions. Archive it instead.');
  }

  const { data: productToDelete, error } = await supabaseAdminClient
    .from('creator_products')
    .select('stripe_product_id')
    .eq('id', productId)
    .single();

  if (error) throw error;

  // Delete from Stripe first
  if (productToDelete?.stripe_product_id) {
    try {
      await deleteStripeProduct(creatorProfile.stripe_access_token, productToDelete.stripe_product_id);
    } catch (stripeError) {
      // If Stripe deletion fails, we still want to mark as deleted in our DB
      console.error('Failed to delete from Stripe:', stripeError);
    }
  }

  // Soft delete in our database (mark as deleted instead of actually deleting)
  const { error: deleteError } = await supabaseAdminClient
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

  revalidatePath('/creator/dashboard/products');
}

// New function for product duplication
export async function duplicateCreatorProductAction(productId: string, newName?: string) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const { data: originalProduct, error } = await supabaseAdminClient
    .from('creator_products')
    .select('*')
    .eq('id', productId)
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

// New function for bulk operations
export async function bulkArchiveProductsAction(productIds: string[], reason?: string) {
  const results = await Promise.allSettled(
    productIds.map(id => archiveCreatorProductAction(id, reason))
  );
  
  const failed = results.filter(r => r.status === 'rejected').length;
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  
  return { succeeded, failed };
}

export async function bulkDeleteProductsAction(productIds: string[], reason?: string) {
  const results = await Promise.allSettled(
    productIds.map(id => deleteCreatorProductAction(id, reason))
  );
  
  const failed = results.filter(r => r.status === 'rejected').length;
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  
  return { succeeded, failed };
}

// Get product statistics for dashboard
export async function getCreatorProductStatsAction() {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const { data: products, error } = await supabaseAdminClient
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