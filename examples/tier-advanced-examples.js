/**
 * Advanced Tier Management Examples
 * 
 * Real-world scenarios and patterns for implementing tiering and usage tracking
 */

// ============================================================================
// Example 1: Complete E-commerce SaaS Setup
// ============================================================================

/**
 * Scenario: Setting up tiers for an e-commerce platform
 * Features: Store management, product listings, order processing, analytics
 */
async function setupEcommerceTiers() {
  const ecommerceTiers = [
    {
      name: 'Starter Store',
      description: 'Perfect for testing the waters',
      price: 0,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'basic_analytics',
        'stores:1',
        'products:50',
        'team_members:1',
        'email_support'
      ],
      usage_caps: {
        orders_per_month: 100,
        api_calls: 5000,
        storage_gb: 1
      },
      trial_period_days: 0
    },
    {
      name: 'Growth',
      description: 'For growing businesses',
      price: 49.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'advanced_analytics',
        'stores:3',
        'products:500',
        'team_members:5',
        'priority_support',
        'custom_domain',
        'abandoned_cart_recovery'
      ],
      usage_caps: {
        orders_per_month: 1000,
        api_calls: 50000,
        storage_gb: 10,
        email_sends: 5000
      },
      is_default: true,
      trial_period_days: 14
    },
    {
      name: 'Professional',
      description: 'Advanced tools for scaling',
      price: 199.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'enterprise_analytics',
        'stores:10',
        'products:5000',
        'team_members:25',
        'dedicated_support',
        'custom_domain',
        'abandoned_cart_recovery',
        'multi_currency',
        'advanced_shipping',
        'api_access'
      ],
      usage_caps: {
        orders_per_month: 10000,
        api_calls: 500000,
        storage_gb: 100,
        email_sends: 50000
      },
      trial_period_days: 30
    },
    {
      name: 'Enterprise',
      description: 'Unlimited everything for large organizations',
      price: 999.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'enterprise_analytics',
        'stores:unlimited',
        'products:unlimited',
        'team_members:unlimited',
        'dedicated_account_manager',
        'custom_domain',
        'abandoned_cart_recovery',
        'multi_currency',
        'advanced_shipping',
        'api_access',
        'white_label',
        'sso',
        'custom_integrations'
      ],
      usage_caps: {}, // No limits
      trial_period_days: 30
    }
  ];

  for (const tier of ecommerceTiers) {
    console.log(`Creating tier: ${tier.name}`);
    const result = await createTier(tier);
    console.log(`✓ Created ${tier.name} (ID: ${result.tier.id})`);
  }
}

// ============================================================================
// Example 2: SaaS Analytics Platform with Usage-Based Pricing
// ============================================================================

/**
 * Scenario: Analytics platform with tiered event tracking
 * Pay for what you use model with base subscription
 */
async function setupAnalyticsPlatform() {
  // Create usage meters
  const meters = [
    {
      event_name: 'events_tracked',
      display_name: 'Events Tracked',
      description: 'Number of analytics events captured',
      aggregation_type: 'count',
      unit_name: 'events',
      billing_model: 'metered'
    },
    {
      event_name: 'data_points_stored',
      display_name: 'Data Points',
      description: 'Number of data points stored',
      aggregation_type: 'sum',
      unit_name: 'points',
      billing_model: 'metered'
    },
    {
      event_name: 'dashboards_created',
      display_name: 'Dashboards',
      description: 'Number of custom dashboards',
      aggregation_type: 'count',
      unit_name: 'dashboards',
      billing_model: 'licensed'
    }
  ];

  for (const meter of meters) {
    await createMeter(meter);
  }

  // Create tiers with usage-based pricing
  const analyticsTiers = [
    {
      name: 'Starter Analytics',
      price: 29,
      usage_caps: {
        events_tracked: 100000,
        data_points_stored: 1000000,
        dashboards_created: 5
      },
      overage_pricing: {
        events_tracked: 0.0001,  // $0.10 per 1000 events
        data_points_stored: 0.00001
      }
    },
    {
      name: 'Professional Analytics',
      price: 99,
      usage_caps: {
        events_tracked: 1000000,
        data_points_stored: 10000000,
        dashboards_created: 25
      },
      overage_pricing: {
        events_tracked: 0.00008,  // Volume discount
        data_points_stored: 0.000008
      }
    }
  ];

  for (const tier of analyticsTiers) {
    await createTier(tier);
  }
}

