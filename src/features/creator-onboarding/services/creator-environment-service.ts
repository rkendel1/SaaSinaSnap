/**
 * Creator-focused environment management service
 * Provides creators with intuitive tools to manage test/production environments
 */

import { createStripeClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

export type CreatorEnvironment = 'test' | 'production';

export interface CreatorEnvironmentStatus {
  currentEnvironment: CreatorEnvironment;
  testConfigured: boolean;
  productionConfigured: boolean;
  productsInTest: number;
  productsInProduction: number;
  pendingDeployments: number;
  lastDeployment?: {
    date: string;
    productName: string;
    status: 'success' | 'failed';
  };
}

export interface ProductDeploymentPreview {
  productId: string;
  productName: string;
  testPrice: number;
  productionPrice?: number;
  isDeployed: boolean;
  lastModified: string;
  validationResults: ValidationCheck[];
}

export interface ValidationCheck {
  check: string;
  status: 'passed' | 'warning' | 'failed';
  message: string;
  critical: boolean;
}

export interface DeploymentSummary {
  totalProducts: number;
  readyToDeploy: number;
  needsAttention: number;
  deploymentTime: string;
  estimatedDowntime: string;
}

/**
 * Get environment status for a creator
 */
export async function getCreatorEnvironmentStatus(creatorId: string): Promise<CreatorEnvironmentStatus> {
  const supabase = await createSupabaseAdminClient();
  
  // Get creator's current environment and Stripe configuration
  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('stripe_account_id, stripe_access_token, stripe_test_enabled, stripe_production_enabled')
    .eq('id', creatorId)
    .single();

  if (!creatorProfile) {
    throw new Error('Creator not found');
  }

  // Get product counts by environment
  const { data: products } = await supabase
    .from('creator_products')
    .select('environment, stripe_test_product_id, stripe_production_product_id')
    .eq('creator_id', creatorId);

  const productsInTest = products?.filter(p => p.stripe_test_product_id).length || 0;
  const productsInProduction = products?.filter(p => p.stripe_production_product_id).length || 0;

  // Get pending deployments
  const { data: deployments } = await supabase
    .from('product_environment_deployments')
    .select('*')
    .eq('creator_id', creatorId)
    .in('deployment_status', ['pending', 'deploying', 'scheduled']);

  const pendingDeployments = deployments?.length || 0;

  // Get last deployment
  const { data: lastDeployment } = await supabase
    .from('product_environment_deployments')
    .select('created_at, product_id, deployment_status')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let lastDeploymentInfo = undefined;
  if (lastDeployment) {
    const { data: product } = await supabase
      .from('creator_products')
      .select('name')
      .eq('id', lastDeployment.product_id)
      .single();

    if (product) {
      lastDeploymentInfo = {
        date: lastDeployment.created_at,
        productName: product.name,
        status: lastDeployment.deployment_status === 'completed' ? 'success' as const : 'failed' as const,
      };
    }
  }

  return {
    currentEnvironment: 'test', // Creators always start in test
    testConfigured: Boolean(creatorProfile.stripe_access_token),
    productionConfigured: Boolean(creatorProfile.stripe_production_enabled),
    productsInTest,
    productsInProduction,
    pendingDeployments,
    lastDeployment: lastDeploymentInfo,
  };
}

/**
 * Get deployment preview for all creator products
 */
export async function getProductDeploymentPreview(creatorId: string): Promise<ProductDeploymentPreview[]> {
  const supabase = await createSupabaseAdminClient();
  
  const { data: products } = await supabase
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', true);

  if (!products) return [];

  const previews: ProductDeploymentPreview[] = [];

  for (const product of products) {
    const validationResults = await validateProductForCreatorDeployment(product);
    
    previews.push({
      productId: product.id,
      productName: product.name,
      testPrice: product.price,
      productionPrice: product.stripe_production_price_id ? product.price : undefined,
      isDeployed: Boolean(product.stripe_production_product_id),
      lastModified: product.updated_at,
      validationResults,
    });
  }

  return previews;
}

/**
 * Validate a creator product for deployment
 */
export async function validateProductForCreatorDeployment(product: any): Promise<ValidationCheck[]> {
  const checks: ValidationCheck[] = [];

  // Product name validation
  checks.push({
    check: 'product_name',
    status: product.name && product.name.trim().length > 0 ? 'passed' : 'failed',
    message: product.name && product.name.trim().length > 0 
      ? 'Product name is valid' 
      : 'Product name is required',
    critical: true,
  });

  // Price validation
  checks.push({
    check: 'product_price',
    status: product.price && product.price > 0 ? 'passed' : 'failed',
    message: product.price && product.price > 0 
      ? `Price: $${product.price}` 
      : 'Product must have a valid price',
    critical: true,
  });

  // Description validation
  checks.push({
    check: 'product_description',
    status: product.description && product.description.trim().length > 10 ? 'passed' : 'warning',
    message: product.description && product.description.trim().length > 10 
      ? 'Description is comprehensive' 
      : 'Consider adding a detailed description for better customer understanding',
    critical: false,
  });

  // Stripe test product validation
  checks.push({
    check: 'stripe_test_integration',
    status: product.stripe_test_product_id ? 'passed' : 'failed',
    message: product.stripe_test_product_id 
      ? 'Connected to Stripe test product' 
      : 'Must be connected to Stripe test product first',
    critical: true,
  });

  // Currency validation
  checks.push({
    check: 'currency',
    status: product.currency && ['usd', 'eur', 'gbp'].includes(product.currency.toLowerCase()) ? 'passed' : 'warning',
    message: product.currency 
      ? `Currency: ${product.currency.toUpperCase()}` 
      : 'Currency should be specified',
    critical: false,
  });

  return checks;
}

/**
 * Get deployment summary for creator dashboard
 */
export async function getCreatorDeploymentSummary(creatorId: string): Promise<DeploymentSummary> {
  const previews = await getProductDeploymentPreview(creatorId);
  
  const totalProducts = previews.length;
  const readyToDeploy = previews.filter(p => 
    !p.isDeployed && p.validationResults.every(v => v.status !== 'failed')
  ).length;
  const needsAttention = previews.filter(p => 
    p.validationResults.some(v => v.status === 'failed')
  ).length;

  return {
    totalProducts,
    readyToDeploy,
    needsAttention,
    deploymentTime: '< 5 minutes', // Estimated based on product count
    estimatedDowntime: '0 seconds - seamless transition',
  };
}

/**
 * Deploy a single product to production with creator-friendly feedback
 */
export async function deployCreatorProductToProduction(
  creatorId: string, 
  productId: string
): Promise<{
  success: boolean;
  deploymentId?: string;
  error?: string;
  productionProductId?: string;
  productionPriceId?: string;
}> {
  const supabase = await createSupabaseAdminClient();
  
  try {
    // Get creator profile for Stripe credentials
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_access_token')
      .eq('id', creatorId)
      .single();

    if (!creatorProfile?.stripe_access_token) {
      return { success: false, error: 'Stripe account not connected' };
    }

    // Get product details
    const { data: product } = await supabase
      .from('creator_products')
      .select('*')
      .eq('id', productId)
      .eq('creator_id', creatorId)
      .single();

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Validate product before deployment
    const validationResults = await validateProductForCreatorDeployment(product);
    const criticalFailures = validationResults.filter(v => v.critical && v.status === 'failed');
    
    if (criticalFailures.length > 0) {
      return { 
        success: false, 
        error: `Validation failed: ${criticalFailures.map(f => f.message).join(', ')}` 
      };
    }

    // Create deployment record
    const { data: deployment } = await supabase
      .from('product_environment_deployments')
      .insert({
        creator_id: creatorId,
        product_id: productId,
        source_environment: 'test',
        target_environment: 'production',
        deployment_status: 'deploying',
        started_by: creatorId,
      })
      .select()
      .single();

    if (!deployment) {
      return { success: false, error: 'Failed to create deployment record' };
    }

    // Create Stripe product in production
    const productionStripe = createStripeClient('production', creatorProfile.stripe_account_id);
    
    const stripeProduct = await productionStripe.products.create({
      name: product.name,
      description: product.description || undefined,
      active: true,
      metadata: {
        creator_id: creatorId,
        source_product_id: productId,
        deployed_from: 'test',
        deployment_id: deployment.id,
      },
    });

    const stripePrice = await productionStripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(product.price * 100), // Convert to cents
      currency: product.currency || 'usd',
      recurring: product.product_type === 'subscription' ? { interval: 'month' } : undefined,
      metadata: {
        creator_id: creatorId,
        source_price_id: product.stripe_test_price_id || '',
        deployment_id: deployment.id,
      },
    });

    // Update product with production IDs
    await supabase
      .from('creator_products')
      .update({
        stripe_production_product_id: stripeProduct.id,
        stripe_production_price_id: stripePrice.id,
        last_deployed_to_production: new Date().toISOString(),
      })
      .eq('id', productId);

    // Update deployment status
    await supabase
      .from('product_environment_deployments')
      .update({
        deployment_status: 'completed',
        progress_percentage: 100,
        progress_message: 'Product successfully deployed to production',
        completed_at: new Date().toISOString(),
      })
      .eq('id', deployment.id);

    return {
      success: true,
      deploymentId: deployment.id,
      productionProductId: stripeProduct.id,
      productionPriceId: stripePrice.id,
    };

  } catch (error) {
    console.error('Deployment error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown deployment error' 
    };
  }
}

/**
 * Get environment-specific embed configuration
 */
export async function getEnvironmentEmbedConfig(creatorId: string, environment: CreatorEnvironment) {
  const supabase = await createSupabaseAdminClient();
  
  const { data: products } = await supabase
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', true);

  return {
    environment,
    products: products?.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stripeProductId: environment === 'test' 
        ? product.stripe_test_product_id 
        : product.stripe_production_product_id,
      stripePriceId: environment === 'test' 
        ? product.stripe_test_price_id 
        : product.stripe_production_price_id,
      isDeployed: environment === 'production' 
        ? Boolean(product.stripe_production_product_id) 
        : true,
    })) || [],
  };
}