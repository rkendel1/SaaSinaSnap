'use server';

import Stripe from 'stripe';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';

import type { EnvironmentSyncLog, ProductEnvironmentDeployment, StripeEnvironment, StripeEnvironmentConfig } from '../types';

export class StripeEnvironmentService {
  /**
   * Get Stripe environment configuration for a tenant
   */
  static async getEnvironmentConfig(tenantId: string, environment: StripeEnvironment): Promise<StripeEnvironmentConfig | null> {
    const supabase = await createSupabaseAdminClient(tenantId);
    
    const { data, error } = await supabase
      .from('stripe_environment_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('environment', environment)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching environment config:', error);
      throw new Error('Failed to fetch environment configuration');
    }
    
    return data;
  }

  /**
   * Create or update Stripe environment configuration
   */
  static async upsertEnvironmentConfig(
    tenantId: string, 
    environment: StripeEnvironment,
    config: Partial<StripeEnvironmentConfig>
  ): Promise<StripeEnvironmentConfig> {
    const supabase = await createSupabaseAdminClient(tenantId);
    
    const configData = {
      tenant_id: tenantId,
      environment,
      ...config,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('stripe_environment_configs')
      .upsert(configData, { onConflict: 'tenant_id,environment' })
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting environment config:', error);
      throw new Error('Failed to save environment configuration');
    }
    
    return data;
  }

  /**
   * Get the active Stripe environment for a tenant
   */
  static async getActiveEnvironment(tenantId: string): Promise<StripeEnvironment> {
    const supabase = await createSupabaseAdminClient(tenantId);
    
    const { data, error } = await supabase
      .from('platform_settings')
      .select('stripe_environment')
      .eq('tenant_id', tenantId)
      .single();
    
    if (error) {
      console.error('Error fetching active environment:', error);
      return 'test'; // Default to test environment
    }
    
    return (data?.stripe_environment as StripeEnvironment) || 'test';
  }

  /**
   * Switch the active Stripe environment for a tenant
   */
  static async switchEnvironment(tenantId: string, environment: StripeEnvironment, userId: string): Promise<void> {
    const supabase = await createSupabaseAdminClient(tenantId);
    
    // Log the environment switch
    await this.logEnvironmentOperation(tenantId, environment, 'environment_switch', {
      previous_environment: await this.getActiveEnvironment(tenantId),
      new_environment: environment,
    }, userId);
    
    const { error } = await supabase
      .from('platform_settings')
      .update({ 
        stripe_environment: environment,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.error('Error switching environment:', error);
      throw new Error('Failed to switch environment');
    }
  }

  /**
   * Create a Stripe client for a specific tenant and environment
   */
  static async createStripeClient(tenantId: string, environment?: StripeEnvironment): Promise<Stripe> {
    const activeEnvironment = environment || await this.getActiveEnvironment(tenantId);
    const config = await this.getEnvironmentConfig(tenantId, activeEnvironment);
    
    let secretKey: string;
    
    if (config?.stripe_access_token) {
      // Use tenant-specific credentials if available
      secretKey = config.stripe_access_token;
    } else {
      // Fall back to platform credentials
      secretKey = getEnvVar(
        activeEnvironment === 'test' 
          ? process.env.STRIPE_SECRET_KEY 
          : process.env.STRIPE_PRODUCTION_SECRET_KEY,
        'STRIPE_SECRET_KEY'
      );
    }
    
    return new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      stripeAccount: config?.stripe_account_id,
      appInfo: {
        name: 'Staryer Platform',
        version: '0.1.0',
      },
    });
  }

  /**
   * Log an environment operation for audit trail
   */
  static async logEnvironmentOperation(
    tenantId: string,
    environment: StripeEnvironment,
    operation: string,
    operationData: Record<string, any>,
    userId?: string,
    entityType?: string,
    entityId?: string
  ): Promise<EnvironmentSyncLog> {
    const supabase = await createSupabaseAdminClient(tenantId);
    
    const logData: Partial<EnvironmentSyncLog> = {
      tenant_id: tenantId,
      environment,
      operation,
      entity_type: entityType,
      entity_id: entityId,
      operation_data: operationData,
      status: 'started',
      started_by: userId,
    };
    
    const { data, error } = await supabase
      .from('environment_sync_logs')
      .insert(logData)
      .select()
      .single();
    
    if (error) {
      console.error('Error logging environment operation:', error);
      throw new Error('Failed to log operation');
    }
    
    return data;
  }
}
