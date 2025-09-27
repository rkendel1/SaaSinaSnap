'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Code,
  DollarSign,
  HelpCircle,
  Home, 
  Menu, 
  Package, 
  Palette,
  Settings, 
  User,
  X} from 'lucide-react';

import { cn } from '@/utils/cn';

import { Badge } from './badge';
import { Button } from './button';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
  isActive?: boolean;
}

export interface MobileNavigationProps {
  items: NavItem[];
  currentPath?: string;
  userName?: string;
  userAvatar?: string;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/creator/dashboard',
    icon: Home,
    description: 'Overview and quick stats',
  },
  {
    id: 'products',
    label: 'Products & Tiers',
    href: '/creator/products-and-tiers',
    icon: Package,
    description: 'Manage your offerings',
  },
  {
    id: 'revenue',
    label: 'Revenue',
    href: '/creator/dashboard/revenue',
    icon: DollarSign,
    description: 'Financial analytics',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/creator/dashboard/analytics',
    icon: BarChart3,
    description: 'Performance insights',
  },
  {
    id: 'embeds',
    label: 'Embeds & Scripts',
    href: '/creator/embeds-and-scripts',
    icon: Code,
    description: 'Integrate anywhere',
  },
  {
    id: 'design',
    label: 'Design Studio',
    href: '/creator/design-studio',
    icon: Palette,
    description: 'Customize your brand',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/creator/profile',
    icon: User,
    description: 'Account settings',
  },
  {
    id: 'help',
    label: 'Help Center',
    href: '/help',
    icon: HelpCircle,
    description: 'Get support',
  },
];

export function MobileNavigation({
  items = defaultNavItems,
  currentPath,
  userName,
  userAvatar,
  className,
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mark active items based on current path
  const navItems = items.map(item => ({
    ...item,
    isActive: currentPath?.startsWith(item.href) || false,
  }));

  return (
    <>
      {/* Mobile Menu Button */}
      <div className={cn('md:hidden', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Profile" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {userName || 'Creator'}
                    </p>
                    <p className="text-xs text-gray-500">Menu</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto py-2">
                <nav className="space-y-1 px-2">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                          item.isActive
                            ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <IconComponent className={cn(
                          'h-5 w-5 flex-shrink-0',
                          item.isActive ? 'text-blue-600' : 'text-gray-400'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-center">
                  <p>SaaSinaSnap Platform</p>
                  <p className="mt-1">Need help? Tap Help Center above</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Bottom Tab Navigation for Mobile
export interface BottomTabsProps {
  items?: NavItem[];
  currentPath?: string;
  className?: string;
}

export function BottomTabs({
  items = defaultNavItems.slice(0, 5), // Show only first 5 for bottom tabs
  currentPath,
  className,
}: BottomTabsProps) {
  const activeItems = items.map(item => ({
    ...item,
    isActive: currentPath?.startsWith(item.href) || false,
  }));

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden',
      className
    )}>
      <div className="grid grid-cols-5 h-16">
        {activeItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 transition-colors',
                item.isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className="relative">
                <IconComponent className="h-5 w-5" />
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Quick Action Floating Button
export function QuickActionButton({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-40 md:hidden',
        className
      )}
    >
      <Package className="h-6 w-6 text-white" />
    </Button>
  );
}