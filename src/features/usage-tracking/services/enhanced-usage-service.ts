/**
 * Enhanced Usage Tracking Service
 * Provides comprehensive subscriber activity tracking for creators
 */

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Tables } from '@/libs/supabase/types';

export interface UsageTrackingEvent {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  event_type: string;
  quantity: number;
  metadata?: Record<string, any>;
  timestamp: string;
  billing_period: string;
}

export interface CreatorUsageAnalytics {
  total_active_subscribers: number;
  usage_by_tier: {
    tier_id: string;
    tier_name: string;
    subscriber_count: number;
    total_usage: number;
    average_usage: number;
    usage_cap: number;
    utilization_rate: number;
  }[];
  top_usage_events: {
    event_type: string;
    total_quantity: number;
    unique_users: number;
  }[];
  usage_trends: {
    date: string;
    total_usage: number;
    unique_users: number;
  }[];
}

export interface SubscriberUsageProfile {
  user_id: string;
  tier_info: {
    tier_id: string;
    tier_name: string;
    price: number;
    usage_caps: Record<string, number>;
    feature_entitlements: string[];
  };
  current_usage: {
    event_type: string;
    quantity_used: number;
    quantity_available: number;
    utilization_rate: number;
  }[];
  usage_history: {
    date: string;
    event_type: string;
    quantity: number;
  }[];
  overage_alerts: {
    event_type: string;
    current_usage: number;
    limit: number;
    threshold_exceeded: number; // percentage
  }[];
}

export interface MultiVariantUsageData {
  variant_id: string;
  variant_name: string;
  pricing_structure: {
    base_price: number;
    usage_tiers: {
      up_to: number;
      price_per_unit: number;
    }[];
  };
  usage_data: {
    total_usage: number;
    cost_breakdown: {
      base_cost: number;
      usage_cost: number;
      total_cost: number;
    };
  };
}

export class EnhancedUsageService {
  /**
   * Track a usage event for a subscriber
   */
  static async trackUsageEvent(
    userId: string,
    creatorId: string,
    eventType: string,
    quantity: number = 1,
    metadata?: Record<string, any>
  ): Promise<string> {
    const supabase = await createSupabaseServerClient();

    // Get subscriber's current tier
    const { data: tierAssignment } = await supabase
      .from('customer_tier_assignments')
      .select(`
        id,
        tier_id,
        subscription_tiers (
          id,
          name,
          usage_caps
        )
      `)
      .eq('customer_id', userId)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .single();

    if (!tierAssignment) {
      throw new Error('No active tier found for user');
    }

    // Get current billing period
    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Create usage event
    const usageEvent = {
      user_id: userId,
      creator_id: creatorId,
      tier_id: tierAssignment.tier_id,
      event_type: eventType,
      quantity,
      metadata: metadata || {},
      billing_period: billingPeriod,
    };

    const { data, error } = await supabase
      .from('usage_events')
      .insert(usageEvent)
      .select()
      .single();

    if (error) throw error;

    // Update aggregated usage
    await this.updateAggregatedUsage(userId, creatorId, eventType, quantity, billingPeriod);

    return data.id;
  }

  /**
   * Get comprehensive usage analytics for a creator
   */
  static async getCreatorUsageAnalytics(
    creatorId: string,
    dateRange?: { start: string; end: string }
  ): Promise<CreatorUsageAnalytics> {
    const supabase = await createSupabaseServerClient();

    // Get active subscribers by tier
    const { data: tierStats } = await supabase
      .from('customer_tier_assignments')
      .select(`
        tier_id,
        subscription_tiers (
          name,
          usage_caps
        )
      `)
      .eq('creator_id', creatorId)
      .eq('status', 'active');

    // Get usage data
    let usageQuery = supabase
      .from('usage_events')
      .select('*')
      .eq('creator_id', creatorId);

    if (dateRange) {
      usageQuery = usageQuery
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data: usageEvents } = await usageQuery;

    // Process data to create analytics
    const totalActiveSubscribers = tierStats?.length || 0;
    
    // Group usage by tier
    const usageByTier = this.groupUsageByTier(tierStats || [], usageEvents || []);
    
    // Get top usage events
    const topUsageEvents = this.getTopUsageEvents(usageEvents || []);
    
    // Get usage trends
    const usageTrends = this.getUsageTrends(usageEvents || []);

    return {
      total_active_subscribers: totalActiveSubscribers,
      usage_by_tier: usageByTier,
      top_usage_events: topUsageEvents,
      usage_trends: usageTrends,
    };
  }

  /**
   * Get detailed usage profile for a specific subscriber
   */
  static async getSubscriberUsageProfile(
    userId: string,
    creatorId: string
  ): Promise<SubscriberUsageProfile | null> {
    const supabase = await createSupabaseServerClient();

    // Get subscriber's tier info
    const { data: tierAssignment } = await supabase
      .from('customer_tier_assignments')
      .select(`
        tier_id,
        subscription_tiers (
          id,
          name,
          price,
          usage_caps,
          feature_entitlements
        )
      `)
      .eq('customer_id', userId)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .single();

    if (!tierAssignment) return null;

    const tier = tierAssignment.subscription_tiers as any;

    // Get current billing period usage
    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data: currentUsage } = await supabase
      .from('usage_aggregates')
      .select('*')
      .eq('user_id', userId)
      .eq('creator_id', creatorId)
      .eq('billing_period', billingPeriod);

    // Get usage history
    const { data: usageHistory } = await supabase
      .from('usage_events')
      .select('*')
      .eq('user_id', userId)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Process current usage vs limits
    const usageCaps = tier.usage_caps as Record<string, number> || {};
    const processedCurrentUsage = Object.keys(usageCaps).map(eventType => {
      const used = currentUsage?.find(u => u.event_type === eventType)?.total_quantity || 0;
      const available = usageCaps[eventType];
      return {
        event_type: eventType,
        quantity_used: used,
        quantity_available: available,
        utilization_rate: available > 0 ? used / available : 0,
      };
    });

