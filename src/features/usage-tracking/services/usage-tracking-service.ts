import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

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

export class UsageTrackingService {
  /**
   * Create a new usage meter
   */
  static async createMeter(creatorId: string, meterData: CreateMeterRequest): Promise<UsageMeter> {
    const supabase = await createSupabaseServerClient();

    // Create the meter
    const { data: meter, error } = await supabase
      .from('usage_meters')
      .insert({
        creator_id: creatorId,
        event_name: meterData.event_name,
        display_name: meterData.display_name,
        description: meterData.description,
        aggregation_type: meterData.aggregation_type,
        unit_name: meterData.unit_name || 'units',
        billing_model: meterData.billing_model || 'metered'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create meter: ${error.message}`);
    }

    // Create plan limits if provided
    if (meterData.plan_limits && meterData.plan_limits.length > 0) {
      const planLimitsData = meterData.plan_limits.map(limit => ({
        meter_id: meter.id,
        plan_name: limit.plan_name,
        limit_value: limit.limit_value,
        overage_price: limit.overage_price,
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

    return meter;
  }

  /**
   * Get all meters for a creator
   */
  static async getMeters(creatorId: string): Promise<UsageMeter[]> {
    const supabase = await createSupabaseServerClient();

    const { data: meters, error } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch meters: ${error.message}`);
    }

    return meters || [];
  }

