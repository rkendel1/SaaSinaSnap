'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/libs/utils';

interface InfoItem {
  label: string;
  value: string | number;
  valueColor?: string;
}

interface AnalyticsInfoCardProps {
  title: string;
  items: InfoItem[];
  className?: string;
}

/**
 * Shared analytics info card for displaying key-value pairs
 * Used for platform health, customer economics, and similar metrics
 */
export function AnalyticsInfoCard({ title, items, className }: AnalyticsInfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className={cn('font-medium', item.valueColor || 'text-gray-900')}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
