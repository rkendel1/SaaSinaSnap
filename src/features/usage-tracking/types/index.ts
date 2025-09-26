// Usage Tracking Types

export interface UsageMeter {
  id: string;
  tenant_id: string | null; // Allow null
  creator_id: string;
  event_name: string;
  display_name: string;
  description: string | null; // Allow null
  aggregation_type: 'count' | 'sum' | 'unique' | 'duration' | 'max';
  unit_name: string | null; // Allow null
  billing_model: 'metered' | 'licensed' | 'hybrid';
  active: boolean | null; // Allow null
  created_at: string;
  updated_at: string;
}

export interface MeterPlanLimit {
  id: string;
  meter_id: string;
  plan_name: string;
  limit_value: number | null; // Allow null
  overage_price: number | null; // Allow null
  soft_limit_threshold: number | null; // Allow null
  hard_cap: boolean | null; // Allow null
  created_at: string;
  updated_at: string;
  tenant_id: string | null; // Allow null
}

export interface UsageEvent {
  id: string;
  meter_id: string;
  user_id: string;
  event_value: number;
  properties: Record<string, any> | null; // Allow null
  event_timestamp: string;
  created_at: string;
  tenant_id: string | null; // Allow null
}

export interface UsageAggregate {
  id: string;
  meter_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  aggregate_value: number;
  event_count: number;
  billing_period: string | null; // Allow null
  created_at: string;
  updated_at: string;
  tenant_id: string | null; // Allow null
}

export interface UsageAlert {
  id: string;
  meter_id: string;
  user_id: string;
  plan_name: string;
  alert_type: 'soft_limit' | 'hard_limit' | 'overage' | string; // Broader string type
  threshold_percentage: number | null; // Allow null
  current_usage: number;
  limit_value: number | null; // Allow null
  triggered_at: string;
  acknowledged: boolean | null; // Allow null
  acknowledged_at: string | null; // Allow null
  created_at: string;
  tenant_id: string | null; // Allow null
}

export interface UsageBillingSync {
  id: string;
  meter_id: string;
  user_id: string;
  billing_period: string;
  usage_quantity: number;
  overage_quantity: number | null; // Allow null
  stripe_usage_record_id: string | null; // Allow null
  stripe_subscription_item_id: string | null; // Allow null
  billing_status: string | null; // Broader string type
  sync_attempts: number | null; // Allow null
  last_sync_attempt: string | null; // Allow null
  sync_error: string | null; // Allow null
  created_at: string;
  updated_at: string;
  tenant_id: string | null; // Allow null
}

// API Types
export interface TrackUsageRequest {
  meter_id: string; // Added meter_id
  event_name: string; // Added event_name
  user_id: string;
  event_value?: number;
  properties?: Record<string, any> | null; // Allow null
  timestamp?: string;
}

export interface TrackUsageResponse {
  success: boolean;
  event_id?: string;
  error?: string;
}

export interface CreateMeterRequest {
  event_name: string;
  display_name: string;
  description?: string;
  aggregation_type: 'count' | 'sum' | 'unique' | 'duration' | 'max';
  unit_name?: string;
  billing_model?: 'metered' | 'licensed' | 'hybrid';
  plan_limits?: Array<{
    plan_name: string;
    limit_value?: number | null;
    overage_price?: number | null;
    soft_limit_threshold?: number | null;
    hard_cap?: boolean | null;
  }>;
}

export interface UsageSummary {
  meter_id: string;
  meter_name: string;
  user_id: string;
  current_usage: number;
  limit_value: number | null; // Allow null
  usage_percentage: number | null; // Allow null
  overage_amount: number;
  plan_name: string;
  billing_period: string;
  alerts: UsageAlert[];
}

export interface UsageAnalytics {
  total_usage: number;
  usage_by_user: Array<{
    user_id: string;
    usage: number;
    plan: string;
  }>;
  usage_trends: Array<{
    period: string;
    usage: number;
  }>;
  revenue_impact: {
    base_revenue: number;
    overage_revenue: number;
    total_revenue: number;
  };
  top_users: Array<{
    user_id: string;
    usage: number;
    revenue: number;
  }>;
  // Added for tenant-aware analytics
  total_events: number;
  unique_users: number;
  meters: Record<string, {
    total_events: number;
    total_value: number;
    unique_users: number | Set<string>; // Can be number or Set<string> during processing
    unit_name: string | null;
  }>;
  period_start: string;
  period_end: string;
}

