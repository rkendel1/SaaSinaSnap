export interface ApiKey {
  id: string;
  key_prefix: string;
  key_hash: string;
  key_hint: string;
  creator_id: string;
  customer_id?: string;
  user_id: string;
  name: string;
  description?: string;
  environment: 'test' | 'production' | 'sandbox';
  scopes: string[];
  permissions: Record<string, any>;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  rate_limit_per_month: number;
  usage_limits: Record<string, any>;
  expires_at?: string;
  last_used_at?: string;
  last_used_ip?: string;
  usage_count: number;
  active: boolean;
  revoked_at?: string;
  revoked_by?: string;
  revoked_reason?: string;
  auto_rotate_enabled: boolean;
  rotate_every_days: number;
  next_rotation_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyUsage {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  referer?: string;
  tokens_used: number;
  credits_consumed: number;
  timestamp: string;
}

export interface CreatorApiKeyConfig {
  id: string;
  creator_id: string;
  requires_api_keys: boolean;
  delegate_key_management: boolean;
  default_environment: 'test' | 'production' | 'sandbox';
  default_rate_limit_per_hour: number;
  default_rate_limit_per_day: number;
  default_rate_limit_per_month: number;
  available_scopes: string[];
  default_scopes: string[];
  default_expires_days?: number;
  allow_customer_key_regeneration: boolean;
  allow_customer_scope_modification: boolean;
  auto_generate_on_purchase: boolean;
  email_keys_to_customers: boolean;
  include_in_dashboard: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyRotation {
  id: string;
  api_key_id: string;
  old_key_hash: string;
  new_key_hash: string;
  rotation_type: 'manual' | 'auto' | 'security';
  reason?: string;
  rotated_by?: string;
  rotated_at: string;
}

export interface CreateApiKeyRequest {
  creator_id: string;
  customer_id?: string;
  name: string;
  description?: string;
  environment: 'test' | 'production' | 'sandbox';
  scopes?: string[];
  permissions?: Record<string, any>;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  rate_limit_per_month?: number;
  expires_days?: number;
  auto_rotate_enabled?: boolean;
  rotate_every_days?: number;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  api_key?: ApiKey;
  error?: string;
  rate_limit_exceeded?: boolean;
  expired?: boolean;
  revoked?: boolean;
}

export interface ApiKeyUsageStats {
  total_requests: number;
  requests_this_hour: number;
  requests_today: number;
  requests_this_month: number;
  average_response_time: number;
  error_rate: number;
  top_endpoints: Array<{
    endpoint: string;
    count: number;
  }>;
  usage_by_day: Array<{
    date: string;
    count: number;
  }>;
}