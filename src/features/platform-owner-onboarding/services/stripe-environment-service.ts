'use server';

import Stripe from 'stripe';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';

import type { EnvironmentSyncLog, ProductEnvironmentDeployment, StripeEnvironment, StripeEnvironmentConfig } from '../types';

/**
 * Get Stripe environment configuration for a tenant
 */
export async function getEnvironmentConfig(tenantId: string, environment: StripeEnvironment): Promise<StripeEnvironmentConfig | null> {
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
export async function upsertEnvironmentConfig(
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
export async function getActiveEnvironment(tenantId: string): Promise<StripeEnvironment> {
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
export async function switchEnvironment(tenantId: string, environment: StripeEnvironment, userId: string): Promise<void> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  // Log the environment switch
  await logEnvironmentOperation(tenantId, environment, 'environment_switch', {
    previous_environment: await getActiveEnvironment(tenantId),
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
export async function createStripeClient(tenantId: string, environment?: StripeEnvironment): Promise<Stripe> {
  const activeEnvironment = environment || await getActiveEnvironment(tenantId);
  const config = await getEnvironmentConfig(tenantId, activeEnvironment);
  
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
 * Deploy a product from test to production environment
 */
export async function deployProductToProduction(
  tenantId: string,
  productId: string,
  userId: string
): Promise<ProductEnvironmentDeployment> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  // Get the product from test environment
  const { data: product, error: productError } = await supabase
    .from('creator_products')
    .select('*')
    .eq('id', productId)
    .eq('environment', 'test')
    .single();
  
  if (productError || !product) {
    throw new Error('Product not found in test environment');
  }
  
  // Create deployment record
  const deploymentData: Partial<ProductEnvironmentDeployment> = {
    tenant_id: tenantId,
    product_id: productId,
    source_environment: 'test',
    target_environment: 'production',
    source_stripe_product_id: product.stripe_test_product_id,
    source_stripe_price_id: product.stripe_test_price_id,
    deployment_status: 'pending',
    deployed_by: userId,
    deployment_data: {
      product_name: product.name,
      price: product.price,
      currency: product.currency,
    },
  };
  
  const { data: deployment, error: deploymentError } = await supabase
    .from('product_environment_deployments')
    .insert(deploymentData)
    .select()
    .single();
  
  if (deploymentError) {
    throw new Error('Failed to create deployment record');
  }
  
  try {
    // Update deployment status to deploying
    await supabase
      .from('product_environment_deployments')
      .update({ deployment_status: 'deploying' })
      .eq('id', deployment.id);
    
    // Create Stripe clients for both environments
    const testStripe = await createStripeClient(tenantId, 'test');
    const prodStripe = await createStripeClient(tenantId, 'production');
    
    // Create product in production environment
    const prodProduct = await prodStripe.products.create({
      name: product.name,
      description: product.description || undefined,
      metadata: {
        tenant_id: tenantId,
        source_product_id: productId,
        deployed_from: 'test',
      },
    });
    
    // Create price in production environment
    const prodPrice = await prodStripe.prices.create({
      product: prodProduct.id,
      unit_amount: Math.round(product.price * 100),
      currency: product.currency,
      metadata: {
        tenant_id: tenantId,
        source_price_id: product.stripe_test_price_id || '',
      },
    });
    
    // Update the deployment record with production IDs
    await supabase
      .from('product_environment_deployments')
      .update({
        target_stripe_product_id: prodProduct.id,
        target_stripe_price_id: prodPrice.id,
        deployment_status: 'completed',
        deployed_at: new Date().toISOString(),
      })
      .eq('id', deployment.id);
    
    // Update the product with production IDs
    await supabase
      .from('creator_products')
      .update({
        stripe_production_product_id: prodProduct.id,
        stripe_production_price_id: prodPrice.id,
        last_deployed_to_production: new Date().toISOString(),
      })
      .eq('id', productId);
    
    // Log successful deployment
    await logEnvironmentOperation(tenantId, 'production', 'deployment', {
      product_id: productId,
      stripe_product_id: prodProduct.id,
      deployment_id: deployment.id,
    }, userId);
    
    return { ...deployment, deployment_status: 'completed' } as ProductEnvironmentDeployment;
    
  } catch (error) {
    console.error('Error deploying product:', error);
    
    // Update deployment status to failed
    await supabase
      .from('product_environment_deployments')
      .update({
        deployment_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', deployment.id);
    
    throw new Error('Failed to deploy product to production');
  }
}

/**
 * Log an environment operation for audit trail
 */
export async function logEnvironmentOperation(
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

/**
 * Get deployment history for a product
 */
export async function getProductDeploymentHistory(
  tenantId: string,
  productId: string
): Promise<ProductEnvironmentDeployment[]> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  const { data, error } = await supabase
    .from('product_environment_deployments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching deployment history:', error);
    throw new Error('Failed to fetch deployment history');
  }
  
  return data || [];
}

/**
 * Get environment sync logs for audit trail
 */
export async function getEnvironmentLogs(
  tenantId: string,
  environment?: StripeEnvironment,
  limit: number = 50
): Promise<EnvironmentSyncLog[]> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  let query = supabase
    .from('environment_sync_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (environment) {
    query = query.eq('environment', environment);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching environment logs:', error);
    throw new Error('Failed to fetch environment logs');
  }
  
  return data || [];
}
