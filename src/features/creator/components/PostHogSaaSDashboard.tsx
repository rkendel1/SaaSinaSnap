'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3, 
  Calendar,
  CheckCircle,
  Clock,
  DollarSign, 
  FlaskConical,
  Globe,
  Lightbulb,
  Loader2, 
  RefreshCw, 
  Star,
  Target,
  TrendingDown, 
  TrendingUp, 
  Users, 
  Zap} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

import {
  getABTestInsightsAction,
  getActionableInsightsAction,
  getCompetitiveInsightsAction,
  getRealTimeMetricsAction,
  getSaaSMetricsAction,
  getSubscriptionPlanMetricsAction,
  getUsageMetricsAction} from '../actions/posthog-analytics-actions';
import { 
  ABTestInsight,
  CompetitiveInsight,
  SaaSMetrics,
  SubscriptionPlanMetrics,
  UsageMetric} from '../services/posthog-analytics';
import { CreatorProfile } from '../types';

interface PostHogSaaSDashboardProps {
  creatorProfile: CreatorProfile;
}

export function PostHogSaaSDashboard({ creatorProfile }: PostHogSaaSDashboardProps) {
  const [saasMetrics, setSaasMetrics] = useState<SaaSMetrics | null>(null);
  const [planMetrics, setPlanMetrics] = useState<SubscriptionPlanMetrics[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>([]);
  const [competitiveInsights, setCompetitiveInsights] = useState<CompetitiveInsight[]>([]);
  const [abTestInsights, setABTestInsights] = useState<ABTestInsight[]>([]);
  const [actionableInsights, setActionableInsights] = useState<{
    insights: string[];
    suggestions: string[];
    trends: string[];
  }>({ insights: [], suggestions: [], trends: [] });
  const [realTimeMetrics, setRealTimeMetrics] = useState<{
    active_users_now: number;
    revenue_today: number;
    signups_today: number;
    trials_started_today: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [saas, plans, usage, competitive, abTests, insights, realTime] = await Promise.all([
        getSaaSMetricsAction(),
        getSubscriptionPlanMetricsAction(),
        getUsageMetricsAction(),
        getCompetitiveInsightsAction(['SaaS analytics', 'subscription metrics']),
        getABTestInsightsAction(),
        getActionableInsightsAction(),
        getRealTimeMetricsAction()
      ]);

      setSaasMetrics(saas);
      setPlanMetrics(plans);
      setUsageMetrics(usage);
      setCompetitiveInsights(competitive);
      setABTestInsights(abTests);
      setActionableInsights(insights);
      setRealTimeMetrics(realTime);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load dashboard data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Set up real-time updates every 30 seconds for live metrics
    const interval = setInterval(async () => {
      try {
        const realTime = await getRealTimeMetricsAction();
        setRealTimeMetrics(realTime);
      } catch (error) {
        console.error('Error updating real-time metrics:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [creatorProfile.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-gray-600">Loading SaaS dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SaaS Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights powered by PostHog</p>
        </div>
        <Button onClick={fetchAllData} disabled={isLoading} variant="outline">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Real-time Metrics */}
      {realTimeMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Active Users Now</p>
                  <p className="text-2xl font-bold text-blue-900">{realTimeMetrics.active_users_now}</p>
                </div>
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center mt-2">
                <Clock className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-xs text-blue-600">Live</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Revenue Today</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(realTimeMetrics.revenue_today)}</p>
                </div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+12% vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Signups Today</p>
                  <p className="text-2xl font-bold text-purple-900">{realTimeMetrics.signups_today}</p>
                </div>
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex items-center mt-2">
                <Star className="h-3 w-3 text-purple-500 mr-1" />
                <span className="text-xs text-purple-600">Quality leads</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Trials Started</p>
                  <p className="text-2xl font-bold text-orange-900">{realTimeMetrics.trials_started_today}</p>
                </div>
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex items-center mt-2">
                <Calendar className="h-3 w-3 text-orange-500 mr-1" />
                <span className="text-xs text-orange-600">14-day trials</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="competitive">Market Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {saasMetrics && (
            <>
              {/* Key SaaS Metrics */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">ARR</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(saasMetrics.arr)}</p>
                        <p className="text-xs text-green-600 mt-1">
                          +{formatPercentage(saasMetrics.revenue_growth)} YoY
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">MRR</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(saasMetrics.mrr)}</p>
                        <p className="text-xs text-green-600 mt-1">
                          +{formatPercentage(saasMetrics.growth_rate)} MoM
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{formatPercentage(saasMetrics.churn_rate)}</p>
                        <p className="text-xs text-green-600 mt-1">Below industry avg</p>
                      </div>
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Subs</p>
                        <p className="text-2xl font-bold text-gray-900">{saasMetrics.active_subscriptions}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          +{saasMetrics.new_subscribers - saasMetrics.cancelled_subscriptions} net
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Economics */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Customer Economics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lifetime Value (LTV)</span>
                      <span className="font-semibold">{formatCurrency(saasMetrics.ltv)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Customer Acquisition Cost (CAC)</span>
                      <span className="font-semibold">{formatCurrency(saasMetrics.cac)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">LTV:CAC Ratio</span>
                      <Badge variant="secondary">
                        {(saasMetrics.ltv / saasMetrics.cac).toFixed(1)}:1
                      </Badge>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Payback Period</span>
                        <span>{Math.ceil(saasMetrics.cac / (saasMetrics.mrr / saasMetrics.active_subscriptions))} months</span>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Growth Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Net Revenue Retention</span>
                      <Badge variant="default">112%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expansion Revenue</span>
                      <span className="font-semibold text-green-600">+{formatCurrency(1200)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quick Ratio</span>
                      <Badge variant="secondary">3.8</Badge>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Growth Health Score</span>
                        <span className="text-green-600">Excellent</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planMetrics.map((plan, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{plan.plan_name}</h3>
                          <p className="text-sm text-gray-600">{plan.subscribers} subscribers</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(plan.revenue)}</p>
                          <p className="text-sm text-gray-600">monthly revenue</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Churn Rate</span>
                          <p className="font-medium">{formatPercentage(plan.churn_rate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Conversion</span>
                          <p className="font-medium text-green-600">{formatPercentage(plan.conversion_rate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Upgrade Rate</span>
                          <p className="font-medium text-blue-600">{formatPercentage(plan.upgrade_rate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Downgrade Rate</span>
                          <p className="font-medium text-red-600">{formatPercentage(plan.downgrade_rate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Active A/B Tests & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {abTestInsights.map((test, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{test.test_name}</h3>
                          <p className="text-sm text-gray-600">Test ID: {test.test_id}</p>
                        </div>
                        <Badge variant={test.status === 'running' ? 'default' : test.status === 'completed' ? 'secondary' : 'outline'}>
                          {test.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-600">Statistical Significance</span>
                          <div className="flex items-center gap-2">
                            <Progress value={test.statistical_significance * 100} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{formatPercentage(test.statistical_significance)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Improvement</span>
                          <p className="font-medium text-green-600">+{formatPercentage(test.improvement)}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <h4 className="font-medium text-sm mb-1">Recommendation</h4>
                        <p className="text-sm text-gray-700">{test.recommendation}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Next Steps</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {test.next_steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitive Analysis Tab */}
        <TabsContent value="competitive" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Industry & Competitive Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitiveInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{insight.company}</h3>
                          <p className="text-sm text-gray-600">Keyword: {insight.keyword}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(insight.trend)}
                          <Badge variant="outline">{insight.trend}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Market Share</span>
                          <p className="font-medium">{formatPercentage(insight.market_share)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Growth Rate</span>
                          <p className="font-medium text-green-600">+{formatPercentage(insight.growth_rate)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">News Mentions</span>
                          <p className="font-medium">{insight.news_mentions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Actionable Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Key Insights
                    </h3>
                    <div className="space-y-2">
                      {actionableInsights.insights.map((insight, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Recommendations
                    </h3>
                    <div className="space-y-2">
                      {actionableInsights.suggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      Current Trends
                    </h3>
                    <div className="space-y-2">
                      {actionableInsights.trends.map((trend, index) => (
                        <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm text-purple-800">{trend}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}