import OpenAI from 'openai';

import { openaiServerClient } from '@/libs/openai/openai-server-client';

import type { CreatorProfile } from '../types';

export interface TaskAssistanceRequest {
  taskId: string;
  taskType: 'product-setup' | 'embed-creation' | 'storefront-customization' | 'integration-setup' | 'account-setup' | 'optimization-audit' | 'environment-setup';
  userMessage: string;
  context?: Record<string, any>;
}

export interface TaskAssistanceResponse {
  response: string;
  suggestions: string[];
  nextSteps: string[];
  resources?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  confidence: number;
}

export class AITaskAssistantService {
  
  /**
   * Get AI assistance for a specific task
   */
  static async getTaskAssistance(
    creatorProfile: CreatorProfile,
    request: TaskAssistanceRequest
  ): Promise<TaskAssistanceResponse> {
    const systemPrompt = this.createTaskSystemPrompt(creatorProfile, request.taskType);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponseContent);
      } catch (error) {
        console.error('Failed to parse AI task assistance response:', aiResponseContent);
        throw new Error("AI returned an invalid JSON response.");
      }

      return {
        response: parsedResponse.response || "I'll help you with that task.",
        suggestions: parsedResponse.suggestions || [],
        nextSteps: parsedResponse.nextSteps || [],
        resources: parsedResponse.resources || [],
        confidence: parsedResponse.confidence || 0.8
      };
    } catch (error) {
      console.error('Error in AI task assistance:', error);
      
      // Provide helpful fallback response
      return {
        response: error instanceof Error && error.message.includes('AI service')
          ? `${error.message} However, I can still provide some general guidance for ${request.taskType.replace('-', ' ')} tasks based on best practices.`
          : `I encountered a technical issue, but I can still help you with ${request.taskType.replace('-', ' ')} using my knowledge base.`,
        suggestions: this.getFallbackSuggestions(request.taskType),
        nextSteps: this.getFallbackNextSteps(request.taskType),
        resources: [],
        confidence: 0.6
      };
    }
  }

  /**
   * Generate task-specific recommendations with predictive insights
   */
  static async generateTaskRecommendations(
    creatorProfile: CreatorProfile,
    taskType: TaskAssistanceRequest['taskType']
  ): Promise<{
    recommendations: string[];
    quickActions: Array<{
      title: string;
      action: string;
      description: string;
    }>;
    predictiveInsights?: {
      successProbability: number;
      timeToComplete: string;
      potentialChallenges: string[];
      optimizationTips: string[];
    };
  }> {
    const systemPrompt = this.createEnhancedRecommendationSystemPrompt(creatorProfile, taskType);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate personalized recommendations with predictive insights for this task based on my business profile." }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 1000
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        recommendations: parsedResponse.recommendations || [],
        quickActions: parsedResponse.quickActions || [],
        predictiveInsights: parsedResponse.predictiveInsights
      };
    } catch (error) {
      console.error('Error generating enhanced task recommendations:', error);
      return {
        recommendations: this.getFallbackRecommendations(taskType),
        quickActions: this.getFallbackQuickActions(taskType)
      };
    }
  }

  /**
   * Generate churn reduction recommendations for onboarding
   */
  static async generateChurnReductionRecommendations(
    creatorProfile: CreatorProfile,
    onboardingProgress: {
      currentStep: number;
      timeSpent: number;
      strugglingAreas: string[];
      completionRate: number;
    }
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    interventions: Array<{
      type: 'guidance' | 'simplification' | 'incentive' | 'support';
      priority: 'critical' | 'high' | 'medium';
      action: string;
      expectedImpact: string;
    }>;
    engagementBoosts: string[];
  }> {
    const systemPrompt = this.createChurnReductionPrompt(creatorProfile, onboardingProgress);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze onboarding progress and recommend churn reduction strategies.` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        riskLevel: parsedResponse.riskLevel || 'medium',
        interventions: parsedResponse.interventions || [],
        engagementBoosts: parsedResponse.engagementBoosts || []
      };
    } catch (error) {
      console.error('Error generating churn reduction recommendations:', error);
      return {
        riskLevel: 'medium',
        interventions: [],
        engagementBoosts: ['Provide step-by-step guidance', 'Offer live support', 'Show progress indicators']
      };
    }
  }

  private static createTaskSystemPrompt(creatorProfile: CreatorProfile, taskType: string): string {
    const businessContext = `
**Creator's Business Profile:**
- Business Name: ${creatorProfile.business_name || 'Startup'}
- Description: ${creatorProfile.business_description || 'SaaS business'}
- Industry: ${creatorProfile.business_type || 'Technology'}
- Target Market: ${creatorProfile.target_market || 'General'}
- Brand Color: ${creatorProfile.brand_color || '#3b82f6'}
- Page Slug: ${creatorProfile.page_slug}
- Onboarding Status: ${creatorProfile.onboarding_completed ? 'Completed' : 'In Progress'}
`;

    const taskExpertise = {
      'product-setup': `
You are a SaaS Product Strategy Expert specializing in product catalog optimization, pricing strategies, and subscription model design. You help creators set up compelling product offerings that convert.

**Your expertise includes:**
- Product positioning and messaging
- Pricing psychology and optimization
- Subscription tier design
- Feature bundling strategies
- Market research and competitive analysis`,

      'embed-creation': `
You are a Conversion-Focused Embed Designer Expert specializing in creating high-converting embeddable widgets. You understand user psychology, design principles, and technical implementation.

**Your expertise includes:**
- Widget design and user experience
- Conversion optimization techniques
- A/B testing for embeds
- Integration best practices
- Performance optimization`,

      'storefront-customization': `
You are a Brand Design and Storefront Optimization Expert specializing in creating cohesive, high-converting digital storefronts. You excel at brand consistency and user journey optimization.

**Your expertise includes:**
- Brand identity translation to digital
- User journey optimization
- Page hierarchy and navigation
- Visual design principles
- Conversion rate optimization`,

      'integration-setup': `
You are a Technical Integration Expert specializing in SaaS tool connections, API integrations, and workflow automation. You help creators streamline their operations.

**Your expertise includes:**
- Popular SaaS integrations
- Webhook configuration
- API best practices
- Automation workflows
- Technical troubleshooting`,

      'optimization-audit': `
You are a Business Optimization Analyst Expert specializing in comprehensive SaaS business audits. You identify growth opportunities and operational improvements.

**Your expertise includes:**
- Performance analytics
- Conversion funnel analysis
- Technical optimization
- Business process improvement
- Growth strategy development`,

      'environment-setup': `
You are a Stripe Environment Management Expert specializing in safe development practices and production deployment strategies. You help creators manage test and production environments effectively.

**Your expertise includes:**
- Test vs production environment best practices
- Safe deployment strategies
- Go-live readiness assessment
- Environment switching workflows
- Payment security and compliance
- Risk mitigation during production launch`
    };

    return `${taskExpertise[taskType] || taskExpertise['optimization-audit']}

${businessContext}

**Response Requirements:**
You must respond with a JSON object containing:

\`\`\`json
{
  "response": "Your expert response addressing their specific question/need",
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2", "Actionable suggestion 3"],
  "nextSteps": ["Next step 1", "Next step 2", "Next step 3"],
  "resources": [
    {
      "title": "Resource title",
      "url": "/relevant/path",
      "description": "Brief description of how this helps"
    }
  ],
  "confidence": 0.9
}
\`\`\`

Provide expert, actionable advice tailored to their specific business profile and current task.`;
  }

  private static createRecommendationSystemPrompt(creatorProfile: CreatorProfile, taskType: string): string {
    return `You are a Strategic Business Advisor providing personalized recommendations for ${taskType.replace('-', ' ')}.

**Creator's Business Profile:**
- Business: ${creatorProfile.business_name || 'New SaaS'} (${creatorProfile.business_description || 'Growing business'})
- Industry: ${creatorProfile.business_type || 'Technology'}
- Target Market: ${creatorProfile.target_market || 'Business professionals'}

**Task Focus:** ${taskType}

Provide JSON response with:
\`\`\`json
{
  "recommendations": [
    "Specific recommendation 1 tailored to their business",
    "Specific recommendation 2 with clear rationale",
    "Specific recommendation 3 for immediate action"
  ],
  "quickActions": [
    {
      "title": "Action Title",
      "action": "specific_action_code",
      "description": "Clear description of the benefit"
    }
  ]
}
\`\`\`

Make recommendations specific to their business type and current needs.`;
  }

  private static getFallbackSuggestions(taskType: TaskAssistanceRequest['taskType']): string[] {
    const fallbacks = {
      'product-setup': [
        'Start with your core product offering',
        'Set competitive but profitable pricing',
        'Write clear, benefit-focused descriptions'
      ],
      'embed-creation': [
        'Choose a simple, clean design',
        'Include a compelling call-to-action',
        'Test on different screen sizes'
      ],
      'storefront-customization': [
        'Keep your brand colors consistent',
        'Use high-quality images',
        'Ensure fast loading times'
      ],
      'integration-setup': [
        'Start with essential integrations',
        'Test thoroughly before going live',
        'Document your API endpoints'
      ],
      'account-setup': [
        'Review your subscription plan',
        'Update your billing information',
        'Set up payment methods for reliability'
      ],
      'optimization-audit': [
        'Check your page loading speeds',
        'Verify all links work correctly',
        'Monitor your conversion rates'
      ]
    };
    
    return fallbacks[taskType] || ['Focus on user experience', 'Test thoroughly', 'Get feedback from users'];
  }

  private static getFallbackNextSteps(taskType: TaskAssistanceRequest['taskType']): string[] {
    const nextSteps = {
      'product-setup': [
        'Create your first product',
        'Set up pricing tiers',
        'Test the purchase flow'
      ],
      'embed-creation': [
        'Choose an embed template',
        'Customize the design',
        'Generate embed code'
      ],
      'storefront-customization': [
        'Review your current pages',
        'Update brand elements',
        'Preview your changes'
      ],
      'integration-setup': [
        'Choose your integrations',
        'Configure API settings',
        'Test the connections'
      ],
      'account-setup': [
        'Visit your account dashboard',
        'Review subscription details',
        'Update billing information if needed'
      ],
      'optimization-audit': [
        'Run a performance check',
        'Review analytics data',
        'Implement improvements'
      ]
    };
    
    return nextSteps[taskType] || ['Plan your approach', 'Start with basics', 'Test and iterate'];
  }

  private static createEnhancedRecommendationSystemPrompt(creatorProfile: CreatorProfile, taskType: string): string {
    return `You are a Strategic Business Advisor providing personalized recommendations with predictive insights for ${taskType.replace('-', ' ')}.

**Creator's Business Profile:**
- Business: ${creatorProfile.business_name || 'New SaaS'} (${creatorProfile.business_description || 'Growing business'})
- Industry: ${creatorProfile.business_type || 'Technology'}
- Target Market: ${creatorProfile.target_market || 'Business professionals'}

**Task Focus:** ${taskType}

Provide JSON response with:
\`\`\`json
{
  "recommendations": [
    "Specific recommendation 1 tailored to their business",
    "Specific recommendation 2 with clear rationale", 
    "Specific recommendation 3 for immediate action"
  ],
  "quickActions": [
    {
      "title": "Action Title",
      "action": "specific_action_code",
      "description": "Clear description of the benefit"
    }
  ],
  "predictiveInsights": {
    "successProbability": 0.85,
    "timeToComplete": "2-3 days",
    "potentialChallenges": ["Challenge 1", "Challenge 2"],
    "optimizationTips": ["Tip 1", "Tip 2"]
  }
}
\`\`\`

Include predictive insights based on similar businesses and common patterns.`;
  }

  private static createChurnReductionPrompt(creatorProfile: CreatorProfile, progress: any): string {
    return `You are a Customer Success Specialist focused on reducing onboarding churn.

**Creator Profile:**
- Business: ${creatorProfile.business_name || 'New SaaS'}
- Description: ${creatorProfile.business_description || 'Not provided'}

**Onboarding Progress:**
- Current Step: ${progress.currentStep}
- Time Spent: ${progress.timeSpent} minutes
- Completion Rate: ${progress.completionRate}%
- Struggling Areas: ${progress.strugglingAreas.join(', ')}

Respond with JSON:
\`\`\`json
{
  "riskLevel": "low|medium|high",
  "interventions": [
    {
      "type": "guidance|simplification|incentive|support",
      "priority": "critical|high|medium",
      "action": "Specific intervention action",
      "expectedImpact": "Expected outcome"
    }
  ],
  "engagementBoosts": [
    "Engagement strategy 1",
    "Engagement strategy 2"
  ]
}
\`\`\`

Focus on preventing abandonment and increasing completion rates.`;
  }

  private static getFallbackRecommendations(taskType: TaskAssistanceRequest['taskType']): string[] {
    return this.getFallbackSuggestions(taskType);
  }

  private static getFallbackQuickActions(taskType: TaskAssistanceRequest['taskType']): Array<{
    title: string;
    action: string;
    description: string;
  }> {
    const actions = {
      'product-setup': [
        { title: 'Start Product Setup', action: 'create_product', description: 'Begin creating your first product' },
        { title: 'Set Pricing', action: 'configure_pricing', description: 'Configure your pricing tiers' }
      ],
      'embed-creation': [
        { title: 'Generate Embed', action: 'create_embed', description: 'Create your first embed widget' },
        { title: 'Customize Style', action: 'customize_embed', description: 'Personalize the embed appearance' }
      ],
      'storefront-customization': [
        { title: 'Update Branding', action: 'update_branding', description: 'Apply your brand colors and logo' },
        { title: 'Preview Changes', action: 'preview_storefront', description: 'See how your storefront looks' }
      ],
      'integration-setup': [
        { title: 'Connect Payment', action: 'setup_payment', description: 'Set up payment processing' },
        { title: 'Configure Webhooks', action: 'setup_webhooks', description: 'Enable real-time notifications' }
      ],
      'account-setup': [
        { title: 'View Account', action: 'view_account', description: 'Check your account dashboard' },
        { title: 'Manage Subscription', action: 'manage_subscription', description: 'Update billing and payment methods' }
      ],
      'optimization-audit': [
        { title: 'Run Audit', action: 'run_audit', description: 'Check your platform performance' },
        { title: 'Review Analytics', action: 'view_analytics', description: 'Analyze your key metrics' }
      ]
    };
    
    return actions[taskType] || [
      { title: 'Get Started', action: 'begin_task', description: 'Start working on this task' }
    ];
  }
}