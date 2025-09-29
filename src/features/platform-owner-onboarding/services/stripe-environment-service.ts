'use server';

import Stripe from 'stripe';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';

import type { DeploymentSchedule,EnvironmentSyncLog, ProductEnvironmentDeployment, StripeEnvironment, StripeEnvironmentConfig, ValidationResult } from '../types';

/**
 * Get Stripe environment configuration for the current creator
 */
export async function getEnvironmentConfig(environment: StripeEnvironment): Promise<StripeEnvironmentConfig | null> {
  const supabase = await createSupabaseAdminClient();
  
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('creator_profiles')
    .select(`
      id,
      stripe_test_account_id,
      stripe_test_access_token,
      stripe_test_refresh_token,
      stripe_test_enabled,
      stripe_production_account_id,
      stripe_production_access_token,
      stripe_production_refresh_token,
      stripe_production_enabled
    `)
    .eq('id', user.id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching environment config:', error);
    throw new Error('Failed to fetch environment configuration');
  }
  
  if (!data) {
    return null;
  }
  
  // Transform creator profile data to StripeEnvironmentConfig format
  if (environment === 'test') {
    return {
      id: `${data.id}-test`,
      tenant_id: data.id, // Use creator ID as tenant for compatibility
      environment: 'test',
      stripe_account_id: data.stripe_test_account_id,
      stripe_access_token: data.stripe_test_access_token,
      stripe_refresh_token: data.stripe_test_refresh_token,
      is_active: data.stripe_test_enabled || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } else {
    return {
      id: `${data.id}-production`,
      tenant_id: data.id, // Use creator ID as tenant for compatibility
      environment: 'production',
      stripe_account_id: data.stripe_production_account_id,
      stripe_access_token: data.stripe_production_access_token,
      stripe_refresh_token: data.stripe_production_refresh_token,
      is_active: data.stripe_production_enabled || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Create or update Stripe environment configuration for the current creator
 */
export async function upsertEnvironmentConfig(
  environment: StripeEnvironment,
  config: Partial<StripeEnvironmentConfig>
): Promise<StripeEnvironmentConfig> {
  const supabase = await createSupabaseAdminClient();
  
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Map the config to creator_profiles columns
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };
  
  if (environment === 'test') {
    if (config.stripe_account_id !== undefined) updateData.stripe_test_account_id = config.stripe_account_id;
    if (config.stripe_access_token !== undefined) updateData.stripe_test_access_token = config.stripe_access_token;
    if (config.stripe_refresh_token !== undefined) updateData.stripe_test_refresh_token = config.stripe_refresh_token;
    if (config.is_active !== undefined) updateData.stripe_test_enabled = config.is_active;
  } else {
    if (config.stripe_account_id !== undefined) updateData.stripe_production_account_id = config.stripe_account_id;
    if (config.stripe_access_token !== undefined) updateData.stripe_production_access_token = config.stripe_access_token;
    if (config.stripe_refresh_token !== undefined) updateData.stripe_production_refresh_token = config.stripe_refresh_token;
    if (config.is_active !== undefined) updateData.stripe_production_enabled = config.is_active;
  }
  
  const { data, error } = await supabase
    .from('creator_profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error upserting environment config:', error);
    throw new Error('Failed to save environment configuration');
  }
  
  // Return the config in the expected format
  return {
    id: `${user.id}-${environment}`,
    tenant_id: user.id,
    environment,
    stripe_account_id: environment === 'test' ? data.stripe_test_account_id : data.stripe_production_account_id,
    stripe_access_token: environment === 'test' ? data.stripe_test_access_token : data.stripe_production_access_token,
    stripe_refresh_token: environment === 'test' ? data.stripe_test_refresh_token : data.stripe_production_refresh_token,
    is_active: environment === 'test' ? data.stripe_test_enabled : data.stripe_production_enabled,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Get the active Stripe environment for the current creator
 */
export async function getActiveEnvironment(): Promise<StripeEnvironment> {
  const supabase = await createSupabaseAdminClient();
  
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return 'test'; // Default to test environment if not authenticated
  }
  
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('current_stripe_environment')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching active environment:', error);
    return 'test'; // Default to test environment
  }
  
  return (data?.current_stripe_environment as StripeEnvironment) || 'test';
}

/**
 * Switch the active Stripe environment for the current creator
 */
export async function switchEnvironment(environment: StripeEnvironment, userId: string): Promise<void> {
  const supabase = await createSupabaseAdminClient();
  
  // Log the environment switch (simplified logging without tenant context)
  console.log(`Switching environment to ${environment} for user ${userId}`);
  
  const { error } = await supabase
    .from('creator_profiles')
    .update({ 
      current_stripe_environment: environment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  if (error) {
    console.error('Error switching environment:', error);
    throw new Error('Failed to switch environment');
  }
}

/**
 * Create a Stripe client for the current creator and environment
 */
export async function createStripeClient(environment?: StripeEnvironment): Promise<Stripe> {
  const activeEnvironment = environment || await getActiveEnvironment();
  const config = await getEnvironmentConfig(activeEnvironment);
  
  let secretKey: string;
  
  if (config?.stripe_access_token) {
    // Use creator-specific credentials if available
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
  productId: string
): Promise<ValidationResult[]> {
  const supabase = await createSupabaseAdminClient();
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
        const testStripe = await createStripeClient('test');
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
    const prodConfig = await getEnvironmentConfig('production');
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
  deploymentId: string,
  progress: number,
  message: string,
  status?: string
): Promise<void> {
  const supabase = await createSupabaseAdminClient();
  
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
  const supabase = await createSupabaseAdminClient();

  // Validate the product first
  const validationResults = await validateProductForDeployment(productId);
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
    tenant_id: userId, // Use userId as tenant_id for compatibility
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
  console.log(`Scheduled deployment ${deployment.id} for product ${productId} at ${scheduledFor}`);

  return deployment;
}
/**
 * Deploy a product from test to production environment with enhanced progress tracking
 */
export async function deployProductToProduction(
  productId: string,
  userId: string,
  scheduledDeploymentId?: string
): Promise<ProductEnvironmentDeployment> {
  const supabase = await createSupabaseAdminClient();
  
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
    await updateDeploymentProgress('', 0, 'Validating product for deployment...', 'validating');
    
    const validationResults = await validateProductForDeployment(productId);
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
      tenant_id: userId, // Use userId as tenant_id for compatibility
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
    await updateDeploymentProgress(deployment.id, 20, 'Creating Stripe clients...', 'deploying');

    // Create Stripe clients for both environments
    const testStripe = await createStripeClient('test');
    const prodStripe = await createStripeClient('production');

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

    await updateDeploymentProgress(deployment.id, 40, 'Creating product in production environment...');

    // Create product in production environment
    const prodProduct = await prodStripe.products.create({
      name: product.name,
      description: product.description || undefined,
      active: true,
      metadata: {
        creator_id: userId,
        source_product_id: productId,
        deployed_from: 'test',
        deployment_id: deployment.id,
        deployed_at: new Date().toISOString(),
      },
    });

    await updateDeploymentProgress(deployment.id, 60, 'Creating price in production environment...');

    // Create price in production environment
    const prodPrice = await prodStripe.prices.create({
      product: prodProduct.id,
      unit_amount: Math.round(product.price * 100),
      currency: product.currency,
      metadata: {
        creator_id: userId,
        source_price_id: product.stripe_test_price_id || '',
        deployment_id: deployment.id,
      },
    });

    await updateDeploymentProgress(deployment.id, 80, 'Updating deployment records...');

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

    await updateDeploymentProgress(deployment.id, 100, 'Deployment completed successfully!', 'completed');

    // Log successful deployment
    console.log(`Successfully deployed product ${productId} to production. Stripe product: ${prodProduct.id}, price: ${prodPrice.id}`);

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
    console.log(`Failed to deploy product ${productId}: ${errorMessage}`);

    throw new Error(`Failed to deploy product to production: ${errorMessage}`);
  }
}

/**
 * Get scheduled deployments for the current creator
 */
export async function getScheduledDeployments(
  limit: number = 50
): Promise<ProductEnvironmentDeployment[]> {
  const supabase = await createSupabaseAdminClient();
  
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('product_environment_deployments')
    .select('*')
    .eq('tenant_id', user.id) // Use user.id since we now use creator ID as tenant_id
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
  deploymentId: string,
  userId: string
): Promise<void> {
  const supabase = await createSupabaseAdminClient();
  
  const { error } = await supabase
    .from('product_environment_deployments')
    .update({
      deployment_status: 'cancelled',
      progress_message: 'Deployment cancelled by user',
      updated_at: new Date().toISOString(),
    })
    .eq('id', deploymentId)
    .eq('tenant_id', userId) // Use userId since we now use creator ID as tenant_id
    .eq('deployment_status', 'scheduled');
  
  if (error) {
    console.error('Error cancelling scheduled deployment:', error);
    throw new Error('Failed to cancel scheduled deployment');
  }

  // Log the cancellation
  console.log(`Cancelled scheduled deployment ${deploymentId} by user ${userId}`);
}

/**
 * Get deployment status with real-time progress
 */
export async function getDeploymentStatus(
  deploymentId: string
): Promise<ProductEnvironmentDeployment | null> {
  const supabase = await createSupabaseAdminClient();
  
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('product_environment_deployments')
    .select('*')
    .eq('id', deploymentId)
    .eq('tenant_id', user.id) // Use user.id since we now use creator ID as tenant_id
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching deployment status:', error);
    throw new Error('Failed to fetch deployment status');
  }
  
  return data;
}

/**
 * Get deployment history for a product
 */
export async function getProductDeploymentHistory(
  productId: string
): Promise<ProductEnvironmentDeployment[]> {
  const supabase = await createSupabaseAdminClient();
  
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('product_environment_deployments')
    .select('*')
    .eq('tenant_id', user.id) // Use user.id since we now use creator ID as tenant_id
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching deployment history:', error);
    throw new Error('Failed to fetch deployment history');
  }
  
  return data || [];
}
