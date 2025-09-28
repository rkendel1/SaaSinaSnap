import * as crypto from 'crypto';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import {
  ApiKey,
  ApiKeyUsage,
  ApiKeyUsageStats,
  ApiKeyValidationResult,
  CreateApiKeyRequest,
  CreatorApiKeyConfig,
} from '../types';

export class ApiKeyService {
  /**
   * Get supabase admin client
   */
  private static async getSupabase() {
    return await createSupabaseAdminClient();
  }

  /**
   * Generate a secure API key with the specified prefix
   */
  static generateApiKey(environment: 'test' | 'production' | 'sandbox' = 'test'): { fullKey: string; hash: string; hint: string; prefix: string } {
    const prefixes = {
      test: 'sk_test_',
      production: 'sk_live_',
      sandbox: 'sk_sandbox_'
    };
    
    const prefix = prefixes[environment];
    
    // Generate 32 random bytes and encode as base64url (no padding)
    const randomBytes = crypto.randomBytes(32);
    const keyBody = randomBytes.toString('base64url').slice(0, 32);
    const fullKey = prefix + keyBody;
    
    // Create hash for storage
    const hash = crypto.createHash('sha256').update(fullKey).digest('hex');
    
    // Get last 4 characters for hint
    const hint = '...' + keyBody.slice(-4);
    
    return { fullKey, hash, hint, prefix };
  }

  /**
   * Create a new API key for a creator/customer
   */
  static async createApiKey(request: CreateApiKeyRequest, tenantId?: string): Promise<{ apiKey: ApiKey; fullKey: string }> {
    const keyData = this.generateApiKey(request.environment);
    
    const apiKeyData = {
      tenant_id: tenantId,
      key_prefix: keyData.prefix,
      key_hash: keyData.hash,
      key_hint: keyData.hint,
      creator_id: request.creator_id,
      customer_id: request.customer_id,
      user_id: request.customer_id || request.creator_id, // Default to creator if no customer
      name: request.name,
      description: request.description,
      environment: request.environment,
      scopes: request.scopes || ['read:basic'],
      permissions: request.permissions || {},
      rate_limit_per_hour: request.rate_limit_per_hour || 1000,
      rate_limit_per_day: request.rate_limit_per_day || 10000,
      rate_limit_per_month: request.rate_limit_per_month || 100000,
      usage_limits: {},
      expires_at: request.expires_days ? new Date(Date.now() + request.expires_days * 24 * 60 * 60 * 1000).toISOString() : null,
      auto_rotate_enabled: request.auto_rotate_enabled || false,
      rotate_every_days: request.rotate_every_days || 90,
      next_rotation_at: request.auto_rotate_enabled 
        ? new Date(Date.now() + (request.rotate_every_days || 90) * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };

    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('api_keys')
      .insert([apiKeyData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    return {
      apiKey: data as any as ApiKey,
      fullKey: keyData.fullKey
    };
  }

  /**
   * Validate an API key and return associated data
   */
  static async validateApiKey(keyValue: string, ip?: string): Promise<ApiKeyValidationResult> {
    try {
      const hash = crypto.createHash('sha256').update(keyValue).digest('hex');
      
      const supabase = await this.getSupabase();
      const { data: apiKey, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', hash)
        .single();

      if (error || !apiKey) {
        return { valid: false, error: 'Invalid API key' };
      }

      const key = apiKey as ApiKey;

      // Check if key is active
      if (!key.active) {
        return { valid: false, error: 'API key is inactive', revoked: true };
      }

      // Check if key is revoked
      if (key.revoked_at) {
        return { valid: false, error: 'API key has been revoked', revoked: true };
      }

      // Check if key is expired
      if (key.expires_at && new Date(key.expires_at) < new Date()) {
        return { valid: false, error: 'API key has expired', expired: true };
      }

      // Update last used timestamp and IP
      if (ip) {
        const supabase = await this.getSupabase();
        await supabase.rpc('update_api_key_usage', {
          key_hash: hash,
          ip_addr: ip
        });
      }

      return { valid: true, api_key: key };
    } catch (error) {
      return { valid: false, error: 'Failed to validate API key' };
    }
  }

  /**
   * Get API keys for a user/creator
   */
  static async getApiKeys(userId: string, creatorId?: string): Promise<ApiKey[]> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId);

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch API keys: ${error.message}`);
    }

    return data as ApiKey[];
  }

  /**
   * Revoke an API key
   */
  static async revokeApiKey(keyId: string, revokedBy: string, reason?: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('api_keys')
      .update({
        active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
        revoked_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }
  }

  /**
   * Rotate an API key (generate new key, deactivate old one)
   */
  static async rotateApiKey(keyId: string, rotatedBy: string, reason?: string): Promise<{ newKey: string; newApiKey: ApiKey }> {
    const supabase = await this.getSupabase();
    const { data: oldKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (fetchError || !oldKey) {
      throw new Error('API key not found');
    }

    const oldKeyData = oldKey as ApiKey;
    
    // Generate new key
    const newKeyData = this.generateApiKey(oldKeyData.environment);
    
    // Update the existing key record with new key data
    const { data: updatedKey, error: updateError } = await supabase
      .from('api_keys')
      .update({
        key_hash: newKeyData.hash,
        key_hint: newKeyData.hint,
        updated_at: new Date().toISOString(),
        next_rotation_at: oldKeyData.auto_rotate_enabled 
          ? new Date(Date.now() + oldKeyData.rotate_every_days * 24 * 60 * 60 * 1000).toISOString()
          : null
      })
      .eq('id', keyId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to rotate API key: ${updateError.message}`);
    }

    // Log the rotation
    await supabase
      .from('api_key_rotations')
      .insert([{
        tenant_id: oldKeyData.tenant_id,
        api_key_id: keyId,
        old_key_hash: oldKeyData.key_hash,
        new_key_hash: newKeyData.hash,
        rotation_type: 'manual',
        reason,
        rotated_by: rotatedBy
      }]);

    return {
      newKey: newKeyData.fullKey,
      newApiKey: updatedKey as ApiKey
    };
  }

