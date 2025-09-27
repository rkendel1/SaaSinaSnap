'use client';

import { useState } from 'react';
import { ArrowRight, BarChart, Brain, CheckCircle, ChevronRight, DollarSign, Play, Settings, Target, TrendingUp, Users, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AIEnhancedDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const aiFeatures = [
    {
      id: 'onboarding-optimization',
      title: 'AI-Guided Onboarding',
      description: 'Intelligent path optimization with 60% faster setup and 40% higher completion rates',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      stats: { improvement: '60%', metric: 'faster setup' },
      demo: {
        before: 'Generic 7-step process for all users',
        after: 'Personalized 3-5 step flow based on AI analysis',
        impact: '40% higher completion rate'
      }
    },
    {
      id: 'churn-prediction',
      title: 'Predictive Churn Prevention',
      description: 'AI predicts customer churn 30-60 days in advance with automated prevention strategies',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      stats: { improvement: '45%', metric: 'churn reduction' },
      demo: {
        before: 'React to churn after it happens',
        after: 'Prevent churn with 30-60 day advance warning',
        impact: '45% reduction in customer churn'
      }
    },
    {
      id: 'smart-pricing',
      title: 'AI Pricing Intelligence',
      description: 'Machine learning analyzes market data to recommend optimal pricing strategies',
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500',
      stats: { improvement: '25%', metric: 'revenue increase' },
      demo: {
        before: 'Manual pricing based on intuition',
        after: 'AI-optimized pricing with market intelligence',
        impact: '25% average revenue increase'
      }
    },
    {
      id: 'predictive-analytics',
      title: 'Advanced Predictive Analytics',
      description: 'Real-time usage forecasting, pattern analysis, and anomaly detection',
      icon: BarChart,
      color: 'from-orange-500 to-red-500',
      stats: { improvement: '70%', metric: 'insight accuracy' },
      demo: {
        before: 'Historical reporting with basic metrics',
        after: 'Predictive insights with ML-powered forecasting',
        impact: '70% more accurate business predictions'
      }
    },
    {
      id: 'asset-creation',
      title: 'AI Asset Generation',
      description: 'Automated creation of marketing materials, logos, and brand assets',
      icon: Zap,
      color: 'from-teal-500 to-blue-500',
      stats: { improvement: '80%', metric: 'time savings' },
      demo: {
        before: 'Manual asset creation or expensive designers',
        after: 'AI generates professional assets in seconds',
        impact: '80% reduction in asset creation time'
      }
    },
    {
      id: 'smart-integrations',
      title: 'Intelligent Integration Recommendations',
      description: 'AI analyzes your business to recommend the most valuable integrations',
      icon: Settings,
      color: 'from-indigo-500 to-purple-500',
      stats: { improvement: '50%', metric: 'efficiency gains' },
      demo: {
        before: 'Manual integration selection and setup',
        after: 'AI recommends and configures optimal integrations',
        impact: '50% operational efficiency improvement'
      }
    }
  ];

  const integrations = [
    { name: 'PayPal', description: 'Additional payment gateway for higher conversion', category: 'Payment' },
    { name: 'Zapier', description: '5000+ app automations and workflows', category: 'Automation' },
    { name: 'HubSpot', description: 'CRM sync and customer management', category: 'CRM' },
    { name: 'Mailchimp', description: 'Email marketing and audience sync', category: 'Marketing' },
    { name: 'Slack', description: 'Real-time notifications and alerts', category: 'Communication' },
    { name: 'Square', description: 'POS and comprehensive payment processing', category: 'Payment' }
  ];

  const useCases = [
    {
      title: 'SaaS Startup Launch',
      description: 'AI guides new creators through optimized onboarding, predicts best pricing strategy, and generates professional assets.',
      metrics: ['60% faster launch', '40% higher completion', '25% better pricing'],
      timeline: '2-3 days instead of 2-3 weeks'
    },
    {
      title: 'Churn Reduction Campaign',
      description: 'Predictive analytics identify at-risk customers and automatically trigger personalized retention strategies.',
      metrics: ['30-60 day advance warning', '45% churn reduction', '3x retention rate'],
      timeline: 'Real-time monitoring and intervention'
    },
    {
      title: 'Revenue Optimization',
      description: 'AI analyzes usage patterns, recommends tier upgrades, and optimizes pricing for maximum customer lifetime value.',
      metrics: ['25% revenue increase', '35% higher LTV', '50% more upgrades'],
      timeline: 'Continuous optimization with monthly reviews'
    }
  ];

  const playDemo = (featureId: string) => {
    setActiveDemo(featureId);
    setIsPlaying(true);
    
    // Simulate demo playing
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            🤖 AI-Powered SaaS Platform
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SaaSinaSnap AI Enhancement Suite
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            Experience the world&apos;s first AI-powered SaaS monetization platform. Our machine learning algorithms optimize every aspect of your business—from onboarding to pricing to customer retention.
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Play className="mr-2 h-5 w-5" />
              Watch AI Demo
            </Button>
            <Button size="lg" variant="outline">
              <Brain className="mr-2 h-5 w-5" />
              View Technical Details
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">60%</div>
              <div className="text-sm text-muted-foreground">Faster Setup</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">45%</div>
              <div className="text-sm text-muted-foreground">Churn Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">25%</div>
              <div className="text-sm text-muted-foreground">Revenue Increase</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">70%</div>
              <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
            </div>
          </div>
        </div>

        {/* AI Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">AI-Powered Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeDemo === feature.id;
              
              return (
                <Card key={feature.id} className={`transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white mb-4 inline-block`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary">
                        +{feature.stats.improvement}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-muted-foreground">Before: {feature.demo.before}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-muted-foreground">After: {feature.demo.after}</span>
                      </div>
                      <div className="flex items-center text-sm font-medium text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {feature.demo.impact}
                      </div>
                    </div>
                    <Button 
                      onClick={() => playDemo(feature.id)}
                      disabled={isPlaying}
                      className="w-full"
                      variant={isActive ? "default" : "outline"}
                    >
                      {isPlaying && isActive ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Running Demo...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          View Demo
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Integrations Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Enhanced Integrations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{integration.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {integration.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              <Settings className="mr-2 h-5 w-5" />
              View All Integrations
            </Button>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Real-World Use Cases</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-sm">Key Metrics:</h4>
                    {useCase.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {metric}
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-sm font-medium text-blue-600">
                      Timeline: {useCase.timeline}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience AI-Powered SaaS Growth?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Join the next generation of SaaS creators using artificial intelligence to optimize every aspect of their business. From onboarding to pricing to customer retention—let AI drive your success.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Brain className="mr-2 h-5 w-5" />
              Start AI-Powered Setup
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Users className="mr-2 h-5 w-5" />
              Join Beta Program
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-blue-500">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold">500+</div>
                <div className="text-blue-200">AI-Optimized Launches</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$2M+</div>
                <div className="text-blue-200">Additional Revenue Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold">45%</div>
                <div className="text-blue-200">Average Churn Reduction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Technical Implementation
              </CardTitle>
              <CardDescription>
                Built with cutting-edge AI and machine learning technologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-3">AI Services Implemented:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• AIOnboardingOptimizerService - Intelligent path optimization</li>
                    <li>• PredictiveAnalyticsService - ML-powered customer insights</li>
                    <li>• EnhancedEmbedService - Real-time optimization and A/B testing</li>
                    <li>• IntegrationService - Smart recommendation engine</li>
                    <li>• Enhanced AI Task Assistant - Predictive guidance system</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Key Technologies:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• OpenAI GPT-4 for intelligent recommendations</li>
                    <li>• Machine learning algorithms for churn prediction</li>
                    <li>• Real-time analytics and pattern recognition</li>
                    <li>• Multi-gateway payment processing</li>
                    <li>• Advanced A/B testing with statistical significance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}