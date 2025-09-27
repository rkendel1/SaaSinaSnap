/**
 * Tenant-Aware Usage Tracking Service
 * Enhanced usage tracking service with multi-tenant support
 */

import { headers } from 'next/headers';

import { TenantAnalytics } from '@/libs/analytics/tenant-analytics';
import { AuditLogger } from '@/libs/audit/audit-logger';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'; // Added import
import { ensureTenantContext } from '@/libs/supabase/tenant-context';
import { Json, Tables, TablesInsert } from '@/libs/supabase/types';

import type {
  CreateMeterRequest,
  MeterPlanLimit,
  TrackUsageRequest,
  UsageAggregate,
  UsageAlert,
  UsageAnalytics,
  UsageEvent,
  UsageMeter,
  UsageSummary,
} from '../types';

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

// Define a type for the joined data from usage_aggregates and usage_meters
type UsageAggregateWithMeter = Tables<'usage_aggregates'> & {
  usage_meters: Pick<Tables<'usage_meters'>, 'id' | 'display_name' | 'unit_name' | 'creator_id'>;
};

// Define a type for the joined data from usage_events and usage_meters
type UsageEventWithMeter = Tables<'usage_events'> & {
  usage_meters: Pick<Tables<'usage_meters'>, 'active' | 'aggregation_type' | 'billing_model' | 'created_at' | 'creator_id' | 'description' | 'display_name' | 'event_name' | 'id' | 'tenant_id' | 'unit_name' | 'updated_at'>;
};


export class TenantUsageTrackingService {
  /**
   * Create a new usage meter with tenant context
   */
  static async createMeter(creatorId: string, meterData: CreateMeterRequest): Promise<UsageMeter> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient(tenantId);

