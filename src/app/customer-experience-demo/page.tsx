'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuccessFeedback, ErrorFeedback, LoadingFeedback, InfoFeedback } from '@/components/ui/user-feedback';
import { ContextualHelp } from '@/components/ui/contextual-help';
import { ProgressTracker, ProgressIndicator } from '@/components/ui/progress-tracker';
import { LoadingState, LoadingCard, LoadingSkeleton } from '@/components/ui/loading-states';
import { HelpCenter } from '@/components/ui/help-center';

export default function CustomerExperienceDemoPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const sampleSteps = [
    {
      id: 'setup',
      title: 'Account Setup',
      description: 'Complete your profile and business information',
      status: 'completed' as const,
      completedAt: new Date(Date.now() - 86400000),
    },
    {
      id: 'first-product',
      title: 'Create First Product',
      description: 'Add your first product or service',
      status: 'current' as const,
      estimatedTime: '10 min',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Customer Experience Enhancements Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore comprehensive customer experience improvements designed to delight users.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enhanced Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>✅ Success celebrations</li>
                <li>✅ Clear error messages</li>
                <li>✅ Actionable feedback</li>
                <li>✅ Loading indicators</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contextual Help</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>✅ Inline help tooltips</li>
                <li>✅ Step-by-step guidance</li>
                <li>✅ Video integration</li>
                <li>✅ Related resources</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>✅ Visual progress indicators</li>
                <li>✅ Milestone celebrations</li>
                <li>✅ Achievement rewards</li>
                <li>✅ Success metrics</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SuccessFeedback
                title="Payment Successful!"
                message="Your subscription has been activated. Welcome to the platform!"
                actions={[
                  { label: 'View Dashboard', action: () => alert('Navigate to dashboard'), variant: 'primary' },
                ]}
              />

              <ErrorFeedback
                title="Payment Failed"
                message="We couldn't process your payment. Please check your card details."
                actions={[
                  { label: 'Retry Payment', action: () => alert('Retry payment'), variant: 'primary' },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Contextual Help Demo
                <ContextualHelp
                  content={{
                    id: 'help-demo',
                    title: 'Contextual Help',
                    description: 'This provides instant guidance without leaving the page.',
                    steps: [
                      'Click the help icon next to features',
                      'Read explanations and steps',
                      'Follow guidance to complete tasks'
                    ]
                  }}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HelpCenter compact />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressTracker
                title="Getting Started"
                description="Complete these steps to get your platform ready"
                steps={sampleSteps}
                showRewards={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
