'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, Copy, Eye, EyeOff, RotateCcw, TrendingUp, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { ApiKey, ApiKeyUsageStats } from '../types';

interface SubscriberApiKeyDashboardProps {
  customerId: string;
  apiKeys: ApiKey[];
  onRotateKey?: (keyId: string) => void;
}

export function SubscriberApiKeyDashboard({ customerId, apiKeys, onRotateKey }: SubscriberApiKeyDashboardProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [usageStats, setUsageStats] = useState<Record<string, ApiKeyUsageStats>>({});
  const [loading, setLoading] = useState(false);

  const loadUsageStats = useCallback(async () => {
    setLoading(true);
    try {
      const statsPromises = apiKeys.map(async (key) => {
        // Mock data for demo - in production would fetch from API
        const mockStats: ApiKeyUsageStats = {
          total_requests: Math.floor(Math.random() * 10000),
          requests_this_hour: Math.floor(Math.random() * 100),
          requests_today: Math.floor(Math.random() * 1000),
          requests_this_month: Math.floor(Math.random() * 5000),
          average_response_time: Math.floor(Math.random() * 500) + 100,
          error_rate: Math.random() * 0.1,
          top_endpoints: [
            { endpoint: '/api/v1/products', count: Math.floor(Math.random() * 1000) },
            { endpoint: '/api/v1/analytics', count: Math.floor(Math.random() * 500) },
            { endpoint: '/api/v1/users', count: Math.floor(Math.random() * 300) }
          ],
          usage_by_day: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 200)
          })).reverse()
        };
        return { keyId: key.id, stats: mockStats };
      });

      const results = await Promise.all(statsPromises);
      const statsMap = results.reduce((acc, { keyId, stats }) => {
        acc[keyId] = stats;
        return acc;
      }, {} as Record<string, ApiKeyUsageStats>);

      setUsageStats(statsMap);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  }, [apiKeys]);

  useEffect(() => {
    loadUsageStats();
  }, [loadUsageStats]);

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
    // Add toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      <div>
        <h2 className="text-2xl font-bold">Your API Keys</h2>
        <p className="text-gray-600 mt-1">
          Manage and monitor your API keys for accessing your subscribed services
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-gray-600">
              {apiKeys.filter(key => key.active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(usageStats).reduce((sum, stats) => sum + stats.requests_today, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">
              Across all keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(Object.values(usageStats).reduce((sum, stats) => sum + stats.average_response_time, 0) / (Object.values(usageStats).length || 1))}ms
            </div>
            <p className="text-xs text-gray-600">
              Across all requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys */}
      <div className="space-y-4">
        {apiKeys.map(key => {
          const stats = usageStats[key.id];
          const hourlyUsage = calculateUsagePercentage(stats?.requests_this_hour || 0, key.rate_limit_per_hour);
          const dailyUsage = calculateUsagePercentage(stats?.requests_today || 0, key.rate_limit_per_day);
          const monthlyUsage = calculateUsagePercentage(stats?.requests_this_month || 0, key.rate_limit_per_month);

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
                      {!key.active && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRotateKey?.(key.id)}
                    >
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
                      <label className="text-sm font-medium">API Key</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-gray-50 rounded border font-mono text-sm">
                          {visibleKeys.has(key.id) ? 
                            `${key.key_prefix}${'*'.repeat(24)}${key.key_hint}` : 
                            `${key.key_prefix}${'*'.repeat(28)}${key.key_hint}`
                          }
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${key.key_prefix}example_key_${key.key_hint}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Scopes</label>
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
                    {stats && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Hourly Usage</span>
                              <span className={getUsageColor(hourlyUsage)}>
                                {stats.requests_this_hour} / {key.rate_limit_per_hour.toLocaleString()}
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
                                {stats.requests_today.toLocaleString()} / {key.rate_limit_per_day.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={dailyUsage} className="h-2" />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Monthly Usage</span>
                              <span className={getUsageColor(monthlyUsage)}>
                                {stats.requests_this_month.toLocaleString()} / {key.rate_limit_per_month.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={monthlyUsage} className="h-2" />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Top Endpoints</h4>
                          <div className="space-y-1">
                            {stats.top_endpoints.slice(0, 3).map(endpoint => (
                              <div key={endpoint.endpoint} className="flex justify-between text-sm">
                                <code className="text-xs bg-gray-100 px-1 rounded">{endpoint.endpoint}</code>
                                <span>{endpoint.count.toLocaleString()} requests</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Error Rate</span>
                            <p className="font-semibold">{(stats.error_rate * 100).toFixed(2)}%</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Response Time</span>
                            <p className="font-semibold">{stats.average_response_time}ms</p>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Environment</span>
                        <p className="font-semibold capitalize">{key.environment}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Used</span>
                        <p className="font-semibold">
                          {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                        </p>
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

                    {key.expires_at && new Date(key.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Expiring Soon</span>
                        </div>
                        <p className="text-yellow-700 text-sm mt-1">
                          This API key will expire on {formatDate(key.expires_at)}. Consider rotating it soon.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {apiKeys.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
            <p className="text-gray-600">
              You don&rsquo;t have any API keys yet. API keys will be automatically generated when you subscribe to services that require them.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}