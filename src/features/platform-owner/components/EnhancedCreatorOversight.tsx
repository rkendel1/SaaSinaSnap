'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, DollarSign, Package, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

interface CreatorInsight {
  id: string;
  name: string;
  email: string;
  onboardingProgress: number;
  onboardingStatus: 'not_started' | 'in_progress' | 'completed' | 'needs_help';
  revenue: number;
  totalProducts: number;
  activeProducts: number;
  lastActivity: string;
  healthScore: number;
  nextMilestone: string;
  riskFactors: string[];
  successMetrics: {
    hasStripeConnected: boolean;
    hasProducts: boolean;
    hasRevenue: boolean;
    hasRecentActivity: boolean;
  };
}

interface PlatformMetrics {
  totalCreators: number;
  activeCreators: number;
  creatorsNeedingHelp: number;
  averageHealthScore: number;
  totalRevenue: number;
  conversionRate: number;
}

export function EnhancedCreatorOversight() {
  const [creators, setCreators] = useState<CreatorInsight[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<CreatorInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCreatorInsights();
  }, []);

  const loadCreatorInsights = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockCreators: CreatorInsight[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          onboardingProgress: 100,
          onboardingStatus: 'completed',
          revenue: 12450.50,
          totalProducts: 3,
          activeProducts: 3,
          lastActivity: '2024-01-15T10:30:00Z',
          healthScore: 85,
          nextMilestone: 'Scale marketing',
          riskFactors: [],
          successMetrics: {
            hasStripeConnected: true,
            hasProducts: true,
            hasRevenue: true,
            hasRecentActivity: true,
          },
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          onboardingProgress: 60,
          onboardingStatus: 'in_progress',
          revenue: 0,
          totalProducts: 1,
          activeProducts: 0,
          lastActivity: '2024-01-10T14:20:00Z',
          healthScore: 45,
          nextMilestone: 'Complete Stripe setup',
          riskFactors: ['No Stripe connection', 'Inactive products', 'No recent activity'],
          successMetrics: {
            hasStripeConnected: false,
            hasProducts: true,
            hasRevenue: false,
            hasRecentActivity: false,
          },
        },
        {
          id: '3',
          name: 'Tech Startup Pro',
          email: 'startup@example.com',
          onboardingProgress: 25,
          onboardingStatus: 'needs_help',
          revenue: 0,
          totalProducts: 0,
          activeProducts: 0,
          lastActivity: '2024-01-05T09:15:00Z',
          healthScore: 20,
          nextMilestone: 'Complete basic setup',
          riskFactors: ['Onboarding stalled', 'No products created', 'Long inactivity'],
          successMetrics: {
            hasStripeConnected: false,
            hasProducts: false,
            hasRevenue: false,
            hasRecentActivity: false,
          },
        },
      ];

      const mockMetrics: PlatformMetrics = {
        totalCreators: mockCreators.length,
        activeCreators: mockCreators.filter(c => c.healthScore > 50).length,
        creatorsNeedingHelp: mockCreators.filter(c => c.onboardingStatus === 'needs_help' || c.riskFactors.length > 0).length,
        averageHealthScore: mockCreators.reduce((sum, c) => sum + c.healthScore, 0) / mockCreators.length,
        totalRevenue: mockCreators.reduce((sum, c) => sum + c.revenue, 0),
        conversionRate: (mockCreators.filter(c => c.hasRevenue).length / mockCreators.length) * 100,
      };

      setCreators(mockCreators);
      setPlatformMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load creator insights:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load creator insights. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />;
    if (score >= 60) return <Clock className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getOnboardingStatusBadge = (status: CreatorInsight['onboardingStatus']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'needs_help':
        return <Badge className="bg-red-100 text-red-800">Needs Help</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
    }
  };

  const handleCreatorAction = async (creatorId: string, action: string) => {
    try {
      // Mock action implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (action) {
        case 'send_help':
          toast({
            description: 'Support email sent to creator successfully.',
          });
          break;
        case 'schedule_call':
          toast({
            description: 'Call scheduled with creator successfully.',
          });
          break;
        case 'send_resources':
          toast({
            description: 'Additional resources sent to creator.',
          });
          break;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Action failed. Please try again.',
      });
    }
  };

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
      {/* Platform Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformMetrics?.totalCreators}</div>
            <p className="text-xs text-muted-foreground">
              {platformMetrics?.activeCreators} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformMetrics?.averageHealthScore.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Average creator health score
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${platformMetrics?.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {platformMetrics?.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {platformMetrics?.creatorsNeedingHelp}
            </div>
            <p className="text-xs text-muted-foreground">
              Creators need help
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Creator Insights Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="needs_help">Needs Help ({platformMetrics?.creatorsNeedingHelp})</TabsTrigger>
          <TabsTrigger value="high_performers">High Performers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creators.map((creator) => (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCreator(creator)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getHealthScoreColor(creator.healthScore)}`}>
                        {getHealthScoreIcon(creator.healthScore)}
                      </div>
                      <div>
                        <h4 className="font-medium">{creator.name}</h4>
                        <p className="text-sm text-gray-600">{creator.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getOnboardingStatusBadge(creator.onboardingStatus)}
                      <div className="text-right">
                        <p className="font-medium">${creator.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{creator.activeProducts} products</p>
                      </div>
                      <div className="w-16">
                        <div className="text-xs text-gray-600 mb-1">Health</div>
                        <Progress value={creator.healthScore} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="needs_help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Creators Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creators
                  .filter(c => c.onboardingStatus === 'needs_help' || c.riskFactors.length > 0)
                  .map((creator) => (
                    <div key={creator.id} className="p-4 border rounded-lg border-red-200 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{creator.name}</h4>
                            {getOnboardingStatusBadge(creator.onboardingStatus)}
                          </div>
                          <p className="text-sm text-gray-600">{creator.email}</p>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-red-700">Risk Factors:</p>
                            {creator.riskFactors.map((risk, index) => (
                              <p key={index} className="text-xs text-red-600">• {risk}</p>
                            ))}
                          </div>
                          <p className="text-sm text-blue-700">Next Milestone: {creator.nextMilestone}</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreatorAction(creator.id, 'send_help')}
                          >
                            Send Help
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCreatorAction(creator.id, 'schedule_call')}
                          >
                            Schedule Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="high_performers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Performing Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creators
                  .filter(c => c.healthScore >= 80)
                  .map((creator) => (
                    <div key={creator.id} className="p-4 border rounded-lg border-green-200 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{creator.name}</h4>
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              High Performer
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{creator.email}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span>${creator.revenue.toLocaleString()} revenue</span>
                            <span>{creator.activeProducts} active products</span>
                            <span>Health: {creator.healthScore}%</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreatorAction(creator.id, 'send_resources')}
                          >
                            Share Best Practices
                          </Button>
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