    // Check for overage alerts
    const overageAlerts = processedCurrentUsage
      .filter(usage => usage.utilization_rate > 0.8)
      .map(usage => ({
        event_type: usage.event_type,
        current_usage: usage.quantity_used,
        limit: usage.quantity_available,
        threshold_exceeded: usage.utilization_rate * 100,
      }));

    return {
      user_id: userId,
      tier_info: {
        tier_id: tier.id,
        tier_name: tier.name,
        price: tier.price,
        usage_caps: usageCaps,
        feature_entitlements: tier.feature_entitlements || [],
      },
      current_usage: processedCurrentUsage,
      usage_history: usageHistory?.map(event => ({
        date: event.created_at,
        event_type: event.event_type,
        quantity: event.quantity,
      })) || [],
      overage_alerts: overageAlerts,
    };
  }

  /**
   * Track usage across different pricing structure variants
   */
  static async trackMultiVariantUsage(
    userId: string,
    creatorId: string,
    variantId: string,
    eventType: string,
    quantity: number
  ): Promise<MultiVariantUsageData> {
    // Track the usage event
    await this.trackUsageEvent(userId, creatorId, eventType, quantity, {
      variant_id: variantId,
    });

    // Get variant pricing structure
    const variant = await this.getVariantPricingStructure(variantId);
    
    // Calculate usage-based cost
    const costBreakdown = this.calculateUsageBasedCost(quantity, variant.pricing_structure);

    return {
      variant_id: variantId,
      variant_name: variant.name,
      pricing_structure: variant.pricing_structure,
      usage_data: {
        total_usage: quantity,
        cost_breakdown: costBreakdown,
      },
    };
  }

  /**
   * Private helper methods
   */
  private static async updateAggregatedUsage(
    userId: string,
    creatorId: string,
    eventType: string,
    quantity: number,
    billingPeriod: string
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('usage_aggregates')
      .upsert({
        user_id: userId,
        creator_id: creatorId,
        event_type: eventType,
        billing_period: billingPeriod,
        total_quantity: quantity,
      }, {
        onConflict: 'user_id,creator_id,event_type,billing_period',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error updating aggregated usage:', error);
    }
  }

  private static groupUsageByTier(tierStats: any[], usageEvents: any[]) {
    return tierStats.map(stat => {
      const tierUsage = usageEvents.filter(event => event.tier_id === stat.tier_id);
      const totalUsage = tierUsage.reduce((sum, event) => sum + event.quantity, 0);
      const usageCaps = stat.subscription_tiers?.usage_caps || {};
      const usageCap = typeof usageCaps === 'object' 
        ? Object.values(usageCaps).reduce((sum: number, cap: any) => sum + (typeof cap === 'number' ? cap : 0), 0)
        : 0;

      return {
        tier_id: stat.tier_id || '',
        tier_name: stat.subscription_tiers?.name || 'Unknown',
        subscriber_count: 1,
        total_usage: totalUsage,
        average_usage: totalUsage,
        usage_cap: usageCap,
        utilization_rate: usageCap > 0 ? totalUsage / usageCap : 0,
      };
    });
  }

  private static getTopUsageEvents(usageEvents: any[]) {
    const eventGroups = usageEvents.reduce((groups, event) => {
      if (!groups[event.event_type]) {
        groups[event.event_type] = {
          total_quantity: 0,
          unique_users: new Set(),
        };
      }
      groups[event.event_type].total_quantity += event.quantity;
      groups[event.event_type].unique_users.add(event.user_id);
      return groups;
    }, {} as Record<string, { total_quantity: number; unique_users: Set<string> }>);

    return Object.entries(eventGroups)
      .map(([eventType, data]) => ({
        event_type: eventType,
        total_quantity: data.total_quantity,
        unique_users: data.unique_users.size,
      }))
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 10);
  }

  private static getUsageTrends(usageEvents: any[]) {
    const dateGroups = usageEvents.reduce((groups, event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = {
          total_usage: 0,
          unique_users: new Set(),
        };
      }
      groups[date].total_usage += event.quantity;
      groups[date].unique_users.add(event.user_id);
      return groups;
    }, {} as Record<string, { total_usage: number; unique_users: Set<string> }>);

    return Object.entries(dateGroups)
      .map(([date, data]) => ({
        date,
        total_usage: data.total_usage,
        unique_users: data.unique_users.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static async getVariantPricingStructure(variantId: string) {
    // This would fetch from a variants table or configuration
    return {
      name: `Variant ${variantId}`,
      pricing_structure: {
        base_price: 10,
        usage_tiers: [
          { up_to: 100, price_per_unit: 0.1 },
          { up_to: 1000, price_per_unit: 0.05 },
          { up_to: -1, price_per_unit: 0.02 }, // unlimited
        ],
      },
    };
  }

  private static calculateUsageBasedCost(quantity: number, pricingStructure: any) {
    const { base_price, usage_tiers } = pricingStructure;
    let remainingQuantity = quantity;
    let usageCost = 0;

    for (const tier of usage_tiers) {
      if (remainingQuantity <= 0) break;
      
      const tierQuantity = tier.up_to === -1 
        ? remainingQuantity 
        : Math.min(remainingQuantity, tier.up_to);
      
      usageCost += tierQuantity * tier.price_per_unit;
      remainingQuantity -= tierQuantity;
    }

    return {
      base_cost: base_price,
      usage_cost: usageCost,
      total_cost: base_price + usageCost,
    };
  }
}