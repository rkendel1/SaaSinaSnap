import Stripe from 'stripe';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Json, Tables, TablesInsert, TablesUpdate } from '@/libs/supabase/types';

import type {
  CreateTierRequest,
  CustomerTierAssignment,
  CustomerTierInfo,
  SubscriptionTier,
  TierAnalytics,
  TierEnforcementResult,
  TierUpgradeOption,
  TierUsageOverage,
  UpdateTierRequest,
  UsageMeter,
} from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export class TierManagementService {
  /**
   * Get predefined tier templates
   */
  static getTierTemplates(): CreateTierRequest[] {
    return [
      {
        name: 'Starter',
        description: 'Perfect for individuals and small projects',
        price: 9.99,
        currency: 'usd',
        billing_cycle: 'monthly',
        feature_entitlements: [
          'basic_support',
          'core_features',
          'user_accounts:1'
        ],
        usage_caps: {
          api_calls: 10000,
          storage_gb: 5,
          projects_created: 3
        },
        trial_period_days: 14
      },
      {
        name: 'Pro',
        description: 'Advanced features for growing businesses',
        price: 29.99,
        currency: 'usd',
        billing_cycle: 'monthly',
        feature_entitlements: [
          'priority_support',
          'advanced_analytics',
          'team_collaboration',
          'user_accounts:10',
          'api_access'
        ],
        usage_caps: {
          api_calls: 100000,
          storage_gb: 50,
          projects_created: 25
        },
        trial_period_days: 14
      },
      {
        name: 'Enterprise',
        description: 'Full-featured solution for large organizations',
        price: 99.99,
        currency: 'usd',
        billing_cycle: 'monthly',
        feature_entitlements: [
          'dedicated_support',
          'custom_integrations',
          'advanced_security',
          'user_accounts:unlimited',
          'api_access',
          'white_labeling'
        ],
        usage_caps: {
          api_calls: 1000000,
          storage_gb: 500,
          projects_created: 100
        },
        trial_period_days: 30
      }
    ];
  }

  /**
   * Clone an existing tier
   */
  static async cloneTier(creatorId: string, tierId: string, newTierData?: Partial<CreateTierRequest>): Promise<SubscriptionTier> {
    const originalTier = await this.getTier(tierId, creatorId);
    if (!originalTier) {
      throw new Error('Tier not found');
    }

    const cloneRequest: CreateTierRequest = {
      name: newTierData?.name || `${originalTier.name} (Copy)`,
      description: newTierData?.description || originalTier.description,
      price: newTierData?.price || originalTier.price,
      currency: newTierData?.currency || originalTier.currency,
      billing_cycle: newTierData?.billing_cycle || (originalTier.billing_cycle as 'monthly' | 'yearly' | 'weekly' | 'daily'), // Cast to specific type
      feature_entitlements: newTierData?.feature_entitlements || [...(originalTier.feature_entitlements || [])],
      usage_caps: newTierData?.usage_caps || { ...(originalTier.usage_caps || {}) },
      trial_period_days: newTierData?.trial_period_days !== undefined ? newTierData.trial_period_days : originalTier.trial_period_days,
      is_default: false // Never clone as default
    };

    return this.createTier(creatorId, cloneRequest);
  }

  /**
   * Preview usage impact for tier changes
   */
  static async previewUsageImpact(creatorId: string, tierData: CreateTierRequest | UpdateTierRequest): Promise<{
    projectedOverages: Array<{
      metric: string;
      currentUsage: number;
      newLimit: number;
      projectedOverage: number;
      overageCost: number;
    }>;
    revenueImpact: {
      baseRevenue: number;
      overageRevenue: number;
      totalRevenue: number;
    };
  }> {
    const supabase = await createSupabaseServerClient();

    // Get active customers for this creator
    const { data: assignments } = await supabase
      .from('customer_tier_assignments')
      .select('customer_id, tier_id')
      .eq('creator_id', creatorId)
      .eq('status', 'active');

    const projectedOverages: Array<{
      metric: string;
      currentUsage: number;
      newLimit: number;
      projectedOverage: number;
      overageCost: number;
    }> = [];

    let totalOverageRevenue = 0;

    if (assignments && tierData.usage_caps) {
      const usageCaps = tierData.usage_caps as Record<string, number>; // Cast to specific type
      for (const [metric, newLimit] of Object.entries(usageCaps)) {
        // Get current usage for this metric across all customers
        const { data: aggregates } = await supabase
          .from('usage_aggregates')
          .select('user_id, aggregate_value')
          .in('user_id', assignments.map(a => a.customer_id))
          .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
          .order('period_start', { ascending: false });

        if (aggregates) {
          for (const aggregate of aggregates) {
            const currentUsage = aggregate.aggregate_value;
            const projectedOverage = Math.max(0, currentUsage - newLimit);
            
            if (projectedOverage > 0) {
              const overageCost = projectedOverage * 0.01; // Simplified overage pricing
              totalOverageRevenue += overageCost;

              projectedOverages.push({
                metric,
                currentUsage,
                newLimit,
                projectedOverage,
                overageCost
              });
            }
          }
        }
      }
    }

    const baseRevenue = (assignments?.length || 0) * (tierData.price || 0);
    
    return {
      projectedOverages,
      revenueImpact: {
        baseRevenue,
        overageRevenue: totalOverageRevenue,
        totalRevenue: baseRevenue + totalOverageRevenue
      }
    };
  }

  /**
   * Create a new subscription tier
   */
  static async createTier(creatorId: string, request: CreateTierRequest): Promise<SubscriptionTier> {
    const supabase = await createSupabaseServerClient();

    // Create Stripe product and price first
    let stripeProductId: string | undefined;
    let stripePriceId: string | undefined;

    try {
      // Get creator's Stripe account
      const { data: creator } = await supabase
        .from('creator_profiles')
        .select('stripe_account_id')
        .eq('id', creatorId)
        .single();

      if (!creator?.stripe_account_id) {
        throw new Error('Creator must have Stripe Connect account set up');
      }

      // Create Stripe product
      const stripeProduct = await stripe.products.create(
        {
          name: request.name,
          description: request.description || undefined,
          metadata: {
            creator_id: creatorId,
            tier_type: 'subscription'
          }
        },
        {
          stripeAccount: creator.stripe_account_id
        }
      );
      stripeProductId = stripeProduct.id;

      // Create Stripe price
      const stripePrice = await stripe.prices.create(
        {
          product: stripeProductId,
          unit_amount: Math.round(request.price * 100), // Convert to cents
          currency: request.currency || 'usd', // Ensure currency is string
          recurring: {
            interval: request.billing_cycle === 'yearly' ? 'year' : 'month',
            interval_count: 1
          },
          metadata: {
            creator_id: creatorId,
            tier_name: request.name
          }
        },
        {
          stripeAccount: creator.stripe_account_id
        }
      );
      stripePriceId = stripePrice.id;

      // Insert tier into database
      const { data: tier, error } = await supabase
        .from('subscription_tiers')
        .insert({
          creator_id: creatorId,
          name: request.name,
          description: request.description,
          price: request.price,
          currency: request.currency,
          billing_cycle: request.billing_cycle || 'monthly',
          feature_entitlements: request.feature_entitlements,
          usage_caps: request.usage_caps,
          is_default: request.is_default,
          trial_period_days: request.trial_period_days,
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId
        } as TablesInsert<'subscription_tiers'>) // Cast to Insert type
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create tier: ${error.message}`);
      }

      return tier as SubscriptionTier; // Cast to SubscriptionTier
    } catch (error) {
      // Cleanup Stripe resources if database insert failed
      if (stripeProductId && stripePriceId) {
        try {
          const { data: creator } = await supabase
            .from('creator_profiles')
            .select('stripe_account_id')
            .eq('id', creatorId)
            .single();

          if (creator?.stripe_account_id) {
            await stripe.prices.update(
              stripePriceId,
              { active: false },
              { stripeAccount: creator.stripe_account_id }
            );
            await stripe.products.update(
              stripeProductId,
              { active: false },
              { stripeAccount: creator.stripe_account_id }
            );
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup Stripe resources:', cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * Update an existing subscription tier
   */
  static async updateTier(tierId: string, creatorId: string, request: UpdateTierRequest): Promise<SubscriptionTier> {
    const supabase = await createSupabaseServerClient();

    // Get existing tier
    const { data: existingTier, error: fetchError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('creator_id', creatorId)
      .single();

    if (fetchError || !existingTier) {
      throw new Error('Tier not found');
    }

    // If price or billing cycle changed, create new Stripe price
    let stripePriceId: string | null | undefined = existingTier.stripe_price_id;
    if (request.price !== undefined || request.billing_cycle !== undefined) {
      const { data: creator } = await supabase
        .from('creator_profiles')
        .select('stripe_account_id')
        .eq('id', creatorId)
        .single();

      if (creator?.stripe_account_id && existingTier.stripe_product_id) {
        const newPrice = request.price || existingTier.price;
        const newCycle = request.billing_cycle || existingTier.billing_cycle;

        const stripePrice = await stripe.prices.create(
          {
            product: existingTier.stripe_product_id,
            unit_amount: Math.round(newPrice * 100),
            currency: request.currency || existingTier.currency || 'usd', // Ensure currency is string
            recurring: {
              interval: newCycle === 'yearly' ? 'year' : 'month',
              interval_count: 1
            },
            metadata: {
              creator_id: creatorId,
              tier_name: request.name || existingTier.name
            }
          },
          {
            stripeAccount: creator.stripe_account_id
          }
        );

        stripePriceId = stripePrice.id;

        // Deactivate old price
        if (existingTier.stripe_price_id) {
          await stripe.prices.update(
            existingTier.stripe_price_id,
            { active: false },
            { stripeAccount: creator.stripe_account_id }
          );
        }
      }
    }

    // Update tier in database
    const updateData: TablesUpdate<'subscription_tiers'> = { // Cast to Update type
      ...request,
      billing_cycle: request.billing_cycle || existingTier.billing_cycle, // Ensure billing_cycle is correct type
      stripe_price_id: stripePriceId
    };

    const { data: tier, error } = await supabase
      .from('subscription_tiers')
      .update(updateData)
      .eq('id', tierId)
      .eq('creator_id', creatorId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tier: ${error.message}`);
    }

    return tier as SubscriptionTier; // Cast to SubscriptionTier
  }

  /**
   * Get all tiers for a creator
   */
  static async getCreatorTiers(creatorId: string): Promise<SubscriptionTier[]> {
    const supabase = await createSupabaseServerClient();

    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('creator_id', creatorId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch tiers: ${error.message}`);
    }

    return tiers as SubscriptionTier[] || []; // Cast to SubscriptionTier[]
  }

  /**
   * Get a specific tier by ID
   */
  static async getTier(tierId: string, creatorId: string): Promise<SubscriptionTier | null> {
    const supabase = await createSupabaseServerClient();

    const { data: tier, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('creator_id', creatorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch tier: ${error.message}`);
    }

    return tier as SubscriptionTier | null; // Cast to SubscriptionTier | null
  }

  /**
   * Delete a tier
   */
  static async deleteTier(tierId: string, creatorId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // Check if tier has active customers
    const { data: assignments } = await supabase
      .from('customer_tier_assignments')
      .select('id')
      .eq('tier_id', tierId)
      .eq('status', 'active')
      .limit(1);

    if (assignments && assignments.length > 0) {
      throw new Error('Cannot delete tier with active customers');
    }

    // Get tier for Stripe cleanup
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('stripe_product_id, stripe_price_id')
      .eq('id', tierId)
      .eq('creator_id', creatorId)
      .single();

    // Delete from database
    const { error } = await supabase
      .from('subscription_tiers')
      .delete()
      .eq('id', tierId)
      .eq('creator_id', creatorId);

    if (error) {
      throw new Error(`Failed to delete tier: ${error.message}`);
    }

    // Deactivate Stripe resources
    if (tier?.stripe_price_id || tier?.stripe_product_id) {
      try {
        const { data: creator } = await supabase
          .from('creator_profiles')
          .select('stripe_account_id')
          .eq('id', creatorId)
          .single();

        if (creator?.stripe_account_id) {
          if (tier.stripe_price_id) {
            await stripe.prices.update(
              tier.stripe_price_id,
              { active: false },
              { stripeAccount: creator.stripe_account_id }
            );
          }
          if (tier.stripe_product_id) {
            await stripe.products.update(
              tier.stripe_product_id,
              { active: false },
              { stripeAccount: creator.stripe_account_id }
            );
          }
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup Stripe resources:', cleanupError);
        // Don't throw - tier is already deleted from database
      }
    }
  }

  /**
   * Assign a customer to a tier
   */
  static async assignCustomerToTier(
    customerId: string,
    creatorId: string,
    tierId: string,
    stripeSubscriptionId?: string
  ): Promise<CustomerTierAssignment> {
    const supabase = await createSupabaseServerClient();

    // Get tier details
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('creator_id', creatorId)
      .single();

    if (!tier) {
      throw new Error('Tier not found');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    
    // Calculate period end based on billing cycle
    switch (tier.billing_cycle) {
      case 'daily':
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;
      case 'weekly':
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;
      case 'monthly':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'yearly':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
    }

    // Handle trial period
    let trialStart: Date | undefined;
    let trialEnd: Date | undefined;
    let status: CustomerTierAssignment['status'] = 'active';
    
    if (tier.trial_period_days && tier.trial_period_days > 0) { // Add null check
      trialStart = new Date(now);
      trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + tier.trial_period_days);
      status = 'trialing';
    }

    // Upsert assignment (handle existing assignment)
    const { data: assignment, error } = await supabase
      .from('customer_tier_assignments')
      .upsert({
        customer_id: customerId,
        creator_id: creatorId,
        tier_id: tierId,
        status,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: trialStart?.toISOString() || null, // Ensure null if undefined
        trial_end: trialEnd?.toISOString() || null,     // Ensure null if undefined
        stripe_subscription_id: stripeSubscriptionId || null, // Ensure null if undefined
        cancel_at_period_end: false
      } as TablesInsert<'customer_tier_assignments'>) // Cast to Insert type
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign customer to tier: ${error.message}`);
    }

    return assignment as CustomerTierAssignment; // Cast to CustomerTierAssignment
  }

  /**
   * Get customer's current tier info
   */
  static async getCustomerTierInfo(customerId: string, creatorId: string): Promise<CustomerTierInfo | null> {
    const supabase = await createSupabaseServerClient();

    // Get current tier assignment with tier details
    const { data: assignment, error } = await supabase
      .from('customer_tier_assignments')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('customer_id', customerId)
      .eq('creator_id', creatorId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch customer tier info: ${error.message}`);
    }

    if (!assignment || !assignment.tier) {
      return null;
    }

    // Get usage summary for current billing period
    const usageSummary: Record<string, {
      current_usage: number;
      limit_value: number | null;
      usage_percentage: number | null;
      overage_amount: number;
    }> = {};
    
    if (assignment.tier.usage_caps && Object.keys(assignment.tier.usage_caps).length > 0) {
      const usageCaps = assignment.tier.usage_caps as Record<string, number>; // Cast to specific type
      // Get meters for usage caps
      const { data: meters } = await supabase
        .from('usage_meters')
        .select('*')
        .eq('creator_id', creatorId)
        .in('event_name', Object.keys(usageCaps));

      if (meters) {
        for (const meter of meters) {
          const limitValue = usageCaps[meter.event_name];
          
          // Get current usage for this billing period
          const billingPeriod = assignment.current_period_start.substring(0, 7); // YYYY-MM format
          
          const { data: aggregate } = await supabase
            .from('usage_aggregates')
            .select('aggregate_value')
            .eq('meter_id', meter.id)
            .eq('user_id', customerId)
            .eq('billing_period', billingPeriod)
            .single();

          const currentUsage = aggregate?.aggregate_value || 0;
          const usagePercentage = limitValue ? (currentUsage / limitValue) * 100 : null;
          const overageAmount = Math.max(0, currentUsage - (limitValue || 0));

          usageSummary[meter.event_name] = {
            current_usage: currentUsage,
            limit_value: limitValue,
            usage_percentage: usagePercentage,
            overage_amount: overageAmount
          };
        }
      }
    }

    // Get recent overages
    const billingPeriod = assignment.current_period_start.substring(0, 7);
    const { data: overages } = await supabase
      .from('tier_usage_overages')
      .select(`
        *,
        meter:usage_meters(*),
        tier:subscription_tiers(*)
      `)
      .eq('customer_id', customerId)
      .eq('creator_id', creatorId)
      .eq('billing_period', billingPeriod);

    return {
      tier: assignment.tier as SubscriptionTier, // Cast to SubscriptionTier
      assignment: assignment as CustomerTierAssignment, // Cast to CustomerTierAssignment
      usage_summary: usageSummary,
      overages: overages as TierUsageOverage[] || [], // Cast to TierUsageOverage[]
      next_billing_date: assignment.current_period_end
    };
  }

  /**
   * Check if customer can perform an action based on tier limits
   */
  static async checkTierEnforcement(
    customerId: string,
    creatorId: string,
    metricName: string,
    requestedUsage: number = 1
  ): Promise<TierEnforcementResult> {
    const supabase = await createSupabaseServerClient();

    // Get customer's current tier
    const tierInfo = await this.getCustomerTierInfo(customerId, creatorId);
    
    if (!tierInfo) {
      return {
        allowed: false,
        reason: 'No active subscription tier found',
        limit_value: null,
        current_usage: 0,
        usage_percentage: 0
      };
    }

    const usageCap = (tierInfo.tier.usage_caps as Record<string, number>)?.[metricName]; // Cast and access
    
    // If no cap is set, usage is unlimited
    if (!usageCap) {
      return { allowed: true, limit_value: null, current_usage: 0, usage_percentage: 0 };
    }

    const usageSummary = tierInfo.usage_summary[metricName];
    const currentUsage = usageSummary?.current_usage || 0;
    const projectedUsage = currentUsage + requestedUsage;
    const usagePercentage = (projectedUsage / usageCap) * 100;

    // Get meter to check if hard cap is enabled
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('event_name', metricName)
      .single();

    if (!meter) {
      return { allowed: true, limit_value: null, current_usage: 0, usage_percentage: 0 };
    }

    // Get plan limits for this meter
    const { data: planLimit } = await supabase
      .from('meter_plan_limits')
      .select('*')
      .eq('meter_id', meter.id)
      .eq('plan_name', tierInfo.tier.name.toLowerCase())
      .single();

    const hardCap = planLimit?.hard_cap || false;
    const softLimitThreshold = (planLimit?.soft_limit_threshold || 0.8) * 100;

    // Check hard cap
    if (hardCap && projectedUsage > usageCap) {
      return {
        allowed: false,
        reason: `Usage limit exceeded. Your ${tierInfo.tier.name} plan allows ${usageCap} ${metricName} per billing cycle.`,
        current_usage: currentUsage,
        limit_value: usageCap,
        usage_percentage: usagePercentage,
        should_block: true
      };
    }

    // Check soft limit for warnings
    const shouldWarn = usagePercentage >= softLimitThreshold;

    return {
      allowed: true,
      current_usage: currentUsage,
      limit_value: usageCap,
      usage_percentage: usagePercentage,
      should_warn: shouldWarn,
      should_block: false
    };
  }

  /**
   * Get tier upgrade options for a customer
   */
  static async getTierUpgradeOptions(customerId: string, creatorId: string): Promise<TierUpgradeOption[]> {
    const supabase = await createSupabaseServerClient();

    // Get customer's current tier
    const tierInfo = await this.getCustomerTierInfo(customerId, creatorId);
    
    if (!tierInfo) {
      return [];
    }

    // Get all available tiers for creator
    const tiers = await this.getCreatorTiers(creatorId);
    
    // Filter out current tier and inactive tiers
    const upgradeTiers = tiers.filter(tier => 
      tier.id !== tierInfo.tier.id && 
      tier.active &&
      (tier.price || 0) > (tierInfo.tier.price || 0) // Ensure price is not null
    );

    const upgradeOptions: TierUpgradeOption[] = [];

    for (const tier of upgradeTiers) {
      const upgradeCost = (tier.price || 0) - (tierInfo.tier.price || 0);
      
      // Calculate potential savings from reduced overages
      let estimatedSavings = 0;
      for (const [metricName, currentSummary] of Object.entries(tierInfo.usage_summary)) {
        const currentOverage = currentSummary.overage_amount || 0;
        const newLimit = (tier.usage_caps as Record<string, number>)?.[metricName]; // Cast and access
        
        if (newLimit && currentOverage > 0) {
          const { data: meterIdData } = await supabase.from('usage_meters').select('id').eq('event_name', metricName).single();
          const meterId = meterIdData?.id;

          if (meterId) {
            const { data: overagePriceData } = await supabase
              .from('meter_plan_limits')
              .select('overage_price')
              .eq('meter_id', meterId)
              .eq('plan_name', tier.name.toLowerCase())
              .single();
            
            const overagePrice = overagePriceData?.overage_price || 0; // Fetch overage price
            
            const wouldOverage = Math.max(0, currentSummary.current_usage - newLimit);
            estimatedSavings += (currentOverage - wouldOverage) * (overagePrice || 0); // Use fetched overage price
          }
        }
      }

      // Determine if this is a recommended upgrade
      const isRecommended = estimatedSavings > upgradeCost * 0.5; // If savings > 50% of upgrade cost
      
      let reason = '';
      if (isRecommended) {
        reason = `Recommended: Save approximately $${estimatedSavings.toFixed(2)} on overage charges`;
      }

      upgradeOptions.push({
        tier,
        upgrade_cost: upgradeCost,
        upgrade_savings: estimatedSavings,
        recommended: isRecommended,
        reason
      });
    }

    // Sort by recommendation, then by price
    return upgradeOptions.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return (a.tier.price || 0) - (b.tier.price || 0); // Ensure price is not null
    });
  }

  /**
   * Calculate and record usage overages for billing
   */
  static async calculateUsageOverages(
    customerId: string,
    creatorId: string,
    billingPeriod: string
  ): Promise<TierUsageOverage[]> {
    const supabase = await createSupabaseServerClient();

    // Get customer's tier info
    const tierInfo = await this.getCustomerTierInfo(customerId, creatorId);
    
    if (!tierInfo) {
      return [];
    }

    const overages: TierUsageOverage[] = [];

    // Check each usage cap
    for (const [metricName, limitValue] of Object.entries(tierInfo.tier.usage_caps || {})) { // Add null check
      if (!limitValue) continue; // Skip unlimited metrics

      // Get meter
      const { data: meter } = await supabase
        .from('usage_meters')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('event_name', metricName)
        .single();

      if (!meter) continue;

      // Get plan limit for overage pricing
      const { data: planLimit } = await supabase
        .from('meter_plan_limits')
        .select('*')
        .eq('meter_id', meter.id)
        .eq('plan_name', tierInfo.tier.name.toLowerCase())
        .single();

      if (!planLimit?.overage_price) continue;

      // Get usage aggregate for billing period
      const { data: aggregate } = await supabase
        .from('usage_aggregates')
        .select('aggregate_value')
        .eq('meter_id', meter.id)
        .eq('user_id', customerId)
        .eq('billing_period', billingPeriod)
        .single();

      const actualUsage = aggregate?.aggregate_value || 0;
      const overageAmount = Math.max(0, actualUsage - limitValue);

      if (overageAmount > 0) {
        const overageCost = overageAmount * planLimit.overage_price;

        // Upsert overage record
        const { data: overage, error } = await supabase
          .from('tier_usage_overages')
          .upsert({
            customer_id: customerId,
            creator_id: creatorId,
            tier_id: tierInfo.tier.id,
            meter_id: meter.id,
            billing_period: billingPeriod,
            limit_value: limitValue,
            actual_usage: actualUsage,
            overage_amount: overageAmount,
            overage_price: planLimit.overage_price,
            overage_cost: overageCost
          } as TablesInsert<'tier_usage_overages'>) // Cast to Insert type
          .select()
          .single();

        if (!error && overage) {
          overages.push(overage as TierUsageOverage); // Cast to TierUsageOverage
        }
      }
    }

    return overages;
  }

  /**
   * Get tier analytics for a creator
   */
  static async getTierAnalytics(
    creatorId: string,
    tierId?: string,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    startDate?: string,
    endDate?: string
  ): Promise<TierAnalytics[]> {
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from('tier_analytics')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('creator_id', creatorId)
      .eq('period_type', periodType);

    if (tierId) {
      query = query.eq('tier_id', tierId);
    }

    if (startDate) {
      query = query.gte('period_start', startDate);
    }

    if (endDate) {
      query = query.lte('period_end', endDate);
    }

    const { data: analytics, error } = await query.order('period_start', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tier analytics: ${error.message}`);
    }

    return analytics as TierAnalytics[] || []; // Cast to TierAnalytics[]
  }
}