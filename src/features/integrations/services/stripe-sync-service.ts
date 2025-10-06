/**
 * Stripe Bidirectional Sync Service
 * Ensures platform is the source of truth while maintaining sync with Stripe
 */

import Stripe from 'stripe';

import { createStripeClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

export interface SyncResult {
  success: boolean;
  synced_items: number;
  errors: string[];
  conflicts: Array<{
    item_id: string;
    platform_value: any;
    stripe_value: any;
    resolution: 'platform_wins' | 'stripe_wins' | 'manual_required';
  }>;
}

export class StripeSyncService {
  /**
   * Sync product from Stripe to platform (webhook handler)
   * Links Stripe products to creators via metadata
   */
  static async syncProductFromStripe(
    stripeProduct: Stripe.Product,
    stripeAccountId?: string
  ): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    // Extract creator_id from metadata
    const creatorId = stripeProduct.metadata?.creator_id;
    
    if (!creatorId) {
      console.warn(`Product ${stripeProduct.id} has no creator_id in metadata, skipping sync`);
      return;
    }

    // Check if this is a creator product or platform product
    const isCreatorProduct = stripeProduct.metadata?.product_type === 'creator';

    if (isCreatorProduct) {
      // Sync to creator_products table
      const { data: existingProduct } = await supabase
        .from('creator_products')
        .select('*')
        .eq('stripe_product_id', stripeProduct.id)
        .eq('creator_id', creatorId)
        .single();

      const productData = {
        creator_id: creatorId,
        name: stripeProduct.name,
        description: stripeProduct.description || null,
        image_url: stripeProduct.images?.[0] || null,
        active: stripeProduct.active,
        stripe_product_id: stripeProduct.id,
        metadata: stripeProduct.metadata,
        updated_at: new Date().toISOString()
      };

      if (existingProduct) {
        // Update existing product
        await supabase
          .from('creator_products')
          .update(productData)
          .eq('id', existingProduct.id);
      } else {
        // Create new product record
        await supabase
          .from('creator_products')
          .insert(productData);
      }
    } else {
      // Sync to platform products table
      await supabase
        .from('products')
        .upsert({
          id: stripeProduct.id,
          active: stripeProduct.active,
          name: stripeProduct.name,
          description: stripeProduct.description || null,
          image: stripeProduct.images?.[0] || null,
          metadata: stripeProduct.metadata,
          approved: true,
          is_platform_product: true,
          platform_owner_id: creatorId
        });
    }
  }

  /**
   * Sync price from Stripe to platform (webhook handler)
   */
  static async syncPriceFromStripe(
    stripePrice: Stripe.Price,
    stripeAccountId?: string
  ): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    // Get product to find creator
    const productId = typeof stripePrice.product === 'string' 
      ? stripePrice.product 
      : stripePrice.product.id;

    const { data: creatorProduct } = await supabase
      .from('creator_products')
      .select('id, creator_id')
      .eq('stripe_product_id', productId)
      .single();

    if (creatorProduct) {
      // Update creator product with new price
      await supabase
        .from('creator_products')
        .update({
          price: stripePrice.unit_amount ? stripePrice.unit_amount / 100 : 0,
          currency: stripePrice.currency,
          stripe_price_id: stripePrice.id,
          product_type: stripePrice.recurring ? 'subscription' : 'one_time',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_product_id', productId)
        .eq('creator_id', creatorProduct.creator_id);
    } else {
      // Sync to platform prices table
      await supabase
        .from('prices')
        .upsert({
          id: stripePrice.id,
          product_id: productId,
          active: stripePrice.active,
          currency: stripePrice.currency,
          unit_amount: stripePrice.unit_amount,
          type: stripePrice.type,
          interval: stripePrice.recurring?.interval || null,
          interval_count: stripePrice.recurring?.interval_count || null,
          trial_period_days: stripePrice.recurring?.trial_period_days || null,
          metadata: stripePrice.metadata
        });
    }
  }

  /**
   * Sync product from platform to Stripe
   * Ensures Stripe reflects platform changes
   */
  static async syncProductToStripe(
    productId: string,
    creatorId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    // Get product and creator credentials
    const { data: product } = await supabase
      .from('creator_products')
      .select('*')
      .eq('id', productId)
      .eq('creator_id', creatorId)
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_test_access_token, stripe_production_access_token')
      .eq('id', creatorId)
      .single();

    if (!creator?.stripe_account_id) {
      throw new Error('Creator Stripe account not connected');
    }

    // Get environment-specific access token
    const accessToken = environment === 'test' 
      ? creator.stripe_test_access_token 
      : creator.stripe_production_access_token;

    const stripe = createStripeClient(environment, creator.stripe_account_id, accessToken || undefined);

    // Update or create Stripe product
    if (product.stripe_product_id) {
      await stripe.products.update(product.stripe_product_id, {
        name: product.name,
        description: product.description || undefined,
        images: (product as any).image_url ? [(product as any).image_url] : undefined,
        active: product.active ?? undefined,
        metadata: {
          ...(typeof product.metadata === 'object' && product.metadata !== null ? product.metadata as Record<string, string> : {}),
          creator_id: creatorId,
          product_type: 'creator',
          platform_product_id: product.id
        } as Stripe.MetadataParam
      });
    } else {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
        images: (product as any).image_url ? [(product as any).image_url] : undefined,
        active: product.active ?? undefined,
        metadata: {
          ...(typeof product.metadata === 'object' && product.metadata !== null ? product.metadata as Record<string, string> : {}),
          creator_id: creatorId,
          product_type: 'creator',
          platform_product_id: product.id
        } as Stripe.MetadataParam
      });

      // Update platform with Stripe ID
      await supabase
        .from('creator_products')
        .update({ stripe_product_id: stripeProduct.id })
        .eq('id', productId);
    }
  }

  /**
   * Detect and resolve sync conflicts
   */
  static async detectConflicts(
    creatorId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<SyncResult['conflicts']> {
    const supabase = await createSupabaseAdminClient();
    const conflicts: SyncResult['conflicts'] = [];

    // Get creator credentials
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_test_access_token, stripe_production_access_token')
      .eq('id', creatorId)
      .single();

    if (!creator?.stripe_account_id) {
      return conflicts;
    }

    const accessToken = environment === 'test' 
      ? creator.stripe_test_access_token 
      : creator.stripe_production_access_token;

    const stripe = createStripeClient(environment, creator.stripe_account_id, accessToken || undefined);

    // Get platform products
    const { data: platformProducts } = await supabase
      .from('creator_products')
      .select('*')
      .eq('creator_id', creatorId)
      .not('stripe_product_id', 'is', null);

    if (!platformProducts) {
      return conflicts;
    }

    // Check each product for conflicts
    for (const platformProduct of platformProducts) {
      try {
        const stripeProduct = await stripe.products.retrieve(platformProduct.stripe_product_id!);

        // Check for name conflicts
        if (stripeProduct.name !== platformProduct.name) {
          conflicts.push({
            item_id: platformProduct.id,
            platform_value: platformProduct.name,
            stripe_value: stripeProduct.name,
            resolution: 'platform_wins' // Platform is source of truth
          });
        }

        // Check for price conflicts
        if (stripeProduct.default_price) {
          const priceId = typeof stripeProduct.default_price === 'string'
            ? stripeProduct.default_price
            : stripeProduct.default_price.id;

          const stripePrice = await stripe.prices.retrieve(priceId);
          const stripePriceAmount = stripePrice.unit_amount ? stripePrice.unit_amount / 100 : 0;

          if (stripePriceAmount !== platformProduct.price) {
            conflicts.push({
              item_id: platformProduct.id,
              platform_value: platformProduct.price,
              stripe_value: stripePriceAmount,
              resolution: 'platform_wins'
            });
          }
        }
      } catch (error) {
        console.error(`Error checking product ${platformProduct.id}:`, error);
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts by syncing platform to Stripe
   */
  static async resolveConflicts(
    conflicts: SyncResult['conflicts'],
    creatorId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<void> {
    for (const conflict of conflicts) {
      if (conflict.resolution === 'platform_wins') {
        await this.syncProductToStripe(conflict.item_id, creatorId, environment);
      }
    }
  }

  /**
   * Full sync: Platform -> Stripe
   * Ensures Stripe matches platform state
   */
  static async fullSyncToStripe(
    creatorId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced_items: 0,
      errors: [],
      conflicts: []
    };

    const supabase = await createSupabaseAdminClient();

    // Get all creator products
    const { data: products } = await supabase
      .from('creator_products')
      .select('*')
      .eq('creator_id', creatorId);

    if (!products) {
      return result;
    }

    // Detect conflicts first
    result.conflicts = await this.detectConflicts(creatorId, environment);

    // Sync each product
    for (const product of products) {
      try {
        await this.syncProductToStripe(product.id, creatorId, environment);
        result.synced_items++;
      } catch (error) {
        result.success = false;
        result.errors.push(`Product ${product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Refresh OAuth tokens if expired
   */
  static async refreshOAuthTokens(
    creatorId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_test_refresh_token, stripe_production_refresh_token')
      .eq('id', creatorId)
      .single();

    if (!creator) {
      throw new Error('Creator not found');
    }

    const refreshToken = environment === 'test'
      ? creator.stripe_test_refresh_token
      : creator.stripe_production_refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Exchange refresh token for new access token
    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_secret: process.env.STRIPE_SECRET_KEY!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh OAuth token');
    }

    const data = await response.json();

    // Update tokens in database
    const updateData = environment === 'test'
      ? {
          stripe_test_access_token: data.access_token,
          stripe_test_refresh_token: data.refresh_token
        }
      : {
          stripe_production_access_token: data.access_token,
          stripe_production_refresh_token: data.refresh_token
        };

    await supabase
      .from('creator_profiles')
      .update(updateData)
      .eq('id', creatorId);
  }

  /**
   * Validate sync status
   */
  static async validateSyncStatus(
    creatorId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<{
    in_sync: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const supabase = await createSupabaseAdminClient();

    // Check for products without Stripe IDs
    const { data: productsWithoutStripe } = await supabase
      .from('creator_products')
      .select('id, name')
      .eq('creator_id', creatorId)
      .is('stripe_product_id', null);

    if (productsWithoutStripe && productsWithoutStripe.length > 0) {
      issues.push(`${productsWithoutStripe.length} products not synced to Stripe`);
      recommendations.push('Run full sync to create Stripe products');
    }

    // Check for conflicts
    const conflicts = await this.detectConflicts(creatorId, environment);
    if (conflicts.length > 0) {
      issues.push(`${conflicts.length} sync conflicts detected`);
      recommendations.push('Resolve conflicts to ensure data consistency');
    }

    // Check OAuth token validity
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_test_access_token, stripe_production_access_token')
      .eq('id', creatorId)
      .single();

    const accessToken = environment === 'test'
      ? creator?.stripe_test_access_token
      : creator?.stripe_production_access_token;

    if (!accessToken) {
      issues.push('No valid OAuth access token');
      recommendations.push('Reconnect Stripe account or refresh tokens');
    }

    return {
      in_sync: issues.length === 0,
      issues,
      recommendations
    };
  }
}