    // Create the meter with tenant context
    const { data: meter, error } = await supabase
      .from('usage_meters')
      .insert({
        tenant_id: tenantId,
        creator_id: creatorId,
        event_name: meterData.event_name,
        display_name: meterData.display_name,
        description: meterData.description || null, // Ensure null if undefined
        aggregation_type: meterData.aggregation_type,
        unit_name: meterData.unit_name || 'units',
        billing_model: meterData.billing_model || 'metered'
      } as TablesInsert<'usage_meters'>) // Cast to Insert type
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create meter: ${error.message}`);
    }

    // Create plan limits if provided
    if (meterData.plan_limits && meterData.plan_limits.length > 0) {
      const planLimitsData = meterData.plan_limits.map(limit => ({
        tenant_id: tenantId,
        meter_id: meter.id,
        plan_name: limit.plan_name,
        limit_value: limit.limit_value || null, // Ensure null if undefined
        overage_price: limit.overage_price || null, // Ensure null if undefined
        soft_limit_threshold: limit.soft_limit_threshold || 0.8,
        hard_cap: limit.hard_cap || false
      } as TablesInsert<'meter_plan_limits'>)); // Cast to Insert type

      const { error: limitsError } = await supabase
        .from('meter_plan_limits')
        .insert(planLimitsData);

      if (limitsError) {
        throw new Error(`Failed to create plan limits: ${limitsError.message}`);
      }
    }

    // Log audit event
    await AuditLogger.log({
      action: 'meter_created',
      resourceType: 'usage_meter',
      resourceId: meter.id,
      newValue: meter,
      metadata: { creator_id: creatorId }
    });

    // Track analytics event
    await TenantAnalytics.trackFeatureUsage(
      creatorId,
      'usage_meter',
      'created',
      creatorId,
      { meter_name: meter.display_name }
    );

    return meter as UsageMeter; // Cast to UsageMeter
  }

  /**
   * Track usage with tenant context
   */
  static async trackUsage(request: TrackUsageRequest): Promise<UsageEvent> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient(tenantId);

    // Get the meter to ensure it exists and belongs to this tenant
    const { data: meter, error: meterError } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('id', request.meter_id)
      .eq('tenant_id', tenantId)
      .single();

    if (meterError || !meter) {
      throw new Error('Meter not found or not accessible');
    }

    // Create usage event with tenant context
    const { data: event, error } = await supabase
      .from('usage_events')
      .insert({
        tenant_id: tenantId,
        meter_id: request.meter_id,
        user_id: request.user_id,
        event_value: request.event_value || 1,
        properties: request.properties || null // Ensure null if undefined
      } as TablesInsert<'usage_events'>) // Cast to Insert type
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track usage: ${error.message}`);
    }

    // Log audit event
    await AuditLogger.logUsageEvent(
      request.meter_id,
      {
        user_id: request.user_id,
        event_value: request.event_value,
        properties: request.properties
      }
    );

    // Track analytics
    await TenantAnalytics.trackUsage(
      request.user_id,
      meter.event_name,
      request.event_value || 1,
      request.user_id,
      {
        meter_id: request.meter_id,
        meter_name: meter.display_name
      }
    );

    // Update aggregates asynchronously
    this.updateAggregatesAsync(request.meter_id, request.user_id).catch((error: any) => {
      console.error('Failed to update aggregates:', error);
    });

    return event as UsageEvent; // Cast to UsageEvent
  }

  /**
   * Get usage summary for a user with tenant isolation
   */
  static async getUserUsageSummary(
    userId: string,
    creatorId?: string,
    period?: string
  ): Promise<UsageSummary[]> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient(tenantId);

    let query = supabase
      .from('usage_aggregates')
      .select(`
        *,
        usage_meters!inner (
          id,
          display_name,
          unit_name,
          creator_id
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (creatorId) {
      query = query.eq('usage_meters.creator_id', creatorId);
    }

    if (period) {
      query = query.eq('billing_period', period);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get usage summary: ${error.message}`);
    }

    return data.map((aggregate: UsageAggregateWithMeter) => ({
      meter_id: aggregate.meter_id,
      meter_name: aggregate.usage_meters.display_name,
      user_id: aggregate.user_id,
      current_usage: aggregate.aggregate_value,
      overage_amount: 0, // Default overage_amount
      plan_name: 'unknown', // Default plan_name
      billing_period: aggregate.billing_period || '', // Ensure billing_period is string
      alerts: [], // Default alerts
      limit_value: null, // Default limit_value
      usage_percentage: null, // Default usage_percentage
    }));
  }

  /**
   * Check usage enforcement for a user
   */
  static async checkUsageEnforcement(
    userId: string,
    meterId: string,
    requestedUsage: number = 1
  ): Promise<{
    allowed: boolean;
    reason?: string;
    current_usage: number;
    limit: number | null;
    remaining: number | null;
  }> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient(tenantId);

    // Get current usage for this billing period
    const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    const { data: aggregate } = await supabase
      .from('usage_aggregates')
      .select('aggregate_value')
      .eq('tenant_id', tenantId)
      .eq('meter_id', meterId)
      .eq('user_id', userId)
      .eq('billing_period', currentPeriod)
      .single();

    const currentUsage = aggregate?.aggregate_value || 0;

    // Get user's current tier and usage limits
    const { data: tierAssignment } = await supabase
      .from('customer_tier_assignments')
      .select(`
        tier_id,
        subscription_tiers!inner (
          usage_caps
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('customer_id', userId)
      .eq('status', 'active')
      .single();

    if (!tierAssignment) {
      // No tier assigned, allow usage (could be free tier)
      return {
        allowed: true,
        current_usage: currentUsage,
        limit: null,
        remaining: null
      };
    }

    // Get meter information to find the limit
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('event_name')
      .eq('tenant_id', tenantId)
      .eq('id', meterId)
      .single();

    if (!meter) {
      throw new Error('Meter not found');
    }

    const usageCaps = tierAssignment.subscription_tiers.usage_caps as Record<string, number> | null; // Cast to specific type
    const limit = usageCaps?.[meter.event_name];

    if (!limit || limit <= 0) {
      // No limit or unlimited
      return {
        allowed: true,
        current_usage: currentUsage,
        limit: null,
        remaining: null
      };
    }

    const newUsage = currentUsage + requestedUsage;
    const remaining = Math.max(0, limit - currentUsage);

    if (newUsage > limit) {
      return {
        allowed: false,
        reason: `Usage limit exceeded. Current: ${currentUsage}, Limit: ${limit}, Requested: ${requestedUsage}`,
        current_usage: currentUsage,
        limit,
        remaining
      };
    }

    return {
      allowed: true,
      current_usage: currentUsage,
      limit,
      remaining
    };
  }

  /**
   * Get usage meters for a creator with tenant isolation
   */
  static async getCreatorMeters(creatorId: string): Promise<UsageMeter[]> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient(tenantId);

    const { data, error } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('creator_id', creatorId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get meters: ${error.message}`);
    }

    return data as UsageMeter[];
  }

  /**
   * Update plan limits for a meter
   */
  static async updatePlanLimits(
    meterId: string,
    planLimits: MeterPlanLimit[]
  ): Promise<void> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient(tenantId);

    // Verify meter belongs to this tenant
    const { data: meter } = await supabase
      .from('usage_meters')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', meterId)
      .single();

    if (!meter) {
      throw new Error('Meter not found or not accessible');
    }

    // Delete existing limits
    await supabase
      .from('meter_plan_limits')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('meter_id', meterId);

    // Insert new limits if provided
    if (planLimits.length > 0) {
      const limitsData = planLimits.map(limit => ({
        tenant_id: tenantId,
        meter_id: meter.id,
        plan_name: limit.plan_name,
        limit_value: limit.limit_value || null, // Ensure null if undefined
        overage_price: limit.overage_price || null, // Ensure null if undefined
        soft_limit_threshold: limit.soft_limit_threshold || 0.8,
        hard_cap: limit.hard_cap || false
      } as TablesInsert<'meter_plan_limits'>)); // Cast to Insert type

      const { error: limitsError } = await supabase
        .from('meter_plan_limits')
        .insert(limitsData);

      if (limitsError) {
        throw new Error(`Failed to update plan limits: ${limitsError.message}`);
      }
    }

    // Log audit event
    await AuditLogger.log({
      action: 'plan_limits_updated',
      resourceType: 'meter_plan_limits',
      resourceId: meterId,
      newValue: planLimits,
      metadata: { meter_id: meterId }
    });
  }

  /**
   * Get usage analytics for a tenant
   */
  static async getUsageAnalytics(
    creatorId?: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<UsageAnalytics> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient(tenantId);

    let interval = '30 days';
    switch (period) {
      case 'day':
        interval = '1 day';
        break;
      case 'week':
        interval = '7 days';
        break;
    }

    let query = supabase
      .from('usage_events')
      .select(`
        *,
        usage_meters!inner (
          display_name,
          creator_id,
          unit_name
        )
      `)
      .eq('tenant_id', tenantId)
      .gte('created_at', `now() - interval '${interval}'`);

    if (creatorId) {
      query = query.eq('usage_meters.creator_id', creatorId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get usage analytics: ${error.message}`);
    }

    // Process analytics
    const analytics: UsageAnalytics = {
      total_events: data.length,
      unique_users: new Set(data.map((e: Tables<'usage_events'>) => e.user_id)).size,
      meters: {},
      period_start: new Date(Date.now() - (period === 'day' ? 86400000 : period === 'week' ? 604800000 : 2592000000)).toISOString(),
      period_end: new Date().toISOString(),
      total_usage: 0, // Initialize
      usage_by_user: [], // Initialize
      usage_trends: [], // Initialize
      revenue_impact: { base_revenue: 0, overage_revenue: 0, total_revenue: 0 }, // Initialize
      top_users: [] // Initialize
    };

    data.forEach((event: any) => {
      const meterName = event.usage_meters.display_name;
      if (!analytics.meters[meterName]) {
        analytics.meters[meterName] = {
          total_events: 0,
          total_value: 0,
          unique_users: 0, // Initialize as number
          unit_name: event.usage_meters.unit_name
        };
      }

      analytics.meters[meterName].total_events++;
      analytics.meters[meterName].total_value += event.event_value;
      // For unique users, we'd need a more complex aggregation or a separate query
      // For now, we'll just count distinct user_ids for the meter
      // This is a simplification for the demo
      // analytics.meters[meterName].unique_users = (analytics.meters[meterName].unique_users as number) + 1; // Increment
    });

    // Recalculate unique users for meters after all events are processed
    // This is a placeholder, actual unique user calculation would be more complex
    Object.keys(analytics.meters).forEach(meterName => {
      const meterEvents = data.filter((e: Tables<'usage_events'> & { usage_meters: Pick<Tables<'usage_meters'>, 'display_name'> }) => e.usage_meters.display_name === meterName);
      analytics.meters[meterName].unique_users = new Set(meterEvents.map((e: Tables<'usage_events'>) => e.user_id)).size;
    });

    // Placeholder calculations for other analytics properties
    analytics.total_usage = data.reduce((sum: number, event: Tables<'usage_events'>) => sum + event.event_value, 0);
    analytics.usage_by_user = Array.from(data.reduce((acc: Map<string, { user_id: string; usage: number; plan: string }>, event: Tables<'usage_events'>) => {
      const userEntry = acc.get(event.user_id) || { user_id: event.user_id, usage: 0, plan: 'unknown' };
      userEntry.usage += event.event_value;
      return acc.set(event.user_id, userEntry);
    }, new Map()).values());
    analytics.usage_trends = Array.from(data.reduce((acc: Map<string, { period: string; usage: number }>, event: Tables<'usage_events'>) => {
      const period = event.created_at.substring(0, 10); // Group by day
      const trendEntry = acc.get(period) || { period, usage: 0 };
      trendEntry.usage += event.event_value;
      return acc.set(period, trendEntry);
    }, new Map()).values()).sort((a, b) => (a as { period: string }).period.localeCompare((b as { period: string }).period));
    
    // Revenue impact and top users would require joining with pricing and customer data
    // For now, these remain mock/simplified
    analytics.revenue_impact = {
      base_revenue: Math.floor(Math.random() * 1000),
      overage_revenue: Math.floor(Math.random() * 500),
      total_revenue: Math.floor(Math.random() * 1500)
    };
    analytics.top_users = analytics.usage_by_user
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)
      .map(u => ({ ...u, revenue: Math.floor(Math.random() * 100) })); // Mock revenue

    return analytics;
  }

  /**
   * Update usage aggregates (private helper)
   */
  private static async updateAggregatesAsync(meterId: string, userId: string): Promise<void> {
    try {
      const tenantId = getTenantIdFromHeaders();
      if (!tenantId) throw new Error('Tenant context not found');

      const supabase = await createSupabaseAdminClient(tenantId);
      const currentPeriod = this.getCurrentBillingPeriod();
      const periodStart = this.getPeriodStart(currentPeriod);
      const periodEnd = this.getPeriodEnd(currentPeriod);

      // Get meter info for aggregation type
      const { data: meter } = await supabase
        .from('usage_meters')
        .select('aggregation_type')
        .eq('tenant_id', tenantId)
        .eq('id', meterId)
        .single();

      if (!meter) return;

      // Calculate aggregate value based on type
      let aggregateValue = 0;
      let eventCount = 0;

      const { data: events } = await supabase
        .from('usage_events')
        .select('event_value')
        .eq('meter_id', meterId)
        .eq('user_id', userId)
        .gte('event_timestamp', periodStart)
        .lte('event_timestamp', periodEnd);

      if (events && events.length > 0) {
        eventCount = events.length;
        
        switch (meter.aggregation_type) {
          case 'count':
            aggregateValue = eventCount;
            break;
          case 'sum':
            aggregateValue = events.reduce((sum: number, e: { event_value: number }) => sum + Number(e.event_value), 0);
            break;
          case 'max':
            aggregateValue = Math.max(...events.map((e: { event_value: number }) => Number(e.event_value)));
            break;
          case 'unique':
            // For unique, we'd need to track unique properties - simplified for now
            aggregateValue = eventCount;
            break;
          case 'duration':
            aggregateValue = events.reduce((sum: number, e: { event_value: number }) => sum + Number(e.event_value), 0);
            break;
        }
      }

      // Upsert aggregate
      await supabase
        .from('usage_aggregates')
        .upsert({
          tenant_id: tenantId,
          meter_id: meterId,
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd,
          aggregate_value: aggregateValue,
          event_count: eventCount,
          billing_period: currentPeriod
        } as TablesInsert<'usage_aggregates'>);
    } catch (error) {
      console.error('Error updating aggregates:', error);
    }
  }

  /**
   * Check for limit violations and create alerts (private helper)
   */
  private static async checkLimitsAsync(meterId: string, userId: string): Promise<void> {
    try {
      const tenantId = getTenantIdFromHeaders();
      if (!tenantId) throw new Error('Tenant context not found');

      const supabase = await createSupabaseServerClient();
      const currentPeriod = this.getCurrentBillingPeriod();

      // Get current usage
      const { data: aggregate } = await supabase
        .from('usage_aggregates')
        .select('aggregate_value')
        .eq('tenant_id', tenantId)
        .eq('meter_id', meterId)
        .eq('user_id', userId)
        .eq('billing_period', currentPeriod)
        .single();

      const currentUsage = aggregate?.aggregate_value || 0;

      // Get meter and its plan limits
      const { data: meterWithLimits } = await supabase
        .from('usage_meters')
        .select(`
          *,
          meter_plan_limits!inner (
            plan_name,
            limit_value,
            soft_limit_threshold,
            hard_cap
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('id', meterId)
        .single();

      if (!meterWithLimits || !meterWithLimits.meter_plan_limits) return;

      for (const limit of meterWithLimits.meter_plan_limits) {
        if (!limit.limit_value) continue; // Skip if no limit

        const usagePercentage = (currentUsage / limit.limit_value) * 100;

        // Check for soft limit (warning)
        if (limit.soft_limit_threshold && usagePercentage >= (limit.soft_limit_threshold * 100)) {
          await supabase
            .from('usage_alerts')
            .upsert({
              tenant_id: tenantId,
              meter_id: meterId,
              user_id: userId,
              plan_name: limit.plan_name,
              alert_type: 'soft_limit_reached',
              threshold_percentage: limit.soft_limit_threshold * 100,
              current_usage: currentUsage,
              limit_value: limit.limit_value,
              triggered_at: new Date().toISOString(),
              acknowledged: false
            } as TablesInsert<'usage_alerts'>);
        }

        // Check for hard cap (blocking)
        if (limit.hard_cap && currentUsage >= limit.limit_value) {
          await supabase
            .from('usage_alerts')
            .upsert({
              tenant_id: tenantId,
              meter_id: meterId,
              user_id: userId,
              plan_name: limit.plan_name,
              alert_type: 'hard_limit_reached',
              threshold_percentage: 100,
              current_usage: currentUsage,
              limit_value: limit.limit_value,
              triggered_at: new Date().toISOString(),
              acknowledged: false
            } as TablesInsert<'usage_alerts'>);
        }
      }
    } catch (error) {
      console.error('Error checking limits:', error);
    }
  }

  /**
   * Helper methods for date/period calculations
   */
  private static getCurrentBillingPeriod(): string {
    return new Date().toISOString().substring(0, 7); // YYYY-MM format
  }

  private static getPeriodStart(period?: string): string {
    const p = period || this.getCurrentBillingPeriod();
    return `${p}-01T00:00:00.000Z`;
  }

  private static getPeriodEnd(period?: string): string {
    const p = period || this.getCurrentBillingPeriod();
    const date = new Date(`${p}-01`);
    date.setUTCMonth(date.getUTCMonth() + 1);
    date.setUTCDate(0);
    return `${p}-${String(date.getUTCDate()).padStart(2, '0')}T23:59:59.999Z`;
  }

  // --- Missing Helper Methods for UsageAnalytics Calculation ---
  private static calculateUsageByUser(aggregates: UsageAggregate[]): UsageAnalytics['usage_by_user'] {
    const userMap = new Map<string, { user_id: string; usage: number; plan: string }>();
    aggregates.forEach((agg: UsageAggregate) => {
      const userEntry = userMap.get(agg.user_id) || { user_id: agg.user_id, usage: 0, plan: 'unknown' };
      userEntry.usage += agg.aggregate_value;
      userMap.set(agg.user_id, userEntry);
    });
    return Array.from(userMap.values());
  }

  private static calculateUsageTrends(aggregates: UsageAggregate[]): UsageAnalytics['usage_trends'] {
    const trendMap = new Map<string, { period: string; usage: number }>();
    aggregates.forEach((agg: UsageAggregate) => {
      const period = agg.period_start.substring(0, 10); // Group by day
      const trendEntry = trendMap.get(period) || { period, usage: 0 };
      trendEntry.usage += agg.aggregate_value;
      trendMap.set(period, trendEntry);
    });
    return Array.from(trendMap.values()).sort((a, b) => (a as { period: string }).period.localeCompare((b as { period: string }).period));
  }
}
