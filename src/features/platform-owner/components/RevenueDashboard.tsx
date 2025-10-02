'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, DollarSign, TrendingDown, TrendingUp, Users } from 'lucide-react';

import { MetricCard } from '@/components/shared/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RevenueMetrics {
  totalRevenue: number;
  platformFees: number;
  activeCreators: number;
  totalTransactions: number;
  monthlyGrowth: number;
  averageRevenuePerCreator: number;
}

interface CreatorRevenue {
  creatorId: string;
  creatorName: string;
  totalRevenue: number;
  platformFee: number;
  transactionCount: number;
  lastPayment?: string;
}

interface RevenueDashboardProps {
  dateRange?: {
    start: string;
    end: string;
  };
}

export function RevenueDashboard({ dateRange }: RevenueDashboardProps) {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [creatorRevenueData, setCreatorRevenueData] = useState<CreatorRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Mock data for now - replace with actual API calls
    const mockMetrics: RevenueMetrics = {
      totalRevenue: 45680.32,
      platformFees: 4568.03,
      activeCreators: 24,
      totalTransactions: 1247,
      monthlyGrowth: 12.5,
      averageRevenuePerCreator: 1903.35,
    };

    const mockCreatorData: CreatorRevenue[] = [
      {
        creatorId: '1',
        creatorName: 'John Doe',
        totalRevenue: 8950.00,
        platformFee: 895.00,
        transactionCount: 234,
        lastPayment: '2024-01-15',
      },
      {
        creatorId: '2', 
        creatorName: 'Jane Smith',
        totalRevenue: 7240.50,
        platformFee: 724.05,
        transactionCount: 189,
        lastPayment: '2024-01-14',
      },
      {
        creatorId: '3',
        creatorName: 'Tech Creator Pro',
        totalRevenue: 12450.75,
        platformFee: 1245.08,
        transactionCount: 356,
        lastPayment: '2024-01-16',
      },
    ];

    // Simulate API delay
    setTimeout(() => {
      setMetrics(mockMetrics);
      setCreatorRevenueData(mockCreatorData);
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
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{ value: metrics.monthlyGrowth, label: "from last month" }}
        />

        <MetricCard
          title="Platform Fees"
          value={`$${metrics.platformFees.toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          footer={<span className="text-xs text-gray-600">10% of total revenue</span>}
        />

        <MetricCard
          title="Active Creators"
          value={metrics.activeCreators}
          icon={Users}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          footer={
            <span className="text-xs text-gray-600">
              Avg: ${metrics.averageRevenuePerCreator.toFixed(2)} per creator
            </span>
          }
        />

        <MetricCard
          title="Total Transactions"
          value={metrics.totalTransactions.toLocaleString()}
          icon={CalendarDays}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          footer={<span className="text-xs text-gray-600">This month</span>}
        />
      </div>

      {/* Detailed Revenue Breakdown */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="creators">By Creator</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Creator Revenue</p>
                    <p className="text-sm text-green-600">Amount paid to creators</p>
                  </div>
                  <p className="text-xl font-bold text-green-700">
                    ${((metrics?.totalRevenue || 0) - (metrics?.platformFees || 0)).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800">Platform Fees</p>
                    <p className="text-sm text-blue-600">Your revenue from fees</p>
                  </div>
                  <p className="text-xl font-bold text-blue-700">
                    ${metrics?.platformFees.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creatorRevenueData.map((creator) => (
                  <div key={creator.creatorId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{creator.creatorName}</h4>
                      <p className="text-sm text-gray-600">
                        {creator.transactionCount} transactions
                        {creator.lastPayment && (
                          <span className="ml-2">• Last payment: {new Date(creator.lastPayment).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${creator.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Fee: ${creator.platformFee.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Revenue trend charts will be displayed here.</p>
                <p className="text-sm mt-2">Integration with analytics service coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}