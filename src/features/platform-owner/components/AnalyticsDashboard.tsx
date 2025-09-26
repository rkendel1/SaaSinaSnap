'use client';

import { useEffect, useState } from 'react';
import { Activity, BarChart3, Globe, TrendingUp, Users, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlatformAnalytics {
  totalUsers: number;
  activeCreators: number;
  totalPageViews: number;
  conversionRate: number;
  averageSessionDuration: number;
  topTrafficSources: TrafficSource[];
  userGrowth: GrowthMetric[];
  creatorActivity: CreatorActivity[];
}

interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

interface GrowthMetric {
  period: string;
  users: number;
  creators: number;
}

interface CreatorActivity {
  creatorId: string;
  creatorName: string;
  totalSales: number;
  productsActive: number;
  lastActive: string;
  growthRate: number;
}

interface AnalyticsDashboardProps {
  dateRange?: {
    start: string;
    end: string;
  };
}

export function AnalyticsDashboard({ dateRange }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Mock data for demonstration - replace with actual API calls
    const mockAnalytics: PlatformAnalytics = {
      totalUsers: 1247,
      activeCreators: 24,
      totalPageViews: 45680,
      conversionRate: 3.2,
      averageSessionDuration: 245,
      topTrafficSources: [
        { source: 'Direct', visits: 18500, percentage: 40.5 },
        { source: 'Google Search', visits: 13704, percentage: 30.0 },
        { source: 'Social Media', visits: 9136, percentage: 20.0 },
        { source: 'Referral', visits: 4340, percentage: 9.5 },
      ],
      userGrowth: [
        { period: 'Jan', users: 950, creators: 18 },
        { period: 'Feb', users: 1050, creators: 20 },
        { period: 'Mar', users: 1150, creators: 22 },
        { period: 'Apr', users: 1247, creators: 24 },
      ],
      creatorActivity: [
        {
          creatorId: '1',
          creatorName: 'John Doe',
          totalSales: 156,
          productsActive: 3,
          lastActive: '2024-01-16',
          growthRate: 15.2,
        },
        {
          creatorId: '2',
          creatorName: 'Jane Smith',
          totalSales: 134,
          productsActive: 2,
          lastActive: '2024-01-15',
          growthRate: 8.7,
        },
        {
          creatorId: '3',
          creatorName: 'Tech Creator Pro',
          totalSales: 289,
          productsActive: 5,
          lastActive: '2024-01-16',
          growthRate: 22.1,
        },
      ],
    };

    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{analytics?.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Creators</p>
                <p className="text-2xl font-bold">{analytics?.activeCreators}</p>
              </div>
              <Zap className="h-6 w-6 text-purple-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+9% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Page Views</p>
                <p className="text-2xl font-bold">{analytics?.totalPageViews.toLocaleString()}</p>
              </div>
              <Globe className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <span>Avg session: {Math.floor((analytics?.averageSessionDuration || 0) / 60)}m {(analytics?.averageSessionDuration || 0) % 60}s</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics?.conversionRate}%</p>
              </div>
              <BarChart3 className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <span>Visitor to subscriber</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="creators">Creator Activity</TabsTrigger>
          <TabsTrigger value="growth">Growth Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">System Uptime</span>
                    <span className="font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">API Response Time</span>
                    <span className="font-medium">145ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-medium text-green-600">0.02%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="font-medium">234</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm">New creator registered: Jane Smith</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Product deployed: Tech Course v2.1</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Payment processed: $299.00</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Domain verified: shop.creator.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topTrafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" style={{ backgroundColor: `hsl(${index * 90}, 70%, 50%)` }}></div>
                      <span className="font-medium">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{source.visits.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{source.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creator Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.creatorActivity.map((creator) => (
                  <div key={creator.creatorId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{creator.creatorName}</h4>
                      <p className="text-sm text-gray-600">
                        {creator.productsActive} active products • Last active: {new Date(creator.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{creator.totalSales} sales</p>
                      <p className="text-sm text-green-600">+{creator.growthRate}% growth</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Growth trend charts will be displayed here.</p>
                <p className="text-sm mt-2">Integration with analytics service coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}