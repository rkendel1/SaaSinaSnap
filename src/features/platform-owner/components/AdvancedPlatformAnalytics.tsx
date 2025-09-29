'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Globe, PieChart, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConversionFunnel {
  stage: string;
  users: number;
  conversionRate: number;
}

interface UserSegment {
  segment: string;
  users: number;
  revenue: number;
  averageValue: number;
  growth: number;
}

interface ChurnAnalysis {
  period: string;
  churnRate: number;
  retentionRate: number;
  newUsers: number;
  lostUsers: number;
}

interface PlatformPerformanceMetrics {
  totalSignups: number;
  creatorConversionRate: number;
  averageTimeToFirstSale: number;
  platformUtilization: number;
  customerSatisfactionScore: number;
  supportTicketVolume: number;
  conversionFunnel: ConversionFunnel[];
  userSegments: UserSegment[];
  churnAnalysis: ChurnAnalysis[];
}

interface AdvancedPlatformAnalyticsProps {
  dateRange?: {
    start: string;
    end: string;
  };
}

export function AdvancedPlatformAnalytics({ dateRange }: AdvancedPlatformAnalyticsProps) {
  const [metrics, setMetrics] = useState<PlatformPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      // Mock advanced analytics data - replace with actual API calls
      const mockMetrics: PlatformPerformanceMetrics = {
        totalSignups: 1247,
        creatorConversionRate: 18.5,
        averageTimeToFirstSale: 12.3,
        platformUtilization: 73.2,
        customerSatisfactionScore: 4.2,
        supportTicketVolume: 156,
        conversionFunnel: [
          { stage: 'Landing Page Visits', users: 5000, conversionRate: 100 },
          { stage: 'Sign Up Started', users: 1500, conversionRate: 30 },
          { stage: 'Account Created', users: 1247, conversionRate: 83.1 },
          { stage: 'Onboarding Started', users: 890, conversionRate: 71.4 },
          { stage: 'Onboarding Completed', users: 560, conversionRate: 62.9 },
          { stage: 'First Product Created', users: 245, conversionRate: 43.8 },
          { stage: 'First Sale Made', users: 89, conversionRate: 36.3 },
        ],
        userSegments: [
          {
            segment: 'High-Value Creators',
            users: 24,
            revenue: 45680,
            averageValue: 1903,
            growth: 15.2,
          },
          {
            segment: 'Growing Creators',
            users: 67,
            revenue: 12340,
            averageValue: 184,
            growth: 8.7,
          },
          {
            segment: 'New Creators',
            users: 156,
            revenue: 2890,
            averageValue: 19,
            growth: 45.3,
          },
          {
            segment: 'Inactive Users',
            users: 890,
            revenue: 0,
            averageValue: 0,
            growth: -12.4,
          },
        ],
        churnAnalysis: [
          { period: 'Week 1', churnRate: 5.2, retentionRate: 94.8, newUsers: 120, lostUsers: 6 },
          { period: 'Week 2', churnRate: 8.1, retentionRate: 91.9, newUsers: 95, lostUsers: 9 },
          { period: 'Week 3', churnRate: 12.3, retentionRate: 87.7, newUsers: 87, lostUsers: 13 },
          { period: 'Week 4', churnRate: 15.6, retentionRate: 84.4, newUsers: 78, lostUsers: 18 },
        ],
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatDuration = (days: number) => `${days.toFixed(1)} days`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Platform Analytics</h2>
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creator Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics?.creatorConversionRate || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Signups → Active Creators
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to First Sale</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics?.averageTimeToFirstSale || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Average for successful creators
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics?.platformUtilization || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Active features usage
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.customerSatisfactionScore.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="segments">User Segments</TabsTrigger>
          <TabsTrigger value="churn">Retention Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Creator Engagement</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revenue Growth</span>
                    <span className="text-sm font-medium">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Satisfaction</span>
                    <span className="text-sm font-medium">84%</span>
                  </div>
                  <Progress value={84} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Platform Stability</span>
                    <span className="text-sm font-medium">96%</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">New Creator Signups</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">+23%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Revenue Growth</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">+18%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Feature Adoption</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">+31%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Support Tickets</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">-12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{stage.stage}</h4>
                          <p className="text-sm text-gray-600">{stage.users.toLocaleString()} users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatPercentage(stage.conversionRate)}</div>
                        <p className="text-xs text-gray-600">conversion rate</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${stage.conversionRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Segment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.userSegments.map((segment) => (
                  <div key={segment.segment} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{segment.segment}</h4>
                      <Badge variant={segment.growth > 0 ? 'default' : 'destructive'}>
                        {segment.growth > 0 ? '+' : ''}{formatPercentage(segment.growth)} growth
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Users</p>
                        <p className="font-medium">{segment.users.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-medium">{formatCurrency(segment.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg. Value</p>
                        <p className="font-medium">{formatCurrency(segment.averageValue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="churn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retention & Churn Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.churnAnalysis.map((period) => (
                  <div key={period.period} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{period.period}</h4>
                      <div className="flex space-x-4">
                        <Badge className="bg-green-100 text-green-800">
                          {formatPercentage(period.retentionRate)} retained
                        </Badge>
                        <Badge variant="destructive">
                          {formatPercentage(period.churnRate)} churned
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded">
                        <p className="text-green-600 font-medium">+{period.newUsers}</p>
                        <p className="text-gray-600">New Users</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <p className="text-red-600 font-medium">-{period.lostUsers}</p>
                        <p className="text-gray-600">Lost Users</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}