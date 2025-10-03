'use client';

import { useState } from 'react';
import { CheckCircle, Copy, Key, Mail, Save, Shield, TrendingUp, Webhook } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { ApiKeyManager } from '@/features/api-key-management/components/ApiKeyManager';

interface PlatformSettingsProps {
  initialSettings?: {
    platform_name?: string;
    platform_description?: string;
    platform_url?: string;
    support_email?: string;
    notifications_enabled?: boolean;
    maintenance_mode?: boolean;
    stripe_test_account_id?: string;
    stripe_production_account_id?: string;
    webhook_endpoints?: WebhookEndpoint[];
    api_keys?: ApiKey[];
  };
  userId?: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  last_used: string;
}

export function PlatformSettings({ initialSettings, userId }: PlatformSettingsProps) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        description: 'Settings saved successfully!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: 'Copied to clipboard!',
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform_name">Platform Name</Label>
                  <Input
                    id="platform_name"
                    value={settings.platform_name || ''}
                    onChange={(e) => handleInputChange('platform_name', e.target.value)}
                    placeholder="SaaSinaSnap"
                  />
                </div>
                <div>
                  <Label htmlFor="platform_url">Platform URL</Label>
                  <Input
                    id="platform_url"
                    value={settings.platform_url || ''}
                    onChange={(e) => handleInputChange('platform_url', e.target.value)}
                    placeholder="https://yourplatform.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="platform_description">Platform Description</Label>
                <Textarea
                  id="platform_description"
                  value={settings.platform_description || ''}
                  onChange={(e) => handleInputChange('platform_description', e.target.value)}
                  placeholder="A brief description of your platform..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email || ''}
                  onChange={(e) => handleInputChange('support_email', e.target.value)}
                  placeholder="support@yourplatform.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive email notifications for platform events</p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notifications_enabled || false}
                  onCheckedChange={(checked) => handleInputChange('notifications_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">Put the platform in maintenance mode</p>
                </div>
                <Switch
                  id="maintenance"
                  checked={settings.maintenance_mode || false}
                  onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stripe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Test Account ID</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={settings.stripe_test_account_id || 'Not connected'}
                      disabled
                      className="bg-gray-50"
                    />
                    {settings.stripe_test_account_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(settings.stripe_test_account_id!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {settings.stripe_test_account_id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm text-gray-600">
                      {settings.stripe_test_account_id ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Production Account ID</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={settings.stripe_production_account_id || 'Not connected'}
                      disabled
                      className="bg-gray-50"
                    />
                    {settings.stripe_production_account_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(settings.stripe_production_account_id!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {settings.stripe_production_account_id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm text-gray-600">
                      {settings.stripe_production_account_id ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Stripe Account Management</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Connect or manage your Stripe accounts through the Environment Setup page.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <a href="/platform-owner-onboarding">Manage Stripe Accounts</a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Webhook className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Webhook management interface will be available here.</p>
                <p className="text-sm mt-2">Configure webhook endpoints to receive real-time notifications.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
              <CardDescription>
                Configure and manage API keys for your platform and creators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userId ? (
                <ApiKeyManager creatorId={userId} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Please log in to manage API keys</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}