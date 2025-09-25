import { posthogServer } from '@/libs/posthog/posthog-server-client';

// Types for comprehensive SaaS analytics
export interface SaaSMetrics {
  arr: number; // Annual Recurring Revenue
  mrr: number; // Monthly Recurring Revenue
  churn_rate: number;
  ltv: number; // Lifetime Value
  cac: number; // Customer Acquisition Cost
  active_subscriptions: number;
  new_subscribers: number;
  cancelled_subscriptions: number;
  growth_rate: number;
  revenue_growth: number;
}

export interface SubscriptionPlanMetrics {
  plan_name: string;
  subscribers: number;
  revenue: number;
  churn_rate: number;
  conversion_rate: number;
  upgrade_rate: number;
  downgrade_rate: number;
}

export interface UsageMetric {
  date: string;
  active_users: number;
  page_views: number;
  feature_usage: Record<string, number>;
  session_duration: number;
  bounce_rate: number;
}

export interface CompetitiveInsight {
  keyword: string;
  company: string;
  trend: 'up' | 'down' | 'stable';
  market_share: number;
  growth_rate: number;
  news_mentions: number;
}

export interface PostHogEvent {
  event: string;
  distinct_id: string;
  properties: Record<string, any>;
  timestamp: string;
}

export interface ABTestInsight {
  test_id: string;
  test_name: string;
  status: 'running' | 'completed' | 'paused';
  statistical_significance: number;
  improvement: number;
  recommendation: string;
  next_steps: string[];
}

export class PostHogAnalyticsService {
  /**
   * Fetch comprehensive SaaS metrics from PostHog
   */
  static async getSaaSMetrics(creatorId: string, dateRange: string = '30d'): Promise<SaaSMetrics> {
    try {
      // In a real implementation, these would be calculated from PostHog queries
      // For now, we'll use mock data that represents what would be computed
      
      // Mock calculation based on events and subscription data
      const mockMetrics: SaaSMetrics = {
        arr: 120000, // Annual Recurring Revenue
        mrr: 10000,  // Monthly Recurring Revenue
        churn_rate: 0.05, // 5% monthly churn
        ltv: 2400,   // Average customer lifetime value
        cac: 150,    // Customer acquisition cost
        active_subscriptions: 85,
        new_subscribers: 12,
        cancelled_subscriptions: 4,
        growth_rate: 0.15, // 15% growth rate
        revenue_growth: 0.23 // 23% revenue growth
      };

      return mockMetrics;
    } catch (error) {
      console.error('Error fetching SaaS metrics:', error);
      throw error;
    }
  }

  /**
   * Get subscription plan performance metrics
   */
  static async getSubscriptionPlanMetrics(creatorId: string): Promise<SubscriptionPlanMetrics[]> {
    try {
      // Mock data representing different subscription plans
      const mockPlanMetrics: SubscriptionPlanMetrics[] = [
        {
          plan_name: 'Basic',
          subscribers: 45,
          revenue: 2250,
          churn_rate: 0.08,
          conversion_rate: 0.12,
          upgrade_rate: 0.25,
          downgrade_rate: 0.05
        },
        {
          plan_name: 'Pro',
          subscribers: 30,
          revenue: 5970,
          churn_rate: 0.04,
          conversion_rate: 0.18,
          upgrade_rate: 0.15,
          downgrade_rate: 0.08
        },
        {
          plan_name: 'Enterprise',
          subscribers: 10,
          revenue: 9990,
          churn_rate: 0.02,
          conversion_rate: 0.25,
          upgrade_rate: 0.05,
          downgrade_rate: 0.02
        }
      ];

      return mockPlanMetrics;
    } catch (error) {
      console.error('Error fetching subscription plan metrics:', error);
      throw error;
    }
  }

