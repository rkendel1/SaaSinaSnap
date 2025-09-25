'use client';

import Link from 'next/link';
import { ArrowLeft, FlaskConical, Plus, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ABTestingPage() {
  // Mock A/B tests for demonstration
  const mockTests = [
    {
      id: 'test-1',
      name: 'Hero Section CTA Test',
      embedName: 'Homepage Hero',
      status: 'running',
      trafficSplit: '50/50',
      primaryGoal: 'Conversions',
      startDate: '2024-07-01',
      endDate: '2024-07-15',
      controlPerformance: '2.5% CR',
      variantPerformance: '3.1% CR',
      lift: '+24%',
      winner: 'Variant B',
    },
    {
      id: 'test-2',
      name: 'Pricing Card Layout',
      embedName: 'Basic Plan Card',
      status: 'completed',
      trafficSplit: '50/50',
      primaryGoal: 'Clicks',
      startDate: '2024-06-10',
      endDate: '2024-06-24',
      controlPerformance: '15% CTR',
      variantPerformance: '12% CTR',
      lift: '-20%',
      winner: 'Control',
    },
    {
      id: 'test-3',
      name: 'Testimonial Carousel vs Grid',
      embedName: 'Customer Testimonials',
      status: 'draft',
      trafficSplit: '50/50',
      primaryGoal: 'Engagement',
      startDate: 'N/A',
      endDate: 'N/A',
      controlPerformance: 'N/A',
      variantPerformance: 'N/A',
      lift: 'N/A',
      winner: 'N/A',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/creator/design-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Studio
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">A/B Testing</h1>
                <p className="text-sm text-gray-600">Optimize your embeds for maximum performance</p>
              </div>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Test
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Running Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{mockTests.filter(t => t.status === 'running').length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{mockTests.filter(t => t.status === 'completed').length}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{mockTests.length}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test List */}
        <Card>
          <CardHeader>
            <CardTitle>All A/B Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTests.map((test) => (
                <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{test.name}</h3>
                    <Badge 
                      variant={test.status === 'running' ? 'default' : test.status === 'completed' ? 'secondary' : 'outline'}
                      className={test.status === 'running' ? 'bg-blue-500 text-white' : test.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}
                    >
                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Embed: <span className="font-medium">{test.embedName}</span> • Goal: <span className="font-medium">{test.primaryGoal}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <p className="font-medium">Traffic Split:</p>
                      <p>{test.trafficSplit}</p>
                    </div>
                    <div>
                      <p className="font-medium">Performance:</p>
                      <p>Control: {test.controlPerformance}</p>
                      <p>Variant: {test.variantPerformance}</p>
                    </div>
                    <div>
                      <p className="font-medium">Lift:</p>
                      <p>{test.lift}</p>
                    </div>
                    <div>
                      <p className="font-medium">Winner:</p>
                      <p>{test.winner}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    {test.status === 'running' && (
                      <Button variant="secondary" size="sm">Pause Test</Button>
                    )}
                    {test.status === 'draft' && (
                      <Button size="sm">Start Test</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {mockTests.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">No A/B tests found</div>
                <div className="text-sm">Start creating tests to optimize your embeds</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}