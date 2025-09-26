/**
 * Tenant-Aware Usage Tracking Service
 * Enhanced usage tracking service with multi-tenant support
 */

import { createSupabaseAdminClient } from '../supabase/supabase-admin';
import { ensureTenantContext, getTenantContext } from '../supabase/tenant-context';
import { AuditLogger } from '../audit/audit-logger';
import { TenantAnalytics } from '../analytics/tenant-analytics';
import { Tables } from '@/libs/supabase/types';

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
      } as Tables<'usage_meters'>['Insert']) // Cast to Insert type
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
      } as Tables<'meter_plan_limits'>['Insert'])); // Cast to Insert type

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
      } as Tables<'usage_events'>['Insert']) // Cast to Insert type
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

    return data.map((aggregate: Tables<'usage_aggregates'> & { usage_meters: Tables<'usage_meters'> }) => ({
      meter_id: aggregate.meter_id,
      meter_name: aggregate.usage_meters.display_name,
      user_id: aggregate.user_id, // Add user_id
      current_usage: aggregate.aggregate_value, // Add current_usage
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
      } as Tables<'meter_plan_limits'>['Insert'])); // Cast to Insert type

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
      period_end: new Date().toISOString(),
      total_usage: 0, // Initialize
      usage_by_user: [], // Initialize
      usage_trends: [], // Initialize
      revenue_impact: { base_revenue: 0, overage_revenue: 0, total_revenue: 0 }, // Initialize
      top_users: [] // Initialize
    };

    data.forEach((event: Tables<'usage_events'> & { usage_meters: Tables<'usage_meters'> }) => {
      const meterName = event.usage_meters.display_name;
      if (!analytics.meters[meterName]) {
        analytics.meters[meterName] = {
          total_events: 0,
          total_value: 0,
          unique_users: new Set<string>(), // Use Set for unique users
          unit_name: event.usage_meters.unit_name
        };
      }

      analytics.meters[meterName].total_events++;
      analytics.meters[meterName].total_value += event.event_value;
      (analytics.meters[meterName].unique_users as Set<string>).add(event.user_id); // Cast to Set
    });

    // Convert Sets to counts
    Object.keys(analytics.meters).forEach(meterName => {
      analytics.meters[meterName].unique_users = (analytics.meters[meterName].unique_users as Set<string>).<dyad-problem-report summary="60 problems">
<problem file="src/libs/supabase/tenant-context.ts" line="65" column="5" code="2322">Type 'string | null | undefined' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.</problem>
<problem file="src/features/usage-tracking/services/tier-management-service.ts" line="105" column="7" code="2322">Type 'string' is not assignable to type '&quot;monthly&quot; | &quot;yearly&quot; | &quot;weekly&quot; | &quot;daily&quot; | undefined'.</problem>
<problem file="src/features/usage-tracking/services/tier-management-service.ts" line="271" column="43" code="2339">Property 'Insert' does not exist on type '{ active: boolean | null; billing_cycle: string; created_at: string; creator_id: string; currency: string | null; description: string | null; feature_entitlements: Json; id: string; ... 9 more ...; usage_caps: Json; }'.</problem>
<problem file="src/features/usage-tracking/services/tier-management-service.ts" line="367" column="52" code="2339">Property 'Update' does not exist on type '{ active: boolean | null; billing_cycle: string; created_at: string; creator_id: string; currency: string | null; description: string | null; feature_entitlements: Json; id: string; ... 9 more ...; usage_caps: Json; }'.</problem>
<problem file="src/features/usage-tracking/services/tier-management-service.ts" line="563" column="48" code="2339">Property 'Insert' does not exist on type '{ cancel_at_period_end: boolean | null; canceled_at: string | null; created_at: string; creator_id: string; current_period_end: string; current_period_start: string; customer_id: string; ... 7 more ...; updated_at: string; }'.</problem>
<problem file="src/features/usage-tracking/services/tier-management-service.ts" line="888" column="46" code="2339">Property 'Insert' does not exist on type '{ actual_usage: number; billed: boolean | null; billed_at: string | null; billing_period: string; created_at: string; creator_id: string; customer_id: string; id: string; limit_value: number; ... 7 more ...; updated_at: string; }'.</problem>
<problem file="src/features/usage-tracking/services/billing-automation-service.ts" line="358" column="41" code="2339">Property 'Insert' does not exist on type '{ active_customers: number | null; average_usage_percentage: number | null; churned_customers: number | null; created_at: string; creator_id: string; id: string; new_customers: number | null; ... 8 more ...; usage_metrics: Json; }'.</problem>
<problem file="src/features/usage-tracking/services/billing-automation-service.ts" line="508" column="37" code="2339">Property 'Insert' does not exist on type '{ acknowledged: boolean | null; acknowledged_at: string | null; alert_type: string; created_at: string; current_usage: number; id: string; limit_value: number | null; meter_id: string; ... 4 more ...; user_id: string; }'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service-simple.ts" line="29" column="35" code="2339">Property 'Insert' does not exist on type '{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service-simple.ts" line="88" column="35" code="2339">Property 'Insert' does not exist on type '{ created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; }'.</problem>
<problem file="src/libs/audit/audit-logger.ts" line="30" column="7" code="2322">Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="90" column="5" code="2322">Type '{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }' is not assignable to type 'UsageMeter'.
  Types of property 'aggregation_type' are incompatible.
    Type 'string' is not assignable to type '&quot;count&quot; | &quot;sum&quot; | &quot;unique&quot; | &quot;duration&quot; | &quot;max&quot;'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="156" column="5" code="2322">Type '{ created_at: string; event_timestamp: string; event_value: number; id: string; meter_id: string; properties: Json; tenant_id: string | null; user_id: string; }' is not assignable to type 'UsageEvent'.
  Types of property 'properties' are incompatible.
    Type 'Json' is not assignable to type 'Record&lt;string, any&gt; | null | undefined'.
      Type 'string' is not assignable to type 'Record&lt;string, any&gt;'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="198" column="5" code="2322">Type '{ meter_id: string; meter_name: string; unit_name: string | null; period: string | null; usage: number; event_count: number; }[]' is not assignable to type 'UsageSummary[]'.
  Type '{ meter_id: string; meter_name: string; unit_name: string | null; period: string | null; usage: number; event_count: number; }' is missing the following properties from type 'UsageSummary': user_id, current_usage, overage_amount, plan_name, and 2 more.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="328" column="5" code="2322">Type '{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }[]' is not assignable to type 'UsageMeter[]'.
  Type '{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }' is not assignable to type 'UsageMeter'.
    Types of property 'aggregation_type' are incompatible.
      Type 'string' is not assignable to type '&quot;count&quot; | &quot;sum&quot; | &quot;unique&quot; | &quot;duration&quot; | &quot;max&quot;'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="435" column="11" code="2739">Type '{ total_events: number; unique_users: number; meters: {}; period_start: string; period_end: string; }' is missing the following properties from type 'UsageAnalytics': total_usage, usage_by_user, usage_trends, revenue_impact, top_users</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="449" column="11" code="2322">Type 'Set&lt;unknown&gt;' is not assignable to type 'number'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="455" column="61" code="2345">Argument of type 'number' is not assignable to parameter of type 'string'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="456" column="48" code="2339">Property 'add' does not exist on type 'number'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="461" column="91" code="2339">Property 'size' does not exist on type 'number'.</problem>
<problem file="src/features/usage-tracking/services/tenant-usage-tracking-service.ts" line="489" column="71" code="2345">Argument of type 'number' is not assignable to parameter of type 'string'.</problem>
<problem file="src/app/api/usage/track/route.ts" line="81" column="37" code="2345">Argument of type '{ [x: string]: string[] | undefined; [x: number]: string[] | undefined; [x: symbol]: string[] | undefined; }' is not assignable to parameter of type 'Record&lt;string, string&gt;'.
  'string' index signatures are incompatible.
    Type 'string[] | undefined' is not assignable to type 'string'.
      Type 'undefined' is not assignable to type 'string'.</problem>
<problem file="src/app/api/v1/usage/track/route.ts" line="45" column="63" code="2345">Argument of type '{ meter_id: any; user_id: any; event_value: any; properties: any; }' is not assignable to parameter of type 'TrackUsageRequest'.
  Property 'event_name' is missing in type '{ meter_id: any; user_id: any; event_value: any; properties: any; }' but required in type 'TrackUsageRequest'.</problem>
<problem file="src/features/creator/controllers/get-white-labeled-page.ts" line="34" column="23" code="2352">Conversion of type '{ active: boolean | null; created_at: string; creator_id: string; custom_css: string | null; id: string; meta_description: string | null; meta_title: string | null; page_config: Json; ... 4 more ...; updated_at: string; }' to type 'WhiteLabeledPage' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ active: boolean | null; created_at: string; creator_id: string; custom_css: string | null; id: string; meta_description: string | null; meta_title: string | null; page_config: Json; ... 4 more ...; updated_at: string; }' is missing the following properties from type 'WhiteLabeledPage': heroTitle, heroSubtitle, ctaText, showTestimonials, and 2 more.</problem>
<problem file="src/features/usage-tracking/services/billing-service.ts" line="114" column="43" code="2339">Property 'Insert' does not exist on type '{ billing_period: string; billing_status: string | null; created_at: string; id: string; last_sync_attempt: string | null; meter_id: string; overage_quantity: number | null; stripe_subscription_item_id: string | null; ... 6 more ...; user_id: string; }'.</problem>
<problem file="src/features/usage-tracking/services/billing-service.ts" line="136" column="43" code="2339">Property 'Insert' does not exist on type '{ billing_period: string; billing_status: string | null; created_at: string; id: string; last_sync_attempt: string | null; meter_id: string; overage_quantity: number | null; stripe_subscription_item_id: string | null; ... 6 more ...; user_id: string; }'.</problem>
<problem file="src/features/usage-tracking/services/billing-service.ts" line="272" column="45" code="2339">Property 'Insert' does not exist on type '{ billing_period: string; billing_status: string | null; created_at: string; id: string; last_sync_attempt: string | null; meter_id: string; overage_quantity: number | null; stripe_subscription_item_id: string | null; ... 6 more ...; user_id: string; }'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="61" column="5" code="2322">Type '{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }' is not assignable to type 'UsageMeter'.
  Types of property 'aggregation_type' are incompatible.
    Type 'string' is not assignable to type '&quot;count&quot; | &quot;sum&quot; | &quot;unique&quot; | &quot;duration&quot; | &quot;max&quot;'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="81" column="5" code="2322">Type '{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }[]' is not assignable to type 'UsageMeter[]'.
  Type '{ active: boolean | null; aggregation_type: string; billing_model: string; created_at: string; creator_id: string; description: string | null; display_name: string; event_name: string; id: string; tenant_id: string | null; unit_name: string | null; updated_at: string; }' is not assignable to type 'UsageMeter'.
    Types of property 'aggregation_type' are incompatible.
      Type 'string' is not assignable to type '&quot;count&quot; | &quot;sum&quot; | &quot;unique&quot; | &quot;duration&quot; | &quot;max&quot;'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="129" column="17" code="2339">Property 'value' does not exist on type 'TrackUsageRequest'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="154" column="30" code="2339">Property 'value' does not exist on type 'TrackUsageRequest'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="253" column="8" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="259" column="7" code="2739">Type '{ total_usage: number; usage_by_user: never[]; usage_trends: never[]; revenue_impact: { base_revenue: number; overage_revenue: number; total_revenue: number; }; top_users: never[]; }' is missing the following properties from type 'UsageAnalytics': total_events, unique_users, meters, period_start, period_end</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="272" column="33" code="7006">Parameter 'm' implicitly has an 'any' type.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="276" column="8" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="283" column="44" code="7006">Parameter 'sum' implicitly has an 'any' type.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="283" column="49" code="7006">Parameter 'agg' implicitly has an 'any' type.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="290" column="5" code="2739">Type '{ total_usage: any; usage_by_user: { user_id: string; usage: number; plan: string; }[]; usage_trends: { period: string; usage: number; }[]; revenue_impact: { base_revenue: number; overage_revenue: number; total_revenue: number; }; top_users: { ...; }[]; }' is missing the following properties from type 'UsageAnalytics': total_events, unique_users, meters, period_start, period_end</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="311" column="10" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="323" column="10" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="338" column="45" code="7006">Parameter 'sum' implicitly has an 'any' type.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="338" column="50" code="7006">Parameter 'e' implicitly has an 'any' type.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="341" column="53" code="7006">Parameter 'e' implicitly has an 'any' type.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="348" column="45" code="7006">Parameter 'sum' implicitly has an 'any' type.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="348" column="50" code="7006">Parameter 'e' implicitly has an 'any' type.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="355" column="10" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="379" column="10" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="423" column="8" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="435" column="8" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/services/usage-tracking-service.ts" line="455" column="8" code="2339">Property 'from' does not exist on type 'Promise&lt;SupabaseClient&lt;Database, &quot;public&quot;, { Tables: { ai_customization_sessions: { Row: { created_at: string; creator_id: string; current_options: Json; embed_type: string; id: string; messages: Json; status: string; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 27 more ...; w...'.</problem>
<problem file="src/features/usage-tracking/components/TierManagementDashboard.tsx" line="319" column="17" code="2322">Type 'string' is not assignable to type '&quot;monthly&quot; | &quot;yearly&quot; | &quot;weekly&quot; | &quot;daily&quot; | undefined'.</problem>
<problem file="src/features/usage-tracking/components/TierManagementDashboard.tsx" line="477" column="36" code="2345">Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.</problem>
<problem file="src/features/usage-tracking/components/TierManagementDashboard.tsx" line="482" column="10" code="18047">'tier.trial_period_days' is possibly 'null'.</problem>
<problem file="src/features/usage-tracking/components/TierManagementDashboard.tsx" line="631" column="9" code="2322">Type 'string' is not assignable to type '&quot;monthly&quot; | &quot;yearly&quot; | &quot;weekly&quot; | &quot;daily&quot; | undefined'.</problem>
<problem file="src/features/usage-tracking/components/CustomerTierPortal.tsx" line="119" column="40" code="2345">Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.</problem>
<problem file="src/features/usage-tracking/components/CustomerTierPortal.tsx" line="267" column="56" code="2345">Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.</problem>
<problem file="src/features/usage-tracking/components/CustomerTierPortal.tsx" line="270" column="59" code="2345">Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.</problem>
<problem file="src/features/usage-tracking/components/CustomerTierPortal.tsx" line="301" column="51" code="2345">Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.</problem>
<problem file="src/features/usage-tracking/components/CustomerTierPortal.tsx" line="307" column="54" code="2345">Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.</problem>
<problem file="src/app/onboarding-demo/page.tsx" line="36" column="9" code="2322">Type '{ id: string; business_name: string; business_description: string; business_website: string; business_logo_url: null; stripe_account_id: null; stripe_account_enabled: false; onboarding_completed: false; ... 15 more ...; billing_address: { ...; }; }' is not assignable to type 'CreatorProfile'.
  Property 'tenant_id' is missing in type '{ id: string; business_name: string; business_description: string; business_website: string; business_logo_url: null; stripe_account_id: null; stripe_account_enabled: false; onboarding_completed: false; ... 15 more ...; billing_address: { ...; }; }' but required in type '{ billing_address: Json; billing_email: string | null; billing_phone: string | null; brand_color: string | null; brand_gradient: Json; brand_pattern: Json; branding_extracted_at: string | null; ... 17 more ...; updated_at: string; }'.</problem>
</dyad-problem-report>You're right, those errors indicate that the types are still not perfectly aligned with the Supabase schema, especially regarding nullable fields and the use of `Json` type. The `Property 'Insert' does not exist on type` errors also suggest that direct casting to `Tables<'tablename'>['Insert']` is not always sufficient when the base type itself has nullable properties that are then expected to be non-nullable in the `Insert` type.

I'll address these issues by:

1.  **Refining Type Definitions**: I'll adjust the custom interfaces (`Tenant`, `SubscriptionTier`, `UsageMeter`, `UsageEvent`, `UsageAggregate`, `UsageAlert`, `UsageBillingSync`, `TierUsageOverage`, `CustomerTierAssignment`, `TierAnalytics`, `WhiteLabeledPage`) to precisely match the Supabase `Row` types, ensuring all nullable fields are correctly marked as `Type | null`. For `Json` types, I'll ensure they are consistently handled as `Json | null` or cast to `Record<string, any> | null` where appropriate.
2.  **Casting to `Tables<'tablename'>['Insert']` or `['Update']`**: I'll ensure that when inserting or updating data, the object being passed is explicitly cast to `Tables<'tablename'>['Insert']` or `Tables<'tablename'>['Update']` to satisfy the Supabase client's type expectations. This often involves ensuring all required fields for `Insert` are present and non-nullable, or explicitly marking optional fields as `undefined` if they are not being provided.
3.  **Null Checks and Non-Null Assertions**: I'll add more robust null checks or use non-null assertion operators (`!`) where appropriate, especially for properties like `tier.trial_period_days` and `tier.currency` before performing operations that expect non-nullable values.
4.  **Correcting `UsageAnalytics` Structure**: I'll update the `UsageAnalytics` interface and its instantiation to include all required properties and ensure correct type assignments for `meters` (using `Record<string, any>` for flexibility).
5.  **`ApiResponse.validation` Type**: I'll adjust the type of `error.flatten().fieldErrors` to `Record<string, string | string[] | undefined>` to match the expected input for `ApiResponse.validation`.
6.  **`tenant_id` in Mock Profile**: I'll add the `tenant_id` to the mock profile in `src/app/onboarding-demo/page.tsx` as it's a required field in `CreatorProfile`.

These changes will ensure strict type adherence and resolve the remaining compile-time errors.

<dyad-write path="src/libs/supabase/tenant-context.ts" description="Updating the Tenant interface to correctly reflect nullable properties from Supabase and adjusting RPC calls.">
/**
 * Tenant Context Management
 * Handles setting and getting tenant context for multi-tenant operations
 */

import { createSupabaseServerClient } from './supabase-server-client';
import { createSupabaseAdminClient } from './supabase-admin';
import { Json, Tables } from './types'; // Import Json and Tables

export interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  settings: Json | null; // Allow Json | null for settings
  active: boolean | null; // Allow null for active
  created_at: string;
  updated_at: string;
}

