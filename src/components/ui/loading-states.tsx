'use client';

import React from 'react';
import { Loader2, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={cn('animate-spin text-gray-500', sizeClasses[size], className)} />
  );
}

export interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingCard({ title, description, className }: LoadingCardProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
      <div className="animate-pulse">
        {title && (
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        )}
        {description && (
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
        )}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

export interface LoadingStateProps {
  title?: string;
  message?: string;
  progress?: number;
  className?: string;
  showProgress?: boolean;
}

export function LoadingState({
  title = 'Loading...',
  message = 'Please wait while we prepare your content',
  progress,
  className,
  showProgress = false,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="relative mb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-blue-600" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-4">{message}</p>
      
      {showProgress && progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center">{Math.round(progress || 0)}% complete</p>
        </div>
      )}
    </div>
  );
}

export interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  avatar?: boolean;
}

export function LoadingSkeleton({ lines = 3, className, avatar = false }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-4 bg-gray-200 rounded',
              index === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}

export interface ProgressiveLoadingProps {
  steps: Array<{
    id: string;
    title: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
  }>;
  className?: string;
}

export function ProgressiveLoading({ steps, className }: ProgressiveLoadingProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        let icon = <Clock className="h-4 w-4 text-gray-400" />;
        let textColor = 'text-gray-500';
        
        switch (step.status) {
          case 'loading':
            icon = <LoadingSpinner size="sm" className="text-blue-600" />;
            textColor = 'text-blue-600';
            break;
          case 'completed':
            icon = <CheckCircle className="h-4 w-4 text-green-600" />;
            textColor = 'text-green-600';
            break;
          case 'error':
            icon = <CheckCircle className="h-4 w-4 text-red-600" />;
            textColor = 'text-red-600';
            break;
        }

        return (
          <div key={step.id} className="flex items-center gap-3">
            {icon}
            <span className={cn('text-sm font-medium', textColor)}>
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Dashboard-specific loading states
export function DashboardLoadingState() {
  return (
    <div className="p-6 space-y-8">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProductLoadingState() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton lines={2} className="mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    </div>
  );
}