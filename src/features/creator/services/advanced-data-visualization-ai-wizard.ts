import OpenAI from 'openai';

import type { CreatorProfile } from '@/features/creator-onboarding/types';
import { openaiServerClient } from '@/libs/openai/openai-server-client';

export type VisualizationType = 'heatmap' | 'trend' | 'journey' | 'funnel' | 'cohort' | 'distribution' | 'comparison';

export interface VisualizationRequest {
  dataType: string;
  visualizationType?: VisualizationType;
  metrics: string[];
  dimensions?: string[];
  timeframe?: string;
  userGoal?: string;
}

export interface VisualizationResponse {
  recommendedVisualization: VisualizationType;
  configuration: {
    chartType: string;
    axes: {
      x: string;
      y: string;
      secondary?: string;
    };
    colors: string[];
    interactions: string[];
  };
  insights: Array<{
    type: 'trend' | 'anomaly' | 'pattern' | 'comparison';
    description: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  recommendations: string[];
  alternativeVisualizations: Array<{
    type: VisualizationType;
    reason: string;
    useCase: string;
  }>;
}

export interface DataVisualizationInsights {
  patterns: string[];
  trends: string[];
  anomalies: string[];
  actionableInsights: string[];
  predictiveInsights?: string[];
}

export class AdvancedDataVisualizationAIWizard {
  /**
   * Generate AI-powered visualization recommendations
   */
  static async generateVisualizationRecommendations(
    creatorProfile: CreatorProfile,
    request: VisualizationRequest
  ): Promise<VisualizationResponse> {
    const systemPrompt = this.createVisualizationSystemPrompt(creatorProfile);
    const userPrompt = this.createUserPrompt(request);

    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 1500
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        recommendedVisualization: parsedResponse.recommendedVisualization || 'trend',
        configuration: parsedResponse.configuration || this.getDefaultConfiguration('trend'),
        insights: parsedResponse.insights || [],
        recommendations: parsedResponse.recommendations || [],
        alternativeVisualizations: parsedResponse.alternativeVisualizations || []
      };
    } catch (error) {
      console.error('Error in data visualization AI wizard:', error);
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Analyze data to extract insights for visualization
   */
  static async analyzeDataForVisualization(
    data: Record<string, any>[],
    metrics: string[]
  ): Promise<DataVisualizationInsights> {
    const sampleData = data.slice(0, 50); // Analyze first 50 records
    
    const prompt = `Analyze this business data and identify patterns, trends, and insights:
Metrics: ${metrics.join(', ')}
Sample data: ${JSON.stringify(sampleData.slice(0, 10))}

Identify:
1. Key patterns in the data
2. Trends over time
3. Anomalies or outliers
4. Actionable insights for business improvement
5. Predictive insights for future trends

Return JSON with: patterns (array), trends (array), anomalies (array), actionableInsights (array), predictiveInsights (array)`;

    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a data analytics expert specializing in business intelligence and visualization." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      return JSON.parse(aiResponseContent);
    } catch (error) {
      console.error('Error analyzing data for visualization:', error);
      return {
        patterns: ['Data shows regular patterns'],
        trends: ['Monitor trends over time'],
        anomalies: [],
        actionableInsights: ['Focus on key metrics', 'Track performance regularly']
      };
    }
  }

