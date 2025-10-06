'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-states';

import { createCheckoutSession } from '../actions/subscription-actions';
import type { PlatformPricingTier } from '../types';

interface PlatformSubscriptionFlowProps {
  pricingTiers: PlatformPricingTier[];
  userId: string;
}

export function PlatformSubscriptionFlow({ pricingTiers, userId }: PlatformSubscriptionFlowProps) {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const checkoutSession = await createCheckoutSession(tierId, userId);
      if (checkoutSession?.url) {
        window.location.href = checkoutSession.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start subscription process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingTiers.map((tier) => (
          <Card key={tier.id} className={`p-6 ${selectedTier === tier.id ? 'ring-2 ring-primary' : ''}`}>
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <p className="text-gray-500 mt-1">{tier.description}</p>
              </div>

              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: tier.currency,
                }).format(tier.price)}
                <span className="text-base font-normal text-gray-500">
                  /{tier.billing_period}
                </span>
              </div>

              <ul className="space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.limits && (
                <div className="space-y-2 text-sm text-gray-500">
                  {tier.limits.max_customers && (
                    <p>Up to {tier.limits.max_customers.toLocaleString()} customers</p>
                  )}
                  {tier.limits.max_products && (
                    <p>Up to {tier.limits.max_products.toLocaleString()} products</p>
                  )}
                  {tier.limits.max_pages && (
                    <p>Up to {tier.limits.max_pages.toLocaleString()} pages</p>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => handleSubscribe(tier.id)}
                disabled={isLoading}
              >
                {isLoading && selectedTier === tier.id ? (
                  <LoadingSpinner className="mr-2" />
                ) : null}
                Subscribe Now
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}