'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight,CheckCircle, Circle, ExternalLink, Package, Palette, Settings, Shield, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import type { CreatorProfile } from '../types';

interface PostOnboardingTaskDashboardProps {
  profile: CreatorProfile;
  onTaskComplete?: (taskId: string) => void;
}

interface TaskModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  actions: {
    label: string;
    href: string;
    variant?: 'default' | 'outline' | 'ghost';
  }[];
  helpText: string;
  aiAssistance: string[];
}

export function PostOnboardingTaskDashboard({ profile, onTaskComplete }: PostOnboardingTaskDashboardProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Define task modules based on the problem statement
  const taskModules: TaskModule[] = [
    {
      id: 'product-setup',
      title: 'Product Setup',
      description: 'Import/create products and configure usage/subscription tiers',
      icon: <Package className="h-5 w-5" />,
      completed: false, // TODO: Calculate based on actual data
      priority: 'high',
      estimatedTime: '10-15 minutes',
      actions: [
        { label: 'Add Products', href: '/creator/dashboard/products/new' },
        { label: 'Import from Stripe', href: '/creator/dashboard/products?import=stripe', variant: 'outline' },
        { label: 'View Examples', href: '/creator/dashboard/products?examples=true', variant: 'ghost' }
      ],
      helpText: 'Set up your products and pricing tiers to start selling',
      aiAssistance: [
        'AI suggestions based on your business type',
        'Stripe product import and validation',
        'Pricing optimization recommendations',
        'Product description templates'
      ]
    },
    {
      id: 'embeds-widgets',
      title: 'Embeds & Widgets',
      description: 'Add embeddable components for external usage',
      icon: <Zap className="h-5 w-5" />,
      completed: false,
      priority: 'medium',
      estimatedTime: '5-10 minutes',
      actions: [
        { label: 'Create Embeds', href: '/embed-preview' },
        { label: 'View Templates', href: '/embed-preview?templates=true', variant: 'outline' }
      ],
      helpText: 'Create embeddable widgets for your website and marketing',
      aiAssistance: [
        'Prebuilt templates for common use cases',
        'Inline guidance for customization',
        'AI suggestions for embed placement'
      ]
    },
    {
      id: 'storefront-customization',
      title: 'Storefront / White-Label',
      description: 'Customize your AI-generated storefront pages',
      icon: <Palette className="h-5 w-5" />,
      completed: false,
      priority: 'high',
      estimatedTime: '15-20 minutes',
      actions: [
        { label: 'Customize Storefront', href: '/creator/storefront/customize' },
        { label: 'Design Templates', href: '/creator/storefront/templates', variant: 'outline' },
        { label: 'Preview Store', href: `/c/${profile.page_slug}`, variant: 'ghost' }
      ],
      helpText: 'Customize your storefront design and content to match your brand',
      aiAssistance: [
        'Editable AI-generated templates',
        'Brand-based design suggestions',
        'Best-practice tips and guidance',
        'Page hierarchy recommendations'
      ]
    },
    {
      id: 'integrations-webhooks',
      title: 'Integrations & Webhooks',
      description: 'Connect Slack, Zapier, analytics, and CRMs',
      icon: <Settings className="h-5 w-5" />,
      completed: false,
      priority: 'medium',
      estimatedTime: '10-15 minutes',
      actions: [
        { label: 'Setup Integrations', href: '/creator/dashboard/integrations' },
        { label: 'Configure Webhooks', href: '/creator/dashboard/webhooks', variant: 'outline' }
      ],
      helpText: 'Connect your favorite tools and services',
      aiAssistance: [
        'Prebuilt integration templates',
        'AI guidance for webhook setup',
        'Testing tools and validation',
        'Popular integration recommendations'
      ]
    },
    {
      id: 'review-optimize',
      title: 'Review & Optimize',
      description: 'Ensure setup is complete and optimized',
      icon: <Shield className="h-5 w-5" />,
      completed: false,
      priority: 'low',
      estimatedTime: '5 minutes',
      actions: [
        { label: 'Run Audit', href: '/creator/dashboard/audit' },
        { label: 'View Recommendations', href: '/creator/dashboard/recommendations', variant: 'outline' }
      ],
      helpText: 'Get AI-powered recommendations to optimize your setup',
      aiAssistance: [
        'AI audit of your complete setup',
        'Inline optimization tips',
        'Progress tracking dashboard',
        'Performance suggestions'
      ]
    }
  ];

  const completedTasks = taskModules.filter(task => task.completed).length;
  const totalTasks = taskModules.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  const priorityTasks = taskModules.filter(task => task.priority === 'high' && !task.completed);

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Setup</h2>
          <p className="text-gray-600">
            Finish these tasks to unlock the full potential of your platform. Take your time - you can complete them at your own pace.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">{completedTasks} of {totalTasks} completed</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {priorityTasks.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📋 High Priority Tasks</h4>
            <p className="text-sm text-blue-800">
              Start with these essential tasks to get the most value from your platform:
            </p>
            <div className="mt-2 space-y-1">
              {priorityTasks.map(task => (
                <div key={task.id} className="text-sm text-blue-700">
                  • {task.title} ({task.estimatedTime})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {taskModules.map((task) => (
          <Card key={task.id} className={`relative ${task.completed ? 'bg-green-50 border-green-200' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${task.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {task.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      task.icon
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">{task.estimatedTime}</span>
                    </div>
                  </div>
                </div>
                {task.completed && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription>{task.description}</CardDescription>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">{task.helpText}</p>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {task.actions.map((action, index) => (
                    <Button 
                      key={index}
                      variant={action.variant || 'default'}
                      size="sm"
                      asChild
                      className={index === 0 ? '' : 'text-xs'}
                    >
                      <Link href={action.href} className="flex items-center gap-1">
                        {action.label}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  ))}
                </div>

                {/* AI Assistance toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  className="w-full justify-between text-xs"
                >
                  🤖 AI Assistance Available
                  <ArrowRight className={`h-3 w-3 transition-transform ${expandedTask === task.id ? 'rotate-90' : ''}`} />
                </Button>

                {/* AI Assistance details */}
                {expandedTask === task.id && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-xs font-medium text-blue-900 mb-2">AI will help you with:</h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {task.aiAssistance.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion message */}
      {completedTasks === totalTasks && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">🎉 Setup Complete!</h3>
          <p className="text-green-800 mb-4">
            Congratulations! You&apos;ve completed all setup tasks. Your platform is now fully optimized and ready to scale.
          </p>
          <Button asChild>
            <Link href="/creator/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      )}
    </div>
  );
}