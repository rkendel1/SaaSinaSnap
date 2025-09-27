'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { PredictiveAnalyticsService, type PredictiveInsights, type ChurnPreventionAction, type SmartTierRecommendation, type UsagePatternAnalysis } from '../services/predictive-analytics-service';

export async function generatePredictiveInsightsAction(
  customerId: string,
  timeframe: 'last-30-days' | 'last-90-days' | 'last-year' = 'last-30-days'
): Promise<PredictiveInsights> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // In a real implementation, you'd verify the creator has access to this customer
  return PredictiveAnalyticsService.generatePredictiveInsights(user.id, customerId, timeframe);
}

export async function generateChurnPreventionActionsAction(
  customerId: string,
  churnRisk: PredictiveInsights['churnRisk']
): Promise<ChurnPreventionAction[]> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return PredictiveAnalyticsService.generateChurnPreventionActions(user.id, customerId, churnRisk);
}

export async function analyzeUsagePatternsAction(
  customerId: string,
  timeframe: string = 'last-30-days'
): Promise<UsagePatternAnalysis> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return PredictiveAnalyticsService.analyzeUsagePatterns(user.id, customerId, timeframe);
}

export async function generateSmartTierRecommendationAction(
  customerId: string,
  businessContext: {
    growth_stage: 'startup' | 'growth' | 'mature';
    seasonality: boolean;
    budget_sensitivity: 'high' | 'medium' | 'low';
  }
): Promise<SmartTierRecommendation> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return PredictiveAnalyticsService.generateSmartTierRecommendation(user.id, customerId, businessContext);
}

export async function detectUsageAnomaliesAction(
  customerId: string,
  recentEvents: Array<{
    id: string;
    creator_id: string;
    user_id: string;
    meter_id: string;
    event_name: string;
    event_value: number;
    timestamp: string;
    properties?: Record<string, any>;
  }>
): Promise<PredictiveInsights['anomalyDetection']> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return PredictiveAnalyticsService.detectUsageAnomalies(user.id, customerId, recentEvents);
}