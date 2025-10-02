'use client';

import { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/libs/utils';

interface ListItem {
  icon?: LucideIcon;
  iconColor?: string;
  label: string;
  primary?: string | number;
  secondary?: string;
}

interface AnalyticsListCardProps {
  title: string;
  items: ListItem[];
  className?: string;
}

/**
 * Shared analytics list card for displaying items with icons and labels
 * Used for traffic sources, recent activity, and similar list displays
 */
export function AnalyticsListCard({ title, items, className }: AnalyticsListCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              {item.icon && (
                <item.icon className={cn('h-4 w-4', item.iconColor || 'text-gray-500')} />
              )}
              <div className="flex-1">
                <span className="text-sm">{item.label}</span>
              </div>
              {item.primary && (
                <div className="text-right">
                  <p className="font-bold">{item.primary}</p>
                  {item.secondary && (
                    <p className="text-sm text-gray-600">{item.secondary}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
