'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiKeyManager } from '@/features/api-key-management/components/ApiKeyManager';
import { SubscriberApiKeyDashboard } from '@/features/api-key-management/components/SubscriberApiKeyDashboard';

import type { ApiKey } from '@/features/api-key-management/types';

export default function ApiKeyDemoPage() {
  const [createdApiKeys, setCreatedApiKeys] = useState<Array<{ apiKey: ApiKey; fullKey: string }>>([]);

  const handleApiKeyCreated = (apiKey: ApiKey, fullKey: string) => {
    setCreatedApiKeys(prev => [...prev, { apiKey, fullKey }]);
  };

  // Mock data for subscriber dashboard
  const mockSubscriberApiKeys: ApiKey[] = [
    {
      id: 'api-key-1',
      tenant_id: 'tenant-1',
      key_prefix: 'sk_test_',
      key_hash: 'hashed_key_1',
      key_hint: '...x7z2',
      creator_id: 'creator-1',
      customer_id: 'customer-1',
      user_id: 'user-1',
      name: 'Production API Key',
      description: 'Main API key for production environment',
      environment: 'production',
      scopes: ['read:products', 'write:usage', 'read:analytics'],
      permissions: {},
      rate_limit_per_hour: 5000,
      rate_limit_per_day: 50000,
      rate_limit_per_month: 1000000,
      usage_limits: {},
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_used_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      usage_count: 15420,
      active: true,
      auto_rotate_enabled: true,
      rotate_every_days: 90,
      next_rotation_at: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'api-key-2',
      tenant_id: 'tenant-1',
      key_prefix: 'sk_test_',
      key_hash: 'hashed_key_2',
      key_hint: '...a9m4',
      creator_id: 'creator-1',
      customer_id: 'customer-1',
      user_id: 'user-1',
      name: 'Development API Key',
      description: 'Testing and development purposes',
      environment: 'test',
      scopes: ['read:products', 'read:analytics'],
      permissions: {},
      rate_limit_per_hour: 1000,
      rate_limit_per_day: 10000,
      rate_limit_per_month: 100000,
      usage_limits: {},
      last_used_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      usage_count: 892,
      active: true,
      auto_rotate_enabled: false,
      rotate_every_days: 90,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Key Management Demo</h1>
          <p className="text-gray-600">
            Comprehensive API key management system for SaaS creators and their customers
          </p>
        </div>

        <Tabs defaultValue="creator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="creator">Creator View</TabsTrigger>
            <TabsTrigger value="subscriber">Subscriber View</TabsTrigger>
          </TabsList>

          <TabsContent value="creator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SaaS Creator API Key Management</CardTitle>
                <p className="text-gray-600">
                  Create and manage API keys for your SaaS products. These keys will be automatically 
                  delivered to customers upon successful payment.
                </p>
              </CardHeader>
              <CardContent>
                <ApiKeyManager 
                  creatorId="demo-creator-id" 
                  onApiKeyCreated={handleApiKeyCreated}
                />
              </CardContent>
            </Card>

            {createdApiKeys.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recently Created Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {createdApiKeys.map(({ apiKey, fullKey }, index) => (
                      <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-green-900">{apiKey.name}</h4>
                            <p className="text-sm text-green-700">Environment: {apiKey.environment}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            Just Created
                          </span>
                        </div>
                        <div className="mt-2">
                          <code className="block p-2 bg-white border rounded text-sm font-mono break-all">
                            {fullKey}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscriber" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer API Key Dashboard</CardTitle>
                <p className="text-gray-600">
                  What your customers see when they access their API keys through their 
                  white-labeled subscriber dashboard.
                </p>
              </CardHeader>
              <CardContent>
                <SubscriberApiKeyDashboard 
                  customerId="demo-customer-id"
                  apiKeys={mockSubscriberApiKeys}
                  onRotateKey={(keyId) => console.log('Rotating key:', keyId)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Key Features Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700">✅ Creator Configuration</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• API key requirements per product</li>
                  <li>• Delegated key management</li>
                  <li>• Configurable scopes and limits</li>
                  <li>• Expiration policies</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700">✅ Automatic Delivery</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Post-purchase key generation</li>
                  <li>• Email delivery integration</li>
                  <li>• White-labeled dashboard access</li>
                  <li>• Secure key storage</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700">✅ Customer Management</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View and regenerate keys</li>
                  <li>• Usage monitoring & analytics</li>
                  <li>• Rate limit tracking</li>
                  <li>• Key rotation & expiration</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700">✅ Security Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Encrypted key storage</li>
                  <li>• Multi-environment support</li>
                  <li>• Automatic rotation</li>
                  <li>• Audit trail logging</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700">✅ Platform Integration</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Multi-tenant architecture</li>
                  <li>• RESTful API endpoints</li>
                  <li>• Usage tracking integration</li>
                  <li>• Stripe payment integration</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700">✅ Analytics & Monitoring</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time usage statistics</li>
                  <li>• Endpoint usage tracking</li>
                  <li>• Performance monitoring</li>
                  <li>• Rate limit enforcement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}