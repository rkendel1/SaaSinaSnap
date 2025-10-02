'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

import { cn } from '@/libs/utils';

interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface UnifiedNavigationProps {
  items: NavigationItem[];
  variant?: 'tabs' | 'sidebar';
  className?: string;
}

/**
 * Unified navigation component that can render as either horizontal tabs
 * (for platform owner) or vertical sidebar items (for creators)
 */
export function UnifiedNavigation({
  items,
  variant = 'tabs',
  className,
}: UnifiedNavigationProps) {
  const pathname = usePathname();

  if (variant === 'tabs') {
    return (
      <nav className={cn('bg-white shadow-sm border-b border-gray-200', className)}>
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap',
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

  // Sidebar variant
  return (
    <nav className={cn('space-y-1', className)}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
