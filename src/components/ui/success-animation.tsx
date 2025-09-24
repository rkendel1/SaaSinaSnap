'use client';

import { useEffect, useState } from 'react';
import { Check, CheckCircle } from 'lucide-react';

import { cn } from '@/utils/cn';

interface SuccessAnimationProps {
  isVisible: boolean;
  message?: string;
  duration?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onComplete?: () => void;
}

export function SuccessAnimation({
  isVisible,
  message = 'Success!',
  duration = 2000,
  size = 'md',
  className,
  onComplete
}: SuccessAnimationProps) {
  const [showCheck, setShowCheck] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show check mark first
      const checkTimer = setTimeout(() => setShowCheck(true), 100);
      // Show message after check appears
      const messageTimer = setTimeout(() => setShowMessage(true), 400);
      // Complete animation
      const completeTimer = setTimeout(() => {
        setShowCheck(false);
        setShowMessage(false);
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(checkTimer);
        clearTimeout(messageTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setShowCheck(false);
      setShowMessage(false);
    }
  }, [isVisible, duration, onComplete]);

  if (!isVisible && !showCheck) return null;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn(
      'fixed inset-0 flex items-center justify-center z-50 pointer-events-none',
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        {/* Animated checkmark circle */}
        <div
          className={cn(
            'rounded-full bg-green-500 flex items-center justify-center',
            'transition-all duration-500 ease-out',
            sizeClasses[size],
            showCheck
              ? 'scale-100 opacity-100'
              : 'scale-0 opacity-0'
          )}
        >
          <Check 
            className={cn(
              'text-white transition-all duration-300 delay-200',
              iconSizeClasses[size],
              showCheck ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
            strokeWidth={3}
          />
        </div>

        {/* Success message */}
        {message && (
          <div
            className={cn(
              'bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border',
              'transition-all duration-300 delay-300',
              showMessage
                ? 'scale-100 opacity-100 translate-y-0'
                : 'scale-95 opacity-0 translate-y-2'
            )}
          >
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
        )}
      </div>

      {/* Background overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/10 transition-opacity duration-300',
          showCheck ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}

// Inline success indicator for smaller spaces
interface InlineSuccessProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function InlineSuccess({ isVisible, message, className }: InlineSuccessProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'flex items-center space-x-2 text-green-600',
      'animate-in fade-in-0 slide-in-from-left-2 duration-300',
      className
    )}>
      <CheckCircle className="w-4 h-4" />
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
}

// Hook for managing success states
export function useSuccessAnimation(duration: number = 2000) {
  const [isSuccess, setIsSuccess] = useState(false);

  const triggerSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), duration);
  };

  return { isSuccess, triggerSuccess };
}