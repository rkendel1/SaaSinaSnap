import OpenAI from 'openai';

import type { CreatorProfile } from '@/features/creator-onboarding/types';
import { openaiServerClient } from '@/libs/openai/openai-server-client';

export interface ReportBuilderRequest {
  reportType?: 'revenue' | 'customer' | 'usage' | 'custom';
  metrics?: string[];
  timeframe?: string;
  filters?: Record<string, any>;
  userQuery?: string;
}

export interface ReportBuilderResponse {
  suggestedMetrics: Array<{
    name: string;
    description: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  reportStructure: {
    title: string;
    sections: Array<{
      name: string;
      metrics: string[];
      visualizationType: 'table' | 'chart' | 'card' | 'graph';
    }>;
  };
  insights: string[];
  recommendations: string[];
}

export class ReportBuilderAIWizard {
  /**
   * Generate AI-powered report recommendations
   */
  static async generateReportRecommendations(
    creatorProfile: CreatorProfile,
    request: ReportBuilderRequest
  ): Promise<ReportBuilderResponse> {
    const systemPrompt = this.createReportBuilderSystemPrompt(creatorProfile);
    const userPrompt = this.createUserPrompt(request);

    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1200
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        suggestedMetrics: parsedResponse.suggestedMetrics || [],
        reportStructure: parsedResponse.reportStructure || { title: 'Custom Report', sections: [] },
        insights: parsedResponse.insights || [],
        recommendations: parsedResponse.recommendations || []
      };
    } catch (error) {
      console.error('Error in report builder AI wizard:', error);
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Analyze existing data to suggest optimal report structure
   */
  static async analyzeDataForReport(
    creatorProfile: CreatorProfile,
    dataSnapshot: {
      revenue?: number;
      customers?: number;
      products?: number;
      activeSubscriptions?: number;
    }
  ): Promise<{
    keyMetrics: string[];
    trends: string[];
    actionableInsights: string[];
  }> {
    const prompt = `Based on the following business data, suggest key metrics and insights for a report:
- Revenue: ${dataSnapshot.revenue || 0}
- Customers: ${dataSnapshot.customers || 0}
- Products: ${dataSnapshot.products || 0}
- Active Subscriptions: ${dataSnapshot.activeSubscriptions || 0}

Provide JSON with: keyMetrics (array), trends (array), actionableInsights (array)`;

    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a business analytics expert helping creators understand their data." },
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
      console.error('Error analyzing data for report:', error);
      return {
        keyMetrics: ['Total Revenue', 'Customer Count', 'Active Subscriptions'],
        trends: ['Monitor revenue growth', 'Track customer acquisition'],
        actionableInsights: ['Focus on customer retention', 'Optimize pricing strategy']
      };
    }
  }

  private static createReportBuilderSystemPrompt(creatorProfile: CreatorProfile): string {
    return `You are an expert data analyst and report builder assistant for SaaS businesses.
Your role is to help creators build effective, insightful reports that provide actionable business intelligence.

Creator Context:
- Business Name: ${creatorProfile.business_name || 'N/A'}
- Industry: ${creatorProfile.business_industry || 'SaaS'}
- Target Audience: ${creatorProfile.target_audience || 'General'}

Key Responsibilities:
1. Identify the most relevant metrics based on business needs
2. Structure reports for maximum clarity and actionability
3. Suggest appropriate visualization types for different data
4. Provide insights on what the metrics mean for the business
5. Recommend next steps based on report findings

Guidelines:
- Prioritize metrics that drive business decisions
- Keep reports focused and not overwhelming
- Suggest visualizations that make data easy to understand
- Always include actionable recommendations
- Consider the creator's expertise level

Return responses in JSON format with:
{
  "suggestedMetrics": [{"name": "string", "description": "string", "category": "string", "priority": "high|medium|low"}],
  "reportStructure": {"title": "string", "sections": [{"name": "string", "metrics": ["string"], "visualizationType": "table|chart|card|graph"}]},
  "insights": ["string"],
  "recommendations": ["string"]
}`;
  }

