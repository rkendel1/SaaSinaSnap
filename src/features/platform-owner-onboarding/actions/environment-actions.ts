'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { cancelScheduledDeployment, deployProductToProduction, getActiveEnvironment, getDeploymentStatus,getEnvironmentConfig, getProductDeploymentHistory, getScheduledDeployments, scheduleProductDeployment, switchEnvironment, validateProductForDeployment } from '../services/stripe-environment-service';
import type { ProductEnvironmentDeployment, StripeEnvironment, StripeEnvironmentConfig, ValidationResult } from '../types';

/**
 * Switch the active Stripe environment
 */
export async function switchStripeEnvironmentAction(environment: StripeEnvironment): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  await switchEnvironment(environment, user.id);
  
  // Revalidate paths that depend on environment settings
  revalidatePath('/platform-owner');
  revalidatePath('/platform-owner-onboarding');
  revalidatePath('/creator');
}

/**
 * Get the current active Stripe environment
 */
export async function getCurrentEnvironmentAction(): Promise<StripeEnvironment> {
  return await getActiveEnvironment();
}

/**
 * Get environment configuration for a specific environment
 */
export async function getEnvironmentConfigAction(environment: StripeEnvironment): Promise<StripeEnvironmentConfig | null> {
  return await getEnvironmentConfig(environment);
}

/**
 * Deploy a product from test to production environment
 */
export async function deployProductToProductionAction(productId: string): Promise<ProductEnvironmentDeployment> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const deployment = await deployProductToProduction( 
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
  return await getProductDeploymentHistory(productId);
}

/**
 * Validate a product before deployment
 */
export async function validateProductForDeploymentAction(productId: string): Promise<ValidationResult[]> {
  return await validateProductForDeployment(productId);
}

/**
 * Schedule a product deployment
 */
export async function scheduleProductDeploymentAction(
  productId: string,
  scheduledFor: string,
  timezone: string,
  notificationSettings?: {
    email_notifications?: boolean;
    webhook_notifications?: boolean;
    reminder_before_minutes?: number;
  }
): Promise<ProductEnvironmentDeployment> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const deployment = await scheduleProductDeployment(
    productId,
    scheduledFor,
    timezone,
    user.id,
    notificationSettings
  );

  revalidatePath('/platform-owner/products');
  revalidatePath('/creator/products');
  
  return deployment;
}

/**
 * Get scheduled deployments
 */
export async function getScheduledDeploymentsAction(): Promise<ProductEnvironmentDeployment[]> {
  return await getScheduledDeployments();
}

/**
 * Cancel a scheduled deployment
 */
export async function cancelScheduledDeploymentAction(deploymentId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  await cancelScheduledDeployment(deploymentId, user.id);

  revalidatePath('/platform-owner/products');
  revalidatePath('/creator/products');
}

/**
 * Get deployment status with progress
 */
export async function getDeploymentStatusAction(deploymentId: string): Promise<ProductEnvironmentDeployment | null> {
  return await getDeploymentStatus(deploymentId);
}
export async function bulkDeployProductsAction(productIds: string[]): Promise<ProductEnvironmentDeployment[]> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const deployments: ProductEnvironmentDeployment[] = [];

  // Deploy products sequentially to avoid overwhelming Stripe API
  for (const productId of productIds) {
    try {
      const deployment = await deployProductToProduction(
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