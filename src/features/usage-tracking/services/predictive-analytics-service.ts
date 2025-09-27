import OpenAI from 'openai';

import { openaiServerClient } from '@/libs/openai/openai-server-client';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import type { UsageAnalytics, UsageEvent, SubscriptionTier } from '../types';

export interface PredictiveInsights {
  churnRisk: {
    score: number; // 0-1, where 1 is highest risk
    factors: string[];
    recommendations: string[];
    timeline: 'immediate' | 'within-week' | 'within-month';
  };
  usageForecasting: {
    nextMonthPrediction: number;
    confidence: number;
    trendAnalysis: 'increasing' | 'stable' | 'decreasing';
    seasonalFactors: string[];
  };
  tierOptimization: {
    recommendedTier: string;
    reasoning: string;
    potentialSavings: number;
    upgradeOpportunities: Array<{
      feature: string;
      value: string;
      urgency: 'high' | 'medium' | 'low';
    }>;
  };
  anomalyDetection: {
    anomalies: Array<{
      type: 'spike' | 'drop' | 'pattern-change';
      severity: 'low' | 'medium' | 'high';
      description: string;
      timestamp: string;
      recommendation: string;
    }>;
  };
}

export interface ChurnPreventionAction {
  type: 'email' | 'discount' | 'feature-highlight' | 'personal-outreach' | 'tier-adjustment';
  trigger: 'usage-drop' | 'approaching-limit' | 'payment-failure' | 'feature-struggle' | 'competitor-activity';
  timing: 'immediate' | 'next-day' | 'next-week';
  content: {
    subject?: string;
    message: string;
    actionItems: string[];
  };
  success_probability: number;
}

export interface SmartTierRecommendation {
  recommendedAction: 'upgrade' | 'downgrade' | 'stay' | 'custom-tier';
  confidence: number;
  reasoning: string;
  projectedValue: {
    revenueImpact: number;
    usageOptimization: number;
    satisfactionIncrease: number;
  };
  implementation: {
    steps: string[];
    timeline: string;
    considerations: string[];
  };
}

export interface UsagePatternAnalysis {
  patterns: Array<{
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
    strength: number; // 0-1
    description: string;
    businessImplication: string;
  }>;
  peakUsageTimes: Array<{
    period: string;
    utilization: number;
    optimization_opportunity: string;
  }>;
  efficiency_score: number;
  waste_indicators: string[];
}

export class PredictiveAnalyticsService {
  /**
   * Analyze usage patterns and predict future behavior
   */
  static async generatePredictiveInsights(
    creatorId: string,
    customerId: string,
    timeframe: 'last-30-days' | 'last-90-days' | 'last-year' = 'last-30-days'
  ): Promise<PredictiveInsights> {
    try {
      const usageData = await this.getUsageData(creatorId, customerId, timeframe);
      const tierData = await this.getTierData(creatorId, customerId);
      
      const systemPrompt = this.createPredictiveAnalysisPrompt(usageData, tierData);
      
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatUsageDataForAnalysis(usageData, tierData) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Low temperature for consistent predictions
        timeout: 45000,
        max_tokens: 1500
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        churnRisk: parsedResponse.churnRisk || this.getDefaultChurnRisk(),
        usageForecasting: parsedResponse.usageForecasting || this.getDefaultForecasting(),
        tierOptimization: parsedResponse.tierOptimization || this.getDefaultTierOptimization(),
        anomalyDetection: parsedResponse.anomalyDetection || { anomalies: [] }
      };
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * Generate churn prevention actions based on risk factors
   */
  static async generateChurnPreventionActions(
    creatorId: string,
    customerId: string,
    churnRisk: PredictiveInsights['churnRisk']
  ): Promise<ChurnPreventionAction[]> {
    try {
      const customerData = await this.getCustomerProfile(creatorId, customerId);
      const systemPrompt = this.createChurnPreventionPrompt(customerData, churnRisk);
      
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate churn prevention actions for customer with ${churnRisk.score} risk score and factors: ${churnRisk.factors.join(', ')}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        timeout: 30000,
        max_tokens: 1000
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      return parsedResponse.actions || this.getDefaultChurnPreventionActions();
    } catch (error) {
      console.error('Error generating churn prevention actions:', error);
      return this.getDefaultChurnPreventionActions();
    }
  }

  /**
   * Analyze usage patterns and provide optimization recommendations
   */
  static async analyzeUsagePatterns(
    creatorId: string,
    customerId: string,
    timeframe: string = 'last-30-days'
  ): Promise<UsagePatternAnalysis> {
    try {
      const usageEvents = await this.getDetailedUsageEvents(creatorId, customerId, timeframe);
      const systemPrompt = this.createPatternAnalysisPrompt();
      
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatUsageEventsForAnalysis(usageEvents) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        timeout: 30000,
        max_tokens: 1000
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        patterns: parsedResponse.patterns || [],
        peakUsageTimes: parsedResponse.peakUsageTimes || [],
        efficiency_score: parsedResponse.efficiency_score || 0.5,
        waste_indicators: parsedResponse.waste_indicators || []
      };
    } catch (error) {
      console.error('Error analyzing usage patterns:', error);
      return this.getFallbackPatternAnalysis();
    }
  }