  private static createUserPrompt(request: ReportBuilderRequest): string {
    let prompt = 'I need help building a report. ';
    
    if (request.reportType) {
      prompt += `I want a ${request.reportType} report. `;
    }
    
    if (request.metrics && request.metrics.length > 0) {
      prompt += `I'm interested in these metrics: ${request.metrics.join(', ')}. `;
    }
    
    if (request.timeframe) {
      prompt += `The timeframe is: ${request.timeframe}. `;
    }
    
    if (request.userQuery) {
      prompt += `Additional context: ${request.userQuery}`;
    } else {
      prompt += 'Please suggest the best structure and metrics for this report.';
    }
    
    return prompt;
  }

  private static getFallbackRecommendations(request: ReportBuilderRequest): ReportBuilderResponse {
    const reportType = request.reportType || 'custom';
    
    const metricsByType: Record<string, any> = {
      revenue: [
        { name: 'Total Revenue', description: 'Sum of all revenue', category: 'financial', priority: 'high' },
        { name: 'Monthly Recurring Revenue (MRR)', description: 'Predictable monthly revenue', category: 'financial', priority: 'high' },
        { name: 'Average Revenue Per User (ARPU)', description: 'Revenue divided by active users', category: 'financial', priority: 'medium' },
        { name: 'Revenue Growth Rate', description: 'Month-over-month growth', category: 'financial', priority: 'high' }
      ],
      customer: [
        { name: 'Total Customers', description: 'Count of all customers', category: 'customer', priority: 'high' },
        { name: 'New Customers', description: 'Recently acquired customers', category: 'customer', priority: 'high' },
        { name: 'Customer Churn Rate', description: 'Percentage of customers lost', category: 'customer', priority: 'high' },
        { name: 'Customer Lifetime Value (CLV)', description: 'Expected total revenue per customer', category: 'customer', priority: 'medium' }
      ],
      usage: [
        { name: 'Active Users', description: 'Users actively using the platform', category: 'usage', priority: 'high' },
        { name: 'Feature Adoption Rate', description: 'Percentage using key features', category: 'usage', priority: 'medium' },
        { name: 'Daily/Monthly Active Users', description: 'Engagement metrics', category: 'usage', priority: 'high' },
        { name: 'Average Session Duration', description: 'Time spent per session', category: 'usage', priority: 'low' }
      ],
      custom: [
        { name: 'Total Revenue', description: 'Sum of all revenue', category: 'financial', priority: 'high' },
        { name: 'Total Customers', description: 'Count of all customers', category: 'customer', priority: 'high' },
        { name: 'Active Subscriptions', description: 'Currently active subscriptions', category: 'subscription', priority: 'high' },
        { name: 'Conversion Rate', description: 'Visitors to customers ratio', category: 'marketing', priority: 'medium' }
      ]
    };

    return {
      suggestedMetrics: metricsByType[reportType] || metricsByType.custom,
      reportStructure: {
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        sections: [
          {
            name: 'Key Metrics Overview',
            metrics: ['Total Revenue', 'Total Customers', 'Active Subscriptions'],
            visualizationType: 'card'
          },
          {
            name: 'Trends Analysis',
            metrics: ['Revenue Growth', 'Customer Growth'],
            visualizationType: 'chart'
          },
          {
            name: 'Detailed Breakdown',
            metrics: ['Monthly Performance', 'Product Performance'],
            visualizationType: 'table'
          }
        ]
      },
      insights: [
        'Focus on metrics that directly impact business growth',
        'Compare current performance against historical data',
        'Identify patterns and anomalies in the data'
      ],
      recommendations: [
        'Review this report weekly to track progress',
        'Set up alerts for significant changes in key metrics',
        'Share insights with your team for alignment'
      ]
    };
  }
}
