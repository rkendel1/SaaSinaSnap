import OpenAI from 'openai';

import { openaiServerClient } from '@/libs/openai/openai-server-client';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export interface EmbedConfiguration {
  id: string;
  creatorId: string;
  productId: string;
  embedType: 'product-card' | 'pricing-table' | 'signup-form' | 'trial-banner' | 'feature-highlight';
  styling: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    secondaryColor: string;
    borderRadius: number;
    shadows: boolean;
    animations: boolean;
    customCSS?: string;
  };
  behavior: {
    autoUpdate: boolean;
    abTestEnabled: boolean;
    performanceTracking: boolean;
    realTimeSync: boolean;
    cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
  };
  targeting: {
    geoTargeting?: string[];
    deviceTargeting?: string[];
    timeBasedRules?: Array<{
      condition: string;
      action: string;
    }>;
  };
  analytics: {
    conversionTracking: boolean;
    heatmapEnabled: boolean;
    userJourneyTracking: boolean;
  };
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmbedPerformanceMetrics {
  embedId: string;
  timeframe: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number; // Click-through rate
    conversionRate: number;
    loadTime: number;
    bounceRate: number;
    engagementScore: number;
  };
  insights: {
    topPerformingVariants: string[];
    underperformingElements: string[];
    optimizationOpportunities: string[];
    demographicBreakdown: Record<string, number>;
  };
}

export interface EmbedOptimizationRecommendation {
  embedId: string;
  recommendations: Array<{
    type: 'design' | 'copy' | 'timing' | 'targeting' | 'technical';
    priority: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
    estimatedLift: number; // Percentage improvement
    aiGenerated: boolean;
  }>;
  abTestSuggestions: Array<{
    hypothesis: string;
    variants: Array<{
      name: string;
      changes: string[];
      expectedOutcome: string;
    }>;
    duration: number; // in days
    trafficSplit: number[]; // e.g., [50, 50] for 50/50 split
  }>;
}

export interface RealTimeEmbedUpdate {
  embedId: string;
  updateType: 'configuration' | 'content' | 'styling' | 'behavior';
  changes: Record<string, any>;
  rolloutStrategy: 'immediate' | 'gradual' | 'scheduled';
  rolloutPercentage?: number; // for gradual rollouts
  scheduledTime?: string; // for scheduled rollouts
  rollbackPlan: {
    triggerConditions: string[];
    automaticRollback: boolean;
    rollbackVersion: string;
  };
}

export interface EmbedABTest {
  id: string;
  embedId: string;
  name: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: Array<{
    id: string;
    name: string;
    configuration: Partial<EmbedConfiguration>;
    trafficPercentage: number;
    performanceMetrics?: EmbedPerformanceMetrics['metrics'];
  }>;
  startDate: string;
  endDate?: string;
  statisticalSignificance: number;
  winningVariant?: string;
  insights: string[];
}

export class EnhancedEmbedService {
  /**
   * Create optimized embed configuration using AI analysis
   */
  static async createOptimizedEmbed(
    creatorId: string,
    productId: string,
    requirements: {
      embedType: EmbedConfiguration['embedType'];
      targetAudience: string;
      goals: string[];
      constraints?: string[];
      brandGuidelines?: Record<string, any>;
    }
  ): Promise<EmbedConfiguration> {
    const systemPrompt = this.createEmbedOptimizationPrompt(requirements);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatRequirementsForAI(requirements) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        timeout: 30000,
        max_tokens: 1200
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const aiSuggestions = JSON.parse(aiResponseContent);
      
      // Create embed configuration with AI suggestions
      const embedConfig: EmbedConfiguration = {
        id: `embed_${Date.now()}`,
        creatorId,
        productId,
        embedType: requirements.embedType,
        styling: {
          theme: aiSuggestions.styling?.theme || 'light',
          primaryColor: aiSuggestions.styling?.primaryColor || '#3b82f6',
          secondaryColor: aiSuggestions.styling?.secondaryColor || '#64748b',
          borderRadius: aiSuggestions.styling?.borderRadius || 8,
          shadows: aiSuggestions.styling?.shadows ?? true,
          animations: aiSuggestions.styling?.animations ?? true,
          customCSS: aiSuggestions.styling?.customCSS
        },
        behavior: {
          autoUpdate: true,
          abTestEnabled: true,
          performanceTracking: true,
          realTimeSync: true,
          cacheStrategy: 'balanced'
        },
        targeting: aiSuggestions.targeting || {},
        analytics: {
          conversionTracking: true,
          heatmapEnabled: true,
          userJourneyTracking: true
        },
        version: '1.0.0',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      await this.saveEmbedConfiguration(embedConfig);
      
      return embedConfig;
    } catch (error) {
      console.error('Error creating optimized embed:', error);
      return this.getDefaultEmbedConfiguration(creatorId, productId, requirements.embedType);
    }
  }