// ============================================================================
// Example 3: Real-time Usage Monitoring Dashboard
// ============================================================================

/**
 * Scenario: Admin dashboard showing real-time usage across all customers
 */
async function createUsageMonitoringDashboard() {
  // Fetch usage summary for all customers
  const response = await fetch('/api/usage/analytics', {
    headers: {
      'Authorization': `Bearer ${getCreatorApiKey()}`
    }
  });

  const analytics = await response.json();

  return {
    // Top 10 users by usage
    topUsers: analytics.usage_by_user
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10),

    // Users approaching limits
    atRiskUsers: analytics.usage_by_user
      .filter(user => user.usage_percentage > 80)
      .map(user => ({
        ...user,
        recommendation: user.usage_percentage > 95 
          ? 'Contact immediately - about to hit limit'
          : 'Send upgrade reminder email'
      })),

    // Revenue breakdown
    revenue: {
      subscriptions: analytics.total_subscription_revenue,
      overages: analytics.total_overage_revenue,
      projected_monthly: calculateProjectedRevenue(analytics.usage_trends)
    },

    // Churn risk indicators
    churnRisk: analytics.usage_by_user
      .filter(user => user.usage_trend === 'declining')
      .map(user => ({
        userId: user.user_id,
        currentUsage: user.usage,
        previousUsage: user.previous_usage,
        decline: ((user.previous_usage - user.usage) / user.previous_usage * 100).toFixed(1),
        tier: user.tier_name
      }))
  };
}

// ============================================================================
// Example 4: Multi-Tenant SaaS with Team Management
// ============================================================================

/**
 * Scenario: Project management tool with team seats and project limits
 */
async function handleTeamManagement(organizationId) {
  // Get organization's current tier
  const tierInfo = await getOrganizationTierInfo(organizationId);
  
  // Check team seat limits
  const teamSeatsLimit = parseInt(
    tierInfo.tier.feature_entitlements
      .find(f => f.startsWith('team_seats:'))
      ?.split(':')[1] || '1'
  );

  const currentMembers = await getTeamMembers(organizationId);

  return {
    canAddMembers: currentMembers.length < teamSeatsLimit,
    remainingSeats: Math.max(0, teamSeatsLimit - currentMembers.length),
    upgrade: currentMembers.length >= teamSeatsLimit ? {
      message: 'Upgrade to add more team members',
      recommendedTier: await getRecommendedUpgrade(organizationId, 'team_seats')
    } : null
  };
}

async function addTeamMember(organizationId, memberEmail) {
  // Check if we can add more members
  const teamStatus = await handleTeamManagement(organizationId);

  if (!teamStatus.canAddMembers) {
    throw new Error('Team seat limit reached. Please upgrade your plan.');
  }

  // Track the usage
  await trackUsage({
    event_name: 'team_members_added',
    user_id: organizationId,
    event_value: 1,
    properties: {
      member_email: memberEmail,
      total_members: teamStatus.remainingSeats + 1
    }
  });

  // Add the member
  return await createTeamMember(organizationId, memberEmail);
}

// ============================================================================
// Example 5: Smart Usage Alerts and Notifications
// ============================================================================

/**
 * Scenario: Proactive customer communication based on usage patterns
 */
