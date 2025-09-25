import { EmbedAsset, EmbedAssetConfig } from '@/features/creator/types/embed-assets';

export interface ABTest {
  id: string;
  embed_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  
  // Test configuration
  traffic_split: number; // 0-100, percentage of traffic for variant
  start_date?: string;
  end_date?: string;
  
  // Variants
  control_version: string; // Original version ID
  variant_version: string; // Test variant ID
  
  // Goals and metrics
  primary_goal: 'clicks' | 'conversions' | 'views' | 'engagement';
  secondary_goals?: string[];
  
  // Results
  results?: ABTestResults;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ABTestResults {
  control: ABTestVariantResults;
  variant: ABTestVariantResults;
  statistical_significance: number; // 0-1
  confidence_level: number; // 0.95, 0.99, etc.
  winner?: 'control' | 'variant' | 'inconclusive';
  lift: number; // Percentage improvement
}

export interface ABTestVariantResults {
  impressions: number;
  clicks: number;
  conversions: number;
  conversion_rate: number;
  click_through_rate: number;
  bounce_rate?: number;
  avg_time_spent?: number;
}

export interface ABTestCreationOptions {
  name: string;
  description?: string;
  embedId: string;
  controlConfig: EmbedAssetConfig;
  variantConfig: EmbedAssetConfig;
  trafficSplit?: number;
  primaryGoal?: ABTest['primary_goal'];
  duration?: number; // days
  createdBy: string;
}

export class ABTestingService {
  private static tests: Map<string, ABTest> = new Map();
  private static testResults: Map<string, ABTestResults> = new Map();

  /**
   * Create a new A/B test
   */
  static async createTest(options: ABTestCreationOptions): Promise<ABTest> {
    const {
      name,
      description,
      embedId,
      controlConfig,
      variantConfig,
      trafficSplit = 50,
      primaryGoal = 'conversions',
      duration = 14,
      createdBy
    } = options;

    const testId = `test_${embedId}_${Date.now()}`;
    const now = new Date().toISOString();
    
    // Create control and variant versions
    const controlVersionId = `${embedId}_control_${Date.now()}`;
    const variantVersionId = `${embedId}_variant_${Date.now()}`;

    const test: ABTest = {
      id: testId,
      embed_id: embedId,
      name,
      description,
      status: 'draft',
      traffic_split: trafficSplit,
      end_date: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : undefined,
      control_version: controlVersionId,
      variant_version: variantVersionId,
      primary_goal: primaryGoal,
      created_by: createdBy,
      created_at: now,
      updated_at: now
    };

    this.tests.set(testId, test);
    return test;
  }

  /**
   * Start an A/B test
   */
  static async startTest(testId: string): Promise<boolean> {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'draft') return false;

    test.status = 'running';
    test.start_date = new Date().toISOString();
    test.updated_at = new Date().toISOString();

    this.tests.set(testId, test);
    return true;
  }

  /**
   * Pause an A/B test
   */
  static async pauseTest(testId: string): Promise<boolean> {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return false;

    test.status = 'paused';
    test.updated_at = new Date().toISOString();

    this.tests.set(testId, test);
    return true;
  }

  /**
   * Complete an A/B test
   */
  static async completeTest(testId: string): Promise<boolean> {
    const test = this.tests.get(testId);
    if (!test || (test.status !== 'running' && test.status !== 'paused')) return false;

    test.status = 'completed';
    test.end_date = new Date().toISOString();
    test.updated_at = new Date().toISOString();

    // Calculate final results
    const results = this.calculateResults(testId);
    if (results) {
      test.results = results;
      this.testResults.set(testId, results);
    }

    this.tests.set(testId, test);
    return true;
  }

  /**
   * Get all tests for an embed
   */
  static getTestsForEmbed(embedId: string): ABTest[] {
    return Array.from(this.tests.values()).filter(test => test.embed_id === embedId);
  }

  /**
   * Get active test for an embed
   */
  static getActiveTest(embedId: string): ABTest | null {
    return Array.from(this.tests.values()).find(test => 
      test.embed_id === embedId && test.status === 'running'
    ) || null;
  }

  /**
   * Get test by ID
   */
  static getTest(testId: string): ABTest | null {
    return this.tests.get(testId) || null;
  }

  /**
   * Record impression for A/B test
   */
  static async recordImpression(testId: string, variant: 'control' | 'variant'): Promise<void> {
    // In a real implementation, this would store in a database
    // Here we'll just increment counters in memory
    const results = this.getOrCreateResults(testId);
    results[variant].impressions++;
    this.testResults.set(testId, results);
  }

