import OpenAI from 'openai';

import { openaiServerClient } from '@/libs/openai/openai-server-client';

import type { CreatorProfile } from '../types';

export interface OnboardingOptimization {
  recommendedPath: OnboardingPathRecommendation;
  predictedChallenges: string[];
  successPredictors: string[];
  assetRecommendations: AssetRecommendation[];
  timeEstimate: {
    optimistic: number; // in minutes
    realistic: number;
    pessimistic: number;
  };
  churnRiskFactors: string[];
  engagementBoosts: string[];
}

export interface OnboardingPathRecommendation {
  path: 'express' | 'standard' | 'comprehensive';
  reason: string;
  steps: Array<{
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedTime: number;
    dependencies: string[];
    aiGuidance: string;
  }>;
}

export interface AssetRecommendation {
  type: 'logo' | 'banner' | 'product-image' | 'marketing-copy' | 'color-palette' | 'brand-guide';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  aiGeneratedContent?: {
    prompt: string;
    generatedAsset?: string;
    alternatives?: string[];
  };
  templates?: string[];
}

export interface BusinessIntelligence {
  marketSegment: string;
  competitiveAdvantages: string[];
  monetizationPotential: 'high' | 'medium' | 'low';
  growthDrivers: string[];
  riskFactors: string[];
  recommendedPricing: {
    strategy: string;
    tiers: Array<{
      name: string;
      price: number;
      features: string[];
      reasoning: string;
    }>;
  };
}

