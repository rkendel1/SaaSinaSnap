'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, CreditCard, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { toast } from '@/components/ui/use-toast';
import { createStripeConnectAccountAction } from '@/features/creator-onboarding/actions/onboarding-actions';

import type { PlatformSettings } from '../../types';

interface PlatformStripeConnectStepProps {
  settings: PlatformSettings;
  onNext: () => void;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

export function PlatformStripeConnectStep({ settings, setSubmitFunction }: PlatformStripeConnectStepProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('stripe_success') === 'true') {
      toast({
        description: 'Stripe account connected successfully!',
        variant: 'default',
      });
      router.replace('/platform-owner-onboarding', undefined);
      setIsSheetOpen(false);
    } else if (searchParams.get('stripe_error') === 'true') {
      toast({
        description: 'Failed to connect Stripe account. Please try again.',
        variant: 'destructive',
      });
      router.replace('/platform-owner-onboarding', undefined);
      setIsSheetOpen(false);
    }
  }, [searchParams, router]);

  const handleConnectAccount = async () => {
    setIsLoading(true);
    try {
      const { onboardingUrl } = await createStripeConnectAccountAction();
      router.push(onboardingUrl);
    } catch (error) {
      console.error('Failed to initiate Stripe Connect:', error);
      toast({
        description: 'An error occurred while initiating Stripe Connect. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!settings.stripe_account_enabled) {
      throw new Error('Stripe account is not connected. Please connect your Stripe account to continue.');
    }
  };

  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null);
  }, [setSubmitFunction, settings.stripe_account_enabled]);

  const isAccountReady = settings.stripe_account_enabled;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Connect Your Platform's Stripe Account</h2>
        <p className="text-gray-600">
          Connect your main Stripe account to collect platform fees and manage creator payouts.
        </p>
      </div>

      {!isAccountReady ? (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white text-gray-900">
            <h3 className="font-medium text-lg text-gray-900">Why connect Stripe?</h3>
            <p className="text-sm text-gray-600">
              As the platform owner, your Stripe account acts as the central hub for all transactions. This enables you to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
              <li>Automatically collect a platform fee on every sale your creators make.</li>
              <li>Oversee all payment activity across your platform.</li>
              <li>Ensure a secure and compliant payment ecosystem via Stripe Connect.</li>
            </ul>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button className="w-full" size="lg" disabled={isLoading}>
                Connect with Stripe
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Connect Your Platform Stripe Account</SheetTitle>
                <SheetDescription>
                  You will be redirected to Stripe to securely connect your account. This is required to operate your platform.
                </SheetDescription>
              </SheetHeader>
              <SheetFooter className="mt-8">
                <Button onClick={handleConnectAccount} disabled={isLoading} className="w-full" size="lg">
                  {isLoading ? 'Redirecting...' : 'Proceed to Stripe'}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="border border-green-200 bg-green-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="font-medium text-green-800">Platform Stripe Account Connected!</h3>
          </div>
          <p className="text-sm text-green-700 mb-4">
            Your platform is ready to process payments and collect fees.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 mt-4 border-green-300 text-green-700 hover:bg-green-100"
            onClick={() => window.open('https://dashboard.stripe.com/', '_blank')}
          >
            Go to Your Stripe Dashboard
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}