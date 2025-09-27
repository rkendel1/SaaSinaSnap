'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { 
  getCreatorEnvironmentStatus, 
  getProductDeploymentPreview, 
  deployCreatorProductToProduction,
  getCreatorDeploymentSummary,
  type CreatorEnvironmentStatus,
  type ProductDeploymentPreview,
  type DeploymentSummary 
} from '../services/creator-environment-service';

/**
 * Get the current environment status for the authenticated creator
 */
export async function getCreatorEnvironmentStatusAction(): Promise<CreatorEnvironmentStatus> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return await getCreatorEnvironmentStatus(user.id);
}

/**
 * Get deployment preview for all creator products
 */
export async function getCreatorProductDeploymentPreviewAction(): Promise<ProductDeploymentPreview[]> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return await getProductDeploymentPreview(user.id);
}

/**
 * Get deployment summary for creator dashboard
 */
export async function getCreatorDeploymentSummaryAction(): Promise<DeploymentSummary> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return await getCreatorDeploymentSummary(user.id);
}

/**
 * Deploy a single product to production
 */
export async function deployCreatorProductToProductionAction(productId: string): Promise<{
  success: boolean;
  deploymentId?: string;
  error?: string;
  productionProductId?: string;
  productionPriceId?: string;
}> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const result = await deployCreatorProductToProduction(user.id, productId);

  // Revalidate relevant paths
  if (result.success) {
    revalidatePath('/creator/dashboard');
    revalidatePath('/creator/products');
    revalidatePath('/creator/onboarding');
  }

  return result;
}

/**
 * Deploy multiple products to production in batch
 */
export async function batchDeployCreatorProductsAction(productIds: string[]): Promise<{
  results: Array<{
    productId: string;
    success: boolean;
    deploymentId?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const results = [];
  let successful = 0;
  let failed = 0;

  // Deploy products sequentially to avoid overwhelming Stripe API
  for (const productId of productIds) {
    try {
      const result = await deployCreatorProductToProduction(user.id, productId);
      results.push({
        productId,
        success: result.success,
        deploymentId: result.deploymentId,
        error: result.error,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Small delay to be respectful to Stripe API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({
        productId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failed++;
    }
  }

  // Revalidate paths if any deployments were successful
  if (successful > 0) {
    revalidatePath('/creator/dashboard');
    revalidatePath('/creator/products');
    revalidatePath('/creator/onboarding');
  }

  return {
    results,
    summary: {
      total: productIds.length,
      successful,
      failed,
    },
  };
}

/**
 * Validate all creator products for deployment readiness
 */
export async function validateCreatorProductsForDeploymentAction(): Promise<{
  readyToDeploy: string[];
  needsAttention: Array<{
    productId: string;
    productName: string;
    issues: Array<{
      check: string;
      message: string;
      critical: boolean;
    }>;
  }>;
}> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const previews = await getProductDeploymentPreview(user.id);
  
  const readyToDeploy: string[] = [];
  const needsAttention: Array<{
    productId: string;
    productName: string;
    issues: Array<{
      check: string;
      message: string;
      critical: boolean;
    }>;
  }> = [];

  for (const preview of previews) {
    const criticalIssues = preview.validationResults.filter(r => r.status === 'failed');
    const allIssues = preview.validationResults.filter(r => r.status !== 'passed');

    if (criticalIssues.length === 0 && !preview.isDeployed) {
      readyToDeploy.push(preview.productId);
    }

    if (allIssues.length > 0) {
      needsAttention.push({
        productId: preview.productId,
        productName: preview.productName,
        issues: allIssues.map(issue => ({
          check: issue.check,
          message: issue.message,
          critical: issue.critical,
        })),
      });
    }
  }

  return {
    readyToDeploy,
    needsAttention,
  };
}