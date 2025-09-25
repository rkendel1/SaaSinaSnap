// Usage Tracking Types

export interface UsageMeter {
  id: string;
  creator_id: string;
  event_name: string;
  display_name: string;
  description?: string;
  aggregation_type: 'count' | 'sum' | 'unique' | 'duration' | 'max';
  unit_name: string;
  billing_model: 'metered' | 'licensed' | 'hybrid';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeterPlanLimit {
  id: string;
  meter_id: string;
  plan_name: string;
  limit_value?: number; // null means unlimited
  overage_price?: number;
  soft_limit_threshold: number; // 0.0 to 1.0
  hard_cap: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageEvent {
  id: string;
  meter_id: string;
  user_id: string;
  event_value: number;
  properties?: Record<string, any>;
  event_timestamp: string;
  created_at: string;
}

export interface UsageAggregate {
  id: string;
  meter_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  aggregate_value: number;
  event_count: number;
  billing_period?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageAlert {
  id: string;
  meter_id: string;
  user_id: string;
  plan_name: string;
  alert_type: 'soft_limit' | 'hard_limit' | 'overage';
  threshold_percentage?: number;
  current_usage: number;
  limit_value?: number;
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  created_at: string;
}

export interface UsageBillingSync {
  id: string;
  meter_id: string;
  user_id: string;
  billing_period: string;
  usage_quantity: number;
  overage_quantity: number;
  stripe_usage_record_id?: string;
  stripe_subscription_item_id?: string;
  billing_status: 'pending' | 'synced' | 'failed';
  sync_attempts: number;
  last_sync_attempt?: string;
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

// API Types
export interface TrackUsageRequest {
  event_name: string;
  user_id: string;
  value?: number;
  properties?: Record<string, any>;
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
    limit_value?: number;
    overage_price?: number;
    soft_limit_threshold?: number;
    hard_cap?: boolean;
  }>;
}

export interface UsageSummary {
  meter_id: string;
  meter_name: string;
  user_id: string;
  current_usage: number;
  limit_value?: number;
  usage_percentage?: number;
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
}