"use server";

import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getProducts } from '@/features/pricing/controllers/get-products';
import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertPlatformProduct,upsertProduct } from '@/features/pricing/controllers/upsert-product';
import { PricingChangeService } from '@/features/pricing/services/pricing-change-service';
import { ProductPriceManagementService } from '@/features/pricing/services/product-price-management';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface ProductData {
  id?: string;
  name: string;
  description: string;
  image?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  active: boolean;
  approved?: boolean;
  isPlatformProduct?: boolean;
}

export async function createPlatformProductAction(productData: ProductData) {
  try {
    console.log('[Platform Product] Starting creation', { 
      productName: productData.name,
      monthlyPrice: productData.monthlyPrice,
      yearlyPrice: productData.yearlyPrice
    });

    const user = await getAuthenticatedUser();
    if (!user?.id) {
      console.error('[Platform Product] Not authenticated');
      throw new Error('Not authenticated. Please log in and try again.');
    }

    // Validate product data
    if (!productData.name || productData.name.trim() === '') {
      throw new Error('Product name is required and cannot be empty.');
    }
    if (!productData.description || productData.description.trim() === '') {
      throw new Error('Product description is required and cannot be empty.');
    }
    if (!productData.monthlyPrice || productData.monthlyPrice <= 0) {
      throw new Error('Monthly price must be greater than 0.');
    }
    if (!productData.yearlyPrice || productData.yearlyPrice <= 0) {
      throw new Error('Yearly price must be greater than 0.');
    }

    console.log('[Platform Product] Product data validated');

    // Sanitize optional fields
    const sanitizedImage = productData.image?.trim() || undefined;

    // 1. Create Product in Stripe
    console.log('[Platform Product] Creating Stripe product');
    let stripeProduct;
    try {
      stripeProduct = await stripeAdmin.products.create({
        name: productData.name,
        description: productData.description,
        images: sanitizedImage ? [sanitizedImage] : [],
        active: true,
      });
      console.log('[Platform Product] Stripe product created', { 
        stripeProductId: stripeProduct.id 
      });
    } catch (stripeError: any) {
      console.error('[Platform Product] Stripe product creation failed', { 
        error: stripeError.message,
        errorType: stripeError.type,
        errorCode: stripeError.code
      });
      throw new Error(`Failed to create product in Stripe: ${stripeError.message}`);
    }

    // 2. Create Prices in Stripe
    console.log('[Platform Product] Creating Stripe prices');
    let monthlyStripePrice, yearlyStripePrice;
    try {
      [monthlyStripePrice, yearlyStripePrice] = await Promise.all([
        stripeAdmin.prices.create({
          product: stripeProduct.id,
          unit_amount: Math.round(productData.monthlyPrice * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
        }),
        stripeAdmin.prices.create({
          product: stripeProduct.id,
          unit_amount: Math.round(productData.yearlyPrice * 100),
          currency: 'usd',
          recurring: { interval: 'year' },
        }),
      ]);
      console.log('[Platform Product] Stripe prices created', { 
        monthlyPriceId: monthlyStripePrice.id,
        yearlyPriceId: yearlyStripePrice.id 
      });
    } catch (priceError: any) {
      console.error('[Platform Product] Stripe price creation failed', { 
        error: priceError.message,
        errorType: priceError.type,
        errorCode: priceError.code,
        stripeProductId: stripeProduct.id
      });
      throw new Error(`Failed to create prices in Stripe: ${priceError.message}`);
    }

    // 3. Sync with Supabase immediately to avoid race conditions with webhooks
    console.log('[Platform Product] Syncing with Supabase');
    try {
      await upsertPlatformProduct(stripeProduct, {
        approved: productData.approved ?? true,
        isPlatformProduct: true,
        platformOwnerId: user.id
      });
      await Promise.all([
        upsertPrice(monthlyStripePrice), 
        upsertPrice(yearlyStripePrice)
      ]);
      console.log('[Platform Product] Synced with Supabase successfully');
    } catch (supabaseError: any) {
      console.error('[Platform Product] Supabase sync failed', { 
        error: supabaseError.message,
        stripeProductId: stripeProduct.id
      });
      throw new Error(`Failed to sync product with database: ${supabaseError.message}`);
    }

    revalidatePath('/dashboard/products');
    revalidatePath('/');
    revalidatePath('/pricing');
    
    console.log('[Platform Product] Product created successfully');
    return getProducts({ includeInactive: true });
  } catch (error: any) {
    console.error('[Platform Product] Product creation failed', { 
      error: error.message,
      errorStack: error.stack,
      productData: {
        name: productData.name,
        monthlyPrice: productData.monthlyPrice,
        yearlyPrice: productData.yearlyPrice
      }
    });
    throw error;
  }
}

export async function updatePlatformProductAction(productData: ProductData) {
  try {
    console.log('[Platform Product Update] Starting update', { 
      productId: productData.id,
      productName: productData.name
    });

    const user = await getAuthenticatedUser();
    if (!user?.id) {
      console.error('[Platform Product Update] Not authenticated');
      throw new Error('Not authenticated. Please log in and try again.');
    }

    if (!productData.id) {
      throw new Error('Product ID is required for updates.');
    }

    // Validate product data
    if (!productData.name || productData.name.trim() === '') {
      throw new Error('Product name is required and cannot be empty.');
    }
    if (!productData.monthlyPrice || productData.monthlyPrice <= 0) {
      throw new Error('Monthly price must be greater than 0.');
    }
    if (!productData.yearlyPrice || productData.yearlyPrice <= 0) {
      throw new Error('Yearly price must be greater than 0.');
    }

    console.log('[Platform Product Update] Product data validated');

    // 1. Analyze price change impact before making changes
    console.log('[Platform Product Update] Retrieving current product from Stripe');
    let currentProduct, existingPrices;
    try {
      currentProduct = await stripeAdmin.products.retrieve(productData.id);
      existingPrices = await stripeAdmin.prices.list({ product: productData.id, active: true });
      console.log('[Platform Product Update] Current product and prices retrieved', {
        productId: productData.id,
        activePriceCount: existingPrices.data.length
      });
    } catch (stripeError: any) {
      console.error('[Platform Product Update] Failed to retrieve current product', { 
        error: stripeError.message,
        errorType: stripeError.type,
        productId: productData.id
      });
      throw new Error(`Failed to retrieve current product: ${stripeError.message}`);
    }
    
    const currentMonthlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'month')?.unit_amount || 0;
    const currentYearlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'year')?.unit_amount || 0;
    const newMonthlyAmount = Math.round(productData.monthlyPrice * 100);
    const newYearlyAmount = Math.round(productData.yearlyPrice * 100);

    // Check if this is a significant price change
    const monthlyChangePercentage = currentMonthlyPrice > 0 ? Math.abs(newMonthlyAmount - currentMonthlyPrice) / currentMonthlyPrice : 0;
    const yearlyChangePercentage = currentYearlyPrice > 0 ? Math.abs(newYearlyAmount - currentYearlyPrice) / currentYearlyPrice : 0;

    if (monthlyChangePercentage > 0.1 || yearlyChangePercentage > 0.1) {
      console.log('[Platform Product Update] Significant price change detected', {
        monthlyChangePercentage: (monthlyChangePercentage * 100).toFixed(2) + '%',
        yearlyChangePercentage: (yearlyChangePercentage * 100).toFixed(2) + '%'
      });

      try {
        // Analyze impact for significant price changes (>10%)
        const impactAnalysis = await ProductPriceManagementService.analyzePriceChangeImpact(
          productData.id,
          currentMonthlyPrice / 100,
          productData.monthlyPrice
        );

        console.log('[Platform Product Update] Price change impact analysis:', impactAnalysis);

        // Create pricing change notification if there are existing subscribers
        if (impactAnalysis.existing_subscribers > 0) {
          await PricingChangeService.createPricingChangeNotification(
            user.id,
            productData.id,
            {
              change_type: newMonthlyAmount > currentMonthlyPrice ? 'price_increase' : 'price_decrease',
              old_data: {
                price: currentMonthlyPrice / 100,
              },
              new_data: {
                price: productData.monthlyPrice,
              },
              effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              reason: 'Platform pricing adjustment',
            }
          );
          console.log('[Platform Product Update] Price change notification created');
        }
      } catch (analysisError: any) {
        console.error('[Platform Product Update] Price impact analysis failed', { 
          error: analysisError.message 
        });
        // Continue with update even if analysis fails
      }
    }

    // 2. Update Product in Stripe
    console.log('[Platform Product Update] Updating Stripe product');
    let stripeProduct;
    try {
      stripeProduct = await stripeAdmin.products.update(productData.id, {
        name: productData.name,
        description: productData.description,
        images: productData.image ? [productData.image] : [],
        active: productData.active,
      });
      console.log('[Platform Product Update] Stripe product updated successfully');
    } catch (stripeError: any) {
      console.error('[Platform Product Update] Failed to update Stripe product', { 
        error: stripeError.message,
        errorType: stripeError.type,
        errorCode: stripeError.code
      });
      throw new Error(`Failed to update product in Stripe: ${stripeError.message}`);
    }

    // 3. Handle Price Updates by creating new prices and archiving old ones
    const pricesToUpsert: Stripe.Price[] = [];

    console.log('[Platform Product Update] Handling price updates');
    try {
      if (!existingPrices.data.find(p => p.recurring?.interval === 'month') || existingPrices.data.find(p => p.recurring?.interval === 'month')?.unit_amount !== newMonthlyAmount) {
        const existingMonthlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'month');
        if (existingMonthlyPrice) {
          // Create audit record for price change
          await ProductPriceManagementService.createPriceChangeAudit(
            productData.id,
            existingMonthlyPrice.id,
            'new_monthly_price',
            'Platform pricing update',
            await ProductPriceManagementService.analyzePriceChangeImpact(productData.id, currentMonthlyPrice / 100, productData.monthlyPrice)
          );
          
          pricesToUpsert.push(await stripeAdmin.prices.update(existingMonthlyPrice.id, { active: false }));
        }
        pricesToUpsert.push(await stripeAdmin.prices.create({
          product: productData.id,
          unit_amount: newMonthlyAmount,
          currency: 'usd',
          recurring: { interval: 'month' },
          active: productData.active,
        }));
      }

      if (!existingPrices.data.find(p => p.recurring?.interval === 'year') || existingPrices.data.find(p => p.recurring?.interval === 'year')?.unit_amount !== newYearlyAmount) {
        const existingYearlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'year');
        if (existingYearlyPrice) {
          // Create audit record for price change
          await ProductPriceManagementService.createPriceChangeAudit(
            productData.id,
            existingYearlyPrice.id,
            'new_yearly_price',
            'Platform pricing update',
            await ProductPriceManagementService.analyzePriceChangeImpact(productData.id, currentYearlyPrice / 100, productData.yearlyPrice)
          );
          
          pricesToUpsert.push(await stripeAdmin.prices.update(existingYearlyPrice.id, { active: false }));
        }
        pricesToUpsert.push(await stripeAdmin.prices.create({
          product: productData.id,
          unit_amount: newYearlyAmount,
          currency: 'usd',
          recurring: { interval: 'year' },
          active: productData.active,
        }));
      }

      // If product is being archived, archive all its active prices
      if (productData.active === false) {
        for (const price of existingPrices.data) {
          if (price.active) {
            pricesToUpsert.push(await stripeAdmin.prices.update(price.id, { active: false }));
          }
        }
      }

      console.log('[Platform Product Update] Price updates completed', {
        pricesUpdated: pricesToUpsert.length
      });
    } catch (priceError: any) {
      console.error('[Platform Product Update] Failed to update prices', { 
        error: priceError.message,
        errorType: priceError.type,
        errorCode: priceError.code
      });
      throw new Error(`Failed to update product prices: ${priceError.message}`);
    }

    // 4. Sync all changes with Supabase
    console.log('[Platform Product Update] Syncing with Supabase');
    try {
      await upsertProduct(stripeProduct);
      if (pricesToUpsert.length > 0) {
        await Promise.all(pricesToUpsert.map(p => upsertPrice(p)));
      }
      console.log('[Platform Product Update] Synced with Supabase successfully');
    } catch (supabaseError: any) {
      console.error('[Platform Product Update] Failed to sync with Supabase', { 
        error: supabaseError.message
      });
      throw new Error(`Failed to sync product with database: ${supabaseError.message}`);
    }

    revalidatePath('/dashboard/products');
    revalidatePath('/');
    revalidatePath('/pricing');
    
    console.log('[Platform Product Update] Product updated successfully');
    return getProducts({ includeInactive: true });
  } catch (error: any) {
    console.error('[Platform Product Update] Product update failed', { 
      error: error.message,
      errorStack: error.stack,
      productData: {
        id: productData.id,
        name: productData.name,
        monthlyPrice: productData.monthlyPrice,
        yearlyPrice: productData.yearlyPrice
      }
    });
    throw error;
  }
}

