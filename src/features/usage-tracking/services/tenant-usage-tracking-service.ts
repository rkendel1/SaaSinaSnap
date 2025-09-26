/**
 * Tenant-Aware Usage Tracking Service
 * Enhanced usage tracking service with multi-tenant support
 */

import { AuditLogger } from '@/libs/audit/audit-logger';
import { TenantAnalytics } from '@/libs/analytics/tenant-analytics';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'; // Added import
import { ensureTenantContext } from '@/libs/supabase/tenant-context';
import { Json, Tables, TablesInsert } from '@/libs/supabase/types';
import { headers } from 'next/headers';

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

    data.forEach((event: UsageEventWithMeter) => {
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
    
    // Revenue impact and top users would require joining with pricing and customer data
    // For now, these remain mock/simplified
    analytics.revenue_impact = {
      base_revenue: Math.floor(Math.random() * 1000),
      overage_revenue: Math.floor(Math.random() * 500),
      total_revenue: Math.floor(Math.random() * 1500)
    };
    analytics.top_users = analytics.usage_by_user
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="492" column="39" code="2769">No overload matches this call.
  Overload 1 of 2, '(predicate: (value: { created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; usage_meters: { display_name: string; creator_id: string; unit_name: string | null; }; }, index: number, array: { ...; }[]) =&gt; value is { ...; }, thisArg?: any): { ...; }[]', gave the following error.
    Argument of type '(e: UsageEventWithMeter) =&gt; boolean' is not assignable to parameter of type '(value: { created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; usage_meters: { display_name: string; creator_id: string; unit_name: string | null; }; }, index: number, array: { ...; }[]) =&gt; value is { ...; }'.
      Types of parameters 'e' and 'value' are incompatible.
        Type '{ created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; usage_meters: { display_name: string; creator_id: string; unit_name: string | null; }; }' is not assignable to type 'UsageEventWithMeter'.
          Type '{ created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; usage_meters: { display_name: string; creator_id: string; unit_name: string | null; }; }' is not assignable to type '{ usage_meters: Pick&lt;{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }, &quot;id&quot; | ... 10 more ... |...'.
            Types of property 'usage_meters' are incompatible.
              Type '{ display_name: string; creator_id: string; unit_name: string | null; }' is missing the following properties from type 'Pick&lt;{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }, &quot;id&quot; | ... 10 more ... | &quot;updated_at&quot;&gt;': id, active, aggregation_type, billing_model, and 5 more.
  Overload 2 of 2, '(predicate: (value: { created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; usage_meters: { display_name: string; creator_id: string; unit_name: string | null; }; }, index: number, array: { ...; }[]) =&gt; unknown, thisArg?: any): { ...; }[]', gave the following error.
    Argument of type '(e: UsageEventWithMeter) =&gt; boolean' is not assignable to parameter of type '(value: { created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; usage_meters: { display_name: string; creator_id: string; unit_name: string | null; }; }, index: number, array: { ...; }[]) =&gt; unknown'.
      Types of parameters 'e' and 'value' are incompatible.
        Type '{ created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; usage_meters: { display_name: string; creator_id: string; unit_name: string | null; }; }' is not assignable to type 'UsageEventWithMeter'.
          Type '{ created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; usage_meters: { display_name: string; creator_id: string; unit_name: string | null; }; }' is not assignable to type '{ usage_meters: Pick&lt;{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }, &quot;id&quot; | ... 10 more ... |...'.
            Types of property 'usage_meters' are incompatible.
              Type '{ display_name: string; creator_id: string; unit_name: string | null; }' is missing the following properties from type 'Pick&lt;{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }, &quot;id&quot; | ... 10 more ... | &quot;updated_at&quot;&gt;': id, active, aggregation_type, billing_model, and 5 more.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="533" column="30" code="2304">Cannot find name 'createSupabaseServerClient'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="609" column="30" code="2304">Cannot find name 'createSupabaseServerClient'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="751" column="28" code="2304">Cannot find name 'createSupabaseServerClient'.</problem>
<problem file="src/features/pricing/controllers/upsert-price.ts" line="35" column="5" code="2353">Object literal may only specify known properties, and 'tenant_id' does not exist in type '{ active?: boolean | null | undefined; created_at?: string | null | undefined; currency?: string | null | undefined; description?: string | null | undefined; id: string; interval?: &quot;day&quot; | ... 4 more ... | undefined; ... 6 more ...; updated_at?: string | ... 1 more ... | undefined; }'.</problem>
<problem file="src/features/pricing/controllers/upsert-product.ts" line="30" column="5" code="2353">Object literal may only specify known properties, and 'tenant_id' does not exist in type '{ active?: boolean | null | undefined; created_at?: string | null | undefined; description?: string | null | undefined; id: string; image?: string | null | undefined; metadata?: Json | undefined; name?: string | ... 1 more ... | undefined; updated_at?: string | ... 1 more ... | undefined; }'.</problem>
<problem file="src/features/creator/actions/product-actions.ts" line="109" column="102" code="2345">Argument of type 'ProductUpdateParams' is not assignable to parameter of type '{ name?: string | undefined; description?: string | undefined; metadata?: Record&lt;string, string&gt; | undefined; images?: string[] | undefined; statement_descriptor?: string | undefined; unit_label?: string | undefined; active?: boolean | undefined; }'.
  Types of property 'description' are incompatible.
    Type 'Emptyable&lt;string&gt; | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.</problem>
<problem file="src/features/creator/actions/product-actions.ts" line="127" column="90" code="2345">Argument of type 'PriceCreateParams' is not assignable to parameter of type '{ product: string; unit_amount: number; currency: string; recurring?: { interval: &quot;day&quot; | &quot;week&quot; | &quot;month&quot; | &quot;year&quot;; interval_count?: number | undefined; trial_period_days?: number | undefined; usage_type?: &quot;metered&quot; | ... 1 more ... | undefined; aggregate_usage?: &quot;sum&quot; | ... 3 more ... | undefined; } | undefined; b...'.
  Types of property 'product' are incompatible.
    Type 'string | undefined' is not assignable to type 'string'.
      Type 'undefined' is not assignable to type 'string'.</problem>
<problem file="src/features/creator/actions/product-actions.ts" line="167" column="89" code="2345">Argument of type 'ProductCreateParams' is not assignable to parameter of type '{ name: string; description?: string | undefined; metadata?: Record&lt;string, string&gt; | undefined; images?: string[] | undefined; statement_descriptor?: string | undefined; unit_label?: string | undefined; active?: boolean | undefined; }'.
  Types of property 'metadata' are incompatible.
    Type 'MetadataParam | undefined' is not assignable to type 'Record&lt;string, string&gt; | undefined'.
      Type 'MetadataParam' is not assignable to type 'Record&lt;string, string&gt;'.
        'string' index signatures are incompatible.
          Type 'string | number | null' is not assignable to type 'string'.
            Type 'null' is not assignable to type 'string'.</problem>
<problem file="src/features/creator/actions/product-actions.ts" line="183" column="85" code="2345">Argument of type 'PriceCreateParams' is not assignable to parameter of type '{ product: string; unit_amount: number; currency: string; recurring?: { interval: &quot;day&quot; | &quot;week&quot; | &quot;month&quot; | &quot;year&quot;; interval_count?: number | undefined; trial_period_days?: number | undefined; usage_type?: &quot;metered&quot; | ... 1 more ... | undefined; aggregate_usage?: &quot;sum&quot; | ... 3 more ... | undefined; } | undefined; b...'.
  Types of property 'product' are incompatible.
    Type 'string | undefined' is not assignable to type 'string'.
      Type 'undefined' is not assignable to type 'string'.</problem>
<problem file="src/features/platform-owner/components/PlatformProductManager.tsx" line="161" column="25" code="2339">Property 'tenant_id' does not exist on type '{ created_at: string; default_creator_brand_color: string | null; default_creator_gradient: Json; default_creator_pattern: Json; default_white_labeled_page_config: Json; ... 8 more ...; updated_at: string; }'.</problem>
<problem file="src/features/creator/components/ProductAndTierManager.tsx" line="108" column="47" code="7009">'new' expression, whose target lacks a construct signature, implicitly has an 'any' type.</problem>
<problem file="src/features/creator/components/ProductAndTierManager.tsx" line="315" column="7" code="2353">Object literal may only specify known properties, and 'stripe_product_id' does not exist in type 'SetStateAction&lt;Partial&lt;CreateTierRequest&gt;&gt;'.</problem>
<problem file="src/features/creator/components/ProductAndTierManager.tsx" line="331" column="25" code="2352">Conversion of type 'Record&lt;string, number&gt; | null | undefined' to type 'string' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Record&lt;string, number&gt;' is not comparable to type 'string'.</problem>
<problem file="src/features/creator/components/ProductAndTierManager.tsx" line="356" column="8" code="2352">Conversion of type 'Record&lt;string, number&gt; | null | undefined' to type 'string' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Record&lt;string, number&gt;' is not comparable to type 'string'.</problem>
<problem file="src/features/creator/components/ProductAndTierManager.tsx" line="462" column="8" code="2352">Conversion of type 'Record&lt;string, number&gt; | null | undefined' to type 'string' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'Record&lt;string, number&gt;' is not comparable to type 'string'.</problem>
<problem file="src/features/creator/components/ProductAndTierManager.tsx" line="641" column="39" code="7006">Parameter 'prev' implicitly has an 'any' type.</problem>
<problem file="src/app/creator/(protected)/products-and-tiers/page.tsx" line="7" column="10" code="2305">Module '&quot;@/features/usage-tracking/services/tier-management-service&quot;' has no exported member 'getCreatorTiers'.</problem>
<problem file="src/app/demo-dashboard/page.tsx" line="3" column="41" code="2307">Cannot find module '@/features/usage-tracking/components/TierManagementDashboard' or its corresponding type declarations.</problem>
</dyad-problem-report><think>**Examining Errors' Root**

I'm currently engaged in a deep dive, meticulously dissecting the 20 TypeScript compile-time errors. My focus is on understanding the root causes of each issue within the provided files. I'm prioritizing `tenant-usage-tracking-service.ts` for error one, and I'll systematically move through the list, applying targeted fixes based on careful analysis.


**Tackling Type Incompatibilities**

I've made progress on the first five errors in `tenant-usage-tracking-service.ts`.  The type mismatch in `UsageEventWithMeter` is now resolved; adjusting the type to mirror the partial `select` query fixed the issue.  Additionally, I added the missing `createSupabaseServerClient` import to the service file, addressing errors three, four, and five.  I'm now moving on to the `upsert-price.ts` errors.


**Identifying Schema Deficiencies**

Okay, I've moved on to the `upsert-price.ts` and `upsert-product.ts` files, identifying the root cause of error 6 and 7. The type errors stem from missing `tenant_id` properties in the `prices` and `products` table inserts in the Supabase types. I'll need to update the Supabase schema definitions in `src/libs/supabase/types.ts` to include this field in both table inserts, resolving these inconsistencies.


**Resolving Schema Conflicts**

I'm now focused on the missing `tenant_id` properties in both `prices` and `products` tables. I will update the `supabase-types.ts` file to include `tenant_id` in the `Insert` and `Update` types for both tables to address errors 6 and 7. After resolving the type discrepancies, I will transition to addressing Stripe-related errors in `product-actions.ts`.


**Analyzing Stripe Integrations**

I'm now diving into the Stripe-related errors in `product-actions.ts`. I need to ensure that the correct types are being used when interacting with the Stripe API, focusing specifically on how the  `description`, `product`, and `metadata` parameters are being passed to Stripe methods.  Addressing type mismatches and ensuring the correct types are being passed will resolve these issues. I'll carefully review the expected Stripe parameter types and adjust the code accordingly, particularly in the `updateStripeProduct` and `createStripePrice` functions.


**Implementing Stripe Adjustments**

I'm now implementing the fixes for the Stripe-related errors in `product-actions.ts`. I'm focusing on ensuring the correct types are used when interacting with the Stripe API for `description`, `product`, and `metadata`. I've adjusted the type for `description` in `updateStripeProduct`, and I'm ensuring `product` is a string in `createStripePrice`. Also, I've correctly typed `metadata` in `createStripeProduct` to resolve those issues.


**Prioritizing & Fixing Errors**

I'm starting with `tenant-usage-tracking-service.ts`, addressing the type mismatch in `UsageEventWithMeter` and the missing `createSupabaseServerClient` import. The type now accurately reflects the partial selection in the `getUsageAnalytics` query. I'll move to `upsert-price.ts` and `upsert-product.ts` to tackle schema deficiencies next.

\n\n

**Addressing Missing Fields**

I've tackled the type errors in `tenant-usage-tracking-service.ts` and am now focusing on schema discrepancies. I'll update `src/libs/supabase/types.ts` to include `tenant_id` in the `prices` and `products` table inserts. This should resolve the errors in `upsert-price.ts` and `upsert-product.ts`.


</think>Okay, I will fix these 20 TypeScript compile-time errors. I'll go through each one, applying the necessary type adjustments, imports, and logic corrections.

Here's the first set of changes for `src/libs/supabase/types.ts`, `src/features/usage-tracking/services/tenant-usage-tracking-service.ts`, and `src/features/platform-owner-onboarding/types/index.ts`.

<dyad-write path="src/libs/supabase/types.ts" description="Adding tenant_id to the Insert and Update types for products and prices tables.">
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_customization_sessions: {
        Row: {
          created_at: string
          creator_id: string
          current_options: Json
          embed_type: string
          id: string
          messages: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          current_options: Json
          embed_type: string
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          current_options?: Json
          embed_type?: string
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          distinct_id: string
          event_name: string
          event_properties: Json | null
          id: string
          metadata: Json | null
          posthog_event_id: string | null
          sent_to_posthog: boolean | null
          session_id: string | null
          tenant_id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          distinct_id: string
          event_name: string
          event_properties?: Json | null
          id?: string
          metadata?: Json | null
          posthog_event_id?: string | null
          sent_to_posthog?: boolean | null
          session_id?: string | null
          tenant_id: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          distinct_id?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          metadata?: Json | null
          posthog_event_id?: string | null
          sent_to_posthog?: boolean | null
          session_id?: string | null
          tenant_id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_sharing_logs: {
        Row: {
          accessed_at: string
          accessed_by_ip: string | null
          accessed_by_user_agent: string | null
          asset_id: string
          id: string
          referrer_url: string | null
        }
        Insert: {
          accessed_at?: string
          accessed_by_ip?: string | null
          accessed_by_user_agent?: string | null
          asset_id: string
          id?: string
          referrer_url?: string | null
        }
        Update: {
          accessed_at?: string
          accessed_by_ip?: string | null
          accessed_by_user_agent?: string | null
          asset_id?: string
          id?: string
          referrer_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_sharing_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "embed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_events: {
        Row: {
          connector_type: string
          created_at: string
          error_message: string | null
          event_data: Json
          event_type: string
          external_id: string | null
          id: string
          metadata: Json | null
          retry_count: number | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          connector_type: string
          created_at?: string
          error_message?: string | null
          event_data: Json
          event_type: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          retry_count?: number | null
          status: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          connector_type?: string
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          retry_count?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connector_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_analytics: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          metric_data: Json | null
          metric_name: string
          metric_value: number | null
          period_end: string
          period_start: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          metric_data?: Json | null
          metric_name: string
          metric_value?: number | null
          period_end: string
          period_start: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          metric_data?: Json | null
          metric_name?: string
          metric_value?: number | null
          period_end?: string
          period_start?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_analytics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_products: {
        Row: {
          active: boolean | null
          created_at: string
          creator_id: string
          currency: string | null
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          price: number | null
          product_type: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          creator_id: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          price?: number | null
          product_type?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          creator_id?: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          price?: number | null
          product_type?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          billing_address: Json | null
          billing_email: string | null
          billing_phone: string | null
          brand_color: string | null
          brand_gradient: Json | null
          brand_pattern: Json | null
          branding_extracted_at: string | null
          branding_extraction_error: string | null
          branding_extraction_status: string | null
          business_description: string | null
          business_logo_url: string | null
          business_name: string | null
          business_website: string | null
          created_at: string
          extracted_branding_data: Json | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          page_slug: string
          stripe_access_token: string | null
          stripe_account_enabled: boolean | null
          stripe_account_id: string | null
          stripe_refresh_token: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          billing_email?: string | null
          billing_phone?: string | null
          brand_color?: string | null
          brand_gradient?: Json | null
          brand_pattern?: Json | null
          branding_extracted_at?: string | null
          branding_extraction_error?: string | null
          branding_extraction_status?: string | null
          business_description?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_website?: string | null
          created_at?: string
          extracted_branding_data?: Json | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          page_slug: string
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          billing_email?: string | null
          billing_phone?: string | null
          brand_color?: string | null
          brand_gradient?: Json | null
          brand_pattern?: Json | null
          branding_extracted_at?: string | null
          branding_extraction_error?: string | null
          branding_extraction_status?: string | null
          business_description?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_website?: string | null
          created_at?: string
          extracted_branding_data?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          page_slug?: string
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_stripe_accounts: {
        Row: {
          access_token: string
          created_at: string
          creator_id: string
          environment: Database["public"]["Enums"]["stripe_environment"]
          id: string
          refresh_token: string
          stripe_account_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          creator_id: string
          environment: Database["public"]["Enums"]["stripe_environment"]
          id?: string
          refresh_token: string
          stripe_account_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          creator_id?: string
          environment?: Database["public"]["Enums"]["stripe_environment"]
          id?: string
          refresh_token?: string
          stripe_account_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_stripe_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_stripe_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_webhooks: {
        Row: {
          active: boolean | null
          created_at: string
          creator_id: string
          endpoint_url: string
          events: string[]
          id: string
          secret_key: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          creator_id: string
          endpoint_url: string
          events: string[]
          id?: string
          secret_key?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          creator_id?: string
          endpoint_url?: string
          events?: string[]
          id?: string
          secret_key?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_webhooks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tier_assignments: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          creator_id: string
          current_period_end: string
          current_period_start: string
          customer_id: string
          id: string
          status: string
          stripe_subscription_id: string | null
          tenant_id: string | null
          tier_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          creator_id: string
          current_period_end?: string
          current_period_start?: string
          customer_id: string
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          tenant_id?: string | null
          tier_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          creator_id?: string
          current_period_end?: string
          current_period_start?: string
          customer_id?: string
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          tenant_id?: string | null
          tier_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tier_assignments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tier_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tier_assignments_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      embed_assets: {
        Row: {
          active: boolean | null
          asset_type: string
          created_at: string
          creator_id: string
          description: string | null
          embed_config: Json
          featured: boolean | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          preview_url: string | null
          share_enabled: boolean | null
          share_token: string | null
          tags: string[] | null
          updated_at: string
          usage_count: number | null
          view_count: number | null
        }
        Insert: {
          active?: boolean | null
          asset_type: string
          created_at?: string
          creator_id: string
          description?: string | null
          embed_config: Json
          featured?: boolean | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          preview_url?: string | null
          share_enabled?: boolean | null
          share_token?: string | null
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
          view_count?: number | null
        }
        Update: {
          active?: boolean | null
          asset_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          embed_config?: Json
          featured?: boolean | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          preview_url?: string | null
          share_enabled?: boolean | null
          share_token?: string | null
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "embed_assets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_plan_limits: {
        Row: {
          created_at: string
          hard_cap: boolean | null
          id: string
          limit_value: number | null
          meter_id: string
          overage_price: number | null
          plan_name: string
          soft_limit_threshold: number | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hard_cap?: boolean | null
          id?: string
          limit_value?: number | null
          meter_id: string
          overage_price?: number | null
          plan_name: string
          soft_limit_threshold?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hard_cap?: boolean | null
          id?: string
          limit_value?: number | null
          meter_id?: string
          overage_price?: number | null
          plan_name?: string
          soft_limit_threshold?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_plan_limits_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_plan_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          default_creator_brand_color: string | null
          default_creator_gradient: Json | null
          default_creator_pattern: Json | null
          default_white_labeled_page_config: Json | null
          id: string
          onboarding_step: number | null
          owner_id: string | null
          platform_owner_onboarding_completed: boolean | null
          stripe_access_token: string | null
          stripe_account_enabled: boolean | null
          stripe_account_id: string | null
          stripe_refresh_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_creator_brand_color?: string | null
          default_creator_gradient?: Json | null
          default_creator_pattern?: Json | null
          default_white_labeled_page_config?: Json | null
          id?: string
          onboarding_step?: number | null
          owner_id?: string | null
          platform_owner_onboarding_completed?: boolean | null
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_creator_brand_color?: string | null
          default_creator_gradient?: Json | null
          default_creator_pattern?: Json | null
          default_white_labeled_page_config?: Json | null
          id?: string
          onboarding_step?: number | null
          owner_id?: string | null
          platform_owner_onboarding_completed?: boolean | null
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          tenant_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          tenant_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          tenant_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscribed_products: {
        Row: {
          creator_product_id: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          price: number | null
          product_type: string | null
          subscribed_at: string | null
          subscription_id: string | null
        }
        Insert: {
          creator_product_id?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          price?: number | null
          product_type?: string | null
          subscribed_at?: string | null
          subscription_id?: string | null
        }
        Update: {
          creator_product_id?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          price?: number | null
          product_type?: string | null
          subscribed_at?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribed_products_creator_product_id_fkey"
            columns: ["creator_product_id"]
            isOneToOne: false
            referencedRelation: "creator_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscribed_products_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          active: boolean | null
          billing_cycle: string
          created_at: string
          creator_id: string
          currency: string | null
          description: string | null
          feature_entitlements: Json | null
          id: string
          is_default: boolean | null
          name: string
          price: number
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tenant_id: string | null
          trial_period_days: number | null
          updated_at: string
          usage_caps: Json | null
        }
        Insert: {
          active?: boolean | null
          billing_cycle?: string
          created_at?: string
          creator_id: string
          currency?: string | null
          description?: string | null
          feature_entitlements?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          price: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tenant_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
          usage_caps?: Json | null
        }
        Update: {
          active?: boolean | null
          billing_cycle?: string
          created_at?: string
          creator_id?: string
          currency?: string | null
          description?: string | null
          feature_entitlements?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tenant_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
          usage_caps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_tiers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_tiers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          tenant_id: string | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          tenant_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          tenant_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean | null
          created_at: string
          custom_domain: string | null
          id: string
          name: string
          settings: Json | null
          subdomain: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          name: string
          settings?: Json | null
          subdomain?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          name?: string
          settings?: Json | null
          subdomain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tier_analytics: {
        Row: {
          active_customers: number | null
          average_usage_percentage: number | null
          churned_customers: number | null
          created_at: string
          creator_id: string
          id: string
          new_customers: number | null
          overage_revenue: number | null
          period_end: string
          period_start: string
          period_type: string
          tenant_id: string | null
          tier_id: string
          total_revenue: number | null
          updated_at: string
          usage_metrics: Json | null
        }
        Insert: {
          active_customers?: number | null
          average_usage_percentage?: number | null
          churned_customers?: number | null
          created_at?: string
          creator_id: string
          id?: string
          new_customers?: number | null
          overage_revenue?: number | null
          period_end: string
          period_start: string
          period_type: string
          tenant_id?: string | null
          tier_id: string
          total_revenue?: number | null
          updated_at?: string
          usage_metrics?: Json | null
        }
        Update: {
          active_customers?: number | null
          average_usage_percentage?: number | null
          churned_customers?: number | null
          created_at?: string
          creator_id?: string
          id?: string
          new_customers?: number | null
          overage_revenue?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          tenant_id?: string | null
          tier_id?: string
          total_revenue?: number | null
          updated_at?: string
          usage_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_analytics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_analytics_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_usage_overages: {
        Row: {
          actual_usage: number
          billed: boolean | null
          billed_at: string | null
          billing_period: string
          created_at: string
          creator_id: string
          customer_id: string
          id: string
          limit_value: number
          meter_id: string
          overage_amount: number
          overage_cost: number
          overage_price: number
          stripe_invoice_item_id: string | null
          tenant_id: string | null
          tier_id: string
          updated_at: string
        }
        Insert: {
          actual_usage: number
          billed?: boolean | null
          billed_at?: string | null
          billing_period: string
          created_at?: string
          creator_id: string
          customer_id: string
          id?: string
          limit_value: number
          meter_id: string
          overage_amount: number
          overage_cost: number
          overage_price: number
          stripe_invoice_item_id?: string | null
          tenant_id?: string | null
          tier_id: string
          updated_at?: string
        }
        Update: {
          actual_usage?: number
          billed?: boolean | null
          billed_at?: string | null
          billing_period?: string
          created_at?: string
          creator_id?: string
          customer_id?: string
          id?: string
          limit_value?: number
          meter_id?: string
          overage_amount?: number
          overage_cost?: number
          overage_price?: number
          stripe_invoice_item_id?: string | null
          tenant_id?: string | null
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_usage_overages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_usage_overages_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_usage_overages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_usage_overages_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_aggregates: {
        Row: {
          aggregate_value: number
          billing_period: string | null
          created_at: string
          event_count: number
          id: string
          meter_id: string
          period_end: string
          period_start: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aggregate_value: number
          billing_period?: string | null
          created_at?: string
          event_count?: number
          id?: string
          meter_id: string
          period_end: string
          period_start: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aggregate_value?: number
          billing_period?: string | null
          created_at?: string
          event_count?: number
          id?: string
          meter_id?: string
          period_end?: string
          period_start?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_aggregates_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_aggregates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          current_usage: number
          id: string
          limit_value: number | null
          meter_id: string
          plan_name: string
          tenant_id: string | null
          threshold_percentage: number | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          current_usage: number
          id?: string
          limit_value?: number | null
          meter_id: string
          plan_name: string
          tenant_id?: string | null
          threshold_percentage?: number | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          current_usage?: number
          id?: string
          limit_value?: number | null
          meter_id?: string
          plan_name?: string
          tenant_id?: string | null
          threshold_percentage?: number | null
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_alerts_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_billing_sync: {
        Row: {
          billing_period: string
          billing_status: string | null
          created_at: string
          id: string
          last_sync_attempt: string | null
          meter_id: string
          overage_quantity: number | null
          stripe_subscription_item_id: string | null
          stripe_usage_record_id: string | null
          sync_attempts: number | null
          sync_error: string | null
          tenant_id: string | null
          updated_at: string
          usage_quantity: number
          user_id: string
        }
        Insert: {
          billing_period: string
          billing_status?: string | null
          created_at?: string
          id?: string
          last_sync_attempt?: string | null
          meter_id: string
          overage_quantity?: number | null
          stripe_subscription_item_id?: string | null
          stripe_usage_record_id?: string | null
          sync_attempts?: number | null
          sync_error?: string | null
          tenant_id?: string | null
          updated_at?: string
          usage_quantity: number
          user_id: string
        }
        Update: {
          billing_period?: string
          billing_status?: string | null
          created_at?: string
          id?: string
          last_sync_attempt?: string | null
          meter_id?: string
          overage_quantity?: number | null
          stripe_subscription_item_id?: string | null
          stripe_usage_record_id?: string | null
          sync_attempts?: number | null
          sync_error?: string | null
          tenant_id?: string | null
          updated_at?: string
          usage_quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_billing_sync_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_billing_sync_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          event_timestamp: string
          event_value: number
          id: string
          meter_id: string
          properties: Json | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_timestamp?: string
          event_value?: number
          id?: string
          meter_id: string
          properties?: Json | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_timestamp?: string
          event_value?: number
          id?: string
          meter_id?: string
          properties?: Json | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_meters: {
        Row: {
          active: boolean | null
          aggregation_type: string
          billing_model: string
          created_at: string
          creator_id: string
          description: string | null
          display_name: string
          event_name: string
          id: string
          tenant_id: string | null
          unit_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          aggregation_type: string
          billing_model?: string
          created_at?: string
          creator_id: string
          description?: string | null
          display_name: string
          event_name: string
          id?: string
          tenant_id?: string | null
          unit_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          aggregation_type?: string
          billing_model?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          display_name?: string
          event_name?: string
          id?: string
          tenant_id?: string | null
          unit_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_meters_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_meters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          id: string
          payment_method: Json | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      white_labeled_pages: {
        Row: {
          active: boolean | null
          created_at: string
          creator_id: string
          custom_css: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          page_config: Json | null
          page_description: string | null
          page_slug: string
          page_title: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          creator_id: string
          custom_css?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          page_config?: Json | null
          page_description?: string | null
          page_slug: string
          page_title?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          creator_id?: string
          custom_css?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          page_config?: Json | null
          page_description?: string | null
          page_slug?: string
          page_title?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "white_labeled_pages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "white_labeled_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_audit_log: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_new_value?: Json
          p_old_value?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      create_tenant: {
        Args: {
          tenant_name: string
          tenant_settings?: Json
          tenant_subdomain?: string
        }
        Returns: string
      }
      customer_has_feature_access: {
        Args: {
          p_creator_id: string
          p_customer_id: string
          p_feature_name: string
        }
        Returns: boolean
      }
      delete_user_full: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      ensure_tenant_context: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_creator_dashboard_stats: {
        Args: { creator_uuid: string }
        Returns: {
          active_products: number
          recent_sales_count: number
          total_revenue: number
          total_sales: number
        }[]
      }
      get_current_tenant: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_current_tier: {
        Args: { p_creator_id: string; p_customer_id: string }
        Returns: {
          billing_cycle: string
          current_period_end: string
          feature_entitlements: Json
          status: string
          tier_id: string
          tier_name: string
          tier_price: number
          usage_caps: Json
        }[]
      }
      get_customer_feature_limit: {
        Args: {
          p_creator_id: string
          p_customer_id: string
          p_feature_name: string
        }
        Returns: number
      }
      increment_product_sales: {
        Args: { amount: number; product_id: string }
        Returns: undefined
      }
      set_current_tenant: {
        Args: { tenant_uuid: string }
        Returns: undefined
      }
      wipe_user_public_tables: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      stripe_environment: "test" | "live"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
      user_role: "platform_owner" | "creator" | "subscriber" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
      user_role: ["platform_owner", "creator", "subscriber", "user"],
    },
  },
} as const