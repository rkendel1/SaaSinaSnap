'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity,
  BarChart3, 
  Bell, 
  ChevronDown, 
  ChevronRight, 
  Code, // New icon for Embeds & Scripts
  CreditCard,
  Database,
  DollarSign,
  Eye,
  FileText,
  FlaskConical,
  FolderOpen, 
  HelpCircle,
  Home,
  LayoutTemplate, // New icon for White-Label Sites
  LineChart,
  Menu,
  Package, 
  Palette, 
  Settings, 
  Upload,
  UserCog,
  Users,
  Webhook,
  X,
  Zap} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/utils/cn';

interface NavigationItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavigationItem[];
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/creator/dashboard',
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: 'Products & Tiers',
    href: '/creator/products-and-tiers',
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: 'Embeds & Scripts', // New top-level item
    href: '/creator/embeds-and-scripts',
    icon: <Code className="h-4 w-4" />,
  },
  {
    title: 'White-Label Sites', // New top-level item
    href: '/creator/white-label-sites',
    icon: <LayoutTemplate className="h-4 w-4" />,
  },
  {
    title: 'Design Studio', // Now focused on builder tools
    icon: <Palette className="h-4 w-4" />,
    children: [
      {
        title: 'Quick Create',
        href: '/creator/design-studio/builder',
        icon: <Zap className="h-4 w-4" />,
      },
      {
        title: 'Website Builder',
        href: '/creator/design-studio/website-builder',
        icon: <Eye className="h-4 w-4" />,
      },
      {
        title: 'A/B Testing',
        href: '/creator/design-studio/testing',
        icon: <FlaskConical className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Revenue & Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      {
        title: 'Revenue Dashboard',
        href: '/creator/dashboard/revenue',
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        title: 'Analytics Overview',
        href: '/creator/dashboard/analytics',
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        title: 'Usage Analytics',
        href: '/creator/dashboard/usage',
        icon: <Activity className="h-4 w-4" />,
      },
      {
        title: 'Recommendations',
        href: '/creator/dashboard/recommendations',
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        title: 'Audit',
        href: '/creator/dashboard/audit',
        icon: <HelpCircle className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Data & Reports',
    icon: <Database className="h-4 w-4" />,
    children: [
      {
        title: 'Report Builder',
        href: '/creator/report-builder',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: 'Data Import',
        href: '/creator/data-import',
        icon: <Upload className="h-4 w-4" />,
      },
      {
        title: 'Data Visualization',
        href: '/creator/data-visualization',
        icon: <LineChart className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Customer Portal Preview',
    href: '/demo/customer-portal',
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    children: [
      {
        title: 'Profile',
        href: '/creator/profile',
        icon: <UserCog className="h-4 w-4" />,
      },
      {
        title: 'Integrations',
        href: '/creator/dashboard/integrations',
        icon: <Zap className="h-4 w-4" />,
      },
      {
        title: 'Webhooks',
        href: '/creator/dashboard/webhooks',
        icon: <Webhook className="h-4 w-4" />,
      },
      {
        title: 'Account Management',
        href: '/creator/account',
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Notifications',
    href: '/creator/dashboard/notifications',
    icon: <Bell className="h-4 w-4" />,
    badge: 3,
  },
  {
    title: 'Help & Support',
    href: '/support',
    icon: <HelpCircle className="h-4 w-4" />,
  },
];

interface SidebarContentProps {
  onNavigate?: () => void;
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(['Design Studio', 'Analytics & Reports', 'Settings']);

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) 
        ? prev.filter(section => section !== title)
        : [...prev, title]
    );
  };

  const isActiveLink = (href: string) => {
    return pathname === href || (href !== '/creator/dashboard' && pathname.startsWith(href + '/'));
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSections.includes(item.title);
    const isActive = item.href ? isActiveLink(item.href) : false;
    const isParentActive = hasChildren && item.children?.some(child => child.href && isActiveLink(child.href));

    const dynamicPl = `pl-${3 + depth * 4}`;

    if (hasChildren) {
      return (
        <Collapsible 
          key={item.title} 
          open={isOpen} 
          onOpenChange={() => toggleSection(item.title)}
        >
          <CollapsibleTrigger asChild>
            <div className={cn(
              "flex items-center justify-between h-10 py-2 font-medium text-sm cursor-pointer",
              "hover:bg-gray-100 hover:text-gray-900",
              (isOpen || isParentActive) ? "text-primary" : "text-gray-700",
              dynamicPl,
              "pr-3"
            )}>
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.title}</span>
                {item.badge && (
                  <span className="ml-auto bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              {(isOpen || isParentActive) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1">
            {item.children?.map(child => renderNavigationItem(child, depth + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link key={item.title} href={item.href || '#'} onClick={onNavigate} className={cn(
        "block",
        dynamicPl,
        "pr-3"
      )}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 py-2 font-medium text-sm",
            "hover:bg-gray-100 hover:text-gray-900",
            isActive 
              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500" 
              : "text-gray-700",
            "px-0"
          )}
        >
          <div className="flex items-center gap-3 w-full">
            {item.icon}
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </div>
        </Button>
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Creator Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your platform</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 overflow-x-hidden">
        <nav className="space-y-1">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Need help? <Link href="/support" className="text-blue-600 hover:text-blue-800">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}

interface SidebarNavigationProps {
  children: React.ReactNode;
}

export function SidebarNavigation({ children }: SidebarNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Menu Button */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent onNavigate={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}