export async function approvePlatformProductAction(productId: string, approved: boolean = true) {
  try {
    console.log('[Approve Product] Starting approval', { productId, approved });
    
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      console.error('[Approve Product] Not authenticated');
      throw new Error('Not authenticated. Please log in and try again.');
    }

    // Validate product ID
    if (!productId || productId.trim() === '') {
      throw new Error('Product ID is required.');
    }

    // Check if user is platform owner
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[Approve Product] Failed to fetch user role', { 
        error: userError.message,
        userId: user.id
      });
      throw new Error('Failed to verify user permissions.');
    }

    if (userData?.role !== 'platform_owner') {
      console.error('[Approve Product] User is not platform owner', { 
        userId: user.id,
        role: userData?.role
      });
      throw new Error('Only platform owners can approve products.');
    }

    console.log('[Approve Product] User is platform owner, proceeding with approval');

    // Update both products and creator_products tables
    // Update products table
    const { error: productsError } = await supabase
      .from('products')
      .update({ 
        approved,
        platform_owner_id: user.id,
        is_platform_product: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (productsError) {
      console.error('[Approve Product] Failed to update products table', { 
        error: productsError.message,
        productId
      });
    } else {
      console.log('[Approve Product] Products table updated successfully');
    }

    // Update creator_products table if it exists
    const { error: creatorProductsError } = await supabase
      .from('creator_products')
      .update({ 
        approved,
        platform_owner_id: user.id,
        is_platform_product: true,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_product_id', productId);

    if (creatorProductsError) {
      console.error('[Approve Product] Failed to update creator_products table', { 
        error: creatorProductsError.message,
        productId
      });
    } else {
      console.log('[Approve Product] Creator products table updated successfully');
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/products');
    revalidatePath('/');
    revalidatePath('/pricing');
    
    console.log('[Approve Product] Product approval completed', { 
      productId, 
      approved 
    });
    
    return { success: true, approved };
  } catch (error: any) {
    console.error('[Approve Product] Product approval failed', { 
      error: error.message,
      productId,
      approved
    });
    throw error;
  }
}