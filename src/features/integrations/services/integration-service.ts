import OpenAI from 'openai';

import { openaiServerClient } from '@/libs/openai/openai-server-client';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export interface IntegrationProvider {
  id: string;
  name: string;
  category: 'payment' | 'automation' | 'analytics' | 'communication' | 'crm' | 'marketing';
  description: string;
  capabilities: string[];
  requiresAuth: boolean;
  authType: 'oauth' | 'api-key' | 'webhook' | 'custom';
  configurationFields: Array<{
    key: string;
    type: 'text' | 'password' | 'select' | 'checkbox' | 'url';
    label: string;
    required: boolean;
    options?: string[];
    validation?: string;
  }>;
  webhookEvents?: string[];
  rateLimits?: {
    requests: number;
    period: 'minute' | 'hour' | 'day';
  };
  documentation?: {
    setupGuide: string;
    apiDocs: string;
    examples: string[];
  };
}

export interface Integration {
  id: string;
  creatorId: string;
  providerId: string;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  configuration: Record<string, any>;
  credentials: Record<string, any>; // Encrypted in database
  webhookEndpoints?: Array<{
    url: string;
    events: string[];
    secret?: string;
  }>;
  lastSync?: string;
  syncStatus?: 'success' | 'error' | 'pending';
  errorMessage?: string;
  metrics?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastRequest: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGatewayConfig {
  providerId: string;
  credentials: {
    publicKey?: string;
    secretKey?: string;
    merchantId?: string;
    webhookSecret?: string;
  };
  settings: {
    currency: string;
    allowedCountries?: string[];
    minimumAmount?: number;
    maximumAmount?: number;
    feeStructure?: {
      percentage: number;
      fixedFee: number;
    };
  };
  features: {
    subscriptions: boolean;
    oneTimePayments: boolean;
    refunds: boolean;
    disputes: boolean;
    multiCurrency: boolean;
  };
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: {
    type: 'event' | 'schedule' | 'webhook';
    condition: string;
    parameters: Record<string, any>;
  };
  actions: Array<{
    type: 'email' | 'webhook' | 'api-call' | 'data-sync' | 'notification';
    provider: string;
    configuration: Record<string, any>;
    onError: 'continue' | 'stop' | 'retry';
  }>;
  status: 'active' | 'inactive' | 'error';
  executionHistory: Array<{
    timestamp: string;
    status: 'success' | 'error';
    details: string;
  }>;
}

export class IntegrationService {
  private static readonly SUPPORTED_PROVIDERS: IntegrationProvider[] = [
    {
      id: 'paypal',
      name: 'PayPal',
      category: 'payment',
      description: 'Accept payments through PayPal with subscriptions and one-time payments',
      capabilities: ['payments', 'subscriptions', 'refunds', 'webhooks'],
      requiresAuth: true,
      authType: 'oauth',
      configurationFields: [
        { key: 'client_id', type: 'text', label: 'Client ID', required: true },
        { key: 'client_secret', type: 'password', label: 'Client Secret', required: true },
        { key: 'sandbox', type: 'checkbox', label: 'Use Sandbox', required: false },
        { key: 'webhook_id', type: 'text', label: 'Webhook ID', required: false }
      ],
      webhookEvents: ['payment.capture.completed', 'billing.subscription.created', 'billing.subscription.cancelled'],
      rateLimits: { requests: 1000, period: 'hour' },
      documentation: {
        setupGuide: '/docs/integrations/paypal',
        apiDocs: 'https://developer.paypal.com/docs/api/',
        examples: ['subscription-setup', 'one-time-payment', 'webhook-handling']
      }
    },
    {
      id: 'zapier',
      name: 'Zapier',
      category: 'automation',
      description: 'Connect to 5000+ apps with automated workflows and triggers',
      capabilities: ['webhooks', 'triggers', 'actions', 'data-sync'],
      requiresAuth: true,
      authType: 'api-key',
      configurationFields: [
        { key: 'api_key', type: 'password', label: 'API Key', required: true },
        { key: 'webhook_url', type: 'url', label: 'Webhook URL', required: false }
      ],
      webhookEvents: ['customer.created', 'subscription.updated', 'payment.received', 'usage.threshold'],
      rateLimits: { requests: 100, period: 'minute' },
      documentation: {
        setupGuide: '/docs/integrations/zapier',
        apiDocs: 'https://zapier.com/developer/documentation/v2/rest-hooks/',
        examples: ['customer-sync', 'payment-notifications', 'usage-alerts']
      }
    },
    {
      id: 'square',
      name: 'Square',
      category: 'payment',
      description: 'Accept payments through Square with comprehensive POS integration',
      capabilities: ['payments', 'subscriptions', 'invoicing', 'inventory'],
      requiresAuth: true,
      authType: 'oauth',
      configurationFields: [
        { key: 'application_id', type: 'text', label: 'Application ID', required: true },
        { key: 'access_token', type: 'password', label: 'Access Token', required: true },
        { key: 'location_id', type: 'text', label: 'Location ID', required: true },
        { key: 'environment', type: 'select', label: 'Environment', required: true, options: ['sandbox', 'production'] }
      ],
      webhookEvents: ['payment.created', 'subscription.created', 'subscription.updated'],
      rateLimits: { requests: 500, period: 'minute' },
      documentation: {
        setupGuide: '/docs/integrations/square',
        apiDocs: 'https://developer.squareup.com/docs',
        examples: ['payment-processing', 'subscription-management']
      }
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      category: 'crm',
      description: 'Sync customers and deals with HubSpot CRM for better customer management',
      capabilities: ['contact-sync', 'deal-tracking', 'email-marketing', 'analytics'],
      requiresAuth: true,
      authType: 'oauth',
      configurationFields: [
        { key: 'access_token', type: 'password', label: 'Access Token', required: true },
        { key: 'portal_id', type: 'text', label: 'Portal ID', required: true },
        { key: 'sync_frequency', type: 'select', label: 'Sync Frequency', required: true, 
          options: ['real-time', 'hourly', 'daily'] }
      ],
      webhookEvents: ['contact.created', 'deal.updated', 'subscription.changed'],
      rateLimits: { requests: 100, period: 'minute' },
      documentation: {
        setupGuide: '/docs/integrations/hubspot',
        apiDocs: 'https://developers.hubspot.com/docs/api/overview',
        examples: ['contact-sync', 'deal-creation', 'revenue-tracking']
      }
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      category: 'marketing',
      description: 'Sync customer data with Mailchimp for email marketing campaigns',
      capabilities: ['email-marketing', 'audience-sync', 'campaign-automation', 'analytics'],
      requiresAuth: true,
      authType: 'api-key',
      configurationFields: [
        { key: 'api_key', type: 'password', label: 'API Key', required: true },
        { key: 'audience_id', type: 'text', label: 'Audience ID', required: true },
        { key: 'double_optin', type: 'checkbox', label: 'Require Double Opt-in', required: false }
      ],
      webhookEvents: ['customer.subscribed', 'customer.unsubscribed', 'payment.received'],
      rateLimits: { requests: 10, period: 'minute' },
      documentation: {
        setupGuide: '/docs/integrations/mailchimp',
        apiDocs: 'https://mailchimp.com/developer/marketing/',
        examples: ['audience-sync', 'automated-campaigns', 'tag-management']
      }
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'communication',
      description: 'Get real-time notifications about payments, new customers, and important events',
      capabilities: ['notifications', 'alerts', 'reporting', 'team-collaboration'],
      requiresAuth: true,
      authType: 'oauth',
      configurationFields: [
        { key: 'webhook_url', type: 'url', label: 'Webhook URL', required: true },
        { key: 'channel', type: 'text', label: 'Default Channel', required: false },
        { key: 'notification_types', type: 'select', label: 'Notification Types', required: true,
          options: ['payments', 'customers', 'subscriptions', 'usage-alerts', 'all'] }
      ],
      webhookEvents: ['payment.received', 'customer.created', 'subscription.cancelled', 'usage.limit.reached'],
      rateLimits: { requests: 1, period: 'minute' },
      documentation: {
        setupGuide: '/docs/integrations/slack',
        apiDocs: 'https://api.slack.com/',
        examples: ['payment-notifications', 'customer-alerts', 'daily-reports']
      }
    }
  ];

