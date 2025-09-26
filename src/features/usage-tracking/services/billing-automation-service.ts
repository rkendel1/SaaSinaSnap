import Stripe from 'stripe';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables, TablesInsert } from '@/libs/supabase/types';

import type { CustomerTierAssignment,TierUsageOverage } from '../types';

import { TierManagementService } from './tier-management-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export class BillingAutomationService {
  /**
   * Process billing for all customers at the end of billing period
   */
  static async processBillingCycle(
    creatorId: string,
    billingPeriod: string
  ): Promise<{ processed: number; errors: string[] }> {
    const supabase = await createSupabaseServerClient();
    const errors: string[] = [];
    let processed = 0;

    try {
      // Get all active customer assignments for this creator
      const { data: assignments, error } = await supabase
        .from('customer_tier_assignments')
        .select(`
          *,
          tier:subscription_tiers(*)
        `)
        .eq('creator_id', creatorId)
        .in('status', ['active', 'trialing']);

      if (error) {
        throw new Error(`Failed to fetch customer assignments: ${error.message}`);
      }

      if (!assignments) {
        return { processed: 0, errors: [] };
      }

      // Get creator's Stripe account
      const { data: creator } = await supabase
        .from('creator_profiles')
        .select('stripe_account_id')
        .eq('id', creatorId)
        .single();

      if (!creator?.stripe_account_id) {
        throw new Error('Creator must have Stripe Connect account set up');
      }

      // Process each customer
      for (const assignment of assignments) {
        try {
          await this.processCustomerBilling(
            assignment as CustomerTierAssignment & { tier: any }, // Cast to correct type
            billingPeriod,
            creator.stripe_account_id
          );
          processed++;
        } catch (error) {
          errors.push(`Customer ${assignment.customer_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { processed, errors };
    } catch (error) {
      errors.push(`Billing cycle error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { processed, errors };
    }
  }

  /**
   * Process billing for a single customer
   */
  static async processCustomerBilling(
    assignment: CustomerTierAssignment & { tier: any },
    billingPeriod: string,
    stripeAccountId: string
  ): Promise<void> {
    // Calculate usage overages for this billing period
    const overages = await TierManagementService.calculateUsageOverages(
      assignment.customer_id,
      assignment.creator_id,
      billingPeriod
    );

    if (overages.length === 0) {
      return; // No overages to bill
    }

    // Create Stripe invoice items for overages
    for (const overage of overages) {
      if (overage.billed) {
        continue; // Already billed
      }

      try {
        await this.createStripeInvoiceItem(
          assignment,
          overage,
          stripeAccountId
        );

        // Mark overage as billed
        await this.markOverageBilled(overage.id);
      } catch (error) {
        console.error('Failed to create invoice item for overage:', error);
        throw error;
      }
    }
  }

  /**
   * Create Stripe invoice item for usage overage
   */
  static async createStripeInvoiceItem(
    assignment: CustomerTierAssignment & { tier: any },
    overage: TierUsageOverage,
    stripeAccountId: string
  ): Promise<string> {
    const supabase = await createSupabaseServerClient();

    // Get customer's Stripe customer ID
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', assignment.customer_id)
      .single();

    if (!customer?.stripe_customer_id) {
      throw new Error('Customer must have Stripe customer ID');
    }

    // Get meter details for description
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('display_name, unit_name')
      .eq('id', overage.meter_id)
      .single();

    const description = `Usage overage: ${overage.overage_amount.toLocaleString()} ${meter?.unit_name || 'units'} of ${meter?.display_name || 'usage'} beyond ${assignment.tier.name} plan limit`;

    // Create invoice item
    const invoiceItem = await stripe.invoiceItems.create(
      {
        customer: customer.stripe_customer_id,
        amount: Math.round(overage.overage_cost * 100), // Convert to cents
        currency: assignment.tier.currency || 'usd', // Ensure currency is string
        description,
        metadata: {
          creator_id: assignment.creator_id,
          customer_id: assignment.customer_id,
          tier_id: assignment.tier_id,
          meter_id: overage.meter_id,
          billing_period: overage.billing_period,
          overage_id: overage.id
        }
      },
      {
        stripeAccount: stripeAccountId
      }
    );

    return invoiceItem.id;
  }

  /**
   * Mark an overage as billed
   */
  static async markOverageBilled(overageId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('tier_usage_overages')
      .update({
        billed: true,
        billed_at: new Date().toISOString()
      })
      .eq('id', overageId);

    if (error) {
      throw new Error(`Failed to mark overage as billed: ${error.message}`);
    }
  }

  /**
   * Handle successful payment webhook
   */
  static async handleSuccessfulPayment(
    stripeInvoiceId: string,
    stripeAccountId: string
  ): Promise<void> {
    // Get invoice details from Stripe
    const invoice = await stripe.invoices.retrieve(
      stripeInvoiceId,
      {
        expand: ['lines.data']
      },
      {
        stripeAccount: stripeAccountId
      }
    );

    // Process each invoice line item
    for (const line of invoice.lines.data) {
      if (line.metadata?.overage_id) {
        // Update overage record with invoice item ID
        await this.updateOverageWithInvoiceItem(
          line.metadata.overage_id,
          line.id
        );
      }
    }
  }

  /**
   * Update overage record with Stripe invoice item ID
   */
  static async updateOverageWithInvoiceItem(
    overageId: string,
    invoiceItemId: string
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('tier_usage_overages')
      .update({
        stripe_invoice_item_id: invoiceItemId
      })
      .eq('id', overageId);

    if (error) {
      console.error('Failed to update overage with invoice item ID:', error);
    }
  }

  /**
   * Process tier change and update Stripe subscription
   */
  static async processTierChange(
    customerId: string,
    creatorId: string,
    newTierId: string,
    prorate: boolean = true
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // Get customer's current assignment
    const { data: currentAssignment } = await supabase
      .from('customer_tier_assignments')
      .select('*')
      .eq('customer_id', customerId)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .single();

    if (!currentAssignment?.stripe_subscription_id) {
      throw new Error('No active Stripe subscription found');
    }

    // Get new tier details
    const { data: newTier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', newTierId)
      .eq('creator_id', creatorId)
      .single();

    if (!newTier) {
      throw new Error('New tier not found');
    }

    // Get creator's Stripe account
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id')
      .eq('id', creatorId)
      .single();

    if (!creator?.stripe_account_id) {
      throw new Error('Creator must have Stripe Connect account set up');
    }

    // Update Stripe subscription
    const subscription = await stripe.subscriptions.update(
      currentAssignment.stripe_subscription_id,
      {
        items: [
          {
            id: currentAssignment.stripe_subscription_id, // This should be the subscription item ID
            price: newTier.stripe_price_id!, // Non-null assertion
          }
        ],
        proration_behavior: prorate ? 'create_prorations' : 'none',
        metadata: {
          tier_id: newTierId,
          tier_name: newTier.name
        }
      },
      {
        stripeAccount: creator.stripe_account_id
      }
    );

    // Update assignment in database
    await TierManagementService.assignCustomerToTier(
      customerId,
      creatorId,
      newTierId,
      subscription.id
    );
  }

  /**
   * Calculate tier analytics for a billing period
   */
  static async calculateTierAnalytics(
    creatorId: string,
    periodStart: string,
    periodEnd: string,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // Get all tiers for creator
    const { data: tiers } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('creator_id', creatorId);

    if (!tiers) return;

    // Calculate analytics for each tier
    for (const tier of tiers) {
      try {
        const analytics = await this.calculateSingleTierAnalytics(
          creatorId,
          tier.id,
          periodStart,
          periodEnd
        );

        // Upsert analytics record
        await supabase
          .from('tier_analytics')
          .upsert({
            creator_id: creatorId,
            tier_id: tier.id,
            period_start: periodStart,
            period_end: periodEnd,
            period_type: periodType,
            ...analytics
          } as TablesInsert<'tier_analytics'>); // Cast to Insert type
      } catch (error) {
        console.error(`Failed to calculate analytics for tier ${tier.id}:`, error);
      }
    }
  }

  /**
   * Calculate analytics for a single tier
   */
  static async calculateSingleTierAnalytics(
    creatorId: string,
    tierId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<{
    active_customers: number;
    new_customers: number;
    churned_customers: number;
    total_revenue: number;
    overage_revenue: number;
    average_usage_percentage: number;
    usage_metrics: Record<string, any>;
  }> {
    const supabase = await createSupabaseServerClient();

    // Get assignments for this tier in the period
    const { data: assignments } = await supabase
      .from('customer_tier_assignments')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('tier_id', tierId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    // Get overages for this tier in the period
    const { data: overages } = await supabase
      .from('tier_usage_overages')
      .select('overage_cost')
      .eq('creator_id', creatorId)
      .eq('tier_id', tierId)
      .eq('billing_period', periodStart.substring(0, 7)); // YYYY-MM format

    // Get tier details for revenue calculation
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('price')
      .eq('id', tierId)
      .single();

    const activeCustomers = assignments?.filter(a => a.status === 'active').length || 0;
    const newCustomers = assignments?.length || 0;
    const churned = assignments?.filter(a => a.status === 'canceled').length || 0;
    const totalRevenue = activeCustomers * (tier?.price || 0);
    const overageRevenue = overages?.reduce((sum, o) => sum + o.overage_cost, 0) || 0;

    return {
      active_customers: activeCustomers,
      new_customers: newCustomers,
      churned_customers: churned,
      total_revenue: totalRevenue,
      overage_revenue: overageRevenue,
      average_usage_percentage: 0, // Would need more complex calculation
      usage_metrics: {}
    };
  }

  /**
   * Send usage warning notifications
   */
  static async sendUsageWarnings(creatorId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // Get customers approaching their limits
    const { data: assignments } = await supabase
      .from('customer_tier_assignments')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('creator_id', creatorId)
      .eq('status', 'active');

    if (!assignments) return;

    for (const assignment of assignments) {
      // Check each usage cap
      if (assignment.tier?.usage_caps) {
        for (const [metricName, limitValue] of Object.entries(assignment.tier.usage_caps || {})) { // Add null check
          try {
            const enforcement = await TierManagementService.checkTierEnforcement(
              assignment.customer_id,
              creatorId,
              metricName
            );

            // Send warning if usage is above 80%
            if (enforcement.should_warn && enforcement.usage_percentage && enforcement.usage_percentage >= 80) {
              await this.sendUsageWarningNotification(
                assignment.customer_id,
                creatorId,
                metricName,
                enforcement.usage_percentage,
                enforcement.current_usage,
                enforcement.limit_value
              );
            }
          } catch (error) {
            console.error(`Failed to check enforcement for ${assignment.customer_id}:`, error);
          }
        }
      }
    }
  }

  /**
   * Send individual usage warning notification
   */
  static async sendUsageWarningNotification(
    customerId: string,
    creatorId: string,
    metricName: string,
    usagePercentage: number,
    currentUsage?: number,
    limitValue?: number | null
  ): Promise<void> {
    // In a real implementation, this would send an email, push notification, etc.
    console.log(`Usage warning for customer ${customerId}: ${metricName} at ${usagePercentage.toFixed(1)}% (${currentUsage}/${limitValue})`);
    
    // Create alert record
    const supabase = await createSupabaseServerClient();
    
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('event_name', metricName)
      .single();

    if (meter) {
      await supabase
        .from('usage_alerts')
        .insert({
          meter_id: meter.id,
          user_id: customerId,
          plan_name: 'current', // Would need to get actual plan name
          alert_type: 'soft_limit',
          threshold_percentage: usagePercentage,
          current_usage: currentUsage || 0,
          limit_value: limitValue
        } as TablesInsert<'usage_alerts'>); // Cast to Insert type
    }
  }
}