'use client';

import React, { useEffect,useState } from 'react';
import { 
  ArrowUpRight,
  Award, 
  Calendar,
  DollarSign, 
  Lightbulb,
  Star, 
  Target, 
  TrendingUp, 
  Users, 
  Zap
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextualHelp } from '@/components/ui/contextual-help';
import { Progress } from '@/components/ui/progress';
import { ProgressTracker } from '@/components/ui/progress-tracker';
import { InfoFeedback, SuccessFeedback } from '@/components/ui/user-feedback';

interface CustomerSuccessMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  customerCount: number;
  churnRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  conversionRate: number;
  monthlyGrowthRate: number;
  customerSatisfactionScore: number;
  timeToFirstSale: number; // days
}

interface SuccessMilestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  category: 'revenue' | 'customers' | 'growth' | 'engagement';
  achieved: boolean;
  achievedAt?: Date;
  reward?: {
    type: 'badge' | 'feature' | 'discount';
    value: string;
    description: string;
  };
}

interface CustomerSuccessDashboardProps {
  metrics: CustomerSuccessMetrics;
  businessAge: number; // days since account creation
  className?: string;
}

const defaultMilestones: SuccessMilestone[] = [
  {
    id: 'first-dollar',
    title: 'First Dollar Earned',
    description: 'Generate your first revenue',
    target: 1,
    current: 0,
    unit: '$',
    category: 'revenue',
    achieved: false,
    reward: {
      type: 'badge',
      value: 'Revenue Generator',
      description: 'Unlocks advanced analytics features'
    }
  },
  {
    id: 'hundred-dollars',
    title: '$100 Revenue Milestone',
    description: 'Reach $100 in total revenue',
    target: 100,
    current: 0,
    unit: '$',
    category: 'revenue',
    achieved: false,
    reward: {
      type: 'feature',
      value: 'Custom Branding',
      description: 'Advanced branding customization options'
    }
  },
  {
    id: 'ten-customers',
    title: '10 Customers',
    description: 'Acquire your first 10 customers',
    target: 10,
    current: 0,
    unit: 'customers',
    category: 'customers',
    achieved: false,
  },
  {
    id: 'thousand-dollars',
    title: '$1,000 Revenue',
    description: 'Reach $1,000 in total revenue',
    target: 1000,
    current: 0,
    unit: '$',
    category: 'revenue',
    achieved: false,
    reward: {
      type: 'discount',
      value: '20% Platform Fee Reduction',
      description: 'Reduced platform fees for 3 months'
    }
  },
  {
    id: 'fifty-customers',
    title: '50 Customers',
    description: 'Build a customer base of 50 people',
    target: 50,
    current: 0,
    unit: 'customers',
    category: 'customers',
    achieved: false,
  }
];

