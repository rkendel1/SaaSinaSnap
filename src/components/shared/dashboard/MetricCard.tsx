'use client';

import { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/libs/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    label?: string;
  };
  footer?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  trend,
  footer,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value.toFixed(1)}%
                </span>
                {trend.label && (
                  <span className="text-xs text-gray-500">{trend.label}</span>
                )}
              </div>
            )}
            {footer && <div className="mt-2">{footer}</div>}
          </div>
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              iconBgColor
            )}
          >
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
