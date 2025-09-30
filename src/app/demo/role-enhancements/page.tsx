'use client';

import { useState } from 'react';
import { CheckCircle, Users, Zap } from 'lucide-react';

import { RoleBasedNavigation } from '@/components/role-based-navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCreatorSupport } from '@/features/creator/components/EnhancedCreatorSupport';
import { EnhancedCustomerPortal } from '@/features/creator/components/EnhancedCustomerPortal';
import { AdvancedPlatformAnalytics } from '@/features/platform-owner/components/AdvancedPlatformAnalytics';
import { EnhancedCreatorOversight } from '@/features/platform-owner/components/EnhancedCreatorOversight';

export default function RoleEnhancementsDemo() {
  const [selectedRole, setSelectedRole] = useState<'platform_owner' | 'creator' | 'user'>('platform_owner');
  const [selectedDemo, setSelectedDemo] = useState<string>('navigation');

  const roleOptions = [
    {
      value: 'platform_owner' as const,
      label: 'Platform Owner',
      description: 'Manage the entire SaaS platform',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      value: 'creator' as const,
      label: 'Creator',
      description: 'Build and grow SaaS businesses',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      value: 'user' as const,
      label: 'Customer',
      description: 'End-user experience',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ];

  const getEnhancementSummary = (role: string) => {
    switch (role) {
      case 'platform_owner':
        return {
          title: 'Platform Owner Enhancements',
          subtitle: 'Comprehensive business intelligence and creator success tools',
          features: [
            'Creator health monitoring with risk identification',
            'Advanced analytics with conversion funnels and cohort analysis', 
            'Automated creator support workflows',
            'Real-time platform performance metrics',
            'User segmentation and growth tracking'
          ]
        };
      case 'creator':
        return {
          title: 'Creator Experience Optimization',
          subtitle: 'SaaS-in-a-Box model with guided success journey',
          features: [
            'Comprehensive support center with progress tracking',
            'Multi-channel support integration (chat, calls, tickets)',
            'Contextual help resources and learning hub',
            'Personalized milestone tracking and recommendations',
            'Simplified setup focusing on SaaS + Stripe only'
          ]
        };
      case 'user':
        return {
          title: 'Enhanced Customer Experience',
          subtitle: 'Professional self-service portal with complete transparency',
          features: [
            'Comprehensive usage analytics with visual progress tracking',
            'Complete billing transparency with downloadable invoices',
            'Enhanced account management and preferences',
            'Self-service support tools and resources',
            'Real-time activity timeline and notifications'
          ]
        };
      default:
        return { title: '', subtitle: '', features: [] };
    }
  };

  const summary = getEnhancementSummary(selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Role-Based Features Demo
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            SaaSinaSnap Enhanced Role Experience
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the comprehensive enhancements made to each user role in the SaaSinaSnap platform. 
            From advanced platform owner analytics to guided creator success journeys and enhanced customer portals.
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {roleOptions.map((option) => (
            <Card 
              key={option.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRole === option.value ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
              onClick={() => setSelectedRole(option.value)}
            >
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${option.color}`}>
                  {option.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{option.label}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
                {selectedRole === option.value && (
                  <Badge className="mt-3 bg-blue-600">Selected</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhancement Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{summary.title}</CardTitle>
            <p className="text-gray-600">{summary.subtitle}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {summary.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demo Content */}
        <Tabs value={selectedDemo} onValueChange={setSelectedDemo} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            {selectedRole === 'platform_owner' && (
              <>
                <TabsTrigger value="oversight">Creator Oversight</TabsTrigger>
                <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
              </>
            )}
            {selectedRole === 'creator' && (
              <TabsTrigger value="support">Support Center</TabsTrigger>
            )}
            {selectedRole === 'user' && (
              <TabsTrigger value="portal">Customer Portal</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="navigation">
            <RoleBasedNavigation userRole={selectedRole} />
          </TabsContent>

          {selectedRole === 'platform_owner' && (
            <>
              <TabsContent value="oversight">
                <Card>
                  <CardHeader>
                    <CardTitle>Enhanced Creator Oversight</CardTitle>
                    <p className="text-gray-600">
                      Monitor creator health, identify at-risk creators, and provide proactive support
                    </p>
                  </CardHeader>
                  <CardContent>
                    <EnhancedCreatorOversight />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Platform Analytics</CardTitle>
                    <p className="text-gray-600">
                      Deep business intelligence with conversion funnels, user segmentation, and retention analytics
                    </p>
                  </CardHeader>
                  <CardContent>
                    <AdvancedPlatformAnalytics />
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {selectedRole === 'creator' && (
            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle>Enhanced Creator Support Center</CardTitle>
                  <p className="text-gray-600">
                    Comprehensive support hub with progress tracking, resources, and multi-channel assistance
                  </p>
                </CardHeader>
                <CardContent>
                  <EnhancedCreatorSupport />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {selectedRole === 'user' && (
            <TabsContent value="portal">
              <Card>
                <CardHeader>
                  <CardTitle>Enhanced Customer Portal</CardTitle>
                  <p className="text-gray-600">
                    Professional self-service portal with usage analytics, billing transparency, and support tools
                  </p>
                </CardHeader>
                <CardContent>
                  <EnhancedCustomerPortal 
                    creatorSlug="demo-creator" 
                    customerId="demo-customer"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Summary Footer */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">🎯 SaaS-in-a-Box Vision Achieved</h3>
            <p className="text-gray-700 mb-4">
              These enhancements transform SaaSinaSnap into a comprehensive, intelligent platform that supports 
              creators from idea to successful SaaS business while providing platform owners with enterprise-grade 
              business intelligence and customer management tools.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Enhanced User Experience</Badge>
              <Badge variant="outline">Proactive Support</Badge>
              <Badge variant="outline">Advanced Analytics</Badge>
              <Badge variant="outline">Self-Service Tools</Badge>
              <Badge variant="outline">Business Intelligence</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}