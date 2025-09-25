'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity,
  AlertTriangle,
  BarChart3, 
  Gauge,
  Plus,
  Settings,
  TrendingUp, 
  Users, 
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

import { 
  getMetersAction,
  getUsageAnalyticsAction
} from '../actions/usage-actions';
import type { UsageAnalytics, UsageMeter } from '../types';

interface UsageDashboardProps {
  creatorId: string;
}

export function UsageDashboard({ creatorId }: UsageDashboardProps) {
  const [meters, setMeters] = useState<UsageMeter[]>([]);
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metersData, analyticsData] = await Promise.all([
        getMetersAction(),
        getUsageAnalyticsAction({
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        })
      ]);

      setMeters(metersData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        description: 'Failed to load usage data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usage & Billing</h1>
          <p className="text-gray-600">Track usage metrics and monitor billing across your SaaS</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Meter
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Meters</p>
                <p className="text-2xl font-bold">{meters.length}</p>
              </div>
              <Gauge className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold">{analytics?.total_usage.toLocaleString() || 0}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{analytics?.usage_by_user.length || 0}</p>
              </div>
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Impact</p>
                <p className="text-2xl font-bold">${analytics?.revenue_impact.total_revenue.toFixed(2) || '0.00'}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="meters">Meters</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Usage Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.usage_trends.length ? (
                <div className="space-y-2">
                  {analytics.usage_trends.slice(-7).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{trend.period}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(trend.usage / Math.max(...analytics.usage_trends.map(t => t.usage))) * 100} className="w-24" />
                        <span className="text-sm font-medium">{trend.usage.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No usage data yet</p>
                  <p className="text-sm text-gray-500">Start tracking usage events to see trends here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.top_users.length ? (
                <div className="space-y-3">
                  {analytics.top_users.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.user_id}</p>
                          <p className="text-sm text-gray-600">{user.usage.toLocaleString()} units</p>
                        </div>
                      </div>
                      <Badge variant="outline">${user.revenue.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No user data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Meters</CardTitle>
            </CardHeader>
            <CardContent>
              {meters.length > 0 ? (
                <div className="space-y-4">
                  {meters.map((meter) => (
                    <div key={meter.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium">{meter.display_name}</h3>
                          <Badge variant={meter.active ? 'default' : 'secondary'}>
                            {meter.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{meter.aggregation_type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{meter.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Event: {meter.event_name}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gauge className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No meters configured</p>
                  <p className="text-sm text-gray-500 mb-4">Create your first usage meter to start tracking</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Meter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Base Revenue</p>
                  <p className="text-2xl font-bold text-blue-700">${analytics?.revenue_impact.base_revenue.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Overage Revenue</p>
                  <p className="text-2xl font-bold text-green-700">${analytics?.revenue_impact.overage_revenue.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-700">${analytics?.revenue_impact.total_revenue.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No active alerts</p>
                <p className="text-sm text-gray-500">Usage alerts will appear here when limits are approached</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}