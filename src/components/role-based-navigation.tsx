'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, ChevronDown, HelpCircle, Settings, TrendingUp, Users, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavigationProps {
  userRole: 'platform_owner' | 'creator' | 'subscriber';
  currentPath?: string;
}

interface NavigationSection {
  title: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  links: {
    href: string;
    label: string;
    description: string;
    isNew?: boolean;
  }[];
}

export function RoleBasedNavigation({ userRole, currentPath }: NavigationProps) {
  const [openSections, setOpenSections] = useState<string[]>(['main']);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getNavigationSections = (): NavigationSection[] => {
    switch (userRole) {
      case 'platform_owner':
        return [
          {
            title: 'Dashboard & Analytics',
            icon: <BarChart3 className="h-5 w-5" />,
            description: 'Platform insights and performance metrics',
            links: [
              {
                href: '/dashboard',
                label: 'Main Dashboard',
                description: 'Platform overview and quick actions'
              },
              {
                href: '/dashboard/revenue',
                label: 'Revenue Dashboard',
                description: 'Financial performance and metrics'
              },
              {
                href: '/dashboard/analytics',
                label: 'Basic Analytics',
                description: 'User engagement and basic metrics'
              },
              {
                href: '/dashboard/advanced-analytics',
                label: 'Advanced Analytics',
                description: 'Conversion funnels, cohorts, and deep insights',
                isNew: true
              }
            ]
          },
          {
            title: 'Creator Management',
            icon: <Users className="h-5 w-5" />,
            description: 'Manage and support your creators',
            badge: 'Enhanced',
            links: [
              {
                href: '/dashboard/creators',
                label: 'User Management',
                description: 'Basic user and creator management'
              },
              {
                href: '/dashboard/creator-oversight',
                label: 'Creator Oversight',
                description: 'Health monitoring and proactive support',
                isNew: true
              },
              {
                href: '/dashboard/creator-feedback',
                label: 'Creator Feedback',
                description: 'Review and respond to creator feedback'
              }
            ]
          },
          {
            title: 'Content & Design',
            icon: <Zap className="h-5 w-5" />,
            description: 'Build and customize platform offerings',
            badge: 'New',
            links: [
              {
                href: '/dashboard/design-studio',
                label: 'Design Studio',
                description: 'Create embeds, manage assets with AI-powered tools',
                isNew: true
              },
              {
                href: '/dashboard/storefront',
                label: 'Platform Storefront',
                description: 'Customize platform appearance and branding',
                isNew: true
              }
            ]
          },
          {
            title: 'Platform Settings',
            icon: <Settings className="h-5 w-5" />,
            description: 'Configure your platform',
            links: [
              {
                href: '/dashboard/products',
                label: 'Product Management',
                description: 'Manage subscription offerings'
              },
              {
                href: '/platform-owner-onboarding',
                label: 'Environment Setup',
                description: 'Configure test and production environments'
              }
            ]
          }
        ];

      case 'creator':
        return [
          {
            title: 'Business Dashboard',
            icon: <TrendingUp className="h-5 w-5" />,
            description: 'Monitor your SaaS business performance',
            links: [
              {
                href: '/creator/dashboard',
                label: 'Main Dashboard',
                description: 'Overview and quick actions'
              },
              {
                href: '/creator/dashboard/revenue',
                label: 'Revenue Analytics',
                description: 'Financial performance and growth metrics'
              },
              {
                href: '/creator/dashboard/analytics',
                label: 'Customer Analytics',
                description: 'User engagement and behavior insights'
              }
            ]
          },
          {
            title: 'Product & Business',
            icon: <Zap className="h-5 w-5" />,
            description: 'Manage your products and pricing',
            links: [
              {
                href: '/creator/products-and-tiers',
                label: 'Products & Tiers',
                description: 'Manage pricing and subscription plans'
              },
              {
                href: '/creator/design-studio',
                label: 'Design Studio',
                description: 'Create embeds, manage assets and scripts'
              },
              {
                href: '/creator/white-label-sites',
                label: 'White-Label Sites',
                description: 'Customize customer-facing pages'
              }
            ]
          },
          {
            title: 'Support & Growth',
            icon: <HelpCircle className="h-5 w-5" />,
            description: 'Get help and grow your business',
            badge: 'New',
            links: [
              {
                href: '/creator/support',
                label: 'Support Center',
                description: 'Help resources, progress tracking, and expert assistance',
                isNew: true
              },
              {
                href: '/creator/profile',
                label: 'Profile Settings',
                description: 'Manage your creator profile'
              }
            ]
          }
        ];

      case 'subscriber':
        return [
          {
            title: 'Account Management',
            icon: <Users className="h-5 w-5" />,
            description: 'Manage your subscription and preferences',
            links: [
              {
                href: '/account',
                label: 'Account Overview',
                description: 'View account status and basic information'
              },
              {
                href: '/account/billing',
                label: 'Billing & Usage',
                description: 'Manage subscription and view usage'
              }
            ]
          }
        ];

      default:
        return [];
    }
  };

  const getRoleDisplayName = (role: NavigationProps['userRole']) => {
    switch (role) {
      case 'platform_owner': return 'Platform Owner';
      case 'creator': return 'Creator';
      case 'subscriber': return 'Subscriber';
      default: return 'User';
    }
  };

  const getRoleDescription = (role: NavigationProps['userRole']) => {
    switch (role) {
      case 'platform_owner': return 'Manage your entire SaaS platform, creators, and business intelligence';
      case 'creator': return 'Build and grow your SaaS business with comprehensive tools and support';
      case 'subscriber': return 'Manage your subscription and account preferences';
      default: return 'Navigate your account';
    }
  };

  const sections = getNavigationSections();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{getRoleDisplayName(userRole)} Navigation</h2>
            <p className="text-sm text-gray-600 mt-1">{getRoleDescription(userRole)}</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {sections.reduce((acc, section) => acc + section.links.length, 0)} Features Available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sections.map((section, index) => {
            const isOpen = openSections.includes(section.title);
            
            return (
              <Collapsible 
                key={section.title} 
                open={isOpen} 
                onOpenChange={() => toggleSection(section.title)}
              >
                <CollapsibleTrigger asChild>
                  <div 
                    className={`
                      flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all
                      ${isOpen ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'} 
                      border
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${isOpen ? 'text-blue-600' : 'text-gray-600'}`}>
                        {section.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{section.title}</h3>
                          {section.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 text-gray-500 transition-transform ${
                        isOpen ? 'transform rotate-180' : ''
                      }`} 
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="grid gap-3 ml-6 md:grid-cols-2">
                    {section.links.map((link) => (
                      <div key={link.href} className="relative">
                        <Button 
                          asChild 
                          variant={currentPath === link.href ? 'default' : 'outline'}
                          className="w-full justify-start h-auto p-3 relative"
                        >
                          <Link href={link.href}>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{link.label}</span>
                                {link.isNew && (
                                  <Badge variant="default" className="text-xs bg-green-600">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{link.description}</p>
                            </div>
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
        
        {userRole === 'platform_owner' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900">🚀 What's New in Platform Owner Tools</h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• <strong>Creator Oversight:</strong> Monitor creator health and provide proactive support</li>
              <li>• <strong>Advanced Analytics:</strong> Conversion funnels, user segmentation, and cohort analysis</li>
              <li>• <strong>Automated Workflows:</strong> Smart alerts and streamlined creator assistance</li>
            </ul>
          </div>
        )}
        
        {userRole === 'creator' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900">🎯 SaaS-in-a-Box Optimization</h4>
            <ul className="mt-2 text-sm text-green-700 space-y-1">
              <li>• <strong>Support Center:</strong> Get personalized guidance for your SaaS journey</li>
              <li>• <strong>Progress Tracking:</strong> Clear milestones from setup to scaling</li>
              <li>• <strong>Expert Help:</strong> Live chat, scheduled calls, and comprehensive resources</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}