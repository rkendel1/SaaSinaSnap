import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables, TablesInsert } from '@/libs/supabase/types';
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

export class UsageTrackingService {
  /**
   * Create a new usage meter
   */
  static async createMeter(creatorId: string, meterData: CreateMeterRequest): Promise<UsageMeter> {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) throw new Error('Tenant context not found');

    const supabase = await createSupabaseServerClient();

    // Create the meter
    const { data: meter, error } = await supabase
      .from('usage_meters')
      .insert({
        tenant_id: tenantId,
        creator_id: creatorId,
        event_name: meterData.event_name,
        display_name: meterData.display_name,
        description: meterData.description,
        aggregation_type: meterData.aggregation_type,
        unit_name: meterData.unit_name || 'units',
        billing_model: meterData.billing_model || 'metered'
      } as TablesInsert<'usage_meters'>)
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
        limit_value: limit.limit_value || null,
        overage_price: limit.overage_price || null,
        soft_limit_threshold: limit.soft_limit_threshold || 0.8,
        hard_cap: limit.hard_cap || false
      }));

      const { error: limitsError } = await supabase
        .from('meter_plan_limits')
        .insert(planLimitsData);

      if (limitsError) {
        console.error('Failed to create plan limits:', limitsError);
      }
    }

    return meter as UsageMeter;
  }

  /**
   * Get all meters for a creator
   */
  static async getMeters(creatorId: string): Promise<UsageMeter[]> {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) throw new Error('Tenant context not found');

    const supabase = await createSupabaseServerClient();

    const { data: meters, error } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('creator_id', creatorId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch meters: ${error.message}`);
    }

    return meters as UsageMeter[] || [];
  }

  /**
   * Get plan limits for a meter
   */
  static async getMeterPlanLimits(meterId: string): Promise<MeterPlanLimit[]> {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) throw new Error('Tenant context not found');

    const supabase = await createSupabaseServerClient();

    const { data: limits, error } = await supabase
      .from('meter_plan_limits')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('meter_id', meterId)
      .order('plan_name');

    if (error) {
      throw new Error(`Failed to fetch plan limits: ${error.message}`);
    }

    return limits || [];
  }

  /**
   * Track a usage event with tier enforcement
   */
  static async trackUsage(creatorId: string, request: TrackUsageRequest): Promise<string> {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) throw new Error('Tenant context not found');

    const supabase = await createSupabaseServerClient();

    // Find the meter
    const { data: meter, error: meterError } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('creator_id', creatorId)
      .eq('event_name', request.event_name)
      .eq('active', true)
      .single();

    if (meterError || !meter) {
      throw new Error(`Meter not found for event: ${request.event_name}`);
    }

    // Check tier enforcement before tracking usage (lazy import to avoid circular dependency)
    try {
      const { TierManagementService } = await import('./tier-management-service');
      const enforcement = await TierManagementService.checkTierEnforcement(
        request.user_id,
        creatorId,
        request.event_name,
        request.event_value || 1
      );
      
      // If hard cap is enabled and usage would exceed limit, block the request
      if (!enforcement.allowed && enforcement.should_block) {
        throw new Error(enforcement.reason || 'Usage limit exceeded');
      }
      
      // If soft limit warning should be shown, we could emit an event or log it
      if (enforcement.should_warn) {
        console.warn(`Usage warning for user ${request.user_id}: ${enforcement.usage_percentage}% of limit reached`);
        // Here you could emit an event, send a notification, etc.
      }
    } catch (error) {
      // If tier enforcement check fails, log the error but don't block usage tracking
      // This ensures backwards compatibility for users without tier assignments
      console.warn('Tier enforcement check failed:', error);
    }

    // Insert the usage event
    const { data: event, error: eventError } = await supabase
      .from('usage_events')
      .insert({
        tenant_id: tenantId,
        meter_id: meter.id,
        user_id: request.user_id,
        event_value: request.event_value || 1,
        properties: request.properties,
        event_timestamp: request.timestamp || new Date().toISOString()
      } as TablesInsert<'usage_events'>)
      .select()
      .single();

    if (eventError) {
      throw new Error(`Failed to track usage: ${eventError.message}`);
    }

    // Update aggregates asynchronously (fire and forget)
    this.updateAggregatesAsync(meter.id, request.user_id);

    // Check for limit violations asynchronously
    this.checkLimitsAsync(meter.id, request.user_id);

    return event.id;
  }

  /**
   * Get usage summary for a user and meter
   */
  static async getUsageSummary(
    meterId: string, 
    userId: string, 
    planName: string,
    billingPeriod?: string
  ): Promise<UsageSummary> {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) throw new Error('Tenant context not found');

    const supabase = await createSupabaseServerClient();

    // Get meter info
    const { data: meter, error: meterError } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', meterId)
      .single();

    if (meterError || !meter) {
      throw new Error('Meter not found');
    }

    // Calculate current billing period if not provided
    const currentPeriod = billingPeriod || this.getCurrentBillingPeriod();

    // Get current usage
    const currentUsage = await this.getCurrentUsage(meterId, userId, currentPeriod);

    // Get alerts
    const { data: alerts } = await supabase
      .from('usage_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('meter_id', meterId)
      .eq('user_id', userId)
      .eq('plan_name', planName)
      .eq('acknowledged', false)
      .order('triggered_at', { ascending: false });

    const usagePercentage = limit?.limit_value 
      ? (currentUsage / limit.limit_value) * 100 
      : null;

    const overageAmount = limit?.limit_value && currentUsage > limit.limit_value 
      ? currentUsage - limit.limit_value 
      : 0;

    return {
      meter_id: meterId,
      meter_name: meter.display_name,
      user_id: userId,
      current_usage: currentUsage,
      limit_value: limit?.limit_value ?? null,
      usage_percentage: usagePercentage ?? null,
      overage_amount: overageAmount,
      plan_name: planName,
      alerts: alerts || []
    };
  }

  /**
   * Get usage analytics for a creator
   */
  static async getUsageAnalytics(
    creatorId: string, 
    dateRange: { start: string; end: string }
  ): Promise<UsageAnalytics> {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) throw new Error('Tenant context not found');

    const supabase = await createSupabaseServerClient();

    // Get meters for the creator
    const { data: meters } = await supabase
      .from('usage_meters')
      .select('id, display_name, unit_name')
      .eq('tenant_id', tenantId)
      .eq('creator_id', creatorId)
      .eq('active', true);

    if (!meters || meters.length === 0) {
      return {
        total_usage: 0,
        usage_by_user: [],
        usage_trends: [],
        revenue_impact: {
          base_revenue: 0,
          overage_revenue: 0,
          total_revenue: 0
        },
        top_users: [],
        total_events: 0,
        unique_users: 0,
        meters: {},
        period_start: dateRange.start,
        period_end: dateRange.end
      };
    }

    const meterIds = meters.map(m => m.id);

    // Get aggregated usage data
    const { data: aggregates } = await supabase
      .from('usage_aggregates')
      .select('*')
      .in('meter_id', meterIds)
      .eq('tenant_id', tenantId)
      .gte('period_start', dateRange.start)
      .lte('period_end', dateRange.end);

    // Calculate analytics from aggregates
    const totalUsage = aggregates?.reduce((sum, agg) => sum + Number(agg.aggregate_value), 0) || 0;

    const usageByUser = this.calculateUsageByUser(aggregates || []);
    const usageTrends = this.calculateUsageTrends(aggregates || []);
    const revenueImpact = await this.calculateRevenueImpact(meterIds, dateRange);
    const topUsers = this.calculateTopUsers(aggregates || []);

    return {
      total_usage: totalUsage,
      usage_by_user: usageByUser,
      usage_trends: usageTrends,
      revenue_impact: revenueImpact,
      top_users: topUsers,
      total_events: aggregates?.length || 0,
      unique_users: new Set(aggregates?.map((agg: Tables<'usage_aggregates'>) => agg.user_id)).size || 0,
      meters: {}, // This would need to be populated based on meter-specific aggregates
      period_start: dateRange.start,
      period_end: dateRange.end
    };
  }

  /**
   * Update usage aggregates (private helper)
   */
  private static async updateAggregatesAsync(meterId: string, userId: string): Promise<void> {
    try {
      const tenantId = getTenantIdFromHeaders();
      if (!tenantId) throw new Error('Tenant context not found');

      const supabase = await createSupabaseServerClient();
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
        .eq('tenant_id', tenantId)
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
            aggregateValue = events.reduce((sum: number, e: Tables<'usage_events'>) => sum + Number(e.event_value), 0);
            break;
          case 'max':
            aggregateValue = Math.max(...events.map((e: Tables<'usage_events'>) => Number(e.event_value)));
            break;
          case 'unique':
            // For unique, we'd need to track unique properties - simplified for now
            aggregateValue = eventCount;
            break;
          case 'duration':
            aggregateValue = events.reduce((sum: number, e: Tables<'usage_events'>) => sum + Number(e.event_value), 0);
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
    return Array.from(trendMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  private static async calculateRevenueImpact(meterIds: string[], dateRange: { start: string; end: string }): Promise<UsageAnalytics['revenue_impact']> {
    // This is a simplified mock. In a real scenario, this would involve complex joins
    // with subscription data, tier pricing, and overage calculations.
    return {
      base_revenue: Math.floor(Math.random() * 1000),
      overage_revenue: Math.floor(Math.random() * 500),
      total_revenue: Math.floor(Math.random() * 1500)
    };
  }

  private static calculateTopUsers(aggregates: UsageAggregate[]): UsageAnalytics['top_users'] {
    const userUsageMap = new Map<string, { user_id: string; usage: number; revenue: number }>();
    aggregates.forEach((agg: UsageAggregate) => {
      const userEntry = userUsageMap.get(agg.user_id) || { user_id: agg.user_id, usage: 0, revenue: 0 };
      userEntry.usage += agg.aggregate_value;
      userUsageMap.set(agg.user_id, userEntry);
    });
    return Array.from(userUsageMap.values()).sort((a, b) => b.usage - a.usage).slice(0, 5);
  }

  private static async getCurrentUsage(meterId: string, userId: string, billingPeriod: string): Promise<number> {
    const supabase = await createSupabaseServerClient();
    const { data: aggregate } = await supabase
      .from('usage_aggregates')
      .select('aggregate_value')
      .eq('meter_id', meterId)
      .eq('user_id', userId)
      .eq('billing_period', billingPeriod)
      .single();
    return aggregate?.aggregate_value || 0;
  }
}