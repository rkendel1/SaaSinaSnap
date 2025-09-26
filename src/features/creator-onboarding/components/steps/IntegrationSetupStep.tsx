'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CheckCircle, MessageSquare, Plus, Settings, Webhook, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

import { updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { BusinessTypeOption, CreatorProfile } from '../../types';

interface IntegrationSetupStepProps {
  profile: CreatorProfile;
  businessType: BusinessTypeOption | null;
  selectedFeatures: string[];
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  config?: Record<string, any>;
  recommended: boolean;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
}

export function IntegrationSetupStep({ 
  profile, 
  businessType, 
  selectedFeatures, 
  setSubmitFunction 
}: IntegrationSetupStepProps) {
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpoint[]>([
    {
      id: '1',
      url: '',
      events: ['subscription.created', 'subscription.updated', 'payment.succeeded'],
      enabled: true,
    }
  ]);

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get notifications about new customers and payments',
      icon: MessageSquare,
      enabled: false,
      recommended: true,
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect to 5000+ apps with automated workflows',
      icon: Zap,
      enabled: false,
      recommended: businessType?.id === 'saas' || businessType?.id === 'ecommerce',
    },
    {
      id: 'analytics',
      name: 'Google Analytics',
      description: 'Track visitor behavior and conversion metrics',
      icon: BarChart3,
      enabled: false,
      recommended: true,
    },
    {
      id: 'custom-webhook',
      name: 'Custom Webhooks',
      description: 'Send real-time data to your own systems',
      icon: Webhook,
      enabled: webhookEndpoints.some(w => w.url && w.enabled),
      recommended: businessType?.id === 'saas',
    }
  ]);

  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIntegrationToggle = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, enabled: !integration.enabled }
        : integration
    ));

    // Show different messages based on integration
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      toast({
        description: `${integration.name} ${integration.enabled ? 'disabled' : 'enabled'} successfully!`,
      });
    }
  };

  const handleWebhookToggle = (webhookId: string) => {
    setWebhookEndpoints(prev => prev.map(webhook => 
      webhook.id === webhookId 
        ? { ...webhook, enabled: !webhook.enabled }
        : webhook
    ));
  };

  const handleWebhookUrlChange = (webhookId: string, url: string) => {
    setWebhookEndpoints(prev => prev.map(webhook => 
      webhook.id === webhookId 
        ? { ...webhook, url }
        : webhook
    ));

    // Update custom webhook integration status
    setIntegrations(prev => prev.map(integration => 
      integration.id === 'custom-webhook'
        ? { ...integration, enabled: webhookEndpoints.some(w => w.url && w.enabled) }
        : integration
    ));
  };

  const addWebhookEndpoint = () => {
    if (!newWebhookUrl.trim()) {
      toast({
        variant: 'destructive',
        description: 'Please enter a webhook URL.',
      });
      return;
    }

    const newWebhook: WebhookEndpoint = {
      id: Date.now().toString(),
      url: newWebhookUrl,
      events: ['subscription.created', 'subscription.updated', 'payment.succeeded'],
      enabled: true,
    };

    setWebhookEndpoints(prev => [...prev, newWebhook]);
    setNewWebhookUrl('');
    
    toast({
      description: 'Webhook endpoint added successfully!',
    });
  };

  const removeWebhookEndpoint = (webhookId: string) => {
    setWebhookEndpoints(prev => prev.filter(webhook => webhook.id !== webhookId));
    toast({
      description: 'Webhook endpoint removed.',
    });
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Save webhook and integration configuration
      const enabledIntegrations = integrations
        .filter(integration => integration.enabled)
        .map(integration => integration.id);

      const activeWebhooks = webhookEndpoints
        .filter(webhook => webhook.url && webhook.enabled);

      await updateCreatorProfileAction({
        webhook_endpoints: activeWebhooks,
        enabled_integrations: enabledIntegrations,
        onboarding_step: 5, // Advance to Review & Launch
      });

      toast({
        description: 'Integration settings saved successfully!',
      });
    } catch (error) {
      console.error('Failed to save integration setup:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save integration settings. Please try again.',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [webhookEndpoints, integrations]);

  // Set submit function for parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
  }, [handleSubmit, setSubmitFunction]);

  const recommendedIntegrations = integrations.filter(i => i.recommended);
  const otherIntegrations = integrations.filter(i => !i.recommended);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Integration Setup</h2>
        <p className="text-gray-600">
          Connect your platform to third-party tools and set up webhooks for real-time notifications.
        </p>
        {businessType && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            Recommendations for {businessType.title} businesses
          </div>
        )}
      </div>

      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="all">All Integrations</TabsTrigger>
        </TabsList>

        {/* Recommended Integrations */}
        <TabsContent value="recommended" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Recommended for Your Business</h3>
                <p className="text-sm text-gray-600">
                  Based on your business type, here are the most useful integrations
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {recommendedIntegrations.map((integration) => {
                const IconComponent = integration.icon;
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{integration.name}</h4>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => handleIntegrationToggle(integration.id)}
                    />
                  </div>
                );
              })}
            </div>

            {recommendedIntegrations.some(i => i.enabled) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Great! You&apos;ve enabled {recommendedIntegrations.filter(i => i.enabled).length} recommended integration(s).
                  </span>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Webhooks Setup */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Webhook className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Webhook Endpoints</h3>
                <p className="text-sm text-gray-600">
                  Receive real-time notifications about events in your system
                </p>
              </div>
            </div>

            {/* Add New Webhook */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900">Add Webhook Endpoint</h4>
              <div className="flex gap-3">
                <Input
                  placeholder="https://your-app.com/webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="flex-1 bg-white"
                />
                <Button onClick={addWebhookEndpoint} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Existing Webhooks */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Configured Endpoints</h4>
              {webhookEndpoints.map((webhook, index) => (
                <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        Endpoint {index + 1}
                      </span>
                      <Switch
                        checked={webhook.enabled}
                        onCheckedChange={() => handleWebhookToggle(webhook.id)}
                      />
                    </div>
                    {webhookEndpoints.length > 1 && (
                      <Button
                        onClick={() => removeWebhookEndpoint(webhook.id)}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    placeholder="https://your-app.com/webhook"
                    value={webhook.url}
                    onChange={(e) => handleWebhookUrlChange(webhook.id, e.target.value)}
                    className="mb-3 bg-white"
                  />
                  
                  <div className="text-xs text-gray-600">
                    Events: {webhook.events.join(', ')}
                  </div>
                </div>
              ))}
            </div>

            {webhookEndpoints.some(w => w.url && w.enabled) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Testing Your Webhooks</h4>
                <p className="text-sm text-blue-800">
                  Once your platform is live, you can test webhooks in your dashboard. 
                  We&apos;ll send test events to verify your endpoints are working correctly.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* All Integrations */}
        <TabsContent value="all" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">All Available Integrations</h3>
                <p className="text-sm text-gray-600">
                  Connect to popular tools and services
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {integrations.map((integration) => {
                const IconComponent = integration.icon;
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{integration.name}</h4>
                          {integration.recommended && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => handleIntegrationToggle(integration.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Integration Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• {integrations.filter(i => i.enabled).length} integrations enabled</p>
          <p>• {webhookEndpoints.filter(w => w.url && w.enabled).length} webhook endpoint(s) configured</p>
          <p>• You can modify these settings anytime from your dashboard</p>
        </div>
      </div>
    </div>
  );
}