'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { AlertCircle, CheckCircle, CreditCard, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet'; // Import Sheet components
import { toast } from '@/components/ui/use-toast'; // Import toast

import { createStripeConnectAccountAction } from '../../actions/onboarding-actions';
import { getStripeConnectAccountAction } from '../../actions/stripe-connect-actions';
import type { CreatorProfile, StripeConnectAccount } from '../../types';

interface StripeConnectStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void; // New prop
}

export function StripeConnectStep({ profile, onNext, setSubmitFunction }: StripeConnectStepProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params for success/error
  const [stripeAccount, setStripeAccount] = useState<StripeConnectAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State for controlling the Sheet

  useEffect(() => {
    const checkStripeAccountStatus = async () => {
      // Only fetch account details if an access token is available
      if (profile.stripe_access_token) {
        const account = await getStripeConnectAccountAction();
        setStripeAccount(account);
      }
      setIsChecking(false);
    };

    checkStripeAccountStatus();

    // Handle redirects from Stripe OAuth callback
    if (searchParams.get('stripe_success') === 'true') {
      toast({
        description: 'Stripe account connected successfully!',
        variant: 'default',
      });
      // Clear the query params after showing toast
      router.replace('/creator/onboarding', undefined);
      setIsSheetOpen(false); // Close the sheet on success
    } else if (searchParams.get('stripe_error') === 'true') {
      toast({
        description: 'Failed to connect Stripe account. Please try again.',
        variant: 'destructive',
      });
      // Clear the query params after showing toast
      router.replace('/creator/onboarding', undefined);
      setIsSheetOpen(false); // Close the sheet on error
    }
  }, [profile.stripe_access_token, searchParams, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnectAccount = async () => {
    setIsLoading(true);
    try {
      const { onboardingUrl } = await createStripeConnectAccountAction();
      // Redirect to Stripe's OAuth authorization page
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
    // This step doesn't have a form to submit, but we need to ensure Stripe is connected
    if (!profile.stripe_account_enabled) {
      throw new Error('Stripe account is not connected. Please connect your Stripe account to continue.');
    }
    // No actual data to save here, just a check
  };

  // Expose handleSubmit to the parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null); // Clean up on unmount
  }, [setSubmitFunction, profile.stripe_account_enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // For Standard accounts, `charges_enabled` and `details_submitted` are usually true
  // immediately after a successful OAuth flow, as Stripe handles the details.
  // The `stripe_account_enabled` in our profile is the primary indicator.
  const isAccountReady = profile.stripe_account_enabled;

  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Connect Your Stripe Account</h2>
        <p className="text-gray-600">
          Connect your Stripe account to start accepting payments from your customers.
        </p>
      </div>

      {!isAccountReady ? (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white text-gray-900">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Secure Payment Processing</h3>
                <p className="text-sm text-gray-600">
                  We use Stripe to securely process payments on your behalf.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Direct Payouts</h3>
                <p className="text-sm text-gray-600">
                  Receive payments directly to your bank account (minus platform fees).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Full Stripe Dashboard Access</h3>
                <p className="text-sm text-gray-600">
                  Manage your account, view analytics, and handle disputes directly in your Stripe Dashboard.
                </p>
              </div>
            </div>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                Set up Stripe Payments
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Connect with Stripe</SheetTitle>
                <SheetDescription>
                  Connect your Stripe account to start accepting payments. You will be redirected to Stripe to complete the process.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
                <p className="text-sm text-gray-700">
                  By clicking "Connect with Stripe", you will be securely redirected to Stripe's website to authorize PayLift to manage payments on your behalf.
                </p>
                <p className="text-xs text-gray-600">
                  This process ensures that your financial information is handled directly by Stripe, a PCI-compliant payment processor.
                </p>
              </div>
              <SheetFooter>
                <Button
                  onClick={handleConnectAccount}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Redirecting to Stripe...' : 'Connect with Stripe'}
                </Button>
                <p className="text-xs text-gray-600 text-center mt-2">
                  By connecting your Stripe account, you agree to our{' '}
                  <a href="/terms" className="underline hover:no-underline text-blue-600" target="_blank" rel="noopener noreferrer">Terms of Service</a>{' '}
                  and Stripe&apos;s{' '}
                  <a href="https://stripe.com/connect/legal" className="underline hover:no-underline text-blue-600" target="_blank" rel="noopener noreferrer">
                    Connected Account Agreement
                  </a>.
                </p>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-green-200 bg-green-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-medium text-green-800">Stripe Account Connected!</h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Your Stripe account is successfully connected and ready to accept payments.
            </p>
            {profile.stripe_account_id && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Account ID:</span>
                  <span className="font-mono text-green-900">{profile.stripe_account_id}</span>
                </div>
                {stripeAccount?.business_profile?.name && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Business:</span>
                    <span className="text-green-900">{stripeAccount.business_profile.name}</span>
                  </div>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 mt-4 border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => window.open('https://dashboard.stripe.com/', '_blank')}
            >
              Go to Stripe Dashboard
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* Removed internal navigation button */}
        </div>
      )}
    </div>
  );
}