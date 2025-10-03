'use client';

import { BarChart3, DollarSign, Home, Package, Palette, Settings, Users } from 'lucide-react';

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
    description: 'View platform analytics and advanced metrics',
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
    description: 'Build embeds, customize scripts, and manage storefront',
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