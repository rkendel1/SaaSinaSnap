'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { PostHogAnalyticsService } from '../services/posthog-analytics';

/**
 * Server action to get comprehensive SaaS metrics
 */
export async function getSaaSMetricsAction(dateRange: string = '30d') {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await PostHogAnalyticsService.getSaaSMetrics(user.id, dateRange);
}

/**
 * Server action to get subscription plan metrics
 */
export async function getSubscriptionPlanMetricsAction() {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await PostHogAnalyticsService.getSubscriptionPlanMetrics(user.id);
}

/**
 * Server action to get usage metrics
 */
export async function getUsageMetricsAction(dateRange: string = '30d') {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await PostHogAnalyticsService.getUsageMetrics(user.id, dateRange);
}

/**
 * Server action to get competitive insights
 */
export async function getCompetitiveInsightsAction(keywords: string[]) {
  return await PostHogAnalyticsService.getCompetitiveInsights(keywords);
}

/**
 * Server action to get A/B test insights
 */
export async function getABTestInsightsAction() {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await PostHogAnalyticsService.getABTestInsights(user.id);
}

/**
 * Server action to get actionable insights
 */
export async function getActionableInsightsAction() {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await PostHogAnalyticsService.getActionableInsights(user.id);
}

/**
 * Server action to get real-time metrics
 */
export async function getRealTimeMetricsAction() {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await PostHogAnalyticsService.getRealTimeMetrics(user.id);
}

/**
 * Server action to track SaaS events
 */
export async function trackSaaSEventAction(event: string, properties: Record<string, any>) {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await PostHogAnalyticsService.trackSaaSEvent(event, user.id, properties);
}