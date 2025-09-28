/**
 * Pricing Change Notification Service
 * Handles transparent communication of pricing changes to creators and subscribers
 */

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';

export interface PricingChangeNotification {
  id: string;
  creator_id: string;
  product_id: string;
  change_type: 'price_increase' | 'price_decrease' | 'tier_restructure' | 'feature_change';
  old_data: {
    price?: number;
    features?: string[];
    limits?: Record<string, number>;
  };
  new_data: {
    price?: number;
    features?: string[];
    limits?: Record<string, number>;
  };
  effective_date: string;
  notification_date: string;
  reason?: string;
  impact_summary: {
    affected_subscribers: number;
    revenue_impact: number;
    grandfathered_subscribers?: number;
  };
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  creator_approved: boolean;
  subscriber_notifications_sent: boolean;
}

export interface SubscriberImpactAnalysis {
  subscriber_id: string;
  current_plan: {
    name: string;
    price: number;
    features: string[];
  };
  new_plan: {
    name: string;
    price: number;
    features: string[];
  };
  price_change: number;
  feature_changes: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  grandfathered: boolean;
  action_required: boolean;
  migration_options: {
    option: string;
    description: string;
    price_impact: number;
  }[];
}

export interface CreatorChangePreview {
  total_affected_subscribers: number;
  revenue_projections: {
    current_monthly: number;
    projected_monthly: number;
    difference: number;
    confidence_level: number;
  };
  subscriber_breakdown: {
    grandfathered: number;
    migrated_automatically: number;
    requires_approval: number;
    at_risk_of_churn: number;
  };
  timeline: {
    notification_date: string;
    grace_period_days: number;
    effective_date: string;
  };
  recommendations: string[];
}

export class PricingChangeService {
  /**
   * Create a pricing change notification and analyze its impact
   */
  static async createPricingChangeNotification(
    creatorId: string,
    productId: string,
    changeData: {
      change_type: PricingChangeNotification['change_type'];
      old_data: PricingChangeNotification['old_data'];
      new_data: PricingChangeNotification['new_data'];
      effective_date: string;
      reason?: string;
    },
    tenantId?: string
  ): Promise<{
    notification: PricingChangeNotification;
    impact_analysis: CreatorChangePreview;
  }> {
    const supabase = await createSupabaseAdminClient();

    // Analyze subscriber impact
    const impactAnalysis = await this.analyzeCreatorChangeImpact(
      creatorId,
      productId,
      changeData,
      tenantId
    );

    // Create notification record
    const notification: Omit<PricingChangeNotification, 'id'> = {
      creator_id: creatorId,
      product_id: productId,
      change_type: changeData.change_type,
      old_data: changeData.old_data,
      new_data: changeData.new_data,
      effective_date: changeData.effective_date,
      notification_date: new Date().toISOString(),
      reason: changeData.reason,
      impact_summary: {
        affected_subscribers: impactAnalysis.total_affected_subscribers,
        revenue_impact: impactAnalysis.revenue_projections.difference,
        grandfathered_subscribers: impactAnalysis.subscriber_breakdown.grandfathered,
      },
      status: 'draft',
      creator_approved: false,
      subscriber_notifications_sent: false,
    };

    // For now, store in a simplified format until proper table is created
    console.log('Pricing change notification created:', notification);
    console.log('Impact analysis:', impactAnalysis);

    return {
      notification: {
        id: `notification_${Date.now()}`,
        ...notification,
      },
      impact_analysis: impactAnalysis,
    };
  }

  /**
   * Analyze the impact of a pricing change on a creator's business
   */
  static async analyzeCreatorChangeImpact(
    creatorId: string,
    productId: string,
    changeData: {
      change_type: string;
      old_data: any;
      new_data: any;
      effective_date: string;
    },
    tenantId?: string
  ): Promise<CreatorChangePreview> {
    const supabase = await createSupabaseAdminClient();

    // Get current subscribers
    const { data: subscribers } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active');

    const totalSubscribers = subscribers?.length || 0;
    
    // Calculate price impact
    const oldPrice = changeData.old_data.price || 0;
    const newPrice = changeData.new_data.price || 0;
    const priceChange = newPrice - oldPrice;
    
    // Estimate revenue impact
    const currentMonthly = totalSubscribers * oldPrice;
    const projectedMonthly = totalSubscribers * newPrice * 0.85; // Assume 15% churn
    const difference = projectedMonthly - currentMonthly;

    // Estimate subscriber breakdown
    const grandfatheredCount = Math.floor(totalSubscribers * 0.3); // 30% grandfathered
    const autoMigratedCount = Math.floor(totalSubscribers * 0.5); // 50% auto-migrated
    const requiresApprovalCount = Math.floor(totalSubscribers * 0.15); // 15% need approval
    const atRiskCount = Math.floor(totalSubscribers * 0.05); // 5% at risk

    return {
      total_affected_subscribers: totalSubscribers,
      revenue_projections: {
        current_monthly: currentMonthly,
        projected_monthly: projectedMonthly,
        difference: difference,
        confidence_level: 0.75,
      },
      subscriber_breakdown: {
        grandfathered: grandfatheredCount,
        migrated_automatically: autoMigratedCount,
        requires_approval: requiresApprovalCount,
        at_risk_of_churn: atRiskCount,
      },
      timeline: {
        notification_date: new Date().toISOString(),
        grace_period_days: 30,
        effective_date: changeData.effective_date,
      },
      recommendations: this.generateChangeRecommendations(changeData, {
        priceChange,
        totalSubscribers,
        projectedChurn: 0.15,
      }),
    };
  }

