'use client';

import { LucideIcon } from 'lucide-react';

import { cn } from '@/libs/utils';

interface StatusCardProps {
  type: 'success' | 'warning' | 'error' | 'info';
  icon: LucideIcon;
  title: string;
  description: string | React.ReactNode;
  className?: string;
}

/**
 * Shared status card component for displaying connection, environment, and status messages
 * Used across product managers to maintain consistent UI
 */
export function ProductStatusCard({
  type,
  icon: Icon,
  title,
  description,
  className,
}: StatusCardProps) {
  const colorClasses = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      description: 'text-green-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      description: 'text-yellow-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      description: 'text-red-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-gray-900',
      description: 'text-gray-600',
    },
  };

  const colors = colorClasses[type];

  return (
    <div
      className={cn(
        'rounded-lg p-4 flex items-center gap-3',
        colors.bg,
        colors.border,
        'border',
        className
      )}
    >
      <Icon className={cn('h-5 w-5', colors.icon)} />
      <div className="flex-1">
        <h4 className={cn('font-medium', colors.title)}>{title}</h4>
        <div className={cn('text-sm', colors.description)}>{description}</div>
      </div>
    </div>
  );
}
