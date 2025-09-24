'use client';

import { Check } from 'lucide-react';

import { cn } from '@/utils/cn';

interface OnboardingProgressProps {
  steps: Array<{
    id: number;
    title: string;
    description: string;
    completed: boolean;
  }>;
  currentStep: number;
  className?: string;
}

export function OnboardingProgress({ steps, currentStep, className }: OnboardingProgressProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground min-w-fit">
          {currentStep} of {steps.length}
        </span>
      </div>

      {/* Step Indicators - Mobile/Compact View */}
      <div className="flex items-center justify-between sm:hidden">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = step.completed;
          const isCurrent = stepNumber === currentStep;
          const isPast = stepNumber < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center space-y-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  isCompleted && 'bg-green-500 text-white scale-110',
                  isCurrent && !isCompleted && 'bg-primary text-primary-foreground scale-110 ring-2 ring-primary/20',
                  !isCurrent && !isPast && !isCompleted && 'bg-muted text-muted-foreground',
                  isPast && !isCompleted && 'bg-primary/20 text-primary'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
              </div>
              <div className="text-xs text-center max-w-16">
                <div className={cn('font-medium truncate', isCurrent && 'text-primary')}>
                  {step.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Indicators - Desktop View */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = step.completed;
          const isCurrent = stepNumber === currentStep;
          const isPast = stepNumber < currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                'relative p-4 rounded-lg border transition-all duration-300 hover:shadow-md',
                isCompleted && 'bg-green-50 border-green-200 shadow-sm',
                isCurrent && !isCompleted && 'bg-primary/5 border-primary/20 shadow-md ring-1 ring-primary/10',
                !isCurrent && !isPast && !isCompleted && 'bg-muted/30 border-muted',
                isPast && !isCompleted && 'bg-primary/5 border-primary/10'
              )}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300',
                    isCompleted && 'bg-green-500 text-white',
                    isCurrent && !isCompleted && 'bg-primary text-primary-foreground',
                    !isCurrent && !isPast && !isCompleted && 'bg-muted text-muted-foreground',
                    isPast && !isCompleted && 'bg-primary/10 text-primary'
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className={cn(
                      'font-semibold text-sm mb-1 truncate',
                      isCompleted && 'text-green-700',
                      isCurrent && 'text-primary',
                      !isCurrent && !isPast && !isCompleted && 'text-muted-foreground',
                      isPast && !isCompleted && 'text-primary'
                    )}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      'text-xs leading-relaxed',
                      isCompleted && 'text-green-600',
                      isCurrent && 'text-muted-foreground',
                      !isCurrent && !isPast && !isCompleted && 'text-muted-foreground/60',
                      isPast && !isCompleted && 'text-muted-foreground'
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
              
              {/* Completion indicator */}
              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              
              {/* Current step pulse animation */}
              {isCurrent && !isCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6">
                  <div className="w-6 h-6 bg-primary rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-6 h-6 bg-primary rounded-full animate-ping opacity-75" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}