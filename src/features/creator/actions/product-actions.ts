'use server';

import { revalidatePath } from 'next/cache';
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
import { PricingChangeService } from '@/features/pricing/services/pricing-change-service';
import { ProductPriceManagementService } from '@/features/pricing/services/product-price-management';
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

// Enhanced product creation/update with full Stripe capabilities
export async function createOrUpdateEnhancedProductAction(productData: EnhancedProductData) {
  try {
    console.log('[Product Action] Starting product creation/update', { 
      productId: productData.id, 
      productName: productData.name,
      hasDescription: !!productData.description,
      hasImages: !!productData.images?.length,
      price: productData.price,
      currency: productData.currency
    });

    // Validate authentication
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      console.error('[Product Action] Authentication failed - no user ID');
      throw new Error('Not authenticated. Please log in and try again.');
    }

    console.log('[Product Action] User authenticated', { userId: user.id });

    // Validate product data
    if (!productData.name || productData.name.trim() === '') {
      throw new Error('Product name is required and cannot be empty.');
    }
    if (!productData.price || productData.price <= 0) {
      throw new Error('Product price must be greater than 0.');
    }
    if (!productData.currency || productData.currency.trim() === '') {
      throw new Error('Currency is required.');
    }
    if (!productData.product_type) {
      throw new Error('Product type is required.');
    }

    console.log('[Product Action] Product data validated successfully');

    // Get and validate creator profile
    const creatorProfile = await getCreatorProfile(user.id);
    console.log('[Product Action] Creator profile retrieved', { 
      hasProfile: !!creatorProfile,
      hasStripeAccount: !!creatorProfile?.stripe_account_id,
      stripeAccountId: creatorProfile?.stripe_account_id || 'none'
    });

    if (!creatorProfile?.stripe_account_id) {
      console.error('[Product Action] Stripe account not connected for user', { userId: user.id });
      throw new Error('Stripe account not connected. Please complete Stripe onboarding first.');
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

    // Sanitize and validate optional fields with fallbacks
    const sanitizedDescription = description?.trim() || null;
    const sanitizedImages = images?.filter(img => img && img.trim() !== '') || [];
    const sanitizedStatementDescriptor = statement_descriptor?.trim().substring(0, 22) || undefined; // Stripe limit
    const sanitizedUnitLabel = unit_label?.trim() || undefined;

    console.log('[Product Action] Optional fields sanitized', {
      hasDescription: !!sanitizedDescription,
      imageCount: sanitizedImages.length,
      hasStatementDescriptor: !!sanitizedStatementDescriptor,
      hasUnitLabel: !!sanitizedUnitLabel
    });

    // Add creator context to metadata with safe defaults
    const enhancedMetadata = {
      ...metadata,
      creator_id: user.id,
      features: features?.join(',') || '',
      category: category || '',
      tags: tags?.join(',') || ''
    };

    console.log('[Product Action] Getting Supabase admin client');
    const supabaseAdmin = await createSupabaseAdminClient();

    if (id) {
      console.log('[Product Action] Updating existing product', { productId: id });
      
      // Update existing product
      const { data: existingProduct, error } = await supabaseAdmin
        .from('creator_products')
        .select('stripe_product_id, stripe_price_id')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[Product Action] Failed to fetch existing product from Supabase', { 
          productId: id, 
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details
        });
        throw new Error(`Failed to fetch existing product: ${error.message}`);
      }

      if (!existingProduct) {
        console.error('[Product Action] Product not found', { productId: id });
        throw new Error('Product not found. It may have been deleted.');
      }

      console.log('[Product Action] Existing product found', { 
        stripeProductId: existingProduct.stripe_product_id,
        stripePriceId: existingProduct.stripe_price_id
      });

      if (existingProduct?.stripe_product_id) {
        // Prepare Stripe product update data, omitting description if empty
        const stripeProductUpdate: Stripe.ProductUpdateParams = {
          name,
          metadata: enhancedMetadata as Stripe.MetadataParam,
          images: sanitizedImages,
          statement_descriptor: sanitizedStatementDescriptor,
          unit_label: sanitizedUnitLabel,
          active,
        };
        
        if (sanitizedDescription) {
          stripeProductUpdate.description = sanitizedDescription;
        }

        console.log('[Product Action] Updating Stripe product', { 
          stripeProductId: existingProduct.stripe_product_id,
          stripeAccountId: creatorProfile.stripe_account_id,
          updateFields: Object.keys(stripeProductUpdate)
        });

        try {
          // Update Stripe product
          await updateStripeProduct(
            creatorProfile.stripe_account_id, 
            existingProduct.stripe_product_id, 
            stripeProductUpdate
          );
          console.log('[Product Action] Stripe product updated successfully');
        } catch (stripeError: any) {
          console.error('[Product Action] Stripe product update failed', { 
            error: stripeError.message,
            errorType: stripeError.type,
            errorCode: stripeError.code,
            stripeProductId: existingProduct.stripe_product_id,
            stripeAccountId: creatorProfile.stripe_account_id
          });
          throw new Error(`Failed to update product in Stripe: ${stripeError.message}`);
        }

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

        console.log('[Product Action] Creating new Stripe price', { 
          priceAmount: newPriceData.unit_amount,
          currency: newPriceData.currency,
          isSubscription: product_type === 'subscription'
        });

        try {
          // Create new price and archive old one
          const newStripePriceId = await createStripePrice(
            creatorProfile.stripe_account_id, 
            newPriceData
          );
          console.log('[Product Action] New Stripe price created', { newStripePriceId });
          
          if (existingProduct.stripe_price_id) {
            console.log('[Product Action] Archiving old price', { 
              oldPriceId: existingProduct.stripe_price_id 
            });
            await archiveStripePrice(
              creatorProfile.stripe_account_id, 
              existingProduct.stripe_price_id
            );
            console.log('[Product Action] Old price archived successfully');
          }

          // Update database record
          console.log('[Product Action] Updating product in Supabase database');
          const { error: updateError } = await supabaseAdmin
            .from('creator_products')
            .update({ 
              name, 
              description: sanitizedDescription,
              price, 
              image_url: sanitizedImages?.[0] || null, 
              active, 
              product_type,
              currency,
              metadata: enhancedMetadata,
              stripe_price_id: newStripePriceId,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (updateError) {
            console.error('[Product Action] Failed to update product in Supabase', { 
              error: updateError.message,
              errorCode: updateError.code,
              errorDetails: updateError.details
            });
            throw new Error(`Failed to update product in database: ${updateError.message}`);
          }
          
          console.log('[Product Action] Product updated in database successfully');
        } catch (priceError: any) {
          console.error('[Product Action] Price creation/archival failed', { 
            error: priceError.message,
            errorType: priceError.type,
            errorCode: priceError.code
          });
          throw new Error(`Failed to update product pricing: ${priceError.message}`);
        }
      }
      } else {
      console.log('[Product Action] Creating new product');
      
      // Prepare Stripe product create data, omitting description if empty
      const stripeProductCreate: Stripe.ProductCreateParams = {
        name,
        metadata: enhancedMetadata as Stripe.MetadataParam,
        images: sanitizedImages,
        statement_descriptor: sanitizedStatementDescriptor,
        unit_label: sanitizedUnitLabel,
        active,
      };
      
      if (sanitizedDescription) {
        stripeProductCreate.description = sanitizedDescription;
      }

      console.log('[Product Action] Creating Stripe product', { 
        stripeAccountId: creatorProfile.stripe_account_id,
        productName: name,
        hasDescription: !!sanitizedDescription,
        imageCount: sanitizedImages.length
      });

      let stripeProductId: string;
      try {
        // Create new product
        stripeProductId = await createStripeProduct(
          creatorProfile.stripe_account_id, 
          stripeProductCreate
        );
        console.log('[Product Action] Stripe product created', { stripeProductId });
      } catch (stripeError: any) {
        console.error('[Product Action] Stripe product creation failed', { 
          error: stripeError.message,
          errorType: stripeError.type,
          errorCode: stripeError.code,
          stripeAccountId: creatorProfile.stripe_account_id
        });
        throw new Error(`Failed to create product in Stripe: ${stripeError.message}`);
      }

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

      console.log('[Product Action] Creating Stripe price', { 
        stripeProductId,
        priceAmount: priceData.unit_amount,
        isSubscription: product_type === 'subscription'
      });

      let stripePriceId: string;
      try {
        stripePriceId = await createStripePrice(
          creatorProfile.stripe_account_id, 
          priceData
        );
        console.log('[Product Action] Stripe price created', { stripePriceId });
      } catch (priceError: any) {
        console.error('[Product Action] Stripe price creation failed', { 
          error: priceError.message,
          errorType: priceError.type,
          errorCode: priceError.code,
          stripeProductId
        });
        throw new Error(`Failed to create price in Stripe: ${priceError.message}`);
      }

      console.log('[Product Action] Inserting product into Supabase database');
      const { error } = await supabaseAdmin.from('creator_products').insert({
        creator_id: user.id,
        name,
        description: sanitizedDescription,
        price,
        image_url: sanitizedImages?.[0] || null,
        active,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        currency,
        product_type,
        metadata: enhancedMetadata,
      });

      if (error) {
        console.error('[Product Action] Failed to insert product into Supabase', { 
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          stripeProductId,
          stripePriceId
        });
        throw new Error(`Failed to save product to database: ${error.message}`);
      }

      console.log('[Product Action] Product created successfully in database');
    }

    console.log('[Product Action] Revalidating paths');
    revalidatePath('/creator/products-and-tiers');
    
    console.log('[Product Action] Product creation/update completed successfully');
  } catch (error: any) {
    console.error('[Product Action] Product creation/update failed', { 
      error: error.message,
      errorStack: error.stack,
      productData: {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        currency: productData.currency,
        product_type: productData.product_type
      }
    });
    
    // Re-throw with enhanced error message
    if (error.message) {
      throw error; // Already has a good message
    } else {
      throw new Error(`Product creation/update failed: ${error.toString()}`);
    }
  }
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
  try {
    console.log('[Archive Product] Starting archive', { productId, reason });
    
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      console.error('[Archive Product] Not authenticated');
      throw new Error('Not authenticated. Please log in and try again.');
    }

    const creatorProfile = await getCreatorProfile(user.id);
    if (!creatorProfile?.stripe_account_id) {
      console.error('[Archive Product] Stripe account not connected', { userId: user.id });
      throw new Error('Stripe account not connected. Please complete Stripe onboarding first.');
    }

    const supabaseAdmin = await createSupabaseAdminClient();
    const { data: productToArchive, error } = await supabaseAdmin
      .from('creator_products')
      .update({ 
        active: false,
        metadata: { archived_at: new Date().toISOString(), archived_reason: reason || 'Manual archive' }
      })
      .eq('id', productId)
      .select('stripe_product_id')
      .single();

    if (error) {
      console.error('[Archive Product] Failed to archive in database', { 
        error: error.message,
        productId 
      });
      throw new Error(`Failed to archive product: ${error.message}`);
    }

    if (productToArchive?.stripe_product_id) {
      try {
        await archiveStripeProduct(creatorProfile.stripe_account_id, productToArchive.stripe_product_id);
        console.log('[Archive Product] Archived in Stripe successfully');
      } catch (stripeError: any) {
        console.error('[Archive Product] Failed to archive in Stripe', { 
          error: stripeError.message,
          stripeProductId: productToArchive.stripe_product_id
        });
        // Continue even if Stripe fails - database is already updated
      }
    }

    revalidatePath('/creator/products-and-tiers');
    console.log('[Archive Product] Product archived successfully');
  } catch (error: any) {
    console.error('[Archive Product] Failed to archive product', { 
      error: error.message,
      productId 
    });
    throw error;
  }
}

// New function for permanent product deletion
export async function deleteCreatorProductAction(productId: string, reason?: string) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');


  const creatorProfile = await getCreatorProfile(user.id);
  if (!creatorProfile?.stripe_account_id) throw new Error('Stripe account not connected');

  const supabaseAdmin = await createSupabaseAdminClient();
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


  const supabaseAdmin = await createSupabaseAdminClient();
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


  const supabaseAdmin = await createSupabaseAdminClient();
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