'use server';

import Stripe from 'stripe';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';

import type { EnvironmentSyncLog, ProductEnvironmentDeployment, StripeEnvironment, StripeEnvironmentConfig, ValidationResult, DeploymentSchedule } from '../types';

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
 * Validate a product before deployment
 */
export async function validateProductForDeployment(
  tenantId: string,
  productId: string
): Promise<ValidationResult[]> {
  const supabase = await createSupabaseAdminClient(tenantId);
  const results: ValidationResult[] = [];

  try {
    // Get the product from test environment
    const { data: product, error: productError } = await supabase
      .from('creator_products')
      .select('*')
      .eq('id', productId)
      .eq('environment', 'test')
      .single();

    if (productError || !product) {
      results.push({
        check: 'product_exists',
        status: 'failed',
        message: 'Product not found in test environment',
        details: { error: productError?.message }
      });
      return results;
    }

    // Validate product data
    if (!product.name || product.name.trim().length === 0) {
      results.push({
        check: 'product_name',
        status: 'failed',
        message: 'Product name is required'
      });
    } else {
      results.push({
        check: 'product_name',
        status: 'passed',
        message: 'Product name is valid'
      });
    }

    if (!product.price || product.price <= 0) {
      results.push({
        check: 'product_price',
        status: 'failed',
        message: 'Product price must be greater than 0'
      });
    } else {
      results.push({
        check: 'product_price',
        status: 'passed',
        message: 'Product price is valid'
      });
    }

    // Check Stripe integration
    if (!product.stripe_test_product_id) {
      results.push({
        check: 'stripe_integration',
        status: 'failed',
        message: 'Product is not connected to Stripe test environment'
      });
    } else {
      // Verify the product exists in Stripe
      try {
        const testStripe = await createStripeClient(tenantId, 'test');
        await testStripe.products.retrieve(product.stripe_test_product_id);
        results.push({
          check: 'stripe_integration',
          status: 'passed',
          message: 'Stripe integration is valid'
        });
      } catch (error) {
        results.push({
          check: 'stripe_integration',
          status: 'failed',
          message: 'Failed to verify Stripe product',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    // Check production environment configuration
    const prodConfig = await getEnvironmentConfig(tenantId, 'production');
    if (!prodConfig || !prodConfig.is_active) {
      results.push({
        check: 'production_config',
        status: 'failed',
        message: 'Production environment is not configured or active'
      });
    } else {
      results.push({
        check: 'production_config',
        status: 'passed',
        message: 'Production environment is properly configured'
      });
    }

    // Check for existing deployments in progress
    const { data: activeDeployments } = await supabase
      .from('product_environment_deployments')
      .select('*')
      .eq('product_id', productId)
      .in('deployment_status', ['pending', 'scheduled', 'deploying', 'validating']);

    if (activeDeployments && activeDeployments.length > 0) {
      results.push({
        check: 'concurrent_deployment',
        status: 'warning',
        message: 'There is already an active deployment for this product'
      });
    } else {
      results.push({
        check: 'concurrent_deployment',
        status: 'passed',
        message: 'No concurrent deployments found'
      });
    }

    return results;
  } catch (error) {
    console.error('Error validating product for deployment:', error);
    results.push({
      check: 'validation_error',
      status: 'failed',
      message: 'Failed to complete validation',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return results;
  }
}

/**
 * Update deployment progress
 */
export async function updateDeploymentProgress(
  tenantId: string,
  deploymentId: string,
  progress: number,
  message: string,
  status?: string
): Promise<void> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  const updates: any = {
    progress_percentage: Math.min(100, Math.max(0, progress)),
    progress_message: message,
    updated_at: new Date().toISOString(),
  };

  if (status) {
    updates.deployment_status = status;
  }

  const { error } = await supabase
    .from('product_environment_deployments')
    .update(updates)
    .eq('id', deploymentId);

  if (error) {
    console.error('Error updating deployment progress:', error);
  }
}

/**
 * Schedule a product deployment
 */
export async function scheduleProductDeployment(
  tenantId: string,
  productId: string,
  scheduledFor: string,
  timezone: string,
  userId: string,
  notificationSettings?: {
    email_notifications?: boolean;
    webhook_notifications?: boolean;
    reminder_before_minutes?: number;
  }
): Promise<ProductEnvironmentDeployment> {
  const supabase = await createSupabaseAdminClient(tenantId);

  // Validate the product first
  const validationResults = await validateProductForDeployment(tenantId, productId);
  const hasErrors = validationResults.some(result => result.status === 'failed');

  if (hasErrors) {
    throw new Error('Product validation failed. Please resolve all issues before scheduling deployment.');
  }

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

  // Create deployment record with scheduled status
  const deploymentData: Partial<ProductEnvironmentDeployment> = {
    tenant_id: tenantId,
    product_id: productId,
    source_environment: 'test',
    target_environment: 'production',
    source_stripe_product_id: product.stripe_test_product_id,
    source_stripe_price_id: product.stripe_test_price_id,
    deployment_status: 'scheduled',
    deployed_by: userId,
    scheduled_for: scheduledFor,
    validation_results: validationResults,
    progress_percentage: 0,
    progress_message: 'Deployment scheduled',
    deployment_data: {
      product_name: product.name,
      price: product.price,
      currency: product.currency,
      timezone,
      notification_settings: {
        email_notifications: notificationSettings?.email_notifications ?? true,
        webhook_notifications: notificationSettings?.webhook_notifications ?? false,
        reminder_before_minutes: notificationSettings?.reminder_before_minutes ?? 30,
      },
    },
  };

  const { data: deployment, error: deploymentError } = await supabase
    .from('product_environment_deployments')
    .insert(deploymentData)
    .select()
    .single();

  if (deploymentError) {
    throw new Error('Failed to schedule deployment');
  }

  // Log the scheduled deployment
  await logEnvironmentOperation(tenantId, 'production', 'deployment_scheduled', {
    product_id: productId,
    scheduled_for: scheduledFor,
    deployment_id: deployment.id,
  }, userId);

  return deployment;
}
/**
 * Deploy a product from test to production environment with enhanced progress tracking
 */
export async function deployProductToProduction(
  tenantId: string,
  productId: string,
  userId: string,
  scheduledDeploymentId?: string
): Promise<ProductEnvironmentDeployment> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  let deployment: ProductEnvironmentDeployment;

  // If this is a scheduled deployment, get the existing record
  if (scheduledDeploymentId) {
    const { data: existingDeployment, error: fetchError } = await supabase
      .from('product_environment_deployments')
      .select('*')
      .eq('id', scheduledDeploymentId)
      .single();

    if (fetchError || !existingDeployment) {
      throw new Error('Scheduled deployment not found');
    }

    deployment = existingDeployment;
  } else {
    // Validate the product first for immediate deployment
    await updateDeploymentProgress(tenantId, '', 0, 'Validating product for deployment...', 'validating');
    
    const validationResults = await validateProductForDeployment(tenantId, productId);
    const hasErrors = validationResults.some(result => result.status === 'failed');

    if (hasErrors) {
      const errorMessages = validationResults
        .filter(result => result.status === 'failed')
        .map(result => result.message)
        .join(', ');
      throw new Error(`Product validation failed: ${errorMessages}`);
    }

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

    // Create deployment record for immediate deployment
    const deploymentData: Partial<ProductEnvironmentDeployment> = {
      tenant_id: tenantId,
      product_id: productId,
      source_environment: 'test',
      target_environment: 'production',
      source_stripe_product_id: product.stripe_test_product_id,
      source_stripe_price_id: product.stripe_test_price_id,
      deployment_status: 'pending',
      deployed_by: userId,
      validation_results: validationResults,
      progress_percentage: 10,
      progress_message: 'Starting deployment process...',
      deployment_data: {
        product_name: product.name,
        price: product.price,
        currency: product.currency,
      },
    };

    const { data: newDeployment, error: deploymentError } = await supabase
      .from('product_environment_deployments')
      .insert(deploymentData)
      .select()
      .single();

    if (deploymentError) {
      throw new Error('Failed to create deployment record');
    }

    deployment = newDeployment;
  }

  try {
    // Update status to deploying
    await updateDeploymentProgress(tenantId, deployment.id, 20, 'Creating Stripe clients...', 'deploying');

    // Create Stripe clients for both environments
    const testStripe = await createStripeClient(tenantId, 'test');
    const prodStripe = await createStripeClient(tenantId, 'production');

    // Get product details from test environment
    const { data: product } = await supabase
      .from('creator_products')
      .select('*')
      .eq('id', productId)
      .eq('environment', 'test')
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    await updateDeploymentProgress(tenantId, deployment.id, 40, 'Creating product in production environment...');

    // Create product in production environment
    const prodProduct = await prodStripe.products.create({
      name: product.name,
      description: product.description || undefined,
      active: true,
      metadata: {
        tenant_id: tenantId,
        source_product_id: productId,
        deployed_from: 'test',
        deployment_id: deployment.id,
        deployed_at: new Date().toISOString(),
      },
    });

    await updateDeploymentProgress(tenantId, deployment.id, 60, 'Creating price in production environment...');

    // Create price in production environment
    const prodPrice = await prodStripe.prices.create({
      product: prodProduct.id,
      unit_amount: Math.round(product.price * 100),
      currency: product.currency,
      metadata: {
        tenant_id: tenantId,
        source_price_id: product.stripe_test_price_id || '',
        deployment_id: deployment.id,
      },
    });

    await updateDeploymentProgress(tenantId, deployment.id, 80, 'Updating deployment records...');

    // Update the deployment record with production IDs
    const { error: updateError } = await supabase
      .from('product_environment_deployments')
      .update({
        target_stripe_product_id: prodProduct.id,
        target_stripe_price_id: prodPrice.id,
        deployment_status: 'completed',
        deployed_at: new Date().toISOString(),
        progress_percentage: 90,
        progress_message: 'Finalizing deployment...',
        updated_at: new Date().toISOString(),
      })
      .eq('id', deployment.id);

    if (updateError) {
      throw new Error('Failed to update deployment record');
    }

    // Update the product with production IDs
    await supabase
      .from('creator_products')
      .update({
        stripe_production_product_id: prodProduct.id,
        stripe_production_price_id: prodPrice.id,
        last_deployed_to_production: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    await updateDeploymentProgress(tenantId, deployment.id, 100, 'Deployment completed successfully!', 'completed');

    // Log successful deployment
    await logEnvironmentOperation(tenantId, 'production', 'deployment_completed', {
      product_id: productId,
      stripe_product_id: prodProduct.id,
      stripe_price_id: prodPrice.id,
      deployment_id: deployment.id,
    }, userId);

    return { 
      ...deployment, 
      deployment_status: 'completed',
      target_stripe_product_id: prodProduct.id,
      target_stripe_price_id: prodPrice.id,
      deployed_at: new Date().toISOString(),
      progress_percentage: 100,
      progress_message: 'Deployment completed successfully!'
    } as ProductEnvironmentDeployment;

  } catch (error) {
    console.error('Error deploying product:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during deployment';
    
    // Update deployment status to failed
    await supabase
      .from('product_environment_deployments')
      .update({
        deployment_status: 'failed',
        error_message: errorMessage,
        progress_percentage: 0,
        progress_message: `Deployment failed: ${errorMessage}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deployment.id);

    // Log failed deployment
    await logEnvironmentOperation(tenantId, 'production', 'deployment_failed', {
      product_id: productId,
      deployment_id: deployment.id,
      error: errorMessage,
    }, userId);

    throw new Error(`Failed to deploy product to production: ${errorMessage}`);
  }
}

/**
 * Get scheduled deployments for a tenant
 */
export async function getScheduledDeployments(
  tenantId: string,
  limit: number = 50
): Promise<ProductEnvironmentDeployment[]> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  const { data, error } = await supabase
    .from('product_environment_deployments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('deployment_status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching scheduled deployments:', error);
    throw new Error('Failed to fetch scheduled deployments');
  }
  
  return data || [];
}

/**
 * Cancel a scheduled deployment
 */
export async function cancelScheduledDeployment(
  tenantId: string,
  deploymentId: string,
  userId: string
): Promise<void> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  const { error } = await supabase
    .from('product_environment_deployments')
    .update({
      deployment_status: 'cancelled',
      progress_message: 'Deployment cancelled by user',
      updated_at: new Date().toISOString(),
    })
    .eq('id', deploymentId)
    .eq('tenant_id', tenantId)
    .eq('deployment_status', 'scheduled');
  
  if (error) {
    console.error('Error cancelling scheduled deployment:', error);
    throw new Error('Failed to cancel scheduled deployment');
  }

  // Log the cancellation
  await logEnvironmentOperation(tenantId, 'production', 'deployment_cancelled', {
    deployment_id: deploymentId,
  }, userId);
}

/**
 * Get deployment status with real-time progress
 */
export async function getDeploymentStatus(
  tenantId: string,
  deploymentId: string
): Promise<ProductEnvironmentDeployment | null> {
  const supabase = await createSupabaseAdminClient(tenantId);
  
  const { data, error } = await supabase
    .from('product_environment_deployments')
    .select('*')
    .eq('id', deploymentId)
    .eq('tenant_id', tenantId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching deployment status:', error);
    throw new Error('Failed to fetch deployment status');
  }
  
  return data;
}
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
