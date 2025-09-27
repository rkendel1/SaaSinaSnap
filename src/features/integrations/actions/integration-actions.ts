'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { type IntegrationProvider,IntegrationService } from '../services/integration-service';

export async function getAvailableProvidersAction(
  category?: IntegrationProvider['category']
): Promise<IntegrationProvider[]> {
  return IntegrationService.getAvailableProviders(category);
}

export async function getProviderAction(providerId: string): Promise<IntegrationProvider | null> {
  return IntegrationService.getProvider(providerId);
}

export async function generateIntegrationRecommendationsAction(
  businessProfile: {
    industry: string;
    businessModel: string;
    targetMarket: string;
    currentTools: string[];
    painPoints: string[];
  }
): Promise<Array<{
  provider: IntegrationProvider;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  expectedBenefits: string[];
  setupComplexity: 'low' | 'medium' | 'high';
  estimatedROI: string;
}>> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return IntegrationService.generateIntegrationRecommendations(user.id, businessProfile);
}