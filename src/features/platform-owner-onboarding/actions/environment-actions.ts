'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getTenantContext } from '@/libs/api-utils/tenant-context';

import { StripeEnvironmentService } from '../services/stripe-environment-service';
import type { ProductEnvironmentDeployment, StripeEnvironment, StripeEnvironmentConfig } from '../types';

/**
 * Switch the active Stripe environment for the current tenant
 */
export async function switchStripeEnvironmentAction(environment: StripeEnvironment): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const tenantContext = await getTenantContext();
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context not found');
  }

  await StripeEnvironmentService.switchEnvironment(tenantContext.tenantId, environment, user.id);
  
  // Revalidate paths that depend on environment settings
  revalidatePath('/platform-owner');
  revalidatePath('/platform-owner-onboarding');
  revalidatePath('/creator');
}

/**
 * Get the current active Stripe environment
 */
export async function getCurrentEnvironmentAction(): Promise<StripeEnvironment> {
  const tenantContext = await getTenantContext();
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context not found');
  }

  return await StripeEnvironmentService.getActiveEnvironment(tenantContext.tenantId);
}

/**
 * Get environment configuration for a specific environment
 */
export async function getEnvironmentConfigAction(environment: StripeEnvironment): Promise<StripeEnvironmentConfig | null> {
  const tenantContext = await getTenantContext();
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context not found');
  }

  return await StripeEnvironmentService.getEnvironmentConfig(tenantContext.tenantId, environment);
}

/**
 * Deploy a product from test to production environment
 */
export async function deployProductToProductionAction(productId: string): Promise<ProductEnvironmentDeployment> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const tenantContext = await getTenantContext();
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context not found');
  }

  const deployment = await StripeEnvironmentService.deployProductToProduction(
    tenantContext.tenantId, 
    productId, 
    user.id
  );

  // Revalidate product-related paths
  revalidatePath('/platform-owner/products');
  revalidatePath('/creator/products');
  
  return deployment;
}

/**
 * Get deployment history for a product
 */
export async function getProductDeploymentHistoryAction(productId: string): Promise<ProductEnvironmentDeployment[]> {
  const tenantContext = await getTenantContext();
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context not found');
  }

  return await StripeEnvironmentService.getProductDeploymentHistory(tenantContext.tenantId, productId);
}

/**
 * Bulk deploy multiple products to production
 */
export async function bulkDeployProductsAction(productIds: string[]): Promise<ProductEnvironmentDeployment[]> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const tenantContext = await getTenantContext();
  if (!tenantContext?.tenantId) {
    throw new Error('Tenant context not found');
  }

  const deployments: ProductEnvironmentDeployment[] = [];

  // Deploy products sequentially to avoid overwhelming Stripe API
  for (const productId of productIds) {
    try {
      const deployment = await StripeEnvironmentService.deployProductToProduction(
        tenantContext.tenantId,
        productId,
        user.id
      );
      deployments.push(deployment);
    } catch (error) {
      console.error(`Failed to deploy product ${productId}:`, error);
      // Continue with other products even if one fails
    }
  }

  // Revalidate product-related paths
  revalidatePath('/platform-owner/products');
  revalidatePath('/creator/products');

  return deployments;
}