  /**
   * Get all available integration providers
   */
  static getAvailableProviders(category?: IntegrationProvider['category']): IntegrationProvider[] {
    if (category) {
      return this.SUPPORTED_PROVIDERS.filter(provider => provider.category === category);
    }
    return this.SUPPORTED_PROVIDERS;
  }

  /**
   * Get integration provider by ID
   */
  static getProvider(providerId: string): IntegrationProvider | null {
    return this.SUPPORTED_PROVIDERS.find(provider => provider.id === providerId) || null;
  }

  /**
   * Generate AI-powered integration recommendations
   */
  static async generateIntegrationRecommendations(
    creatorId: string,
    businessProfile: {
      industry: string;
      businessModel: string;
      targetMarket: string;
      currentTools: string[];
      painPoints: string[];
    }
  ): Promise<Array<{
    provider: IntegrationProvider;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    expectedBenefits: string[];
    setupComplexity: 'low' | 'medium' | 'high';
    estimatedROI: string;
  }>> {
    const systemPrompt = this.createRecommendationPrompt(businessProfile);
    
    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: this.formatBusinessProfileForAI(businessProfile) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        timeout: 30000,
        max_tokens: 1200
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const aiRecommendations = JSON.parse(aiResponseContent);
      
      return this.formatAIRecommendations(aiRecommendations.recommendations || []);
    } catch (error) {
      console.error('Error generating integration recommendations:', error);
      return this.getFallbackRecommendations(businessProfile);
    }
  }

