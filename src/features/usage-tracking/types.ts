export interface UsageMeter {
  id: string;
  creator_id: string;
  event_name: string;
  display_name: string;
  description?: string;
  aggregation_type: string;
  unit_name: string;
  billing_model: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageEvent {
  id: string;
  meter_id: string;
  user_id: string;
  event_name: string;
  event_value: number;
  properties?: any;
  event_timestamp: string;
}

export interface UsageAggregate {
  id: string;
  meter_id: string;
  user_id: string;
  billing_period: string;
  total_usage: number;
  aggregate_value: number;
  created_at: string;
  updated_at: string;
}

export interface UsageAlert {
  id: string;
  meter_id: string;
  user_id: string;
  plan_name: string;
  alert_type: string;
  threshold_percentage: number;
  current_usage: number;
  limit_value?: number;
  triggered_at: string;
  acknowledged: boolean;
}

export interface CreateMeterRequest {
  event_name: string;
  display_name: string;
  description?: string;
  aggregation_type: string;
  unit_name?: string;
  billing_model?: string;
  plan_limits?: MeterPlanLimit[];
}

export interface TrackUsageRequest {
  meter_id: string;
  user_id: string;
  event_name: string;
  event_value?: number;
  properties?: any;
  timestamp?: string;
}

export interface MeterPlanLimit {
  plan_name: string;
  limit_value?: number;
  overage_price?: number;
  soft_limit_threshold?: number;
  hard_cap?: boolean;
}

export interface UsageSummary {
  meter_id: string;
  display_name: string;
  unit_name: string;
  total_usage: number;
  limit?: number;
  remaining?: number;
  billing_period: string;
}

export interface UsageAnalytics {
  usage_by_user: Array<{ user_id: string; usage: number; plan: string }>;
  usage_trends: Array<{ period: string; usage: number }>;
}