  /**
   * Generate personalized impact analysis for each subscriber
   */
  static async analyzeSubscriberImpact(
    subscriberId: string,
    changeData: any,
    tenantId?: string
  ): Promise<SubscriberImpactAnalysis> {
    const supabase = await createSupabaseAdminClient();

    // Get subscriber's current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        prices (
          unit_amount,
          currency
        )
      `)
      .eq('user_id', subscriberId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const currentPrice = subscription.prices?.unit_amount || 0;
    const newPrice = changeData.new_data.price * 100; // Convert to cents
    const priceChange = (newPrice - currentPrice) / 100;

    // Determine if subscriber should be grandfathered
    const grandfathered = this.shouldGrandfatherSubscriber(subscription, changeData);

    // Analyze feature changes
    const featureChanges = this.analyzeFeatureChanges(
      changeData.old_data.features || [],
      changeData.new_data.features || []
    );

    // Generate migration options
    const migrationOptions = this.generateMigrationOptions(subscription, changeData);

    return {
      subscriber_id: subscriberId,
      current_plan: {
        name: 'Current Plan',
        price: currentPrice / 100,
        features: changeData.old_data.features || [],
      },
      new_plan: {
        name: 'New Plan',
        price: newPrice / 100,
        features: changeData.new_data.features || [],
      },
      price_change: priceChange,
      feature_changes: featureChanges,
      grandfathered: grandfathered,
      action_required: !grandfathered && priceChange > 0,
      migration_options: migrationOptions,
    };
  }

  /**
   * Send pricing change notifications to affected subscribers
   */
  static async sendSubscriberNotifications(
    notificationId: string,
    creatorId: string,
    tenantId?: string
  ): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const supabase = await createSupabaseAdminClient();

    // Get affected subscribers
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, id')
      .eq('status', 'active');

    if (!subscriptions?.length) {
      return { sent: 0, failed: 0, errors: [] };
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // In a real implementation, this would send emails/notifications
    for (const subscription of subscriptions) {
      try {
        // Mock notification sending
        console.log(`Sending pricing change notification to user ${subscription.user_id}`);
        sent++;
      } catch (error) {
        failed++;
        errors.push(`Failed to notify user ${subscription.user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Validate and preview pricing changes before implementation
   */
  static async validatePricingChange(
    creatorId: string,
    productId: string,
    changeData: any,
    tenantId?: string
  ): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
    recommendations: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Validate effective date
    const effectiveDate = new Date(changeData.effective_date);
    const now = new Date();
    const daysUntilEffective = Math.ceil((effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEffective < 7) {
      warnings.push('Effective date is less than 7 days away. Consider giving subscribers more notice.');
    }

    if (daysUntilEffective < 1) {
      errors.push('Effective date must be at least 1 day in the future.');
    }

    // Validate price changes
    const oldPrice = changeData.old_data.price || 0;
    const newPrice = changeData.new_data.price || 0;
    const priceIncrease = ((newPrice - oldPrice) / oldPrice) * 100;

    if (priceIncrease > 50) {
      warnings.push(`Price increase of ${priceIncrease.toFixed(1)}% is significant and may cause churn.`);
      recommendations.push('Consider phasing the increase over multiple periods.');
    }

    if (priceIncrease > 100) {
      errors.push('Price increases over 100% require special approval.');
    }

    // Validate features
    if (changeData.change_type === 'feature_change') {
      const removedFeatures = this.analyzeFeatureChanges(
        changeData.old_data.features || [],
        changeData.new_data.features || []
      ).removed;

      if (removedFeatures.length > 0) {
        warnings.push(`Removing features: ${removedFeatures.join(', ')}. This may negatively impact subscribers.`);
        recommendations.push('Consider grandfathering existing subscribers or providing migration paths.');
      }
    }

    const valid = errors.length === 0;

    return {
      valid,
      warnings,
      errors,
      recommendations,
    };
  }

  /**
   * Private helper methods
   */
  private static shouldGrandfatherSubscriber(subscription: any, changeData: any): boolean {
    // Grandfather long-term subscribers or those on legacy plans
    const subscriptionAge = new Date().getTime() - new Date(subscription.created).getTime();
    const ageInMonths = subscriptionAge / (1000 * 60 * 60 * 24 * 30);
    
    return ageInMonths >= 12; // Grandfather subscribers with 12+ months
  }

  private static analyzeFeatureChanges(oldFeatures: string[], newFeatures: string[]) {
    const added = newFeatures.filter(f => !oldFeatures.includes(f));
    const removed = oldFeatures.filter(f => !newFeatures.includes(f));
    const modified: string[] = []; // Would need more sophisticated comparison

    return { added, removed, modified };
  }

  private static generateMigrationOptions(subscription: any, changeData: any) {
    return [
      {
        option: 'Accept Changes',
        description: 'Continue with the new pricing and features',
        price_impact: changeData.new_data.price - changeData.old_data.price,
      },
      {
        option: 'Downgrade',
        description: 'Switch to a lower-tier plan',
        price_impact: -5, // Mock data
      },
      {
        option: 'Cancel',
        description: 'Cancel subscription before changes take effect',
        price_impact: -changeData.old_data.price,
      },
    ];
  }

  private static generateChangeRecommendations(
    changeData: any,
    context: { priceChange: number; totalSubscribers: number; projectedChurn: number }
  ): string[] {
    const recommendations: string[] = [];

    if (context.priceChange > 0) {
      recommendations.push('Consider offering a discount to existing subscribers during the transition period.');
      recommendations.push('Communicate the value improvements that justify the price increase.');
    }

    if (context.projectedChurn > 0.1) {
      recommendations.push('High churn risk detected. Consider phasing the changes or offering alternatives.');
    }

    if (context.totalSubscribers > 100) {
      recommendations.push('With a large subscriber base, consider A/B testing the changes with a subset first.');
    }

    return recommendations;
  }
}