  /**
   * Log API key usage
   */
  static async logUsage(
    keyId: string, 
    endpoint: string, 
    method: string, 
    statusCode: number,
    options: {
      responseTimeMs?: number;
      ipAddress?: string;
      userAgent?: string;
      referer?: string;
      tokensUsed?: number;
      creditsConsumed?: number;
      tenantId?: string;
    } = {}
  ): Promise<void> {
    const usageData = {
      tenant_id: options.tenantId,
      api_key_id: keyId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: options.responseTimeMs,
      ip_address: options.ipAddress,
      user_agent: options.userAgent,
      referer: options.referer,
      tokens_used: options.tokensUsed || 0,
      credits_consumed: options.creditsConsumed || 0
    };

    const { error } = await (await this.getSupabase())
      .from('api_key_usage')
      .insert([usageData]);

    if (error) {
      console.error('Failed to log API key usage:', error);
      // Don't throw error as this shouldn't break the main request
    }
  }

  /**
   * Get usage statistics for an API key
   */
  static async getUsageStats(keyId: string, days: number = 30): Promise<ApiKeyUsageStats> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: usageData, error } = await (await this.getSupabase())
      .from('api_key_usage')
      .select('*')
      .eq('api_key_id', keyId)
      .gte('timestamp', startDate)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch usage stats: ${error.message}`);
    }

    const usage = usageData as ApiKeyUsage[];
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: ApiKeyUsageStats = {
      total_requests: usage.length,
      requests_this_hour: usage.filter(u => new Date(u.timestamp) > hourAgo).length,
      requests_today: usage.filter(u => new Date(u.timestamp) > dayAgo).length,
      requests_this_month: usage.filter(u => new Date(u.timestamp) > monthAgo).length,
      average_response_time: usage.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / (usage.length || 1),
      error_rate: usage.filter(u => u.status_code >= 400).length / (usage.length || 1),
      top_endpoints: this.calculateTopEndpoints(usage),
      usage_by_day: this.calculateUsageByDay(usage, days)
    };

    return stats;
  }

  /**
   * Get or create creator API key configuration
   */
  static async getCreatorConfig(creatorId: string, tenantId?: string): Promise<CreatorApiKeyConfig> {
    const supabase = await this.getSupabase();
    const { data: existing, error: fetchError } = await supabase
      .from('creator_api_key_configs')
      .select('*')
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch creator config: ${fetchError.message}`);
    }

    if (existing) {
      return existing as CreatorApiKeyConfig;
    }

    // Create default configuration
    const defaultConfig = {
      tenant_id: tenantId,
      creator_id: creatorId,
      requires_api_keys: false,
      delegate_key_management: true,
      default_environment: 'test' as const,
      default_rate_limit_per_hour: 1000,
      default_rate_limit_per_day: 10000,
      default_rate_limit_per_month: 100000,
      available_scopes: ['read:basic'],
      default_scopes: ['read:basic'],
      allow_customer_key_regeneration: true,
      allow_customer_scope_modification: false,
      auto_generate_on_purchase: true,
      email_keys_to_customers: true,
      include_in_dashboard: true
    };

    const { data: created, error: createError } = await supabase
      .from('creator_api_key_configs')
      .insert([defaultConfig])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create creator config: ${createError.message}`);
    }

    return created as CreatorApiKeyConfig;
  }

  /**
   * Update creator API key configuration
   */
  static async updateCreatorConfig(creatorId: string, updates: Partial<CreatorApiKeyConfig>): Promise<CreatorApiKeyConfig> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('creator_api_key_configs')
      .update(updates)
      .eq('creator_id', creatorId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update creator config: ${error.message}`);
    }

    return data as CreatorApiKeyConfig;
  }

  /**
   * Helper method to calculate top endpoints
   */
  private static calculateTopEndpoints(usage: ApiKeyUsage[]): Array<{ endpoint: string; count: number }> {
    const endpointCounts = usage.reduce((acc, u) => {
      acc[u.endpoint] = (acc[u.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  /**
   * Helper method to calculate usage by day
   */
  private static calculateUsageByDay(usage: ApiKeyUsage[], days: number): Array<{ date: string; count: number }> {
    const dailyCounts: Record<string, number> = {};
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }
    
    // Count actual usage
    usage.forEach(u => {
      const dateStr = new Date(u.timestamp).toISOString().split('T')[0];
      if (dailyCounts.hasOwnProperty(dateStr)) {
        dailyCounts[dateStr]++;
      }
    });

    return Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}