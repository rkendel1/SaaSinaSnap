import { cn } from '@/utils/cn';

interface LoadingSkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export function LoadingSkeleton({ className, height = 'h-4', width = 'w-full' }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        height,
        width,
        className
      )}
    />
  );
}

interface MetricCardSkeletonProps {
  count?: number;
}

export function MetricCardSkeleton({ count = 4 }: MetricCardSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <LoadingSkeleton height="h-4" width="w-20" />
              <LoadingSkeleton height="h-8" width="w-24" />
            </div>
            <LoadingSkeleton height="h-10" width="w-10" className="rounded-lg" />
          </div>
          <div className="mt-2">
            <LoadingSkeleton height="h-3" width="w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}