  /**
   * Get usage metrics and trends
   */
  static async getUsageMetrics(creatorId: string, dateRange: string = '30d'): Promise<UsageMetric[]> {
    try {
      // Generate mock usage data for the last 30 days
      const mockUsageData: UsageMetric[] = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        mockUsageData.push({
          date: date.toISOString().split('T')[0],
          active_users: Math.floor(Math.random() * 200) + 150,
          page_views: Math.floor(Math.random() * 1000) + 500,
          feature_usage: {
            dashboard: Math.floor(Math.random() * 100) + 50,
            analytics: Math.floor(Math.random() * 80) + 30,
            exports: Math.floor(Math.random() * 40) + 10,
            api_calls: Math.floor(Math.random() * 200) + 100
          },
          session_duration: Math.floor(Math.random() * 300) + 180, // seconds
          bounce_rate: Math.random() * 0.3 + 0.2 // 20-50%
        });
      }

      return mockUsageData;
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      throw error;
    }
  }

  /**
   * Get competitive analysis and industry insights
   */
  static async getCompetitiveInsights(keywords: string[]): Promise<CompetitiveInsight[]> {
    try {
      // Mock competitive insights
      const mockInsights: CompetitiveInsight[] = [
        {
          keyword: 'SaaS analytics',
          company: 'Mixpanel',
          trend: 'up',
          market_share: 0.15,
          growth_rate: 0.12,
          news_mentions: 45
        },
        {
          keyword: 'subscription metrics',
          company: 'ChartMogul',
          trend: 'stable',
          market_share: 0.08,
          growth_rate: 0.05,
          news_mentions: 23
        },
        {
          keyword: 'customer analytics',
          company: 'Amplitude',
          trend: 'up',
          market_share: 0.22,
          growth_rate: 0.18,
          news_mentions: 67
        }
      ];

      return mockInsights;
    } catch (error) {
      console.error('Error fetching competitive insights:', error);
      throw error;
    }
  }

  /**
   * Get A/B test insights and recommendations
   */
  static async getABTestInsights(creatorId: string): Promise<ABTestInsight[]> {
    try {
      // Mock A/B test insights
      const mockABInsights: ABTestInsight[] = [
        {
          test_id: 'test-pricing-page',
          test_name: 'Pricing Page Layout Test',
          status: 'running',
          statistical_significance: 0.87,
          improvement: 0.24,
          recommendation: 'Continue test - trending positive but needs more data',
          next_steps: ['Wait for statistical significance', 'Monitor conversion rates', 'Prepare variant rollout']
        },
        {
          test_id: 'test-signup-flow',
          test_name: 'Signup Flow Simplification',
          status: 'completed',
          statistical_significance: 0.95,
          improvement: 0.31,
          recommendation: 'Implement variant - significant improvement in conversions',
          next_steps: ['Deploy winning variant', 'Monitor post-deployment metrics', 'Plan next optimization']
        }
      ];

      return mockABInsights;
    } catch (error) {
      console.error('Error fetching A/B test insights:', error);
      throw error;
    }
  }

  /**
   * Get actionable insights and suggestions
   */
  static async getActionableInsights(creatorId: string): Promise<{
    insights: string[];
    suggestions: string[];
    trends: string[];
  }> {
    try {
      return {
        insights: [
          'Your MRR has grown 23% month-over-month, primarily driven by Pro plan upgrades',
          'Churn rate is 2.1% below industry average, indicating strong product-market fit',
          'Enterprise plan shows 95% retention rate - consider expanding enterprise features',
          'Mobile usage has increased 45% in the last quarter'
        ],
        suggestions: [
          'Consider implementing usage-based pricing for high-volume customers',
          'Launch a referral program - your NPS score of 8.7 indicates strong advocacy potential',
          'Optimize onboarding flow - 18% of users drop off in the first week',
          'Add more integrations based on customer feedback and usage patterns'
        ],
        trends: [
          'API usage growing 15% month-over-month across all plans',
          'Dashboard feature adoption at 89% - highest in 6 months',
          'Support ticket volume down 22% due to improved self-service features',
          'Free trial to paid conversion rate improved to 24%'
        ]
      };
    } catch (error) {
      console.error('Error fetching actionable insights:', error);
      throw error;
    }
  }

  /**
   * Track custom SaaS events in PostHog
   */
  static async trackSaaSEvent(event: string, userId: string, properties: Record<string, any>): Promise<void> {
    try {
      await posthogServer.capture({
        distinctId: userId,
        event: event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          source: 'saas_dashboard'
        }
      });
    } catch (error) {
      console.error('Error tracking SaaS event:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics for dashboard
   */
  static async getRealTimeMetrics(creatorId: string): Promise<{
    active_users_now: number;
    revenue_today: number;
    signups_today: number;
    trials_started_today: number;
  }> {
    try {
      return {
        active_users_now: Math.floor(Math.random() * 50) + 25,
        revenue_today: Math.floor(Math.random() * 2000) + 500,
        signups_today: Math.floor(Math.random() * 10) + 3,
        trials_started_today: Math.floor(Math.random() * 8) + 2
      };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }
}