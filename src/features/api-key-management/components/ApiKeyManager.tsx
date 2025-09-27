'use client';

import { useEffect, useState } from 'react';
import { Clock, Copy, Eye, EyeOff, Plus, RotateCcw, Shield, Trash2, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import type { ApiKey, ApiKeyUsageStats, CreateApiKeyRequest } from '../types';

interface ApiKeyManagerProps {
  creatorId: string;
  onApiKeyCreated?: (apiKey: ApiKey, fullKey: string) => void;
}

export function ApiKeyManager({ creatorId, onApiKeyCreated }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [usageStats, setUsageStats] = useState<ApiKeyUsageStats | null>(null);

  // Form state for creating new API key
  const [createForm, setCreateForm] = useState<Partial<CreateApiKeyRequest>>({
    creator_id: creatorId,
    environment: 'test',
    scopes: ['read:basic'],
    rate_limit_per_hour: 1000,
    rate_limit_per_day: 10000,
    rate_limit_per_month: 100000,
    auto_rotate_enabled: false,
    rotate_every_days: 90
  });

  useEffect(() => {
    loadApiKeys();
  }, [creatorId]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      // This would typically use the actual user ID from authentication
      const response = await fetch('/api/keys');
      if (response.ok) {
        const data = await response.json();
        // For demo purposes, we'll create some mock data
        setApiKeys([]);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'creator@example.com', // This should come from auth
          name: createForm.name,
          environment: createForm.environment,
          scopes: createForm.scopes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && onApiKeyCreated) {
          // Create mock API key object for demo
          const mockApiKey: Partial<ApiKey> = {
            id: data.data.id,
            name: createForm.name || 'New API Key',
            environment: data.data.environment,
            scopes: data.data.scopes,
            rate_limit_per_hour: data.data.rate_limit_per_hour,
            rate_limit_per_day: data.data.rate_limit_per_day,
            rate_limit_per_month: data.data.rate_limit_per_month,
            created_at: data.data.created_at,
            expires_at: data.data.expires_at
          };
          onApiKeyCreated(mockApiKey as ApiKey, data.data.key);
        }
        setShowCreateDialog(false);
        loadApiKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsCreating(false);
    }
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
    // You could add a toast notification here
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

  const getEnvironmentBadgeColor = (environment: string) => {
    switch (environment) {
      case 'production': return 'bg-green-100 text-green-800';
      case 'test': return 'bg-blue-100 text-blue-800';
      case 'sandbox': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-gray-600 mt-1">
            Manage API keys for your SaaS products and track their usage
          </p>
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
                  value={createForm.name || ''}
                  onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this key will be used for..."
                  value={createForm.description || ''}
                  onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={createForm.environment}
                  onValueChange={value => setCreateForm(prev => ({ ...prev, environment: value as any }))}
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
              <div>
                <Label>Rate Limits</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label htmlFor="hourly" className="text-xs">Per Hour</Label>
                    <Input
                      id="hourly"
                      type="number"
                      value={createForm.rate_limit_per_hour}
                      onChange={e => setCreateForm(prev => ({ ...prev, rate_limit_per_hour: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="daily" className="text-xs">Per Day</Label>
                    <Input
                      id="daily"
                      type="number"
                      value={createForm.rate_limit_per_day}
                      onChange={e => setCreateForm(prev => ({ ...prev, rate_limit_per_day: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthly" className="text-xs">Per Month</Label>
                    <Input
                      id="monthly"
                      type="number"
                      value={createForm.rate_limit_per_month}
                      onChange={e => setCreateForm(prev => ({ ...prev, rate_limit_per_month: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
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

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first API key to enable access to your SaaS products.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map(key => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {key.name}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentBadgeColor(key.environment)}`}>
                        {key.environment}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {key.description || 'No description provided'}
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
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-gray-50 rounded border font-mono text-sm">
                        {visibleKeys.has(key.id) ? `${key.key_prefix}${'*'.repeat(24)}${key.key_hint}` : key.key_hint}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(visibleKeys.has(key.id) ? `${key.key_prefix}example_key_${key.key_hint}` : key.key_hint)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Usage Count</Label>
                      <p className="font-semibold">{key.usage_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Last Used</Label>
                      <p className="font-semibold">
                        {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Created</Label>
                      <p className="font-semibold">{formatDate(key.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Expires</Label>
                      <p className="font-semibold">
                        {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Scopes</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {key.scopes.map(scope => (
                        <span key={scope} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}