  /**
   * Suggest optimal visualization for specific business questions
   */
  static async suggestVisualizationForQuestion(
    question: string,
    availableMetrics: string[]
  ): Promise<{
    visualizationType: VisualizationType;
    reasoning: string;
    requiredMetrics: string[];
    setup: string[];
  }> {
    const prompt = `A creator wants to answer this business question: "${question}"
Available metrics: ${availableMetrics.join(', ')}

Suggest the best visualization type and explain why. Also specify which metrics to use.
Return JSON with: visualizationType, reasoning, requiredMetrics (array), setup (array of steps)`;

    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a data visualization expert helping creators understand their data." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 800
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      return JSON.parse(aiResponseContent);
    } catch (error) {
      console.error('Error suggesting visualization for question:', error);
      return {
        visualizationType: 'trend',
        reasoning: 'Trend visualization shows changes over time',
        requiredMetrics: availableMetrics.slice(0, 2),
        setup: ['Select your metrics', 'Choose time range', 'Generate visualization']
      };
    }
  }

  private static createVisualizationSystemPrompt(creatorProfile: CreatorProfile): string {
    return `You are an expert data visualization specialist helping SaaS creators understand their data through visual insights.
Your role is to recommend the most effective visualization techniques for different types of data and business questions.

Creator Context:
- Business Name: ${creatorProfile.business_name || 'N/A'}
- Industry: ${creatorProfile.business_industry || 'SaaS'}

Key Responsibilities:
1. Recommend optimal visualization types based on data characteristics
2. Configure visualizations for maximum clarity and insight
3. Identify patterns, trends, and anomalies in the data
4. Provide actionable recommendations based on visualizations
5. Suggest alternative visualizations for different use cases

Visualization Types:
- Heatmap: Show intensity/density of data across two dimensions
- Trend: Display changes over time with line/area charts
- Journey: Map user flows and pathways through the product
- Funnel: Visualize conversion steps and drop-off rates
- Cohort: Analyze user behavior by time-based groups
- Distribution: Show how data is spread across ranges
- Comparison: Compare metrics across categories or time periods

Guidelines:
- Match visualization type to data characteristics
- Prioritize clarity and ease of understanding
- Use colors effectively to highlight insights
- Make visualizations interactive when beneficial
- Always include context and labels
- Focus on actionable insights, not just pretty charts

Return responses in JSON format with:
{
  "recommendedVisualization": "heatmap|trend|journey|funnel|cohort|distribution|comparison",
  "configuration": {"chartType": "string", "axes": {"x": "string", "y": "string"}, "colors": ["string"], "interactions": ["string"]},
  "insights": [{"type": "trend|anomaly|pattern|comparison", "description": "string", "severity": "info|warning|critical"}],
  "recommendations": ["string"],
  "alternativeVisualizations": [{"type": "string", "reason": "string", "useCase": "string"}]
}`;
  }

  private static createUserPrompt(request: VisualizationRequest): string {
    let prompt = `I need help visualizing ${request.dataType} data. `;
    
    if (request.visualizationType) {
      prompt += `I'm interested in a ${request.visualizationType} visualization. `;
    }
    
    if (request.metrics && request.metrics.length > 0) {
      prompt += `The metrics I want to visualize are: ${request.metrics.join(', ')}. `;
    }
    
    if (request.dimensions && request.dimensions.length > 0) {
      prompt += `Dimensions: ${request.dimensions.join(', ')}. `;
    }
    
    if (request.timeframe) {
      prompt += `Timeframe: ${request.timeframe}. `;
    }
    
    if (request.userGoal) {
      prompt += `My goal is: ${request.userGoal}. `;
    } else {
      prompt += 'Please suggest the best visualization approach for this data.';
    }
    
    return prompt;
  }

  private static getFallbackRecommendations(request: VisualizationRequest): VisualizationResponse {
    const visualizationType = request.visualizationType || 'trend';
    
    const configByType: Record<VisualizationType, any> = {
      heatmap: {
        chartType: 'heatmap',
        axes: { x: 'time', y: 'metric' },
        colors: ['#3b82f6', '#ef4444', '#10b981'],
        interactions: ['hover', 'zoom', 'filter']
      },
      trend: {
        chartType: 'line',
        axes: { x: 'time', y: 'value' },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
        interactions: ['hover', 'zoom', 'compare']
      },
      journey: {
        chartType: 'sankey',
        axes: { x: 'step', y: 'users' },
        colors: ['#3b82f6', '#6366f1', '#8b5cf6'],
        interactions: ['hover', 'drill-down']
      },
      funnel: {
        chartType: 'funnel',
        axes: { x: 'stage', y: 'count' },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        interactions: ['hover', 'compare']
      },
      cohort: {
        chartType: 'cohort-table',
        axes: { x: 'time', y: 'cohort' },
        colors: ['#3b82f6', '#10b981', '#f59e0b'],
        interactions: ['hover', 'filter']
      },
      distribution: {
        chartType: 'histogram',
        axes: { x: 'range', y: 'frequency' },
        colors: ['#3b82f6', '#6366f1'],
        interactions: ['hover', 'bin-size']
      },
      comparison: {
        chartType: 'bar',
        axes: { x: 'category', y: 'value' },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        interactions: ['hover', 'sort', 'filter']
      }
    };

    return {
      recommendedVisualization: visualizationType,
      configuration: configByType[visualizationType],
      insights: [
        {
          type: 'trend',
          description: 'Review your data patterns to identify growth opportunities',
          severity: 'info'
        },
        {
          type: 'pattern',
          description: 'Look for recurring patterns in your metrics',
          severity: 'info'
        }
      ],
      recommendations: [
        'Regularly review visualizations to track progress',
        'Compare current performance against historical data',
        'Share insights with your team for better decision-making'
      ],
      alternativeVisualizations: [
        {
          type: 'trend',
          reason: 'Show changes over time',
          useCase: 'Track growth and identify trends'
        },
        {
          type: 'comparison',
          reason: 'Compare different metrics',
          useCase: 'Understand relative performance'
        }
      ]
    };
  }

  private static getDefaultConfiguration(type: VisualizationType): any {
    return this.getFallbackRecommendations({ 
      dataType: 'metrics', 
      metrics: [], 
      visualizationType: type 
    }).configuration;
  }
}