async function sendSmartUsageNotifications() {
  const customers = await getAllActiveCustomers();

  for (const customer of customers) {
    const tierInfo = await getCustomerTierInfo(customer.id);
    const usageSummary = tierInfo.usage_summary;

    // Check each metric
    for (const [metric, data] of Object.entries(usageSummary)) {
      // Approaching limit (80-90%)
      if (data.usage_percentage >= 80 && data.usage_percentage < 90) {
        await sendEmail({
          to: customer.email,
          template: 'usage-warning',
          data: {
            metric_name: metric,
            usage_percentage: data.usage_percentage,
            current_usage: data.current_usage,
            limit: data.limit_value,
            tier_name: tierInfo.tier.name
          }
        });
      }

      // Near limit (90-100%)
      if (data.usage_percentage >= 90 && data.usage_percentage < 100) {
        await sendEmail({
          to: customer.email,
          template: 'usage-critical',
          data: {
            metric_name: metric,
            usage_percentage: data.usage_percentage,
            upgrade_options: await getTierUpgradeOptions(customer.id)
          }
        });
      }

      // Over limit
      if (data.usage_percentage >= 100) {
        await sendEmail({
          to: customer.email,
          template: 'usage-exceeded',
          data: {
            metric_name: metric,
            overage_amount: data.overage_amount,
            estimated_cost: data.overage_amount * tierInfo.tier.overage_price,
            upgrade_options: await getTierUpgradeOptions(customer.id)
          }
        });
      }
    }

    // Success pattern - using less than 50% consistently
    if (Object.values(usageSummary).every(m => m.usage_percentage < 50)) {
      // Offer to downgrade to save money
      const lowerTier = await getLowerTierOption(customer.id);
      if (lowerTier) {
        await sendEmail({
          to: customer.email,
          template: 'downgrade-suggestion',
          data: {
            current_tier: tierInfo.tier.name,
            suggested_tier: lowerTier.name,
            monthly_savings: tierInfo.tier.price - lowerTier.price
          }
        });
      }
    }
  }
}

// ============================================================================
// Example 6: Gradual Feature Rollout Based on Tiers
// ============================================================================

/**
 * Scenario: Rolling out new features to different tiers over time
 */
class FeatureGate {
  constructor(tierInfo) {
    this.tierInfo = tierInfo;
  }

  // Check if feature is available
  hasFeature(featureName) {
    return this.tierInfo.tier.feature_entitlements.some(
      feature => feature === featureName || feature.startsWith(`${featureName}:`)
    );
  }

  // Get feature limit (for features like team_seats:10)
  getFeatureLimit(featureName) {
    const feature = this.tierInfo.tier.feature_entitlements.find(
      f => f.startsWith(`${featureName}:`)
    );

    if (!feature) return null;
    
    const limit = feature.split(':')[1];
    return limit === 'unlimited' ? Infinity : parseInt(limit);
  }

  // Check if feature can be used (considering limits)
  async canUseFeature(featureName, currentUsage = 0) {
    if (!this.hasFeature(featureName)) {
      return {
        allowed: false,
        reason: 'Feature not available in your tier',
        upgrade_required: true
      };
    }

    const limit = this.getFeatureLimit(featureName);
    if (limit !== null && currentUsage >= limit) {
      return {
        allowed: false,
        reason: `Feature limit reached (${limit})`,
        upgrade_required: true
      };
    }

    return {
      allowed: true,
      remaining: limit === null ? null : limit - currentUsage
    };
  }
}

// Usage example
async function handleFeatureAccess(userId, featureName) {
  const tierInfo = await getCustomerTierInfo(userId);
  const featureGate = new FeatureGate(tierInfo);

  const currentProjects = await getUserProjectCount(userId);
  const access = await featureGate.canUseFeature('projects', currentProjects);

  if (!access.allowed) {
    return {
      error: access.reason,
      upgrade_required: access.upgrade_required,
      upgrade_options: await getTierUpgradeOptions(userId)
    };
  }

  // Feature is accessible
  return {
    allowed: true,
    remaining: access.remaining
  };
}

// ============================================================================
// Example 7: Webhook Handler for Stripe Events
// ============================================================================

/**
 * Scenario: Handle Stripe webhooks to sync subscription status
 */
