'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { EnhancedEmbedService, type EmbedConfiguration, type EmbedPerformanceMetrics, type EmbedOptimizationRecommendation, type RealTimeEmbedUpdate, type EmbedABTest } from '../services/enhanced-embed-service';

export async function createOptimizedEmbedAction(
  productId: string,
  requirements: {
    embedType: EmbedConfiguration['embedType'];
    targetAudience: string;
    goals: string[];
    constraints?: string[];
    brandGuidelines?: Record<string, any>;
  }
): Promise<EmbedConfiguration> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return EnhancedEmbedService.createOptimizedEmbed(user.id, productId, requirements);
}

export async function analyzeEmbedPerformanceAction(
  embedId: string,
  timeframe: '24h' | '7d' | '30d' | '90d' = '30d'
): Promise<{
  metrics: EmbedPerformanceMetrics;
  recommendations: EmbedOptimizationRecommendation;
}> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // In a real implementation, you'd verify the user owns this embed
  return EnhancedEmbedService.analyzeEmbedPerformance(embedId, timeframe);
}

export async function deployEmbedUpdateAction(
  embedId: string,
  updateData: Partial<EmbedConfiguration>,
  rolloutStrategy: RealTimeEmbedUpdate['rolloutStrategy'] = 'gradual',
  rolloutPercentage: number = 10
): Promise<RealTimeEmbedUpdate> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return EnhancedEmbedService.deployEmbedUpdate(embedId, updateData, rolloutStrategy, rolloutPercentage);
}

export async function createEmbedABTestAction(
  embedId: string,
  testConfig: {
    name: string;
    hypothesis: string;
    variants: Array<{
      name: string;
      configuration: Partial<EmbedConfiguration>;
      trafficPercentage: number;
    }>;
    duration: number; // in days
  }
): Promise<EmbedABTest> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return EnhancedEmbedService.createEmbedABTest(embedId, testConfig);
}

export async function generateAdvancedEmbedCodeAction(
  embedId: string,
  options: {
    includeFallback: boolean;
    enableAnalytics: boolean;
    enableRealTimeUpdates: boolean;
    customAttributes?: Record<string, string>;
  }
): Promise<string> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // This would need to fetch the embed configuration first
  // For now, we'll create a mock configuration
  const mockConfig: EmbedConfiguration = {
    id: embedId,
    creatorId: user.id,
    productId: 'mock-product',
    embedType: 'product-card',
    styling: {
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      borderRadius: 8,
      shadows: true,
      animations: true
    },
    behavior: {
      autoUpdate: true,
      abTestEnabled: false,
      performanceTracking: true,
      realTimeSync: false,
      cacheStrategy: 'balanced'
    },
    targeting: {},
    analytics: {
      conversionTracking: true,
      heatmapEnabled: false,
      userJourneyTracking: false
    },
    version: '1.0.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return EnhancedEmbedService.generateAdvancedEmbedCode(mockConfig, options);
}

export async function getEmbedRealTimeMetricsAction(
  embedId: string
): Promise<{
  currentMetrics: {
    activeViews: number;
    clicksLastHour: number;
    conversionsLastHour: number;
    errorRate: number;
    averageLoadTime: number;
  };
  alerts: Array<{
    type: 'performance' | 'error' | 'conversion';
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
  }>;
}> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return EnhancedEmbedService.getEmbedRealTimeMetrics(embedId);
}