  /**
   * Analyze embed performance and generate optimization recommendations
   */
  static async analyzeEmbedPerformance(
    embedId: string,
    timeframe: '24h' | '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    metrics: EmbedPerformanceMetrics;
    recommendations: EmbedOptimizationRecommendation;
  }> {
    try {
      const performanceData = await this.getEmbedPerformanceData(embedId, timeframe);
      const embedConfig = await this.getEmbedConfiguration(embedId);
      
      const systemPrompt = this.createPerformanceAnalysisPrompt();
      
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatPerformanceDataForAI(performanceData, embedConfig) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        timeout: 45000,
        max_tokens: 1500
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const analysis = JSON.parse(aiResponseContent);
      
      return {
        metrics: this.formatPerformanceMetrics(performanceData, embedId, timeframe),
        recommendations: {
          embedId,
          recommendations: analysis.recommendations || [],
          abTestSuggestions: analysis.abTestSuggestions || []
        }
      };
    } catch (error) {
      console.error('Error analyzing embed performance:', error);
      return this.getFallbackPerformanceAnalysis(embedId, timeframe);
    }
  }

  /**
   * Deploy real-time embed updates with rollback capability
   */
  static async deployEmbedUpdate(
    embedId: string,
    updateData: Partial<EmbedConfiguration>,
    rolloutStrategy: RealTimeEmbedUpdate['rolloutStrategy'] = 'gradual',
    rolloutPercentage: number = 10
  ): Promise<RealTimeEmbedUpdate> {
    const embedConfig = await this.getEmbedConfiguration(embedId);
    if (!embedConfig) {
      throw new Error('Embed configuration not found');
    }

    const update: RealTimeEmbedUpdate = {
      embedId,
      updateType: this.determineUpdateType(updateData),
      changes: updateData,
      rolloutStrategy,
      rolloutPercentage: rolloutStrategy === 'gradual' ? rolloutPercentage : 100,
      rollbackPlan: {
        triggerConditions: [
          'performance_drop > 20%',
          'error_rate > 5%',
          'conversion_rate < baseline * 0.8'
        ],
        automaticRollback: true,
        rollbackVersion: embedConfig.version
      }
    };

    // Validate update before deployment
    const validationResult = await this.validateEmbedUpdate(embedConfig, updateData);
    if (!validationResult.isValid) {
      throw new Error(`Update validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Deploy update
    await this.executeEmbedUpdate(update);
    
    // Monitor deployment
    this.monitorEmbedUpdate(update);
    
    return update;
  }

  /**
   * Create and manage A/B tests for embeds
   */
  static async createEmbedABTest(
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
    const baseConfig = await this.getEmbedConfiguration(embedId);
    if (!baseConfig) {
      throw new Error('Base embed configuration not found');
    }

    const abTest: EmbedABTest = {
      id: `abtest_${Date.now()}`,
      embedId,
      name: testConfig.name,
      hypothesis: testConfig.hypothesis,
      status: 'draft',
      variants: testConfig.variants.map((variant, index) => ({
        id: `variant_${index}`,
        name: variant.name,
        configuration: variant.configuration,
        trafficPercentage: variant.trafficPercentage
      })),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + testConfig.duration * 24 * 60 * 60 * 1000).toISOString(),
      statisticalSignificance: 0,
      insights: []
    };

    // Validate A/B test configuration
    const validationResult = await this.validateABTestConfig(abTest);
    if (!validationResult.isValid) {
      throw new Error(`A/B test validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Save A/B test
    await this.saveABTest(abTest);
    
    return abTest;
  }

  /**
   * Generate embed code with advanced features
   */
  static generateAdvancedEmbedCode(
    embedConfig: EmbedConfiguration,
    options: {
      includeFallback: boolean;
      enableAnalytics: boolean;
      enableRealTimeUpdates: boolean;
      customAttributes?: Record<string, string>;
    }
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saasinasnap.com';
    const embedId = embedConfig.id;
    
    const attributes = [
      `data-embed-id="${embedId}"`,
      `data-creator-id="${embedConfig.creatorId}"`,
      `data-product-id="${embedConfig.productId}"`,
      `data-embed-type="${embedConfig.embedType}"`,
      `data-version="${embedConfig.version}"`,
      ...(options.enableRealTimeUpdates ? ['data-real-time="true"'] : []),
      ...(options.enableAnalytics ? ['data-analytics="true"'] : []),
      ...Object.entries(options.customAttributes || {}).map(([key, value]) => `data-${key}="${value}"`),
    ];

    const fallbackContent = options.includeFallback ? `
  <noscript>
    <div style="padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
      <h3>Loading...</h3>
      <p>Please enable JavaScript to view this content.</p>
      <a href="${baseUrl}/c/${embedConfig.creatorId}/product/${embedConfig.productId}" 
         style="color: ${embedConfig.styling.primaryColor}; text-decoration: none;">
        View Product →
      </a>
    </div>
  </noscript>` : '';

    return `<!-- SaaSinaSnap Enhanced Embed -->
<div id="saasinasnap-embed-${embedId}" class="saasinasnap-embed">
${fallbackContent}
</div>
<script 
  src="${baseUrl}/static/embed-v2.js" 
  ${attributes.join('\n  ')}
  async>
</script>

<!-- Optional: Custom styling -->
<style>
  .saasinasnap-embed {
    max-width: 100%;
    margin: 0 auto;
  }
  
  .saasinasnap-embed[data-loading="true"] {
    opacity: 0.7;
    pointer-events: none;
  }
  
  .saasinasnap-embed[data-error="true"] {
    border: 2px solid #ef4444;
    border-radius: 8px;
    padding: 16px;
    background: #fef2f2;
    color: #991b1b;
    text-align: center;
  }
</style>`;
  }

  /**
   * Monitor embed performance in real-time
   */
  static async getEmbedRealTimeMetrics(embedId: string): Promise<{
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
    try {
      const supabase = await createSupabaseServerClient();
      
      // Fetch real-time metrics (this would be from a real-time analytics service)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentEvents, error } = await supabase
        .from('embed_analytics_events')
        .select('*')
        .eq('embed_id', embedId)
        .gte('timestamp', oneHourAgo);
      
      if (error) {
        console.error('Error fetching real-time metrics:', error);
        return this.getFallbackRealTimeMetrics();
      }
      
      const events = recentEvents || [];
      
      const metrics = {
        activeViews: events.filter(e => e.event_type === 'view').length,
        clicksLastHour: events.filter(e => e.event_type === 'click').length,
        conversionsLastHour: events.filter(e => e.event_type === 'conversion').length,
        errorRate: events.filter(e => e.event_type === 'error').length / Math.max(events.length, 1),
        averageLoadTime: events
          .filter(e => e.event_type === 'load' && e.load_time)
          .reduce((sum, e) => sum + e.load_time, 0) / Math.max(events.filter(e => e.event_type === 'load').length, 1)
      };
      
      const alerts = this.generateAlerts(metrics, events);
      
      return { currentMetrics: metrics, alerts };
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return this.getFallbackRealTimeMetrics();
    }
  }

  // Private helper methods
  private static async saveEmbedConfiguration(config: EmbedConfiguration): Promise<void> {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('embed_configurations')
      .upsert({
        id: config.id,
        creator_id: config.creatorId,
        product_id: config.productId,
        embed_type: config.embedType,
        configuration: {
          styling: config.styling,
          behavior: config.behavior,
          targeting: config.targeting,
          analytics: config.analytics
        },
        version: config.version,
        is_active: config.isActive,
        created_at: config.createdAt,
        updated_at: config.updatedAt
      });
    
    if (error) {
      console.error('Error saving embed configuration:', error);
      throw new Error('Failed to save embed configuration');
    }
  }

  private static async getEmbedConfiguration(embedId: string): Promise<EmbedConfiguration | null> {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('embed_configurations')
      .select('*')
      .eq('id', embedId)
      .single();
    
    if (error) {
      console.error('Error fetching embed configuration:', error);
      return null;
    }
    
    return data ? this.mapDatabaseToConfig(data) : null;
  }

  private static async getEmbedPerformanceData(embedId: string, timeframe: string) {
    const supabase = await createSupabaseServerClient();
    
    const daysBack = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const { data, error } = await supabase
      .from('embed_analytics_events')
      .select('*')
      .eq('embed_id', embedId)
      .gte('timestamp', startDate.toISOString());
    
    if (error) {
      console.error('Error fetching performance data:', error);
      return [];
    }
    
    return data || [];
  }

  private static async validateEmbedUpdate(
    currentConfig: EmbedConfiguration,
    updateData: Partial<EmbedConfiguration>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Validate styling changes
    if (updateData.styling) {
      if (updateData.styling.primaryColor && !this.isValidColor(updateData.styling.primaryColor)) {
        errors.push('Invalid primary color format');
      }
      if (updateData.styling.borderRadius && (updateData.styling.borderRadius < 0 || updateData.styling.borderRadius > 50)) {
        errors.push('Border radius must be between 0 and 50');
      }
    }
    
    // Validate behavior changes
    if (updateData.behavior?.cacheStrategy && !['aggressive', 'balanced', 'minimal'].includes(updateData.behavior.cacheStrategy)) {
      errors.push('Invalid cache strategy');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  private static async validateABTestConfig(abTest: EmbedABTest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Validate traffic split
    const totalTraffic = abTest.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      errors.push('Traffic percentages must sum to 100%');
    }
    
    // Validate variant configurations
    for (const variant of abTest.variants) {
      if (!variant.name || variant.name.length < 1) {
        errors.push('All variants must have names');
      }
      if (variant.trafficPercentage < 5) {
        errors.push('Minimum traffic percentage per variant is 5%');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  private static async executeEmbedUpdate(update: RealTimeEmbedUpdate): Promise<void> {
    // This would implement the actual update deployment logic
    // For now, we'll just log the update
    console.log('Executing embed update:', update);
    
    // Save update record
    const supabase = await createSupabaseServerClient();
    await supabase.from('embed_updates').insert({
      embed_id: update.embedId,
      update_type: update.updateType,
      changes: update.changes,
      rollout_strategy: update.rolloutStrategy,
      rollout_percentage: update.rolloutPercentage,
      status: 'deploying',
      created_at: new Date().toISOString()
    });
  }

  private static monitorEmbedUpdate(update: RealTimeEmbedUpdate): void {
    // This would implement real-time monitoring
    console.log('Monitoring embed update:', update.embedId);
    
    // In a real implementation, this would:
    // - Track performance metrics in real-time
    // - Compare against baseline
    // - Trigger rollback if conditions are met
    // - Send alerts to creators
  }

  private static async saveABTest(abTest: EmbedABTest): Promise<void> {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('embed_ab_tests')
      .insert({
        id: abTest.id,
        embed_id: abTest.embedId,
        name: abTest.name,
        hypothesis: abTest.hypothesis,
        status: abTest.status,
        variants: abTest.variants,
        start_date: abTest.startDate,
        end_date: abTest.endDate,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving A/B test:', error);
      throw new Error('Failed to save A/B test');
    }
  }

  private static determineUpdateType(updateData: Partial<EmbedConfiguration>): RealTimeEmbedUpdate['updateType'] {
    if (updateData.styling) return 'styling';
    if (updateData.behavior) return 'behavior';
    if (updateData.targeting || updateData.analytics) return 'configuration';
    return 'content';
  }

  private static mapDatabaseToConfig(data: any): EmbedConfiguration {
    return {
      id: data.id,
      creatorId: data.creator_id,
      productId: data.product_id,
      embedType: data.embed_type,
      styling: data.configuration.styling,
      behavior: data.configuration.behavior,
      targeting: data.configuration.targeting,
      analytics: data.configuration.analytics,
      version: data.version,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private static isValidColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color);
  }

  private static formatPerformanceMetrics(data: any[], embedId: string, timeframe: string): EmbedPerformanceMetrics {
    const impressions = data.filter(d => d.event_type === 'impression').length;
    const clicks = data.filter(d => d.event_type === 'click').length;
    const conversions = data.filter(d => d.event_type === 'conversion').length;
    
    return {
      embedId,
      timeframe,
      metrics: {
        impressions,
        clicks,
        conversions,
        ctr: impressions > 0 ? clicks / impressions : 0,
        conversionRate: clicks > 0 ? conversions / clicks : 0,
        loadTime: data.filter(d => d.load_time).reduce((sum, d) => sum + d.load_time, 0) / Math.max(data.filter(d => d.load_time).length, 1),
        bounceRate: 0.3, // This would be calculated from actual data
        engagementScore: 0.7 // This would be calculated from actual data
      },
      insights: {
        topPerformingVariants: [],
        underperformingElements: [],
        optimizationOpportunities: [],
        demographicBreakdown: {}
      }
    };
  }

  private static generateAlerts(metrics: any, events: any[]): Array<{ type: 'performance' | 'error' | 'conversion'; severity: 'low' | 'medium' | 'high'; message: string; timestamp: string }> {
    const alerts: Array<{ type: 'performance' | 'error' | 'conversion'; severity: 'low' | 'medium' | 'high'; message: string; timestamp: string }> = [];
    
    if (metrics.errorRate > 0.05) {
      alerts.push({
        type: 'error',
        severity: 'high',
        message: `Error rate is ${(metrics.errorRate * 100).toFixed(1)}%, which is above the 5% threshold`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (metrics.averageLoadTime > 3000) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: `Average load time is ${metrics.averageLoadTime.toFixed(0)}ms, which may impact user experience`,
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  // Prompt creation methods
  private static createEmbedOptimizationPrompt(requirements: any): string {
    return `You are a conversion rate optimization expert specializing in embedded widgets. Create optimal embed configuration.

Requirements:
- Embed Type: ${requirements.embedType}
- Target Audience: ${requirements.targetAudience}
- Goals: ${requirements.goals.join(', ')}
- Constraints: ${requirements.constraints?.join(', ') || 'None'}

Respond with JSON:
{
  "styling": {
    "theme": "light|dark|auto",
    "primaryColor": "#hex-color",
    "secondaryColor": "#hex-color",
    "borderRadius": 0-50,
    "shadows": true|false,
    "animations": true|false,
    "customCSS": "optional-css"
  },
  "targeting": {
    "geoTargeting": ["optional-countries"],
    "deviceTargeting": ["desktop", "mobile", "tablet"],
    "timeBasedRules": [
      {
        "condition": "business-hours",
        "action": "show-contact-form"
      }
    ]
  }
}`;
  }

  private static createPerformanceAnalysisPrompt(): string {
    return `You are a conversion optimization analyst. Analyze embed performance data and provide actionable recommendations.

Respond with JSON:
{
  "recommendations": [
    {
      "type": "design|copy|timing|targeting|technical",
      "priority": "critical|high|medium|low",
      "description": "Specific recommendation",
      "expectedImpact": "Expected outcome",
      "implementationEffort": "low|medium|high",
      "estimatedLift": 15,
      "aiGenerated": true
    }
  ],
  "abTestSuggestions": [
    {
      "hypothesis": "Test hypothesis",
      "variants": [
        {
          "name": "Variant name",
          "changes": ["List of changes"],
          "expectedOutcome": "Expected result"
        }
      ],
      "duration": 14,
      "trafficSplit": [50, 50]
    }
  ]
}`;
  }

  private static formatRequirementsForAI(requirements: any): string {
    return `Create optimized embed configuration for:
Type: ${requirements.embedType}
Audience: ${requirements.targetAudience}
Goals: ${requirements.goals.join(', ')}
${requirements.constraints ? `Constraints: ${requirements.constraints.join(', ')}` : ''}`;
  }

  private static formatPerformanceDataForAI(data: any[], config: any): string {
    const summary = {
      totalEvents: data.length,
      impressions: data.filter(d => d.event_type === 'impression').length,
      clicks: data.filter(d => d.event_type === 'click').length,
      conversions: data.filter(d => d.event_type === 'conversion').length,
      errors: data.filter(d => d.event_type === 'error').length
    };
    
    return `Performance Summary: ${JSON.stringify(summary)}
Current Configuration: ${JSON.stringify(config?.styling)}`;
  }

  // Fallback methods
  private static getDefaultEmbedConfiguration(creatorId: string, productId: string, embedType: string): EmbedConfiguration {
    return {
      id: `embed_${Date.now()}`,
      creatorId,
      productId,
      embedType: embedType as EmbedConfiguration['embedType'],
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
  }

  private static getFallbackPerformanceAnalysis(embedId: string, timeframe: string) {
    return {
      metrics: {
        embedId,
        timeframe,
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0,
          loadTime: 1000,
          bounceRate: 0.5,
          engagementScore: 0.5
        },
        insights: {
          topPerformingVariants: [],
          underperformingElements: [],
          optimizationOpportunities: ['Enable analytics tracking', 'Set up A/B testing'],
          demographicBreakdown: {}
        }
      },
      recommendations: {
        embedId,
        recommendations: [
          {
            type: 'technical' as const,
            priority: 'medium' as const,
            description: 'Enable performance tracking to get detailed insights',
            expectedImpact: 'Better optimization capabilities',
            implementationEffort: 'low' as const,
            estimatedLift: 10,
            aiGenerated: false
          }
        ],
        abTestSuggestions: []
      }
    };
  }

  private static getFallbackRealTimeMetrics() {
    return {
      currentMetrics: {
        activeViews: 0,
        clicksLastHour: 0,
        conversionsLastHour: 0,
        errorRate: 0,
        averageLoadTime: 1000
      },
      alerts: []
    };
  }
}