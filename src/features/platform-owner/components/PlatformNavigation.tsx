'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Code, DollarSign, Home, Layout, MessageSquare, Package, Palette, Settings, TrendingUp, Users } from 'lucide-react';

import { cn } from '@/libs/utils';

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
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}