/**
 * Tenant-Aware Usage Tracking Service
 * Enhanced usage tracking service with multi-tenant support
 */

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getTenantContext, ensureTenantContext } from '@/libs/supabase/tenant-context';
import { AuditLogger } from '@/libs/audit/audit-logger';
import { TenantAnalytics } from '@/libs/analytics/tenant-analytics';

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

export class TenantUsageTrackingService {
  /**
   * Create a new usage meter with tenant context
   */
  static async createMeter(creatorId: string, meterData: CreateMeterRequest): Promise<UsageMeter> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient();

    // Create the meter with tenant context
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
      })
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
        limit_value: limit.limit_value,
        overage_price: limit.overage_price,
        soft_limit_threshold: limit.soft_limit_threshold || 0.8,
        hard_cap: limit.hard_cap || false
      }));

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

    return meter;
  }

  /**
   * Track usage with tenant context
   */
  static async trackUsage(request: TrackUsageRequest): Promise<UsageEvent> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient();

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
        properties: request.properties || {}
      })
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
    this.updateAggregatesAsync(request.meter_id, request.user_id).catch(error => {
      console.error('Failed to update aggregates:', error);
    });

    return event;
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
    const supabase = await createSupabaseAdminClient();

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

    return data.map(aggregate => ({
      meter_id: aggregate.meter_id,
      meter_name: aggregate.usage_meters.display_name,
      unit_name: aggregate.usage_meters.unit_name,
      period: aggregate.billing_period,
      usage: aggregate.aggregate_value,
      event_count: aggregate.event_count
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
    const supabase = await createSupabaseAdminClient();

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

    const usageCaps = tierAssignment.subscription_tiers.usage_caps as Record<string, number>;
    const limit = usageCaps[meter.event_name];

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
    const supabase = await createSupabaseAdminClient();

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

    return data;
  }

  /**
   * Update plan limits for a meter
   */
  static async updatePlanLimits(
    meterId: string,
    planLimits: MeterPlanLimit[]
  ): Promise<void> {
    const tenantId = await ensureTenantContext();
    const supabase = await createSupabaseAdminClient();

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
        meter_id: meterId,
        plan_name: limit.plan_name,
        limit_value: limit.limit_value,
        overage_price: limit.overage_price,
        soft_limit_threshold: limit.soft_limit_threshold || 0.8,
        hard_cap: limit.hard_cap || false
      }));

      const { error } = await supabase
        .from('meter_plan_limits')
        .insert(limitsData);

      if (error) {
        throw new Error(`Failed to update plan limits: ${error.message}`);
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
    const supabase = await createSupabaseAdminClient();

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
      unique_users: new Set(data.map(e => e.user_id)).size,
      meters: {},
      period_start: new Date(Date.now() - (period === 'day' ? 86400000 : period === 'week' ? 604800000 : 2592000000)).toISOString(),
      period_end: new Date().toISOString()
    };

    data.forEach(event => {
      const meterName = event.usage_meters.display_name;
      if (!analytics.meters[meterName]) {
        analytics.meters[meterName] = {
          total_events: 0,
          total_value: 0,
          unique_users: new Set(),
          unit_name: event.usage_meters.unit_name
        };
      }

      analytics.meters[meterName].total_events++;
      analytics.meters[meterName].total_value += parseFloat(event.event_value);
      analytics.meters[meterName].unique_users.add(event.user_id);
    });

    // Convert Sets to counts
    Object.keys(analytics.meters).forEach(meterName => {
      analytics.meters[meterName].unique_users = analytics.meters[meterName].unique_users.size;
    });

    return analytics;
  }

  /**
   * Update aggregates for a meter and user (async operation)
   */
  private static async updateAggregatesAsync(meterId: string, userId: string): Promise<void> {
    const tenantId = await getTenantContext();
    if (!tenantId) return;

    const supabase = await createSupabaseAdminClient();
    const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

    // Calculate aggregate for current period
    const { data: events } = await supabase
      .from('usage_events')
      .select('event_value')
      .eq('tenant_id', tenantId)
      .eq('meter_id', meterId)
      .eq('user_id', userId)
      .gte('created_at', `${currentPeriod}-01`)
      .lt('created_at', `${currentPeriod}-32`); // Next month

    if (!events || events.length === 0) return;

    const totalValue = events.reduce((sum, event) => sum + parseFloat(event.event_value), 0);
    const eventCount = events.length;

    // Upsert aggregate
    await supabase
      .from('usage_aggregates')
      .upsert({
        tenant_id: tenantId,
        meter_id: meterId,
        user_id: userId,
        billing_period: currentPeriod,
        aggregate_value: totalValue,
        event_count: eventCount,
        period_start: `${currentPeriod}-01T00:00:00Z`,
        period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()
      }, {
        onConflict: 'tenant_id,meter_id,user_id,billing_period'
      });
  }
}