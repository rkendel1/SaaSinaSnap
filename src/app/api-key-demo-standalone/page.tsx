'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Copy, Eye, EyeOff, Key, Plus, RotateCcw, Shield, TrendingUp, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function ApiKeyDemoStandalone() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [createdKeys, setCreatedKeys] = useState<any[]>([]);
  
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    environment: 'test',
    rate_limit_per_hour: 1000,
    rate_limit_per_day: 10000,
    rate_limit_per_month: 100000,
    auto_rotate_enabled: false,
    rotate_every_days: 90
  });

  // Mock subscriber API keys
  const mockSubscriberApiKeys = [
    {
      id: 'api-key-1',
      name: 'Production API Key',
      description: 'Main API key for production environment',
      environment: 'production',
      key_prefix: 'sk_live_',
      key_hint: '...x7z2',
      scopes: ['read:products', 'write:usage', 'read:analytics'],
      rate_limit_per_hour: 5000,
      rate_limit_per_day: 50000,
      rate_limit_per_month: 1000000,
      usage_count: 15420,
      last_used_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      auto_rotate_enabled: true,
      rotate_every_days: 90,
      stats: {
        requests_this_hour: 45,
        requests_today: 1250,
        requests_this_month: 15420,
        average_response_time: 142,
        error_rate: 0.02
      }
    },
    {
      id: 'api-key-2',
      name: 'Development API Key',
      description: 'Testing and development purposes',
      environment: 'test',
      key_prefix: 'sk_test_',
      key_hint: '...a9m4',
      scopes: ['read:products', 'read:analytics'],
      rate_limit_per_hour: 1000,
      rate_limit_per_day: 10000,
      rate_limit_per_month: 100000,
      usage_count: 892,
      last_used_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      auto_rotate_enabled: false,
      rotate_every_days: 90,
      stats: {
        requests_this_hour: 12,
        requests_today: 89,
        requests_this_month: 892,
        average_response_time: 95,
        error_rate: 0.01
      }
    }
  ];

  const createApiKey = () => {
    setIsCreating(true);
    
    // Simulate API call
    setTimeout(() => {
      const newKey = {
        id: `key-${Date.now()}`,
        name: createForm.name,
        description: createForm.description,
        environment: createForm.environment,
        key_prefix: createForm.environment === 'production' ? 'sk_live_' : 'sk_test_',
        full_key: `${createForm.environment === 'production' ? 'sk_live_' : 'sk_test_'}${Math.random().toString(36).substring(2, 32)}`,
        created_at: new Date().toISOString()
      };
      
      setCreatedKeys(prev => [...prev, newKey]);
      setShowCreateDialog(false);
      setCreateForm({
        name: '',
        description: '',
        environment: 'test',
        rate_limit_per_hour: 1000,
        rate_limit_per_day: 10000,
        rate_limit_per_month: 100000,
        auto_rotate_enabled: false,
        rotate_every_days: 90
      });
      setIsCreating(false);
    }, 1500);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Staryer API Key Management</h1>
          <p className="text-gray-600">
            Comprehensive API key management system for SaaS creators and their customers
          </p>
        </div>

        <Tabs defaultValue="creator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="creator">Creator Dashboard</TabsTrigger>
            <TabsTrigger value="subscriber">Customer Dashboard</TabsTrigger>
          </TabsList>

          {/* Creator View */}
          <TabsContent value="creator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
                  <Key className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{createdKeys.length}</div>
                  <p className="text-xs text-gray-600">Active keys</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,140</div>
                  <p className="text-xs text-gray-600">Across all customers</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                  <Shield className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-gray-600">With API access</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>API Key Management</CardTitle>
                    <CardDescription>
                      Create and manage API keys for your SaaS products. Keys are automatically delivered to customers.
                    </CardDescription>
                  </div>
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create API Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create New API Key</DialogTitle>
                        <DialogDescription>
                          Generate a new API key for accessing your SaaS products
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="name">Key Name</Label>
                          <Input
                            id="name"
                            placeholder="e.g., Production API Key"
                            value={createForm.name}
                            onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            placeholder="Describe what this key will be used for..."
                            value={createForm.description}
                            onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="environment">Environment</Label>
                          <Select
                            value={createForm.environment}
                            onValueChange={value => setCreateForm(prev => ({ ...prev, environment: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="test">Test</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-rotate"
                            checked={createForm.auto_rotate_enabled}
                            onCheckedChange={checked => setCreateForm(prev => ({ ...prev, auto_rotate_enabled: checked }))}
                          />
                          <Label htmlFor="auto-rotate">Enable automatic rotation</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createApiKey} disabled={isCreating || !createForm.name}>
                          {isCreating ? 'Creating...' : 'Create API Key'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {createdKeys.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Get started by creating your first API key to enable access to your SaaS products.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {createdKeys.map(key => (
                      <div key={key.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{key.name}</h4>
                            <p className="text-sm text-gray-600">{key.description}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                              key.environment === 'production' ? 'bg-green-100 text-green-800' :
                              key.environment === 'test' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {key.environment}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">API Key</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 bg-gray-50 rounded border font-mono text-sm">
                              {key.full_key}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(key.full_key)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriber View */}
          <TabsContent value="subscriber" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
                  <Zap className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSubscriberApiKeys.length}</div>
                  <p className="text-xs text-gray-600">Active keys</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,339</div>
                  <p className="text-xs text-gray-600">Across all keys</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">118ms</div>
                  <p className="text-xs text-gray-600">Across all requests</p>
                </CardContent>
              </Card>
            </div>

            {mockSubscriberApiKeys.map(key => {
              const hourlyUsage = calculateUsagePercentage(key.stats.requests_this_hour, key.rate_limit_per_hour);
              const dailyUsage = calculateUsagePercentage(key.stats.requests_today, key.rate_limit_per_day);
              const monthlyUsage = calculateUsagePercentage(key.stats.requests_this_month, key.rate_limit_per_month);

              return (
                <Card key={key.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {key.name}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            key.environment === 'production' ? 'bg-green-100 text-green-800' :
                            key.environment === 'test' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {key.environment}
                          </span>
                        </CardTitle>
                        <CardDescription>
                          Created {formatDate(key.created_at)} • {key.usage_count.toLocaleString()} total requests
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="usage">Usage</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">API Key</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 bg-gray-50 rounded border font-mono text-sm">
                              {visibleKeys.has(key.id) ? 
                                `${key.key_prefix}${'*'.repeat(24)}${key.key_hint}` : 
                                `${key.key_prefix}${'*'.repeat(28)}${key.key_hint}`
                              }
                            </code>
                            <Button variant="outline" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Scopes</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {key.scopes.map(scope => (
                              <span key={scope} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                {scope}
                              </span>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="usage" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Hourly Usage</span>
                              <span className={getUsageColor(hourlyUsage)}>
                                {key.stats.requests_this_hour} / {key.rate_limit_per_hour.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={hourlyUsage} className="h-2" />
                            {hourlyUsage >= 90 && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                Approaching limit
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Daily Usage</span>
                              <span className={getUsageColor(dailyUsage)}>
                                {key.stats.requests_today.toLocaleString()} / {key.rate_limit_per_day.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={dailyUsage} className="h-2" />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Monthly Usage</span>
                              <span className={getUsageColor(monthlyUsage)}>
                                {key.stats.requests_this_month.toLocaleString()} / {key.rate_limit_per_month.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={monthlyUsage} className="h-2" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Error Rate</span>
                            <p className="font-semibold">{(key.stats.error_rate * 100).toFixed(2)}%</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Response Time</span>
                            <p className="font-semibold">{key.stats.average_response_time}ms</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="settings" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Environment</span>
                            <p className="font-semibold capitalize">{key.environment}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Used</span>
                            <p className="font-semibold">{formatDate(key.last_used_at)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Expires</span>
                            <p className="font-semibold">
                              {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Auto Rotation</span>
                            <p className="font-semibold">
                              {key.auto_rotate_enabled ? `Every ${key.rotate_every_days} days` : 'Disabled'}
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Features Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Comprehensive API Key Management Features</CardTitle>
            <CardDescription>
              All the features needed for enterprise-grade API key management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Creator Configuration
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• API key requirements per product</li>
                  <li>• Delegated key management to platform</li>
                  <li>• Configurable scopes and permissions</li>
                  <li>• Custom expiration policies</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Automatic Delivery
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Auto-generation on purchase</li>
                  <li>• Integrated email delivery</li>
                  <li>• White-labeled dashboard access</li>
                  <li>• Secure encrypted storage</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Customer Management
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Self-service key regeneration</li>
                  <li>• Real-time usage monitoring</li>
                  <li>• Rate limit tracking</li>
                  <li>• Automated key rotation</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Security & Compliance
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• SHA-256 encrypted key hashing</li>
                  <li>• Multi-environment isolation</li>
                  <li>• Comprehensive audit logging</li>
                  <li>• IP-based access tracking</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Analytics & Insights
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Detailed usage analytics</li>
                  <li>• Performance monitoring</li>
                  <li>• Error rate tracking</li>
                  <li>• Historical usage trends</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Platform Integration
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Multi-tenant architecture</li>
                  <li>• RESTful API endpoints</li>
                  <li>• Stripe Connect integration</li>
                  <li>• Usage tracking system</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}