  /**
   * Record click for A/B test
   */
  static async recordClick(testId: string, variant: 'control' | 'variant'): Promise<void> {
    const results = this.getOrCreateResults(testId);
    results[variant].clicks++;
    results[variant].click_through_rate = results[variant].clicks / results[variant].impressions;
    this.testResults.set(testId, results);
  }

  /**
   * Record conversion for A/B test
   */
  static async recordConversion(testId: string, variant: 'control' | 'variant'): Promise<void> {
    const results = this.getOrCreateResults(testId);
    results[variant].conversions++;
    results[variant].conversion_rate = results[variant].conversions / results[variant].impressions;
    this.testResults.set(testId, results);
  }

  /**
   * Get current results for a test
   */
  static getResults(testId: string): ABTestResults | null {
    return this.testResults.get(testId) || null;
  }

  /**
   * Calculate statistical significance and winner
   */
  private static calculateResults(testId: string): ABTestResults | null {
    const rawResults = this.testResults.get(testId);
    if (!rawResults) return null;

    const { control, variant } = rawResults;
    
    // Calculate statistical significance using z-test
    const controlRate = control.conversion_rate;
    const variantRate = variant.conversion_rate;
    
    if (control.impressions < 100 || variant.impressions < 100) {
      // Not enough data for statistical significance
      return {
        ...rawResults,
        statistical_significance: 0,
        confidence_level: 0.95,
        winner: 'inconclusive',
        lift: 0
      };
    }

    const pooledRate = (control.conversions + variant.conversions) / (control.impressions + variant.impressions);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/control.impressions + 1/variant.impressions));
    const zScore = Math.abs(controlRate - variantRate) / standardError;
    
    // Convert z-score to p-value (approximation)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const significance = 1 - pValue;
    
    // Determine winner
    let winner: 'control' | 'variant' | 'inconclusive' = 'inconclusive';
    if (significance > 0.95) {
      winner = variantRate > controlRate ? 'variant' : 'control';
    }

    // Calculate lift
    const lift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;

    return {
      control,
      variant,
      statistical_significance: significance,
      confidence_level: 0.95,
      winner,
      lift
    };
  }

  /**
   * Get or create results object for a test
   */
  private static getOrCreateResults(testId: string): ABTestResults {
    let results = this.testResults.get(testId);
    if (!results) {
      results = {
        control: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          conversion_rate: 0,
          click_through_rate: 0
        },
        variant: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          conversion_rate: 0,
          click_through_rate: 0
        },
        statistical_significance: 0,
        confidence_level: 0.95,
        lift: 0
      };
      this.testResults.set(testId, results);
    }
    return results;
  }

  /**
   * Normal cumulative distribution function approximation
   */
  private static normalCDF(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1 + sign * y);
  }

  /**
   * Determine which variant to show for a user
   */
  static getVariantForUser(testId: string, userId: string): 'control' | 'variant' {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return 'control';

    // Simple hash-based assignment for consistent user experience
    const hash = this.simpleHash(userId + testId);
    const percentage = (hash % 100) + 1;
    
    return percentage <= test.traffic_split ? 'variant' : 'control';
  }

  /**
   * Simple hash function for user assignment
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get test insights and recommendations
   */
  static getTestInsights(testId: string): {
    insights: string[];
    recommendations: string[];
    nextSteps: string[];
  } {
    const test = this.tests.get(testId);
    const results = this.getResults(testId);
    
    const insights: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    if (!test || !results) {
      return { insights, recommendations, nextSteps };
    }

    // Generate insights based on results
    if (results.statistical_significance > 0.95) {
      insights.push(`Test results are statistically significant (${(results.statistical_significance * 100).toFixed(1)}% confidence)`);
      
      if (results.winner === 'variant') {
        insights.push(`Variant performs ${results.lift.toFixed(1)}% better than control`);
        recommendations.push('Consider implementing the variant as the new default');
      } else if (results.winner === 'control') {
        insights.push(`Control performs ${Math.abs(results.lift).toFixed(1)}% better than variant`);
        recommendations.push('Keep the original version');
      }
    } else {
      insights.push('Test results are not yet statistically significant');
      recommendations.push('Continue running the test to gather more data');
    }

    // Check sample sizes
    if (results.control.impressions < 1000 || results.variant.impressions < 1000) {
      insights.push('Sample size may be too small for reliable results');
      recommendations.push('Increase traffic or extend test duration');
    }

    // Next steps
    if (test.status === 'running') {
      nextSteps.push('Monitor test progress daily');
      nextSteps.push('Check for statistical significance');
    }

    return { insights, recommendations, nextSteps };
  }
}