  // AI-powered recommendation methods
  private static createRecommendationPrompt(businessProfile: any): string {
    return `You are an integration specialist helping SaaS creators optimize their business operations. Analyze the business profile and recommend the most valuable integrations.

Available integrations: PayPal, Zapier, Square, HubSpot, Mailchimp, Slack

Business Profile:
- Industry: ${businessProfile.industry}
- Business Model: ${businessProfile.businessModel}
- Target Market: ${businessProfile.targetMarket}
- Current Tools: ${businessProfile.currentTools.join(', ')}
- Pain Points: ${businessProfile.painPoints.join(', ')}

Respond with JSON:
{
  "recommendations": [
    {
      "providerId": "provider-id",
      "priority": "high|medium|low",
      "reasoning": "Why this integration is recommended",
      "expectedBenefits": ["List of benefits"],
      "setupComplexity": "low|medium|high",
      "estimatedROI": "Estimated return on investment"
    }
  ]
}

Focus on integrations that solve specific pain points and align with the business model.`;
  }

  private static formatBusinessProfileForAI(profile: any): string {
    return `Analyze this business profile and recommend the most valuable integrations:
Industry: ${profile.industry}
Model: ${profile.businessModel}
Market: ${profile.targetMarket}
Current Tools: ${profile.currentTools.join(', ')}
Pain Points: ${profile.painPoints.join(', ')}`;
  }

  private static formatAIRecommendations(recommendations: any[]): Array<{
    provider: IntegrationProvider;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    expectedBenefits: string[];
    setupComplexity: 'low' | 'medium' | 'high';
    estimatedROI: string;
  }> {
    return recommendations.map(rec => {
      const provider = this.getProvider(rec.providerId);
      if (!provider) return null;
      
      return {
        provider,
        priority: rec.priority || 'medium',
        reasoning: rec.reasoning || 'Recommended based on business profile',
        expectedBenefits: rec.expectedBenefits || [],
        setupComplexity: rec.setupComplexity || 'medium',
        estimatedROI: rec.estimatedROI || 'Moderate improvement expected'
      };
    }).filter(Boolean) as any[];
  }

  private static getFallbackRecommendations(businessProfile: any): Array<{
    provider: IntegrationProvider;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    expectedBenefits: string[];
    setupComplexity: 'low' | 'medium' | 'high';
    estimatedROI: string;
  }> {
    const recommendations = [];
    
    // Always recommend Zapier for automation
    const zapier = this.getProvider('zapier');
    if (zapier) {
      recommendations.push({
        provider: zapier,
        priority: 'high' as const,
        reasoning: 'Automation can significantly reduce manual work and improve efficiency',
        expectedBenefits: ['Automated workflows', 'Time savings', 'Reduced errors'],
        setupComplexity: 'medium' as const,
        estimatedROI: 'High - automation typically saves 10-20 hours per week'
      });
    }
    
    // Recommend PayPal for payment diversity
    const paypal = this.getProvider('paypal');
    if (paypal) {
      recommendations.push({
        provider: paypal,
        priority: 'medium' as const,
        reasoning: 'Additional payment options can increase conversion rates',
        expectedBenefits: ['More payment options', 'Higher conversion rates', 'Global reach'],
        setupComplexity: 'low' as const,
        estimatedROI: 'Medium - typically 5-15% increase in conversions'
      });
    }
    
    return recommendations;
  }
}