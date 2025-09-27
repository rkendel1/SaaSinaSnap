'use client';

import React from 'react';
import { CheckCircle, Circle, Clock, Star, Target, Trophy } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  completedAt?: Date;
  estimatedTime?: string;
  reward?: {
    type: 'badge' | 'feature' | 'discount';
    value: string;
    description: string;
  };
}

export interface ProgressTrackerProps {
  title: string;
  description?: string;
  steps: ProgressStep[];
  currentStep?: number;
  showRewards?: boolean;
  onStepClick?: (stepId: string) => void;
  className?: string;
  variant?: 'vertical' | 'horizontal' | 'compact';
}

export function ProgressTracker({
  title,
  description,
  steps,
  currentStep,
  showRewards = true,
  onStepClick,
  className,
  variant = 'vertical',
}: ProgressTrackerProps) {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const StepIcon = ({ step }: { step: ProgressStep }) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <Badge variant="secondary">
            {completedSteps}/{steps.length}
          </Badge>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-sm text-gray-600">
          {completedSteps === steps.length
            ? '🎉 All steps completed!'
            : `${steps.length - completedSteps} steps remaining`}
        </p>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {completedSteps}/{steps.length}
            </div>
            <p className="text-xs text-gray-500">completed</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {variant === 'horizontal' ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex-shrink-0 w-48 p-3 rounded-lg border cursor-pointer transition-colors',
                  step.status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : step.status === 'current'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50',
                  onStepClick && 'hover:shadow-sm'
                )}
                onClick={() => onStepClick?.(step.id)}
              >
                <div className="flex items-start gap-3">
                  <StepIcon step={step} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {step.description}
                    </p>
                    {step.estimatedTime && step.status !== 'completed' && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {step.estimatedTime}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'relative flex items-start gap-4 p-3 rounded-lg transition-colors',
                  step.status === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : step.status === 'current'
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200',
                  onStepClick && 'cursor-pointer hover:shadow-sm'
                )}
                onClick={() => onStepClick?.(step.id)}
              >
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-6 top-12 w-0.5 h-6',
                      step.status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                    )}
                  />
                )}

                <StepIcon step={step} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {step.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      {step.completedAt && (
                        <Badge variant="outline" className="text-xs">
                          {step.completedAt.toLocaleDateString()}
                        </Badge>
                      )}
                      
                      {step.estimatedTime && step.status !== 'completed' && (
                        <Badge variant="secondary" className="text-xs">
                          {step.estimatedTime}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {showRewards && step.reward && step.status === 'completed' && (
                    <div className="mt-2 p-2 bg-white rounded border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-xs text-yellow-800">
                          Reward Unlocked: {step.reward.value}
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        {step.reward.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {completedSteps === steps.length && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-green-800">
                  Congratulations! 🎉
                </h3>
                <p className="text-sm text-green-700">
                  You&apos;ve completed all steps. Your platform is ready to drive success!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick progress indicator for dashboards
export function ProgressIndicator({
  label,
  current,
  total,
  className,
}: {
  label: string;
  current: number;
  total: number;
  className?: string;
}) {
  const percentage = (current / total) * 100;
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {current}/{total}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}