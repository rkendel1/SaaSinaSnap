'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronRight, 
  BarChart3, 
  Package, 
  Palette, 
  Settings, 
  FolderOpen, 
  Bell, 
  Home,
  Zap,
  Eye,
  UserCog,
  Menu,
  X,
  HelpCircle,
  CreditCard,
  Activity
} from 'lucide-react';

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
    title: 'Products',
    href: '/creator/dashboard/products', // Direct link to the consolidated page
    icon: <Package className="h-4 w-4" />,
    // Removed children as per user request
  },
  {
    title: 'Design Studio',
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
        title: 'Manage Embeds',
        href: '/creator/design-studio/manage',
        icon: <Settings className="h-4 w-4" />,
      },
      { // Moved from top-level and renamed for clarity
        title: 'Asset Library',
        href: '/creator/dashboard/assets',
        icon: <FolderOpen className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Analytics',
    href: '/creator/dashboard/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: 'Usage & Billing',
    icon: <Activity className="h-4 w-4" />,
    children: [
      {
        title: 'Subscription Tiers',
        href: '/creator/dashboard/tiers',
        icon: <CreditCard className="h-4 w-4" />,
      },
      {
        title: 'Usage Analytics',
        href: '/creator/dashboard/usage',
        icon: <BarChart3 className="h-4 w-4" />,
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
    title: 'Profile & Settings',
    icon: <Settings className="h-4 w-4" />,
    children: [
      {
        title: 'Edit Profile',
        href: '/creator/profile',
        icon: <UserCog className="h-4 w-4" />,
      },
      {
        title: 'Account Settings',
        href: '/account', // Updated to link to the new /account page
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
  { // New section for Help & Support
    title: 'Help & Support',
    href: '/support', // Assuming a support page exists
    icon: <HelpCircle className="h-4 w-4" />,
  },
];

interface SidebarContentProps {
  onNavigate?: () => void;
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  // Corrected initial state to only include actual collapsible sections
  const [openSections, setOpenSections] = useState<string[]>(['Design Studio', 'Usage & Billing', 'Profile & Settings']);

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) 
        ? prev.filter(section => section !== title)
        : [...prev, title]
    );
  };

  const isActiveLink = (href: string) => {
    // Check if the current pathname exactly matches the href or starts with it (for nested routes)
    return pathname === href || (href !== '/creator/dashboard' && pathname.startsWith(href + '/'));
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSections.includes(item.title);
    const isActive = item.href ? isActiveLink(item.href) : false;
    const isParentActive = hasChildren && item.children?.some(child => child.href && isActiveLink(child.href));

    // Calculate dynamic left padding for indentation
    // Base padding for top-level items is pl-3 (12px).
    // Each depth level adds 16px (pl-4).
    const dynamicPl = `pl-${3 + depth * 4}`;

    if (hasChildren) {
      return (
        <Collapsible 
          key={item.title} 
          // Only use isOpen for collapsibility, isParentActive for visual highlighting
          open={isOpen} 
          onOpenChange={() => toggleSection(item.title)}
        >
          <CollapsibleTrigger asChild>
            {/* Apply padding to this wrapper div, and let the button inside fill it */}
            <div className={cn(
              "flex items-center justify-between h-10 py-2 font-medium text-sm cursor-pointer",
              "hover:bg-gray-100 hover:text-gray-900",
              (isOpen || isParentActive) ? "text-primary" : "text-gray-700",
              dynamicPl, // Apply dynamic padding to this wrapper
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
              {/* Chevron icon should be part of the button, not outside */}
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
        "block", // Make the link a block element
        dynamicPl, // Apply dynamic padding to the link
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
            "px-0" // Remove internal horizontal padding from the button
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
      <div className="flex-1 overflow-y-auto p-2 overflow-x-hidden"> {/* Added overflow-x-hidden */}
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