  /**
   * Get plan limits for a meter
   */
  static async getMeterPlanLimits(meterId: string): Promise<MeterPlanLimit[]> {
    const supabase = await createSupabaseServerClient();

    const { data: limits, error } = await supabase
      .from('meter_plan_limits')
      .select('*')
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
    const supabase = await createSupabaseServerClient();

    // Find the meter
    const { data: meter, error: meterError } = await supabase
      .from('usage_meters')
      .select('*')
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
        request.value || 1
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
        meter_id: meter.id,
        user_id: request.user_id,
        event_value: request.value || 1,
        properties: request.properties,
        event_timestamp: request.timestamp || new Date().toISOString()
      })
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
    const supabase = await createSupabaseServerClient();

    // Get meter info
    const { data: meter, error: meterError } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('id', meterId)
      .single();

    if (meterError || !meter) {
      throw new Error('Meter not found');
    }

    // Get plan limits
    const { data: limit, error: limitError } = await supabase
      .from('meter_plan_limits')
      .select('*')
      .eq('meter_id', meterId)
      .eq('plan_name', planName)
      .single();

    // Calculate current billing period if not provided
    const currentPeriod = billingPeriod || this.getCurrentBillingPeriod();

    // Get current usage
    const currentUsage = await this.getCurrentUsage(meterId, userId, currentPeriod);

    // Get alerts
    const { data: alerts } = await supabase
      .from('usage_alerts')
      .select('*')
      .eq('meter_id', meterId)
      .eq('user_id', userId)
      .eq('plan_name', planName)
      .eq('acknowledged', false)
      .order('triggered_at', { ascending: false });

    const usagePercentage = limit?.limit_value 
      ? (currentUsage / limit.limit_value) * 100 
      : undefined;

    const overageAmount = limit?.limit_value && currentUsage > limit.limit_value 
      ? currentUsage - limit.limit_value 
      : 0;

    return {
      meter_id: meterId,
      meter_name: meter.display_name,
      user_id: userId,
      current_usage: currentUsage,
      limit_value: limit?.limit_value,
      usage_percentage: usagePercentage,
      overage_amount: overageAmount,
      plan_name: planName,
      billing_period: currentPeriod,
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
    const supabase = createSupabaseServerClient();

    // Get meters for the creator
    const { data: meters } = await supabase
      .from('usage_meters')
      .select('id')
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
        top_users: []
      };
    }

    const meterIds = meters.map(m => m.id);

    // Get aggregated usage data
    const { data: aggregates } = await supabase
      .from('usage_aggregates')
      .select('*')
      .in('meter_id', meterIds)
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
      top_users: topUsers
    };
  }

  /**
   * Update usage aggregates (private helper)
   */
  private static async updateAggregatesAsync(meterId: string, userId: string): Promise<void> {
    try {
      const supabase = createSupabaseServerClient();
      const currentPeriod = this.getCurrentBillingPeriod();
      const periodStart = this.getPeriodStart(currentPeriod);
      const periodEnd = this.getPeriodEnd(currentPeriod);

      // Get meter info for aggregation type
      const { data: meter } = await supabase
        .from('usage_meters')
        .select('aggregation_type')
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
            aggregateValue = events.reduce((sum, e) => sum + Number(e.event_value), 0);
            break;
          case 'max':
            aggregateValue = Math.max(...events.map(e => Number(e.event_value)));
            break;
          case 'unique':
            // For unique, we'd need to track unique properties - simplified for now
            aggregateValue = eventCount;
            break;
          case 'duration':
            aggregateValue = events.reduce((sum, e) => sum + Number(e.event_value), 0);
            break;
        }
      }

      // Upsert aggregate
      await supabase
        .from('usage_aggregates')
        .upsert({
          meter_id: meterId,
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd,
          aggregate_value: aggregateValue,
          event_count: eventCount,
          billing_period: currentPeriod
        });
    } catch (error) {
      console.error('Error updating aggregates:', error);
    }
  }

  /**
   * Check usage limits and trigger alerts (private helper)
   */
  private static async checkLimitsAsync(meterId: string, userId: string): Promise<void> {
    try {
      const supabase = createSupabaseServerClient();
      
      // Get plan limits for this meter
      const { data: limits } = await supabase
        .from('meter_plan_limits')
        .select('*')
        .eq('meter_id', meterId);

      if (!limits || limits.length === 0) return;

      const currentUsage = await this.getCurrentUsage(meterId, userId);

      for (const limit of limits) {
        if (!limit.limit_value) continue; // Skip unlimited plans

        const usagePercentage = (currentUsage / limit.limit_value) * 100;

        // Check for soft limit (warning)
        if (usagePercentage >= limit.soft_limit_threshold * 100) {
          await this.createAlert(meterId, userId, limit.plan_name, 'soft_limit', usagePercentage, currentUsage, limit.limit_value);
        }

        // Check for hard limit
        if (currentUsage >= limit.limit_value) {
          await this.createAlert(meterId, userId, limit.plan_name, 'hard_limit', 100, currentUsage, limit.limit_value);
        }
      }
    } catch (error) {
      console.error('Error checking limits:', error);
    }
  }

  /**
   * Create usage alert (private helper)
   */
  private static async createAlert(
    meterId: string,
    userId: string,
    planName: string,
    alertType: 'soft_limit' | 'hard_limit' | 'overage',
    thresholdPercentage: number,
    currentUsage: number,
    limitValue: number
  ): Promise<void> {
    const supabase = createSupabaseServerClient();

    // Check if alert already exists for this period
    const { data: existingAlert } = await supabase
      .from('usage_alerts')
      .select('id')
      .eq('meter_id', meterId)
      .eq('user_id', userId)
      .eq('plan_name', planName)
      .eq('alert_type', alertType)
      .gte('triggered_at', this.getPeriodStart())
      .single();

    if (existingAlert) return; // Alert already exists

    await supabase
      .from('usage_alerts')
      .insert({
        meter_id: meterId,
        user_id: userId,
        plan_name: planName,
        alert_type: alertType,
        threshold_percentage: thresholdPercentage,
        current_usage: currentUsage,
        limit_value: limitValue
      });
  }

  /**
   * Get current usage for a user and meter (private helper)
   */
  private static async getCurrentUsage(meterId: string, userId: string, billingPeriod?: string): Promise<number> {
    const supabase = createSupabaseServerClient();
    const currentPeriod = billingPeriod || this.getCurrentBillingPeriod();

    const { data: aggregate } = await supabase
      .from('usage_aggregates')
      .select('aggregate_value')
      .eq('meter_id', meterId)
      .eq('user_id', userId)
      .eq('billing_period', currentPeriod)
      .single();

    return aggregate ? Number(aggregate.aggregate_value) : 0;
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

  private static calculateUsageByUser(aggregates: any[]): Array<{ user_id: string; usage: number; plan: string }> {
    const userUsage = new Map<string, { usage: number; plan: string }>();
    
    aggregates.forEach(agg => {
      const existing = userUsage.get(agg.user_id) || { usage: 0, plan: 'unknown' };
      userUsage.set(agg.user_id, {
        usage: existing.usage + Number(agg.aggregate_value),
        plan: existing.plan
      });
    });

    return Array.from(userUsage.entries()).map(([user_id, data]) => ({
      user_id,
      usage: data.usage,
      plan: data.plan
    }));
  }

  private static calculateUsageTrends(aggregates: any[]): Array<{ period: string; usage: number }> {
    const trends = new Map<string, number>();
    
    aggregates.forEach(agg => {
      const period = agg.billing_period || agg.period_start.substring(0, 7);
      const existing = trends.get(period) || 0;
      trends.set(period, existing + Number(agg.aggregate_value));
    });

    return Array.from(trends.entries())
      .map(([period, usage]) => ({ period, usage }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private static async calculateRevenueImpact(meterIds: string[], dateRange: { start: string; end: string }) {
    // Simplified revenue calculation - would need more complex logic for real implementation
    return {
      base_revenue: 0,
      overage_revenue: 0,
      total_revenue: 0
    };
  }

  private static calculateTopUsers(aggregates: any[]): Array<{ user_id: string; usage: number; revenue: number }> {
    const userStats = new Map<string, { usage: number; revenue: number }>();
    
    aggregates.forEach(agg => {
      const existing = userStats.get(agg.user_id) || { usage: 0, revenue: 0 };
      userStats.set(agg.user_id, {
        usage: existing.usage + Number(agg.aggregate_value),
        revenue: existing.revenue // Would calculate based on overage pricing
      });
    });

    return Array.from(userStats.entries())
      .map(([user_id, stats]) => ({ user_id, ...stats }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }
}