export function CustomerSuccessDashboard({ 
  metrics, 
  businessAge, 
  className 
}: CustomerSuccessDashboardProps) {
  const [milestones, setMilestones] = useState<SuccessMilestone[]>(defaultMilestones);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<SuccessMilestone | null>(null);

  // Update milestones with current metrics
  useEffect(() => {
    const updatedMilestones = milestones.map(milestone => {
      let current = 0;
      
      switch (milestone.id) {
        case 'first-dollar':
        case 'hundred-dollars':
        case 'thousand-dollars':
          current = metrics.totalRevenue;
          break;
        case 'ten-customers':
        case 'fifty-customers':
          current = metrics.customerCount;
          break;
      }

      const achieved = current >= milestone.target;
      const wasAchieved = milestone.achieved;

      // Show celebration for newly achieved milestones
      if (achieved && !wasAchieved) {
        setRecentAchievement({ ...milestone, current, achieved, achievedAt: new Date() });
        setShowCelebration(true);
      }

      return {
        ...milestone,
        current,
        achieved,
        achievedAt: achieved && !wasAchieved ? new Date() : milestone.achievedAt
      };
    });

    setMilestones(updatedMilestones);
  }, [metrics]);

  const completedMilestones = milestones.filter(m => m.achieved).length;
  const overallProgress = (completedMilestones / milestones.length) * 100;

  // Calculate business health score
  const healthFactors = [
    metrics.totalRevenue > 0 ? 20 : 0,
    metrics.customerCount > 0 ? 20 : 0,
    metrics.conversionRate > 2 ? 20 : metrics.conversionRate > 1 ? 10 : 0,
    metrics.churnRate < 5 ? 20 : metrics.churnRate < 10 ? 10 : 0,
    metrics.monthlyGrowthRate > 0 ? 20 : 0,
  ];
  const healthScore = healthFactors.reduce((a, b) => a + b, 0);

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className={className}>
      {/* Recent Achievement Celebration */}
      {showCelebration && recentAchievement && (
        <SuccessFeedback
          title={`🎉 Milestone Achieved: ${recentAchievement.title}!`}
          message={`Congratulations! You've ${recentAchievement.description.toLowerCase()}. ${recentAchievement.reward ? recentAchievement.reward.description : 'Keep up the great work!'}`}
          actions={[
            {
              label: recentAchievement.reward ? 'Claim Reward' : 'View Progress',
              action: () => {
                // Handle reward claiming logic
                setShowCelebration(false);
              },
              variant: 'primary',
            },
            {
              label: 'Share Achievement',
              action: () => {
                if (navigator.share) {
                  navigator.share({
                    title: `I achieved ${recentAchievement.title}!`,
                    text: `Just ${recentAchievement.description.toLowerCase()} on my SaaS platform!`,
                  });
                }
                setShowCelebration(false);
              },
              variant: 'secondary',
            },
          ]}
          dismissible
          onDismiss={() => setShowCelebration(false)}
          className="mb-6"
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Business Health Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Business Health Score
              <ContextualHelp
                content={{
                  id: 'health-score',
                  title: 'Business Health Score',
                  description: 'A comprehensive metric combining revenue, customers, growth, and retention.',
                  steps: [
                    'Revenue generation (20 points)',
                    'Customer acquisition (20 points)', 
                    'Conversion rate (20 points)',
                    'Customer retention (20 points)',
                    'Growth momentum (20 points)'
                  ],
                  tips: [
                    'Focus on one area at a time',
                    'Consistent small improvements compound',
                    'Monitor trends over absolute numbers'
                  ]
                }}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    className={getHealthScoreColor(healthScore)}
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${healthScore}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${getHealthScoreColor(healthScore)}`}>
                    {healthScore}
                  </span>
                </div>
              </div>
              <div>
                <p className={`font-semibold ${getHealthScoreColor(healthScore)}`}>
                  {getHealthScoreLabel(healthScore)}
                </p>
                <p className="text-sm text-gray-600">
                  {businessAge < 30 ? `${businessAge} days old` : `${Math.floor(businessAge / 30)} months old`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Revenue Momentum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  ${metrics.totalRevenue.toFixed(2)}
                </span>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {metrics.monthlyGrowthRate > 0 ? '+' : ''}{metrics.monthlyGrowthRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>MRR: ${metrics.monthlyRecurringRevenue.toFixed(2)}</p>
                <p>AOV: ${metrics.averageOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Customer Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.customerCount}
                </span>
                <Badge variant={metrics.churnRate < 5 ? "default" : "destructive"}>
                  {metrics.churnRate.toFixed(1)}% churn
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p>CLV: ${metrics.customerLifetimeValue.toFixed(2)}</p>
                <p>Conversion: {metrics.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Success Milestones
            <Badge variant="secondary">
              {completedMilestones}/{milestones.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-500">{overallProgress.toFixed(0)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    milestone.achieved
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {milestone.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                    {milestone.achieved && (
                      <div className="flex-shrink-0">
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {milestone.current.toFixed(0)}{milestone.unit} / {milestone.target.toFixed(0)}{milestone.unit}
                      </span>
                      <span className="font-medium">
                        {((milestone.current / milestone.target) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={(milestone.current / milestone.target) * 100}
                      className="h-1"
                    />
                  </div>

                  {milestone.reward && milestone.achieved && (
                    <div className="mt-2 p-2 bg-white rounded border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs font-medium text-yellow-800">
                          {milestone.reward.value}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actionable Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            Growth Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.totalRevenue === 0 && (
              <InfoFeedback
                title="Focus on your first sale"
                message="Getting your first customer is the biggest milestone. Consider offering a limited-time discount or free trial."
                actions={[
                  {
                    label: 'Create Discount',
                    action: () => window.location.href = '/creator/products-and-tiers',
                    variant: 'primary',
                  }
                ]}
              />
            )}

            {metrics.conversionRate < 2 && metrics.customerCount > 0 && (
              <InfoFeedback
                title="Improve conversion rate"
                message="Your conversion rate is below 2%. Consider optimizing your product descriptions and pricing."
                actions={[
                  {
                    label: 'Optimize Products',
                    action: () => window.location.href = '/creator/products-and-tiers',
                    variant: 'primary',
                  }
                ]}
              />
            )}

            {metrics.churnRate > 10 && (
              <InfoFeedback
                title="Address customer churn"
                message="Your churn rate is high. Consider reaching out to customers for feedback and improving your product."
                actions={[
                  {
                    label: 'View Analytics',
                    action: () => window.location.href = '/creator/dashboard/analytics',
                    variant: 'primary',
                  }
                ]}
              />
            )}

            {healthScore >= 80 && (
              <SuccessFeedback
                title="Excellent business performance!"
                message="Your business is performing exceptionally well across all key metrics. Keep up the great work!"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}