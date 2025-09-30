'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3,
  ChevronDown,
  ChevronRight,
  Code, 
  DollarSign,
  HelpCircle,
  LayoutTemplate, 
  Package, 
  Palette,
  Settings,
  UserCog} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CollapsibleSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  actions: {
    href: string;
    icon: React.ReactNode;
    label: string;
  }[];
}

const dashboardSections: CollapsibleSection[] = [
  {
    id: 'product-management',
    title: 'Product Management',
    icon: <Package className="h-5 w-5" />,
    description: 'Manage your products, pricing, and subscription tiers',
    actions: [
      {
        href: '/creator/products-and-tiers',
        icon: <Package className="h-4 w-4" />,
        label: 'Manage Products & Tiers'
      }
    ]
  },
  {
    id: 'site-management',
    title: 'Site Management', 
    icon: <LayoutTemplate className="h-5 w-5" />,
    description: 'Control your website, embeds, and branded experiences',
    actions: [
      {
        href: '/creator/white-label-sites',
        icon: <LayoutTemplate className="h-4 w-4" />,
        label: 'Manage White-Label Sites'
      },
      {
        href: '/creator/embeds-and-scripts',
        icon: <Code className="h-4 w-4" />,
        label: 'Manage Embeds & Scripts'
      }
    ]
  },
  {
    id: 'business-tools',
    title: 'Business Tools',
    icon: <Settings className="h-5 w-5" />,
    description: 'Analyze performance, customize designs, and manage settings',
    actions: [
      {
        href: '/creator/dashboard/revenue',
        icon: <DollarSign className="h-4 w-4" />,
        label: 'Revenue Dashboard'
      },
      {
        href: '/creator/design-studio',
        icon: <Palette className="h-4 w-4" />,
        label: 'Design Studio'
      },
      {
        href: '/creator/dashboard/analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        label: 'Analytics & Reports'
      },
      {
        href: '/creator/profile',
        icon: <UserCog className="h-4 w-4" />,
        label: 'Edit Profile'
      }
    ]
  },
  {
    id: 'support-help',
    title: 'Support & Help',
    icon: <HelpCircle className="h-5 w-5" />,
    description: 'Get help, access resources, and track your success journey',
    actions: [
      {
        href: '/creator/support',
        icon: <HelpCircle className="h-4 w-4" />,
        label: 'Support Center'
      }
    ]
  }
];

export function DashboardQuickActions() {
  const [openSections, setOpenSections] = useState<string[]>(['product-management']);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold mb-6 text-gray-900">Quick Actions</h3>
      <div className="space-y-4">
        {dashboardSections.map((section) => {
          const isOpen = openSections.includes(section.id);
          
          return (
            <Collapsible 
              key={section.id} 
              open={isOpen} 
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">
                      {section.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 ml-6">
                <div className="grid gap-2 sm:grid-cols-1">
                  {section.actions.map((action) => (
                    <Button 
                      key={action.href}
                      asChild 
                      variant="outline" 
                      className="justify-start h-auto py-3"
                    >
                      <Link href={action.href} className="flex items-center gap-2">
                        {action.icon}
                        <span>{action.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
