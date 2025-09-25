'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { UsageTrackingService } from '../services/usage-tracking-service-simple';
import type { CreateMeterRequest, TrackUsageRequest, UsageAnalytics, UsageSummary } from '../types';

/**
 * Server action to create a usage meter
 */
export async function createMeterAction(meterData: CreateMeterRequest) {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await UsageTrackingService.createMeter(user.id, meterData);
}

/**
 * Server action to get all meters for the authenticated creator
 */
export async function getMetersAction() {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await UsageTrackingService.getMeters(user.id);
}

/**
 * Server action to track usage
 */
export async function trackUsageAction(request: TrackUsageRequest) {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await UsageTrackingService.trackUsage(user.id, request);
}

/**
 * Server action to get usage summary
 */
export async function getUsageSummaryAction(
  meterId: string, 
  userId: string, 
  planName: string,
  billingPeriod?: string
): Promise<UsageSummary> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await UsageTrackingService.getUsageSummary(meterId, userId, planName, billingPeriod);
}

/**
 * Server action to get usage analytics
 */
export async function getUsageAnalyticsAction(dateRange: { start: string; end: string }): Promise<UsageAnalytics> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('User not authenticated');
  }

  return await UsageTrackingService.getUsageAnalytics(user.id, dateRange);
}