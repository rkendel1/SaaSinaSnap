'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { getOrCreateCreatorProfile } from '../controllers/creator-profile';
import { AIOnboardingOptimizerService, type BusinessIntelligence,type OnboardingOptimization } from '../services/ai-onboarding-optimizer';
import { AITaskAssistantService } from '../services/ai-task-assistant';
import type { CreatorProfile } from '../types';

export async function optimizeOnboardingPathAction(
  businessContext?: {
    industry?: string;
    targetMarket?: string;
    businessModel?: string;
    experience?: string;
  }
): Promise<OnboardingOptimization> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getOrCreateCreatorProfile(user.id);
  
  return AIOnboardingOptimizerService.optimizeOnboardingPath(creatorProfile, businessContext);
}

export async function generateAssetRecommendationsAction(
  assetType: 'logo' | 'banner' | 'product-image' | 'marketing-copy' | 'color-palette' | 'brand-guide'
): Promise<Array<{
  type: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  aiGeneratedContent?: {
    prompt: string;
    generatedAsset?: string;
    alternatives?: string[];
  };
  templates?: string[];
}>> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getOrCreateCreatorProfile(user.id);
  
  return AIOnboardingOptimizerService.generateAssetRecommendations(creatorProfile, assetType);
}

export async function analyzeBusinessIntelligenceAction(
  marketData?: {
    competitorAnalysis?: string[];
    marketSize?: string;
    trends?: string[];
  }
): Promise<BusinessIntelligence> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getOrCreateCreatorProfile(user.id);
  
  return AIOnboardingOptimizerService.analyzeBusinessIntelligence(creatorProfile, marketData);
}

export async function optimizeNextStepAction(
  currentStep: number,
  completedSteps: string[],
  userBehavior: {
    timeSpent: number;
    completionRate: number;
    strugglingAreas: string[];
  }
): Promise<{
  nextStep: string;
  reasoning: string;
  adaptations: string[];
  riskMitigation: string[];
}> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getOrCreateCreatorProfile(user.id);
  
  return AIOnboardingOptimizerService.optimizeNextStep(
    creatorProfile, 
    currentStep, 
    completedSteps, 
    userBehavior
  );
}

export async function generateChurnReductionRecommendationsAction(
  onboardingProgress: {
    currentStep: number;
    timeSpent: number;
    strugglingAreas: string[];
    completionRate: number;
  }
): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  interventions: Array<{
    type: 'guidance' | 'simplification' | 'incentive' | 'support';
    priority: 'critical' | 'high' | 'medium';
    action: string;
    expectedImpact: string;
  }>;
  engagementBoosts: string[];
}> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getOrCreateCreatorProfile(user.id);
  
  return AITaskAssistantService.generateChurnReductionRecommendations(creatorProfile, onboardingProgress);
}