// Subscription Tier Management Types

export interface SubscriptionTier {
  id: string;
  tenant_id: string | null; // Allow null
  creator_id: string;
  name: string;
  description: string | null; // Allow null
  price: number;
  currency: string | null; // Allow null
  billing_cycle: 'monthly' | 'yearly' | 'weekly' | 'daily' | string; // Broader string type
  feature_entitlements: string[] | null; // Allow null
  usage_caps: Record<string, number> | null; // Allow null
  active: boolean | null; // Allow null
  is_default: boolean | null; // Allow null
  sort_order: number | null; // Allow null
  stripe_price_id: string | null; // Allow null
  stripe_product_id: string | null; // Allow null
  trial_period_days: number | null; // Allow null
  created_at: string;
  updated_at: string;
}

export interface CustomerTierAssignment {
  id: string;
  customer_id: string;
  creator_id: string;
  tier_id: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'paused' | string; // Broader string type
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null; // Allow null
  trial_end: string | null; // Allow null
  cancel_at_period_end: boolean | null; // Allow null
  canceled_at: string | null; // Allow null
  stripe_subscription_id: string | null; // Allow null
  created_at: string;
  updated_at: string;
  tenant_id: string | null; // Allow null
  // Joined data
  tier?: SubscriptionTier;
}

export interface TierUsageOverage {
  id: string;
  customer_id: string;
  creator_id: string;
  tier_id: string;
  meter_id: string;
  billing_period: string;
  limit_value: number;
  actual_usage: number;
  overage_amount: number;
  overage_cost: number;
  overage_price: number;
  billed: boolean | null; // Allow null
  billed_at: string | null; // Allow null
  stripe_invoice_item_id: string | null; // Allow null
  created_at: string;
  updated_at: string;
  tenant_id: string | null; // Allow null
  // Joined data
  meter?: UsageMeter;
  tier?: SubscriptionTier;
}

export interface TierAnalytics {
  id: string;
  creator_id: string;
  tier_id: string;
  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | string; // Broader string type
  active_customers: number | null; // Allow null
  new_customers: number | null; // Allow null
  churned_customers: number | null; // Allow null
  total_revenue: number | null; // Allow null
  overage_revenue: number | null; // Allow null
  average_usage_percentage: number | null; // Allow null
  usage_metrics: Record<string, any> | null; // Allow null
  created_at: string;
  updated_at: string;
  tenant_id: string | null; // Allow null
  // Joined data
  tier?: SubscriptionTier;
}

// API Request/Response Types

export interface CreateTierRequest {
  name: string;
  description?: string | null; // Allow null
  price: number;
  currency?: string | null; // Allow null
  billing_cycle?: 'monthly' | 'yearly' | 'weekly' | 'daily';
  feature_entitlements?: string[] | null; // Allow null
  usage_caps?: Record<string, number> | null; // Allow null
  is_default?: boolean | null; // Allow null
  trial_period_days?: number | null; // Allow null
}

export interface UpdateTierRequest extends Partial<CreateTierRequest> {
  active?: boolean | null; // Allow null
  sort_order?: number | null; // Allow null
  stripe_price_id?: string | null; // Allow null
}

export interface CustomerTierInfo {
  tier: SubscriptionTier;
  assignment: CustomerTierAssignment;
  usage_summary: Record<string, {
    current_usage: number;
    limit_value: number | null; // Allow null
    usage_percentage: number | null; // Allow null
    overage_amount: number;
  }>;
  overages: TierUsageOverage[];
  next_billing_date: string;
}

export interface TierEnforcementResult {
  allowed: boolean;
  reason?: string;
  current_usage?: number;
  limit_value: number | null; // Allow null
  usage_percentage: number | null; // Allow null
  should_warn?: boolean;
  should_block?: boolean;
}

export interface TierUpgradeOption {
  tier: SubscriptionTier;
  upgrade_cost: number;
  upgrade_savings?: number;
  recommended?: boolean;
  reason?: string;
}