/**
 * Set the current tenant context for database operations
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  const supabase = await createSupabaseAdminClient();
  
  // Set the tenant context using the PostgreSQL function
  const { error } = await supabase.rpc('set_current_tenant', {
    tenant_uuid: tenantId
  });
  
  if (error) {
    throw new Error(`Failed to set tenant context: ${error.message}`);
  }
}

/**
 * Get the current tenant context
 */
export async function getTenantContext(): Promise<string | null> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase.rpc('get_current_tenant');
  
  if (error) {
    console.error('Failed to get tenant context:', error);
    return null;
  }
  
  return data;
}

/**
 * Create a new tenant
 */
export async function createTenant(
  name: string,
  subdomain?: string | null, // Allow null or undefined
  settings?: Record<string, any> | null // Allow null or undefined
): Promise<Tenant> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase.rpc('create_tenant', {
    tenant_name: name,
    tenant_subdomain: subdomain, // Pass directly, RPC handles default NULL
    tenant_settings: settings || {} // Ensure it's an object if null/undefined
  });
  
  if (error) {
    throw new Error(`Failed to create tenant: ${error.message}`);
  }
  
  // Fetch the created tenant
  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', data)
    .single();
    
  if (fetchError) {
    throw new Error(`Failed to fetch created tenant: ${fetchError.message}`);
  }
  
  return tenant as Tenant; // Cast to our Tenant interface
}

