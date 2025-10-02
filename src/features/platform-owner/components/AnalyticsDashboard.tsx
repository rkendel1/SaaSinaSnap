'use client';

import { useEffect, useState } from 'react';
import { Activity, BarChart3, Globe, TrendingUp, Users, Zap } from 'lucide-react';

import { AnalyticsInfoCard, AnalyticsListCard,AnalyticsMetricCard } from '@/components/shared/analytics';
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
        <AnalyticsMetricCard
          title="Total Users"
          value={analytics?.totalUsers.toLocaleString() || '0'}
          icon={Users}
          iconColor="text-blue-500"
          subtitle="+12% from last month"
          subtitleColor="text-green-600"
        />
        <AnalyticsMetricCard
          title="Active Creators"
          value={analytics?.activeCreators || 0}
          icon={Zap}
          iconColor="text-purple-500"
          subtitle="+9% from last month"
          subtitleColor="text-green-600"
        />
        <AnalyticsMetricCard
          title="Page Views"
          value={analytics?.totalPageViews.toLocaleString() || '0'}
          icon={Globe}
          iconColor="text-green-500"
          subtitle={`Avg session: ${Math.floor((analytics?.averageSessionDuration || 0) / 60)}m ${(analytics?.averageSessionDuration || 0) % 60}s`}
          subtitleColor="text-gray-600"
        />
        <AnalyticsMetricCard
          title="Conversion Rate"
          value={`${analytics?.conversionRate}%`}
          icon={BarChart3}
          iconColor="text-orange-500"
          subtitle="Visitor to subscriber"
          subtitleColor="text-gray-600"
        />
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
            <AnalyticsInfoCard
              title="Platform Health"
              items={[
                { label: 'System Uptime', value: '99.9%', valueColor: 'text-green-600' },
                { label: 'API Response Time', value: '145ms' },
                { label: 'Error Rate', value: '0.02%', valueColor: 'text-green-600' },
                { label: 'Active Sessions', value: '234' },
              ]}
            />
            <AnalyticsListCard
              title="Recent Activity"
              items={[
                { icon: Activity, iconColor: 'text-green-500', label: 'New creator registered: Jane Smith' },
                { icon: Activity, iconColor: 'text-blue-500', label: 'Product deployed: Tech Course v2.1' },
                { icon: Activity, iconColor: 'text-purple-500', label: 'Payment processed: $299.00' },
                { icon: Activity, iconColor: 'text-orange-500', label: 'Domain verified: shop.creator.com' },
              ]}
            />
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