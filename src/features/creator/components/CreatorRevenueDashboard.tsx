'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, CreditCard, DollarSign, Percent,Target, TrendingDown, TrendingUp, Users } from 'lucide-react';

import { MetricCard } from '@/components/shared/dashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCardSkeleton } from '@/components/ui/loading-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CreatorProfile } from '../types';

interface CreatorRevenueMetrics {
  totalRevenue: number;
  platformFees: number;
  netEarnings: number;
  totalSales: number;
  monthlyGrowth: number;
  averageOrderValue: number;
}

interface RevenueByProduct {
  productId: string;
  productName: string;
  revenue: number;
  sales: number;
  conversionRate: number;
}

interface CreatorRevenueDashboardProps {
  creatorProfile: CreatorProfile;
  initialStats: {
    total_revenue: number;
    total_sales: number;
    active_products: number;
    recent_sales_count: number;
  };
}

export function CreatorRevenueDashboard({ creatorProfile, initialStats }: CreatorRevenueDashboardProps) {
  const [metrics, setMetrics] = useState<CreatorRevenueMetrics | null>(null);
  const [productRevenueData, setProductRevenueData] = useState<RevenueByProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Transform initial stats into revenue metrics with performance optimization
    const platformFeeRate = 0.05; // 5% platform fee
    const totalRevenue = initialStats.total_revenue;
    const platformFees = totalRevenue * platformFeeRate;
    const netEarnings = totalRevenue - platformFees;

    const mockMetrics: CreatorRevenueMetrics = {
      totalRevenue,
      platformFees,
      netEarnings,
      totalSales: initialStats.total_sales,
      monthlyGrowth: Math.random() * 20 - 5, // Mock growth between -5% and +15%
      averageOrderValue: totalRevenue / (initialStats.total_sales || 1),
    };

    // Mock product revenue data with performance considerations
    const mockProductData: RevenueByProduct[] = [
      {
        productId: '1',
        productName: 'Starter Plan',
        revenue: totalRevenue * 0.4,
        sales: Math.floor(initialStats.total_sales * 0.5),
        conversionRate: 3.2,
      },
      {
        productId: '2',
        productName: 'Pro Plan',
        revenue: totalRevenue * 0.45,
        sales: Math.floor(initialStats.total_sales * 0.35),
        conversionRate: 2.8,
      },
      {
        productId: '3',
        productName: 'Enterprise Plan',
        revenue: totalRevenue * 0.15,
        sales: Math.floor(initialStats.total_sales * 0.15),
        conversionRate: 1.5,
      },
    ];

    // Use requestAnimationFrame for smooth UI updates
    requestAnimationFrame(() => {
      setMetrics(mockMetrics);
      setProductRevenueData(mockProductData);
      setLoading(false);
    });
  }, [initialStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <MetricCardSkeleton count={4} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (growth < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{ value: metrics.monthlyGrowth, label: "from last month" }}
        />

        <MetricCard
          title="Net Earnings"
          value={formatCurrency(metrics.netEarnings)}
          icon={Target}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          footer={
            <p className="text-xs text-gray-600">
              After platform fees ({formatCurrency(metrics.platformFees)})
            </p>
          }
        />

        <MetricCard
          title="Total Sales"
          value={metrics.totalSales}
          icon={CreditCard}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          footer={
            <p className="text-xs text-gray-600">
              Avg: {formatCurrency(metrics.averageOrderValue)} per sale
            </p>
          }
        />

        <MetricCard
          title="Platform Fee Rate"
          value="5.0%"
          icon={Percent}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          footer={<p className="text-xs text-gray-600">Standard platform fee</p>}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-product">By Product</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Gross Revenue</span>
                  <span className="font-bold">{formatCurrency(metrics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-red-600">Platform Fees (5%)</span>
                  <span className="text-red-600 font-bold">-{formatCurrency(metrics.platformFees)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 pt-4">
                  <span className="font-bold text-lg">Net Earnings</span>
                  <span className="font-bold text-lg text-green-600">{formatCurrency(metrics.netEarnings)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-product" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productRevenueData.map((product) => (
                  <div key={product.productId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{product.productName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} sales • {product.conversionRate}% conversion
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.revenue)}</p>
                      <Badge variant="secondary">
                        {((product.revenue / metrics.totalRevenue) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Trend Analysis Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  Detailed revenue trends and forecasting will be available once more data is collected.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}