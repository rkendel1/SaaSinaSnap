import React from 'react';
import { AlertCircle, CheckCircle, Clock, HelpCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface UserFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  message: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  className?: string;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const feedbackStyles = {
  success: {
    container: 'border-green-200 bg-green-50',
    icon: 'text-green-600',
    title: 'text-green-800',
    message: 'text-green-700',
  },
  error: {
    container: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    title: 'text-red-800',
    message: 'text-red-700',
  },
  warning: {
    container: 'border-yellow-200 bg-yellow-50',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    message: 'text-blue-700',
  },
  loading: {
    container: 'border-gray-200 bg-gray-50',
    icon: 'text-gray-600 animate-spin',
    title: 'text-gray-800',
    message: 'text-gray-700',
  },
};

const feedbackIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Clock,
};

export function UserFeedback({
  type,
  title,
  message,
  actions = [],
  className,
  showIcon = true,
  dismissible = false,
  onDismiss,
}: UserFeedbackProps) {
  const styles = feedbackStyles[type];
  const IconComponent = feedbackIcons[type];

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4',
        styles.container,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <IconComponent className={cn('h-5 w-5 mt-0.5 flex-shrink-0', styles.icon)} />
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn('font-medium text-sm mb-1', styles.title)}>
              {title}
            </h3>
          )}
          
          <p className={cn('text-sm', styles.message)}>
            {message}
          </p>
          
          {actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={cn(
                    'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    action.variant === 'primary'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Convenience components for specific feedback types
export function SuccessFeedback(props: Omit<UserFeedbackProps, 'type'>) {
  return <UserFeedback {...props} type="success" />;
}

export function ErrorFeedback(props: Omit<UserFeedbackProps, 'type'>) {
  return <UserFeedback {...props} type="error" />;
}

export function LoadingFeedback(props: Omit<UserFeedbackProps, 'type'>) {
  return <UserFeedback {...props} type="loading" />;
}

export function InfoFeedback(props: Omit<UserFeedbackProps, 'type'>) {
  return <UserFeedback {...props} type="info" />;
}