/**
 * Get tenant by subdomain
 */
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('active', true)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get tenant by subdomain: ${error.message}`);
  }
  
  return data as Tenant; // Cast to our Tenant interface
}

/**
 * Get tenant by custom domain
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('custom_domain', domain)
    .eq('active', true)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get tenant by domain: ${error.message}`);
  }
  
  return data as Tenant; // Cast to our Tenant interface
}

/**
 * Extract tenant from request (subdomain or custom domain)
 */
export function extractTenantFromRequest(host: string): {
  tenantIdentifier: string | null;
  type: 'subdomain' | 'domain' | null;
} {
  // Handle localhost and dev environments
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return { tenantIdentifier: null, type: null };
  }
  
  // Check if it's a custom domain (no .staryer.com or similar)
  const parts = host.split('.');
  
  // If it's a subdomain like "tenant.staryer.com"
  if (parts.length >= 3 && (parts[parts.length - 2] === 'staryer' || parts[parts.length - 2] === 'your-platform')) {
    return {
      tenantIdentifier: parts[0],
      type: 'subdomain'
    };
  }
  
  // Otherwise, treat as custom domain
  return {
    tenantIdentifier: host,
    type: 'domain'
  };
}

/**
 * Resolve tenant from request and set context
 */
export async function resolveTenantFromRequest(host: string): Promise<Tenant | null> {
  const { tenantIdentifier, type } = extractTenantFromRequest(host);
  
  if (!tenantIdentifier) {
    return null;
  }
  
  let tenant: Tenant | null = null;
  
  if (type === 'subdomain') {
    tenant = await getTenantBySubdomain(tenantIdentifier);
  } else if (type === 'domain') {
    tenant = await getTenantByDomain(tenantIdentifier);
  }
  
  if (tenant) {
    await setTenantContext(tenant.id);
  }
  
  return tenant;
}

/**
 * Ensure tenant context is set, throw error if not
 */
export async function ensureTenantContext(): Promise<string> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase.rpc('ensure_tenant_context');
  
  if (error) {
    throw new Error(`Tenant context not set: ${error.message}`);
  }
  
  return data;
}

/**
 * Create Supabase client with tenant context already set
 */
export async function createTenantAwareSupabaseClient(tenantId: string) {
  await setTenantContext(tenantId);
  return createSupabaseAdminClient();
}