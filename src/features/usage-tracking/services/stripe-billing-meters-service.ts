/**
 * Stripe Billing Meters Integration Service
 * Integrates platform usage tracking with Stripe's native billing meters
 */

import Stripe from 'stripe';

import { createStripeClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export interface StripeMeterConfig {
  meter_id: string;
  stripe_meter_id: string;
  event_name: string;
  display_name: string;
  aggregation: 'sum' | 'count' | 'max';
}

export class StripeBillingMetersService {
  /**
   * Create a Stripe Billing Meter for a usage meter
   */
  static async createStripeMeter(
    creatorId: string,
    meterId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<string> {
    const supabase = await createSupabaseServerClient();

    // Get meter details
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('id', meterId)
      .eq('creator_id', creatorId)
      .single();

    if (!meter) {
      throw new Error('Meter not found');
    }

    // Get creator credentials
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_test_access_token, stripe_production_access_token')
      .eq('id', creatorId)
      .single();

    if (!creator?.stripe_account_id) {
      throw new Error('Creator Stripe account not connected');
    }

    const accessToken = environment === 'test'
      ? creator.stripe_test_access_token
      : creator.stripe_production_access_token;

    const stripe = createStripeClient(environment, creator.stripe_account_id, accessToken || undefined);

    // Map aggregation types
    const aggregationType = meter.aggregation_type === 'count' ? 'count' : 'sum';

    // Create Stripe Billing Meter
    const stripeMeter = await stripe.billing.meters.create({
      display_name: meter.display_name,
      event_name: meter.event_name,
      default_aggregation: {
        formula: aggregationType
      },
      customer_mapping: {
        event_payload_key: 'customer_id',
        type: 'by_id'
      },
      value_settings: {
        event_payload_key: 'value'
      }
    });

    // Store Stripe meter ID in database
    await supabase
      .from('usage_meters')
      .update({
        metadata: {
          ...(typeof meter.metadata === 'object' && meter.metadata !== null ? meter.metadata : {}),
          stripe_meter_id: stripeMeter.id,
          stripe_environment: environment
        }
      })
      .eq('id', meterId);

    return stripeMeter.id;
  }

  /**
   * Report usage event to Stripe Billing Meter
   */
  static async reportUsageToStripe(
    creatorId: string,
    meterId: string,
    customerId: string,
    value: number,
    timestamp?: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // Get meter with Stripe meter ID
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('id', meterId)
      .eq('creator_id', creatorId)
      .single();

    if (!meter) {
      throw new Error('Meter not found');
    }

    const stripeMeterIdKey = environment === 'test' ? 'stripe_test_meter_id' : 'stripe_production_meter_id';
    const stripMeterId = (meter.metadata as any)?.[stripeMeterIdKey] || (meter.metadata as any)?.stripe_meter_id;

    if (!stripMeterId) {
      console.warn(`No Stripe meter ID found for meter ${meterId}, skipping Stripe reporting`);
      return;
    }

    // Get creator credentials
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_test_access_token, stripe_production_access_token')
      .eq('id', creatorId)
      .single();

    if (!creator?.stripe_account_id) {
      throw new Error('Creator Stripe account not connected');
    }

    // Get customer's Stripe customer ID
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', customerId)
      .single();

    if (!customer?.stripe_customer_id) {
      console.warn(`No Stripe customer ID for customer ${customerId}, skipping Stripe reporting`);
      return;
    }

    const accessToken = environment === 'test'
      ? creator.stripe_test_access_token
      : creator.stripe_production_access_token;

    const stripe = createStripeClient(environment, creator.stripe_account_id, accessToken || undefined);

    // Report usage event to Stripe
    await stripe.billing.meterEvents.create({
      event_name: meter.event_name,
      payload: {
        stripe_customer_id: customer.stripe_customer_id,
        value: value.toString()
      },
      timestamp: timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000)
    });
  }

  /**
   * Create usage-based price with Stripe Billing Meter
   */
  static async createMeterBasedPrice(
    creatorId: string,
    meterId: string,
    productId: string,
    unitAmount: number,
    currency: string = 'usd',
    environment: 'test' | 'production' = 'test'
  ): Promise<string> {
    const supabase = await createSupabaseServerClient();

    // Get meter with Stripe meter ID
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('id', meterId)
      .eq('creator_id', creatorId)
      .single();

    if (!meter) {
      throw new Error('Meter not found');
    }

    const stripeMeterIdKey = environment === 'test' ? 'stripe_test_meter_id' : 'stripe_production_meter_id';
    const stripMeterId = (meter.metadata as any)?.[stripeMeterIdKey] || (meter.metadata as any)?.stripe_meter_id;

    if (!stripMeterId) {
      throw new Error('Stripe meter not configured for this meter');
    }

    // Get creator credentials
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_test_access_token, stripe_production_access_token')
      .eq('id', creatorId)
      .single();

    if (!creator?.stripe_account_id) {
      throw new Error('Creator Stripe account not connected');
    }

    const accessToken = environment === 'test'
      ? creator.stripe_test_access_token
      : creator.stripe_production_access_token;

    const stripe = createStripeClient(environment, creator.stripe_account_id, accessToken || undefined);

    // Create usage-based price
    const price = await stripe.prices.create({
      product: productId,
      currency: currency,
      billing_scheme: 'per_unit',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
        aggregate_usage: meter.aggregation_type === 'sum' ? 'sum' : 'last_during_period'
      },
      unit_amount: unitAmount,
      metadata: {
        meter_id: meterId,
        stripe_meter_id: stripMeterId,
        creator_id: creatorId
      }
    });

    return price.id;
  }

  /**
   * Sync all usage events to Stripe for a billing period
   */
  static async syncBillingPeriodToStripe(
    creatorId: string,
    billingPeriod: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<{ synced: number; errors: string[] }> {
    const supabase = await createSupabaseServerClient();
    const errors: string[] = [];
    let synced = 0;

    // Get all usage events for the billing period
    const periodStart = `${billingPeriod}-01T00:00:00.000Z`;
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(0);
    const periodEndStr = periodEnd.toISOString();

    const { data: events } = await supabase
      .from('usage_events')
      .select(`
        *,
        meter:usage_meters!inner(*)
      `)
      .eq('meter.creator_id', creatorId)
      .gte('event_timestamp', periodStart)
      .lte('event_timestamp', periodEndStr);

    if (!events || events.length === 0) {
      return { synced: 0, errors: [] };
    }

    // Group events by meter and customer
    const eventsByMeterCustomer = new Map<string, typeof events>();
    
    for (const event of events) {
      const key = `${event.meter_id}:${event.user_id}`;
      if (!eventsByMeterCustomer.has(key)) {
        eventsByMeterCustomer.set(key, []);
      }
      eventsByMeterCustomer.get(key)!.push(event);
    }

    // Report each group to Stripe
    for (const [key, groupEvents] of eventsByMeterCustomer) {
      const [meterId, customerId] = key.split(':');
      
      for (const event of groupEvents) {
        try {
          await this.reportUsageToStripe(
            creatorId,
            meterId,
            customerId,
            event.event_value,
            event.event_timestamp,
            environment
          );
          synced++;
        } catch (error) {
          errors.push(`Event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return { synced, errors };
  }

  /**
   * Get usage summary from Stripe for a customer
   */
  static async getStripeUsageSummary(
    creatorId: string,
    customerId: string,
    meterId: string,
    startDate: string,
    endDate: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<{
    total_usage: number;
    period_start: string;
    period_end: string;
  }> {
    const supabase = await createSupabaseServerClient();

    // Get meter with Stripe meter ID
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('id', meterId)
      .eq('creator_id', creatorId)
      .single();

    if (!meter) {
      throw new Error('Meter not found');
    }

    const stripeMeterIdKey = environment === 'test' ? 'stripe_test_meter_id' : 'stripe_production_meter_id';
    const stripMeterId = (meter.metadata as any)?.[stripeMeterIdKey] || (meter.metadata as any)?.stripe_meter_id;

    if (!stripMeterId) {
      throw new Error('Stripe meter not configured');
    }

    // Get customer's Stripe customer ID
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', customerId)
      .single();

    if (!customer?.stripe_customer_id) {
      throw new Error('Customer not found in Stripe');
    }

    // Get creator credentials
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_test_access_token, stripe_production_access_token')
      .eq('id', creatorId)
      .single();

    if (!creator?.stripe_account_id) {
      throw new Error('Creator Stripe account not connected');
    }

    const accessToken = environment === 'test'
      ? creator.stripe_test_access_token
      : creator.stripe_production_access_token;

    const stripe = createStripeClient(environment, creator.stripe_account_id, accessToken || undefined);

    // Query Stripe for usage summary
    const summary = await stripe.billing.meters.listEventSummaries(
      stripMeterId,
      {
        customer: customer.stripe_customer_id,
        start_time: Math.floor(new Date(startDate).getTime() / 1000),
        end_time: Math.floor(new Date(endDate).getTime() / 1000)
      }
    );

    const totalUsage = summary.data.reduce((sum, item) => sum + (item.aggregated_value || 0), 0);

    return {
      total_usage: totalUsage,
      period_start: startDate,
      period_end: endDate
    };
  }

  /**
   * Migrate existing meter to use Stripe Billing Meters
   */
  static async migrateMeterToStripeBilling(
    creatorId: string,
    meterId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<{
    stripe_meter_id: string;
    migrated_events: number;
    errors: string[];
  }> {
    // Create Stripe meter
    const stripeMeterI = await this.createStripeMeter(creatorId, meterId, environment);

    // Sync historical events (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const billingPeriod = threeMonthsAgo.toISOString().substring(0, 7);

    const { synced, errors } = await this.syncBillingPeriodToStripe(
      creatorId,
      billingPeriod,
      environment
    );

    return {
      stripe_meter_id: stripeMeterI,
      migrated_events: synced,
      errors
    };
  }
}