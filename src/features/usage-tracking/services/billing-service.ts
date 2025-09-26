import Stripe from 'stripe';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';

import type { UsageBillingSync } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export class BillingService {
  /**
   * Create a metered price in Stripe for usage-based billing
   */
  static async createMeteredPrice(
    stripeAccountId: string,
    productId: string,
    unitAmount: number,
    currency: string = 'usd',
    unitLabel?: string
  ): Promise<string> {
    try {
      const price = await stripe.prices.create(
        {
          product: productId,
          unit_amount: unitAmount,
          currency,
          recurring: {
            interval: 'month',
            usage_type: 'metered',
            aggregate_usage: 'sum',
          },
          billing_scheme: 'per_unit',
          metadata: {
            unit_label: unitLabel || 'units',
          },
        },
        {
          stripeAccount: stripeAccountId,
        }
      );

      return price.id;
    } catch (error) {
      console.error('Error creating metered price:', error);
      throw new Error(`Failed to create metered price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Report usage to Stripe for metered billing
   */
  static async reportUsageToStripe(
    stripeAccountId: string,
    subscriptionItemId: string,
    quantity: number,
    timestamp?: number
  ): Promise<string> {
    try {
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'increment',
        },
        {
          stripeAccount: stripeAccountId,
        }
      );

      return usageRecord.id;
    } catch (error) {
      console.error('Error reporting usage to Stripe:', error);
      throw new Error(`Failed to report usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync usage data to billing system
   */
  static async syncUsageToBilling(
    meterId: string,
    userId: string,
    billingPeriod: string,
    usageQuantity: number,
    stripeAccountId: string,
    subscriptionItemId: string
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    try {
      // Report usage to Stripe
      const usageRecordId = await this.reportUsageToStripe(
        stripeAccountId,
        subscriptionItemId,
        usageQuantity
      );

      // Update or create billing sync record
      const { error } = await supabase
        .from('usage_billing_sync')
        .upsert({
          meter_id: meterId,
          user_id: userId,
          billing_period: billingPeriod,
          usage_quantity: usageQuantity,
          stripe_usage_record_id: usageRecordId,
          stripe_subscription_item_id: subscriptionItemId,
          billing_status: 'synced',
          sync_attempts: 1,
          last_sync_attempt: new Date().toISOString(),
        } as Tables<'usage_billing_sync'>['Insert']); // Cast to Insert type

      if (error) {
        throw new Error(`Failed to update billing sync: ${error.message}`);
      }
    } catch (error) {
      console.error('Error syncing usage to billing:', error);
      
      // Record failed sync attempt
      const supabaseClient = await createSupabaseServerClient(); // Await here
      await supabaseClient
        .from('usage_billing_sync')
        .upsert({
          meter_id: meterId,
          user_id: userId,
          billing_period: billingPeriod,
          usage_quantity: usageQuantity,
          stripe_subscription_item_id: subscriptionItemId,
          billing_status: 'failed',
          sync_attempts: 1,
          last_sync_attempt: new Date().toISOString(),
          sync_error: error instanceof Error ? error.message : 'Unknown error',
        } as Tables<'usage_billing_sync'>['Insert']); // Cast to Insert type

      throw error;
    }
  }

  /**
   * Get failed billing sync records that need retry
   */
  static async getFailedBillingSync(): Promise<UsageBillingSync[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('usage_billing_sync')
      .select('*')
      .eq('billing_status', 'failed')
      .lt('sync_attempts', 3) // Only retry up to 3 times
      .order('last_sync_attempt', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch failed sync records: ${error.message}`);
    }

    return data as UsageBillingSync[] || [];
  }

  /**
   * Retry failed billing sync
   */
  static async retryFailedSync(syncRecord: UsageBillingSync, stripeAccountId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    try {
      // Attempt to report usage to Stripe again
      const usageRecordId = await this.reportUsageToStripe(
        stripeAccountId,
        syncRecord.stripe_subscription_item_id!,
        syncRecord.usage_quantity
      );

      // Update sync record with success
      const { error } = await supabase
        .from('usage_billing_sync')
        .update({
          stripe_usage_record_id: usageRecordId,
          billing_status: 'synced',
          sync_attempts: (syncRecord.sync_attempts || 0) + 1, // Add null check
          last_sync_attempt: new Date().toISOString(),
          sync_error: null,
        })
        .eq('id', syncRecord.id);

      if (error) {
        throw new Error(`Failed to update sync record: ${error.message}`);
      }
    } catch (error) {
      console.error('Error retrying failed sync:', error);
      
      // Update with new failure
      await supabase
        .from('usage_billing_sync')
        .update({
          billing_status: 'failed',
          sync_attempts: (syncRecord.sync_attempts || 0) + 1, // Add null check
          last_sync_attempt: new Date().toISOString(),
          sync_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', syncRecord.id);

      throw error;
    }
  }

  /**
   * Get billing sync status for a meter and user
   */
  static async getBillingSyncStatus(meterId: string, userId: string, billingPeriod: string): Promise<UsageBillingSync | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('usage_billing_sync')
      .select('*')
      .eq('meter_id', meterId)
      .eq('user_id', userId)
      .eq('billing_period', billingPeriod)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to fetch billing sync status: ${error.message}`);
    }

    return data as UsageBillingSync || null;
  }

  /**
   * Process pending usage for billing sync
   */
  static async processPendingUsage(): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // Get usage aggregates that haven't been synced yet
    const { data: pendingUsage, error } = await supabase
      .from('usage_aggregates')
      .select(`
        *,
        usage_meters!inner(
          creator_id,
          creator_profiles!inner(stripe_account_id)
        )
      `)
      .not('usage_billing_sync.billing_status', 'eq', 'synced')
      .limit(100);

    if (error) {
      console.error('Error fetching pending usage:', error);
      return;
    }

    if (!pendingUsage || pendingUsage.length === 0) {
      return;
    }

    // Process each pending usage record
    for (const usage of pendingUsage) {
      try {
        // This would need more complex logic to determine the subscription item ID
        // For now, we'll just mark as pending
        await supabase
          .from('usage_billing_sync')
          .upsert({
            meter_id: usage.meter_id,
            user_id: usage.user_id,
            billing_period: usage.billing_period,
            usage_quantity: usage.aggregate_value,
            billing_status: 'pending',
            sync_attempts: 0,
          } as Tables<'usage_billing_sync'>['Insert']); // Cast to Insert type
      } catch (error) {
        console.error(`Error processing usage for ${usage.id}:`, error);
      }
    }
  }
}