async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'customer.subscription.created':
      return await handleSubscriptionCreated(event.data.object);
      
    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(event.data.object);
      
    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(event.data.object);
      
    case 'invoice.payment_succeeded':
      return await handlePaymentSucceeded(event.data.object);
      
    case 'invoice.payment_failed':
      return await handlePaymentFailed(event.data.object);
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleSubscriptionCreated(subscription) {
  // Find the tier by Stripe price ID
  const tier = await findTierByStripePriceId(subscription.items.data[0].price.id);
  
  // Assign customer to tier
  await assignCustomerToTier(
    subscription.customer,
    tier.creator_id,
    tier.id,
    subscription.id
  );

  // Send welcome email
  await sendEmail({
    to: subscription.customer_email,
    template: 'subscription-welcome',
    data: {
      tier_name: tier.name,
      features: tier.feature_entitlements,
      trial_end: subscription.trial_end
    }
  });
}

async function handleSubscriptionUpdated(subscription) {
  // Check if tier changed (upgrade/downgrade)
  const oldTier = await getCurrentTierForSubscription(subscription.id);
  const newTier = await findTierByStripePriceId(subscription.items.data[0].price.id);

  if (oldTier.id !== newTier.id) {
    // Update assignment
    await updateCustomerTierAssignment(subscription.customer, newTier.id);

    // Send notification
    const isUpgrade = newTier.price > oldTier.price;
    await sendEmail({
      to: subscription.customer_email,
      template: isUpgrade ? 'subscription-upgraded' : 'subscription-downgraded',
      data: {
        old_tier: oldTier.name,
        new_tier: newTier.name,
        price_difference: Math.abs(newTier.price - oldTier.price)
      }
    });
  }
}

// ============================================================================
// Example 8: Usage-Based Billing Report
// ============================================================================

/**
 * Scenario: Generate monthly usage report for customers
 */
async function generateUsageReport(customerId, billingPeriod) {
  const tierInfo = await getCustomerTierInfo(customerId);
  const usageEvents = await getUsageEventsForPeriod(customerId, billingPeriod);
  
  // Group by metric
  const usageByMetric = {};
  for (const event of usageEvents) {
    if (!usageByMetric[event.event_name]) {
      usageByMetric[event.event_name] = {
        total: 0,
        events: []
      };
    }
    usageByMetric[event.event_name].total += event.event_value;
    usageByMetric[event.event_name].events.push(event);
  }

  // Calculate charges
  const charges = [];
  let totalOverageCharge = 0;

  for (const [metric, data] of Object.entries(usageByMetric)) {
    const limit = tierInfo.tier.usage_caps[metric];
    const overage = limit ? Math.max(0, data.total - limit) : 0;
    const overagePrice = tierInfo.tier.overage_pricing?.[metric] || 0;
    const overageCharge = overage * overagePrice;

    charges.push({
      metric,
      usage: data.total,
      limit: limit || 'Unlimited',
      overage,
      overage_charge: overageCharge
    });

    totalOverageCharge += overageCharge;
  }

  return {
    customer_id: customerId,
    billing_period: billingPeriod,
    tier: tierInfo.tier.name,
    base_charge: tierInfo.tier.price,
    usage_charges: charges,
    total_overage_charge: totalOverageCharge,
    total_charge: tierInfo.tier.price + totalOverageCharge,
    next_billing_date: tierInfo.next_billing_date
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

async function createTier(tierData) {
  const response = await fetch('/api/usage/tiers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getCreatorApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tierData)
  });
  return await response.json();
}

async function createMeter(meterData) {
  const response = await fetch('/api/usage/meters', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getCreatorApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(meterData)
  });
  return await response.json();
}

async function trackUsage(eventData) {
  const response = await fetch('/api/v1/usage/track', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getCreatorApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });
  return await response.json();
}

function getCreatorApiKey() {
  return process.env.CREATOR_API_KEY;
}

// Export examples
module.exports = {
  setupEcommerceTiers,
  setupAnalyticsPlatform,
  createUsageMonitoringDashboard,
  handleTeamManagement,
  addTeamMember,
  sendSmartUsageNotifications,
  FeatureGate,
  handleFeatureAccess,
  handleStripeWebhook,
  generateUsageReport
};
