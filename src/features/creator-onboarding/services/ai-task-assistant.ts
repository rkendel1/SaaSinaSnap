import OpenAI from 'openai';

import { openaiServerClient } from '@/libs/openai/openai-server-client';

import type { CreatorProfile } from '../types';

export interface TaskAssistanceRequest {
  taskId: string;
  taskType: 'product-setup' | 'embed-creation' | 'storefront-customization' | 'integration-setup' | 'optimization-audit';
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
        timeout: 30000,
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
   * Generate task-specific recommendations
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
  }> {
    const systemPrompt = this.createRecommendationSystemPrompt(creatorProfile, taskType);
    
    const completion = await openaiServerClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate personalized recommendations for this task based on my business profile." }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6
    });

    const aiResponseContent = completion.choices[0].message?.content;
    if (!aiResponseContent) throw new Error("AI returned an empty response.");

    const parsedResponse = JSON.parse(aiResponseContent);
    
    return {
      recommendations: parsedResponse.recommendations || [],
      quickActions: parsedResponse.quickActions || []
    };
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
- Growth strategy development`
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
      'optimization-audit': [
        'Run a performance check',
        'Review analytics data',
        'Implement improvements'
      ]
    };
    
    return nextSteps[taskType] || ['Plan your approach', 'Start with basics', 'Test and iterate'];
  }
}