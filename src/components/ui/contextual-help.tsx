'use client';

import React, { useState } from 'react';
import { ChevronRight,ExternalLink, HelpCircle, X } from 'lucide-react';

import { cn } from '@/utils/cn';

import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

export interface HelpContent {
  id: string;
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
  relatedLinks?: Array<{
    title: string;
    href: string;
    external?: boolean;
  }>;
  videoUrl?: string;
}

export interface ContextualHelpProps {
  content: HelpContent;
  trigger?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  compact?: boolean;
}

export function ContextualHelp({
  content,
  trigger,
  position = 'bottom',
  className,
  compact = false,
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
        aria-label="Show help"
      >
        {trigger || <HelpCircle className="h-3 w-3" />}
      </button>

      {/* Help Content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Help Panel */}
          <div
            className={cn(
              'absolute z-20 w-80 max-w-sm',
              positionClasses[position]
            )}
          >
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    {content.title}
                  </CardTitle>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <p className="text-sm text-gray-600">
                  {content.description}
                </p>

                {content.steps && content.steps.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 mb-2 uppercase tracking-wide">
                      Steps
                    </h4>
                    <ol className="space-y-2 text-sm text-gray-600">
                      {content.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="flex-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {content.tips && content.tips.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 mb-2 uppercase tracking-wide">
                      Tips
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {content.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {content.relatedLinks && content.relatedLinks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 mb-2 uppercase tracking-wide">
                      Related
                    </h4>
                    <div className="space-y-1">
                      {content.relatedLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.href}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <span className="flex-1">{link.title}</span>
                          {link.external && <ExternalLink className="h-3 w-3" />}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {content.videoUrl && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      asChild
                    >
                      <a
                        href={content.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch Video Guide
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for inline help
export function InlineHelp({
  content,
  className,
}: {
  content: HelpContent;
  className?: string;
}) {
  return (
    <ContextualHelp
      content={content}
      compact
      className={className}
      trigger={<HelpCircle className="h-3 w-3" />}
    />
  );
}