export class AIOnboardingOptimizerService {
  /**
   * Analyze creator profile and predict optimal onboarding path
   */
  static async optimizeOnboardingPath(
    creatorProfile: CreatorProfile,
    businessContext?: {
      industry?: string;
      targetMarket?: string;
      businessModel?: string;
      experience?: string;
    }
  ): Promise<OnboardingOptimization> {
    const systemPrompt = this.createOnboardingOptimizationPrompt(creatorProfile, businessContext);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.createAnalysisRequest(creatorProfile, businessContext) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent recommendations
        max_tokens: 1500
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        recommendedPath: parsedResponse.recommendedPath || this.getDefaultPath(),
        predictedChallenges: parsedResponse.predictedChallenges || [],
        successPredictors: parsedResponse.successPredictors || [],
        assetRecommendations: parsedResponse.assetRecommendations || [],
        timeEstimate: parsedResponse.timeEstimate || { optimistic: 30, realistic: 60, pessimistic: 120 },
        churnRiskFactors: parsedResponse.churnRiskFactors || [],
        engagementBoosts: parsedResponse.engagementBoosts || []
      };
    } catch (error) {
      console.error('Error in onboarding optimization:', error);
      return this.getFallbackOptimization();
    }
  }

  /**
   * Generate AI-powered asset recommendations and content
   */
  static async generateAssetRecommendations(
    creatorProfile: CreatorProfile,
    assetType: AssetRecommendation['type']
  ): Promise<AssetRecommendation[]> {
    const systemPrompt = this.createAssetGenerationPrompt(creatorProfile, assetType);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${assetType} recommendations for ${creatorProfile.business_name || 'this business'}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      return parsedResponse.recommendations || [];
    } catch (error) {
      console.error('Error generating asset recommendations:', error);
      return this.getFallbackAssetRecommendations(assetType);
    }
  }

  /**
   * Analyze business potential and provide intelligence insights
   */
  static async analyzeBusinessIntelligence(
    creatorProfile: CreatorProfile,
    marketData?: {
      competitorAnalysis?: string[];
      marketSize?: string;
      trends?: string[];
    }
  ): Promise<BusinessIntelligence> {
    const systemPrompt = this.createBusinessIntelligencePrompt(creatorProfile, marketData);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze this business and provide comprehensive intelligence insights." }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1200
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        marketSegment: parsedResponse.marketSegment || 'General SaaS',
        competitiveAdvantages: parsedResponse.competitiveAdvantages || [],
        monetizationPotential: parsedResponse.monetizationPotential || 'medium',
        growthDrivers: parsedResponse.growthDrivers || [],
        riskFactors: parsedResponse.riskFactors || [],
        recommendedPricing: parsedResponse.recommendedPricing || this.getDefaultPricingStrategy()
      };
    } catch (error) {
      console.error('Error in business intelligence analysis:', error);
      return this.getFallbackBusinessIntelligence();
    }
  }

  /**
   * Real-time onboarding progress optimization
   */
  static async optimizeNextStep(
    creatorProfile: CreatorProfile,
    currentStep: number,
    completedSteps: string[],
    userBehavior: {
      timeSpent: number;
      completionRate: number;
      strugglingAreas: string[];
    }
  ): Promise<{
    nextStep: string;
    reasoning: string;
    adaptations: string[];
    riskMitigation: string[];
  }> {
    const systemPrompt = this.createProgressOptimizationPrompt(creatorProfile, userBehavior);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Current progress: Step ${currentStep}, Completed: ${completedSteps.join(', ')}, Time spent: ${userBehavior.timeSpent}min, Completion rate: ${userBehavior.completionRate}%` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 600
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        nextStep: parsedResponse.nextStep || 'continue-current',
        reasoning: parsedResponse.reasoning || 'Continuing with standard flow',
        adaptations: parsedResponse.adaptations || [],
        riskMitigation: parsedResponse.riskMitigation || []
      };
    } catch (error) {
      console.error('Error in progress optimization:', error);
      return {
        nextStep: 'continue-current',
        reasoning: 'Following standard onboarding flow',
        adaptations: [],
        riskMitigation: []
      };
    }
  }

  private static createOnboardingOptimizationPrompt(
    profile: CreatorProfile,
    context?: any
  ): string {
    const businessInfo = `
Business: ${profile.business_name || 'Not specified'}
Description: ${profile.business_description || 'Not provided'}
Industry: ${context?.industry || 'Not specified'}
Experience: ${context?.experience || 'Not specified'}
Target Market: ${context?.targetMarket || 'Not specified'}
`;

    return `You are an expert SaaS onboarding optimization consultant with 15+ years of experience in creator success and retention. Analyze the creator's profile and provide detailed onboarding optimization.

Creator Profile:
${businessInfo}

Your expertise includes:
- Creator psychology and motivation patterns
- Onboarding conversion optimization
- Churn prediction and prevention
- Asset creation strategies
- Time-to-value acceleration

Respond with a JSON object containing:
{
  "recommendedPath": {
    "path": "express|standard|comprehensive",
    "reason": "Detailed reasoning for path recommendation",
    "steps": [
      {
        "id": "step-identifier",
        "priority": "critical|high|medium|low",
        "estimatedTime": 15,
        "dependencies": ["other-step-ids"],
        "aiGuidance": "Specific AI guidance for this step"
      }
    ]
  },
  "predictedChallenges": ["Specific challenges this creator might face"],
  "successPredictors": ["Factors that indicate likely success"],
  "assetRecommendations": [
    {
      "type": "logo|banner|product-image|marketing-copy|color-palette|brand-guide",
      "title": "Asset title",
      "description": "Why this asset is important",
      "priority": "critical|high|medium|low"
    }
  ],
  "timeEstimate": {
    "optimistic": 30, 
    "realistic": 60, 
    "pessimistic": 120
  },
  "churnRiskFactors": ["Factors that might cause creator to abandon"],
  "engagementBoosts": ["Actions to increase engagement and completion"]
}

Provide actionable, specific recommendations based on the creator's profile and context.`;
  }

  private static createAssetGenerationPrompt(
    profile: CreatorProfile,
    assetType: string
  ): string {
    return `You are a professional brand and marketing asset specialist. Generate recommendations for ${assetType} assets.

Creator Profile:
Business: ${profile.business_name || 'Not specified'}
Description: ${profile.business_description || 'Not provided'}

Respond with JSON:
{
  "recommendations": [
    {
      "type": "${assetType}",
      "title": "Asset name",
      "description": "Detailed description and usage",
      "priority": "critical|high|medium|low",
      "aiGeneratedContent": {
        "prompt": "AI generation prompt",
        "alternatives": ["Alternative variations"]
      },
      "templates": ["Template suggestions"]
    }
  ]
}`;
  }

  private static createBusinessIntelligencePrompt(
    profile: CreatorProfile,
    marketData?: any
  ): string {
    return `You are a senior business intelligence analyst specializing in SaaS market analysis. Provide comprehensive business intelligence insights.

Creator Profile:
Business: ${profile.business_name || 'Not specified'}
Description: ${profile.business_description || 'Not provided'}

Respond with JSON:
{
  "marketSegment": "Specific market segment",
  "competitiveAdvantages": ["Unique advantages"],
  "monetizationPotential": "high|medium|low",
  "growthDrivers": ["Key growth opportunities"],
  "riskFactors": ["Potential risks and challenges"],
  "recommendedPricing": {
    "strategy": "Pricing strategy recommendation",
    "tiers": [
      {
        "name": "Tier name",
        "price": 29,
        "features": ["Key features"],
        "reasoning": "Why this tier makes sense"
      }
    ]
  }
}`;
  }

  private static createProgressOptimizationPrompt(
    profile: CreatorProfile,
    behavior: any
  ): string {
    return `You are an onboarding experience optimizer. Analyze current progress and recommend next steps.

Creator Profile:
Business: ${profile.business_name || 'Not specified'}

User Behavior:
- Time spent: ${behavior.timeSpent} minutes
- Completion rate: ${behavior.completionRate}%
- Struggling with: ${behavior.strugglingAreas?.join(', ') || 'None identified'}

Respond with JSON:
{
  "nextStep": "recommended-next-step",
  "reasoning": "Why this step is recommended",
  "adaptations": ["Adaptations to improve experience"],
  "riskMitigation": ["Actions to prevent abandonment"]
}`;
  }

  private static createAnalysisRequest(
    profile: CreatorProfile,
    context?: any
  ): string {
    return `Analyze this creator's profile and optimize their onboarding journey for maximum success and minimal time-to-value.`;
  }

  private static getDefaultPath(): OnboardingPathRecommendation {
    return {
      path: 'standard',
      reason: 'Standard path recommended for typical SaaS creator onboarding',
      steps: [
        {
          id: 'business-setup',
          priority: 'critical',
          estimatedTime: 15,
          dependencies: [],
          aiGuidance: 'Focus on clear business positioning and value proposition'
        },
        {
          id: 'product-setup',
          priority: 'high',
          estimatedTime: 20,
          dependencies: ['business-setup'],
          aiGuidance: 'Create compelling product offerings with clear pricing'
        },
        {
          id: 'storefront-customization',
          priority: 'medium',
          estimatedTime: 25,
          dependencies: ['product-setup'],
          aiGuidance: 'Ensure branding consistency and professional appearance'
        }
      ]
    };
  }

  private static getFallbackOptimization(): OnboardingOptimization {
    return {
      recommendedPath: this.getDefaultPath(),
      predictedChallenges: ['Technical complexity', 'Time constraints', 'Feature overwhelm'],
      successPredictors: ['Clear business vision', 'Defined target market', 'Previous experience'],
      assetRecommendations: [],
      timeEstimate: { optimistic: 30, realistic: 60, pessimistic: 120 },
      churnRiskFactors: ['Complexity', 'Long setup time', 'Unclear value'],
      engagementBoosts: ['Step-by-step guidance', 'Quick wins', 'Progress visualization']
    };
  }

  private static getFallbackAssetRecommendations(assetType: string): AssetRecommendation[] {
    return [
      {
        type: assetType as AssetRecommendation['type'],
        title: `Professional ${assetType}`,
        description: `A professional ${assetType} for your business`,
        priority: 'medium'
      }
    ];
  }

  private static getDefaultPricingStrategy() {
    return {
      strategy: 'Tiered pricing with free trial',
      tiers: [
        {
          name: 'Starter',
          price: 29,
          features: ['Basic features', 'Email support'],
          reasoning: 'Accessible entry point for new customers'
        },
        {
          name: 'Professional',
          price: 79,
          features: ['Advanced features', 'Priority support', 'Analytics'],
          reasoning: 'Best value for growing businesses'
        }
      ]
    };
  }

  private static getFallbackBusinessIntelligence(): BusinessIntelligence {
    return {
      marketSegment: 'General SaaS',
      competitiveAdvantages: [],
      monetizationPotential: 'medium',
      growthDrivers: [],
      riskFactors: [],
      recommendedPricing: this.getDefaultPricingStrategy()
    };
  }
}