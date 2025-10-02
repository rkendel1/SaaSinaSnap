'use client';

import { BarChart3, Code, DollarSign, Home, Layout, MessageSquare, Package, Palette, Settings, TrendingUp, Users } from 'lucide-react';

import { UnifiedNavigation } from '@/components/shared/dashboard';

const navigationItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Revenue',
    href: '/dashboard/revenue',
    icon: DollarSign,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Advanced analytics and insights',
  },
  {
    title: 'Creators',
    href: '/dashboard/creators',
    icon: Users,
    description: 'Manage creators, oversight, and feedback',
  },
  {
    title: 'Products',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    title: 'Design Studio',
    href: '/dashboard/design-studio',
    icon: Palette,
    description: 'Embeds, scripts, and storefront customization',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function PlatformNavigation() {
  return <UnifiedNavigation items={navigationItems} variant="tabs" />;
}