'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface LoadingStateProps {
  type?: 'page' | 'card' | 'dashboard';
  message?: string;
}

export function LoadingState({ type = 'page', message = 'Loading...' }: LoadingStateProps) {
  if (type === 'page') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <Card>
        <CardHeader>
          <LoadingSkeleton height="h-4" width="w-1/3" />
        </CardHeader>
        <CardContent className="space-y-2">
          <LoadingSkeleton height="h-4" width="w-full" />
          <LoadingSkeleton height="h-4" width="w-2/3" />
          <LoadingSkeleton height="h-4" width="w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <LoadingSkeleton height="h-8" width="w-1/3" />
          <LoadingSkeleton height="h-4" width="w-2/3" />
        </div>

        {/* Cards grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <LoadingSkeleton height="h-10" width="w-10" className="rounded-lg" />
                  <LoadingSkeleton height="h-4" width="w-24" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <LoadingSkeleton height="h-4" width="w-full" />
                <LoadingSkeleton height="h-4" width="w-2/3" />
                <LoadingSkeleton height="h-10" width="w-full" className="mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <LoadingSkeleton height="h-6" width="w-1/3" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <LoadingSkeleton height="h-4" width="w-32" />
                    <LoadingSkeleton height="h-3" width="w-20" />
                  </div>
                  <div className="space-y-1">
                    <LoadingSkeleton height="h-4" width="w-16" />
                    <LoadingSkeleton height="h-3" width="w-12" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LoadingSkeleton height="h-6" width="w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <LoadingSkeleton height="h-3" width="w-20" />
                    <LoadingSkeleton height="h-3" width="w-24" />
                  </div>
                  <LoadingSkeleton height="h-2" width="w-full" />
                  <LoadingSkeleton height="h-3" width="w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">{message}</span>
    </div>
  );
}

// Specific loading components
export function AccountPageLoading() {
  return <LoadingState type="dashboard" message="Loading your account..." />;
}

export function PricingPageLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center mb-16">
          <LoadingSkeleton height="h-12" width="w-1/2" className="mx-auto mb-4" />
          <LoadingSkeleton height="h-6" width="w-2/3" className="mx-auto" />
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-2">
              <CardHeader className="text-center">
                <LoadingSkeleton height="h-6" width="w-24" className="mx-auto mb-4" />
                <LoadingSkeleton height="h-8" width="w-20" className="mx-auto" />
                <LoadingSkeleton height="h-4" width="w-32" className="mx-auto mt-2" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton height="h-12" width="w-full" className="mb-6" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <LoadingSkeleton height="h-5" width="w-5" className="rounded-full" />
                      <LoadingSkeleton height="h-4" width="w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UsageDataLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <LoadingSkeleton height="h-8" width="w-8" className="rounded-lg" />
          <LoadingSkeleton height="h-5" width="w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <LoadingSkeleton height="h-3" width="w-20" />
              <LoadingSkeleton height="h-3" width="w-24" />
            </div>
            <LoadingSkeleton height="h-2" width="w-full" />
            <LoadingSkeleton height="h-3" width="w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}