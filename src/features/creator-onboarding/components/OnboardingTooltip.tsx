'use client';

import { ReactNode, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface OnboardingTooltipProps {
  title: string;
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showOnHover?: boolean;
  className?: string;
  children?: ReactNode;
}

export function OnboardingTooltip({ 
  title, 
  content, 
  position = 'top',
  showOnHover = false,
  className,
  children 
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  };

  return (
    <div className="relative inline-block">
      <div
        className={cn("cursor-help", className)}
        onClick={() => !showOnHover && setIsVisible(!isVisible)}
        onMouseEnter={() => showOnHover && setIsVisible(true)}
        onMouseLeave={() => showOnHover && setIsVisible(false)}
      >
        {children || <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary transition-colors" />}
      </div>

      {isVisible && (
        <>
          {/* Backdrop for click-to-close */}
          {!showOnHover && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsVisible(false)}
            />
          )}
          
          {/* Tooltip */}
          <div className={cn(
            "absolute z-50 w-80 max-w-sm p-4 bg-gray-900 text-gray-100 rounded-lg shadow-xl border border-gray-700",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            positionClasses[position]
          )}>
            {/* Arrow */}
            <div className={cn("absolute w-0 h-0 border-4", arrowClasses[position])} />
            
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm pr-2">{title}</h4>
              {!showOnHover && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Content */}
            <div className="text-sm text-gray-300 leading-relaxed">
              {typeof content === 'string' ? (
                <p>{content}</p>
              ) : (
                content
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Predefined tooltips for common onboarding scenarios
export function BusinessNameTooltip() {
  return (
    <OnboardingTooltip
      title="Business Name Tips"
      content={
        <div className="space-y-2">
          <p>Your business name will be used for:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Your branded storefront URL</li>
            <li>Email communications</li>
            <li>Payment receipts</li>
            <li>Marketing materials</li>
          </ul>
          <p className="text-xs text-gray-400 mt-2">
            You can always change this later in your settings.
          </p>
        </div>
      }
    />
  );
}

export function BrandColorTooltip() {
  return (
    <OnboardingTooltip
      title="Brand Colors"
      content={
        <div className="space-y-2">
          <p>Choose colors that represent your brand:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Primary color for buttons and links</li>
            <li>Used across your storefront</li>
            <li>Automatically generates color palette</li>
          </ul>
          <div className="bg-gray-800 p-2 rounded mt-2">
            <p className="text-xs text-gray-400">
              💡 Pro tip: Use your logo&apos;s main color or choose colors that evoke your brand&apos;s personality.
            </p>
          </div>
        </div>
      }
    />
  );
}

export function StripeConnectTooltip() {
  return (
    <OnboardingTooltip
      title="Why Stripe Connect?"
      content={
        <div className="space-y-2">
          <p>Stripe Connect enables:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Secure payment processing</li>
            <li>Automatic fee collection</li>
            <li>Instant payouts to your account</li>
            <li>Comprehensive payment analytics</li>
          </ul>
          <div className="bg-green-900/30 border border-green-700 p-2 rounded mt-2">
            <p className="text-xs text-green-300">
              🔒 Your financial information is secured by Stripe&apos;s bank-level security.
            </p>
          </div>
        </div>
      }
    />
  );
}