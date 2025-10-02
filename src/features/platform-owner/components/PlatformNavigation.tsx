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
  },
  {
    title: 'Advanced Analytics',
    href: '/dashboard/advanced-analytics',
    icon: TrendingUp,
  },
  {
    title: 'Creators',
    href: '/dashboard/creators',
    icon: Users,
  },
  {
    title: 'Creator Oversight',
    href: '/dashboard/creator-oversight',
    icon: Users,
  },
  {
    title: 'Creator Feedback',
    href: '/dashboard/creator-feedback',
    icon: MessageSquare,
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
  },
  {
    title: 'Embeds & Scripts',
    href: '/dashboard/embeds-and-scripts',
    icon: Code,
  },
  {
    title: 'Storefront',
    href: '/dashboard/storefront',
    icon: Layout,
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