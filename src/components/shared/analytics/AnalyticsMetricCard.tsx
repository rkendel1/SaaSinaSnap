'use client';

import { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/libs/utils';

interface AnalyticsMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  subtitleColor?: string;
  className?: string;
  gradient?: boolean;
  gradientColors?: string;
  borderColor?: string;
}

/**
 * Shared analytics metric card component for consistent display across dashboards
 * Supports gradients and custom styling for real-time metrics
 */
export function AnalyticsMetricCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  subtitle,
  subtitleColor = 'text-gray-600',
  className,
  gradient = false,
  gradientColors = 'from-blue-50 to-blue-100',
  borderColor = 'border-blue-200',
}: AnalyticsMetricCardProps) {
  return (
    <Card
      className={cn(
        gradient && `bg-gradient-to-r ${gradientColors} ${borderColor}`,
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-medium', gradient ? iconColor.replace('text-', 'text-') + '-700' : 'text-gray-600')}>
              {title}
            </p>
            <p className={cn('text-2xl font-bold mt-1', gradient ? iconColor.replace('text-', 'text-') + '-900' : 'text-gray-900')}>
              {value}
            </p>
          </div>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
        {subtitle && (
          <div className="flex items-center mt-2">
            <span className={cn('text-xs', subtitleColor)}>{subtitle}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