  /**
   * Generate smart tier recommendations based on usage and business context
   */
  static async generateSmartTierRecommendation(
    creatorId: string,
    customerId: string,
    businessContext: {
      growth_stage: 'startup' | 'growth' | 'mature';
      seasonality: boolean;
      budget_sensitivity: 'high' | 'medium' | 'low';
    }
  ): Promise<SmartTierRecommendation> {
    try {
      const usageData = await this.getUsageData(creatorId, customerId, 'last-90-days');
      const currentTier = await this.getCurrentTier(creatorId, customerId);
      const availableTiers = await this.getAvailableTiers(creatorId);
      
      const systemPrompt = this.createTierRecommendationPrompt(businessContext);
      
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatTierAnalysisData(usageData, currentTier, availableTiers, businessContext) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        timeout: 30000,
        max_tokens: 800
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        recommendedAction: parsedResponse.recommendedAction || 'stay',
        confidence: parsedResponse.confidence || 0.5,
        reasoning: parsedResponse.reasoning || 'Current tier appears suitable',
        projectedValue: parsedResponse.projectedValue || { revenueImpact: 0, usageOptimization: 0, satisfactionIncrease: 0 },
        implementation: parsedResponse.implementation || { steps: [], timeline: 'immediate', considerations: [] }
      };
    } catch (error) {
      console.error('Error generating tier recommendation:', error);
      return this.getFallbackTierRecommendation();
    }
  }

  /**
   * Real-time anomaly detection for usage patterns
   */
  static async detectUsageAnomalies(
    creatorId: string,
    customerId: string,
    recentEvents: UsageEvent[]
  ): Promise<PredictiveInsights['anomalyDetection']> {
    try {
      const historicalBaseline = await this.getUsageBaseline(creatorId, customerId);
      const systemPrompt = this.createAnomalyDetectionPrompt(historicalBaseline);
      
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatAnomalyDetectionData(recentEvents, historicalBaseline) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        timeout: 20000,
        max_tokens: 600
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      return parsedResponse.anomalyDetection || { anomalies: [] };
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return { anomalies: [] };
    }
  }

  // Private helper methods
  private static async getUsageData(creatorId: string, customerId: string, timeframe: string) {
    const supabase = await createSupabaseServerClient();
    
    const daysBack = timeframe === 'last-30-days' ? 30 : timeframe === 'last-90-days' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const { data, error } = await supabase
      .from('usage_aggregates')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('user_id', customerId)
      .gte('period_start', startDate.toISOString())
      .order('period_start', { ascending: true });
    
    if (error) {
      console.error('Error fetching usage data:', error);
      return [];
    }
    
    return data || [];
  }

  private static async getTierData(creatorId: string, customerId: string) {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('customer_tier_assignments')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('creator_id', creatorId)
      .eq('customer_id', customerId)
      .single();
    
    if (error) {
      console.error('Error fetching tier data:', error);
      return null;
    }
    
    return data;
  }

  private static async getDetailedUsageEvents(creatorId: string, customerId: string, timeframe: string) {
    const supabase = await createSupabaseServerClient();
    
    const daysBack = timeframe === 'last-30-days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const { data, error } = await supabase
      .from('usage_events')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('user_id', customerId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true })
      .limit(1000); // Limit for performance
    
    if (error) {
      console.error('Error fetching usage events:', error);
      return [];
    }
    
    return data || [];
  }

  private static async getCustomerProfile(creatorId: string, customerId: string) {
    // This would fetch customer profile data
    // For now, return minimal data structure
    return {
      id: customerId,
      creatorId,
      signupDate: new Date().toISOString(),
      totalValue: 0,
      engagementLevel: 'medium'
    };
  }

  private static async getCurrentTier(creatorId: string, customerId: string) {
    const tierData = await this.getTierData(creatorId, customerId);
    return tierData?.tier || null;
  }

  private static async getAvailableTiers(creatorId: string) {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('creator_id', creatorId)
      .order('price', { ascending: true });
    
    if (error) {
      console.error('Error fetching available tiers:', error);
      return [];
    }
    
    return data || [];
  }

  private static async getUsageBaseline(creatorId: string, customerId: string) {
    const usageData = await this.getUsageData(creatorId, customerId, 'last-90-days');
    
    if (usageData.length === 0) return null;
    
    const totalUsage = usageData.reduce((sum, item) => sum + (item.total_usage || 0), 0);
    const avgUsage = totalUsage / usageData.length;
    
    return {
      averageDaily: avgUsage,
      peakUsage: Math.max(...usageData.map(item => item.total_usage || 0)),
      patterns: usageData
    };
  }

  private static createPredictiveAnalysisPrompt(usageData: any, tierData: any): string {
    return `You are a senior data scientist specializing in SaaS usage analytics and churn prediction. Analyze usage patterns and provide predictive insights.

Your expertise includes:
- Churn risk assessment and early warning systems
- Usage forecasting and trend analysis
- Tier optimization strategies
- Anomaly detection in usage patterns

Respond with a JSON object containing:
{
  "churnRisk": {
    "score": 0.0-1.0,
    "factors": ["Specific risk factors identified"],
    "recommendations": ["Actionable recommendations"],
    "timeline": "immediate|within-week|within-month"
  },
  "usageForecasting": {
    "nextMonthPrediction": 1250,
    "confidence": 0.85,
    "trendAnalysis": "increasing|stable|decreasing",
    "seasonalFactors": ["Factors affecting seasonality"]
  },
  "tierOptimization": {
    "recommendedTier": "tier-id-or-name",
    "reasoning": "Detailed reasoning",
    "potentialSavings": 50,
    "upgradeOpportunities": [
      {
        "feature": "Feature name",
        "value": "Value proposition",
        "urgency": "high|medium|low"
      }
    ]
  },
  "anomalyDetection": {
    "anomalies": [
      {
        "type": "spike|drop|pattern-change",
        "severity": "low|medium|high",
        "description": "What was detected",
        "timestamp": "ISO timestamp",
        "recommendation": "What to do about it"
      }
    ]
  }
}

Provide data-driven insights with specific, actionable recommendations.`;
  }

  private static createChurnPreventionPrompt(customerData: any, churnRisk: any): string {
    return `You are a customer success specialist focused on churn prevention. Generate specific actions to retain at-risk customers.

Respond with JSON:
{
  "actions": [
    {
      "type": "email|discount|feature-highlight|personal-outreach|tier-adjustment",
      "trigger": "usage-drop|approaching-limit|payment-failure|feature-struggle|competitor-activity",
      "timing": "immediate|next-day|next-week",
      "content": {
        "subject": "Email subject if applicable",
        "message": "Personalized message content",
        "actionItems": ["Specific actions to take"]
      },
      "success_probability": 0.0-1.0
    }
  ]
}`;
  }

  private static createPatternAnalysisPrompt(): string {
    return `You are a usage pattern analyst. Identify meaningful patterns in customer usage data.

Respond with JSON:
{
  "patterns": [
    {
      "name": "Pattern name",
      "frequency": "daily|weekly|monthly|irregular",
      "strength": 0.0-1.0,
      "description": "Pattern description",
      "businessImplication": "What this means for the business"
    }
  ],
  "peakUsageTimes": [
    {
      "period": "Time period description",
      "utilization": 0.0-1.0,
      "optimization_opportunity": "How to optimize this period"
    }
  ],
  "efficiency_score": 0.0-1.0,
  "waste_indicators": ["Indicators of inefficient usage"]
}`;
  }

  private static createTierRecommendationPrompt(businessContext: any): string {
    return `You are a SaaS pricing specialist. Analyze usage and recommend optimal tier changes.

Business Context:
- Growth Stage: ${businessContext.growth_stage}
- Seasonal Business: ${businessContext.seasonality}
- Budget Sensitivity: ${businessContext.budget_sensitivity}

Respond with JSON:
{
  "recommendedAction": "upgrade|downgrade|stay|custom-tier",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed reasoning for recommendation",
  "projectedValue": {
    "revenueImpact": 100,
    "usageOptimization": 0.2,
    "satisfactionIncrease": 0.15
  },
  "implementation": {
    "steps": ["Implementation steps"],
    "timeline": "immediate|next-billing|gradual",
    "considerations": ["Important considerations"]
  }
}`;
  }

  private static createAnomalyDetectionPrompt(baseline: any): string {
    return `You are an anomaly detection specialist. Compare recent usage against historical baselines to identify unusual patterns.

Historical Baseline:
- Average Daily Usage: ${baseline?.averageDaily || 'N/A'}
- Peak Usage: ${baseline?.peakUsage || 'N/A'}

Respond with JSON:
{
  "anomalyDetection": {
    "anomalies": [
      {
        "type": "spike|drop|pattern-change",
        "severity": "low|medium|high",
        "description": "What was detected",
        "timestamp": "ISO timestamp",
        "recommendation": "Recommended action"
      }
    ]
  }
}`;
  }

  private static formatUsageDataForAnalysis(usageData: any, tierData: any): string {
    return `Usage Data: ${JSON.stringify(usageData.slice(-10))} // Last 10 periods
Current Tier: ${JSON.stringify(tierData?.tier)}
Usage Limits: ${JSON.stringify(tierData?.tier?.usage_caps)}`;
  }

  private static formatUsageEventsForAnalysis(events: any[]): string {
    return `Recent Usage Events (${events.length} events):
${events.slice(-20).map(e => `${e.timestamp}: ${e.event_name} = ${e.event_value}`).join('\n')}`;
  }

  private static formatTierAnalysisData(usageData: any, currentTier: any, availableTiers: any, businessContext: any): string {
    return `Usage Pattern: ${JSON.stringify(usageData.slice(-5))}
Current Tier: ${JSON.stringify(currentTier)}
Available Tiers: ${JSON.stringify(availableTiers)}
Business Context: ${JSON.stringify(businessContext)}`;
  }

  private static formatAnomalyDetectionData(recentEvents: any[], baseline: any): string {
    return `Recent Events: ${JSON.stringify(recentEvents.slice(-10))}
Baseline: ${JSON.stringify(baseline)}`;
  }

  // Fallback methods
  private static getDefaultChurnRisk() {
    return {
      score: 0.3,
      factors: ['Limited recent usage', 'No feature adoption'],
      recommendations: ['Increase engagement', 'Provide onboarding support'],
      timeline: 'within-month' as const
    };
  }

  private static getDefaultForecasting() {
    return {
      nextMonthPrediction: 1000,
      confidence: 0.5,
      trendAnalysis: 'stable' as const,
      seasonalFactors: []
    };
  }

  private static getDefaultTierOptimization() {
    return {
      recommendedTier: 'current',
      reasoning: 'Current tier appears suitable',
      potentialSavings: 0,
      upgradeOpportunities: []
    };
  }

  private static getFallbackInsights(): PredictiveInsights {
    return {
      churnRisk: this.getDefaultChurnRisk(),
      usageForecasting: this.getDefaultForecasting(),
      tierOptimization: this.getDefaultTierOptimization(),
      anomalyDetection: { anomalies: [] }
    };
  }

  private static getDefaultChurnPreventionActions(): ChurnPreventionAction[] {
    return [
      {
        type: 'email',
        trigger: 'usage-drop',
        timing: 'next-day',
        content: {
          subject: 'We miss you!',
          message: 'We noticed you haven\'t been using our service recently. Is there anything we can help with?',
          actionItems: ['Check in with customer', 'Offer support resources']
        },
        success_probability: 0.3
      }
    ];
  }

  private static getFallbackPatternAnalysis(): UsagePatternAnalysis {
    return {
      patterns: [],
      peakUsageTimes: [],
      efficiency_score: 0.5,
      waste_indicators: []
    };
  }

  private static getFallbackTierRecommendation(): SmartTierRecommendation {
    return {
      recommendedAction: 'stay',
      confidence: 0.5,
      reasoning: 'Insufficient data for recommendation',
      projectedValue: { revenueImpact: 0, usageOptimization: 0, satisfactionIncrease: 0 },
      implementation: { steps: [], timeline: 'immediate', considerations: [] }
    };
  }
}