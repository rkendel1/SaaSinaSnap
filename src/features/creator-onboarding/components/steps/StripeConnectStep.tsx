'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { AlertCircle, CheckCircle, CreditCard, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter,SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Import Sheet components
import { toast } from '@/components/ui/use-toast'; // Import toast
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser

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
      const dataImported = searchParams.get('data_imported') === 'true';
      const profileUpdateError = searchParams.get('profile_update_error') === 'true';
      
      if (profileUpdateError) {
        toast({
          description: 'Stripe account connected successfully, but some profile data could not be imported. You can fill in the details manually.',
          variant: 'default',
        });
      } else {
        toast({
          description: dataImported 
            ? 'Stripe account connected successfully! Your profile has been auto-populated with account data.'
            : 'Stripe account connected successfully!',
          variant: 'default',
        });
      }
      // Clear the query params after showing toast
      router.replace('/creator/onboarding', undefined);
      setIsSheetOpen(false); // Close the sheet on success
      onNext(); // <--- IMPORTANT: Advance to the next step
    } else if (searchParams.get('stripe_error') === 'true') {
      toast({
        description: 'Failed to connect Stripe account. Please try again.',
        variant: 'destructive',
      });
      // Clear the query params after showing toast
      router.replace('/creator/onboarding', undefined);
      setIsSheetOpen(false); // Close the sheet on error
    }
  }, [profile.stripe_access_token, searchParams, router, onNext]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnectAccount = async () => {
    setIsLoading(true);
    try {
      const { stripeConnectUrl } = await createStripeConnectAccountAction();
      // Redirect to Stripe's OAuth authorization page
      router.push(stripeConnectUrl);
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
    // If Stripe is connected, explicitly advance the step
    onNext();
  };

  // Expose handleSubmit to the parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null); // Clean up on unmount
  }, [setSubmitFunction, profile.stripe_account_enabled, onNext]); // eslint-disable-line react-hooks/exhaustive-deps

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
          Connect your Stripe account via OAuth. We'll securely store your credentials and fetch your business name, address, logo, existing products, and webhooks to pre-populate subsequent steps.
        </p>
      </div>

      {/* Enhanced Environment Management Education */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">🚀</span>
          </div>
          <h3 className="font-semibold text-blue-900">Smart Environment Management</h3>
        </div>
        <p className="text-sm text-blue-800 mb-4">
          Our platform provides a complete test-to-production workflow that ensures your products are ready for customers:
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <strong className="text-blue-900 text-sm">Test Environment</strong>
                <p className="text-xs text-blue-700 mt-1">Create products safely using Stripe test mode. Use test cards (4242424242424242) to validate payment flows without real transactions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <strong className="text-blue-900 text-sm">Seamless Deployment</strong>
                <p className="text-xs text-blue-700 mt-1">One-click deployment from test to production with comprehensive validation checks and rollback capabilities.</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <strong className="text-blue-900 text-sm">Dynamic Pricing</strong>
                <p className="text-xs text-blue-700 mt-1">Update pricing strategies rapidly without requiring embed changes or configuration updates.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <strong className="text-blue-900 text-sm">Smart Embeds</strong>
                <p className="text-xs text-blue-700 mt-1">Embeds automatically adapt to environment changes and product updates without requiring code changes.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-blue-100 rounded-lg p-3 border border-blue-300">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-semibold">💡</span>
            <div>
              <strong className="text-blue-900 text-sm">Best Practice:</strong>
              <p className="text-xs text-blue-800 mt-1">
                Start in test mode to experiment freely, then deploy to production when you're ready to accept real payments. 
                Your embeds will continue working seamlessly during the transition.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isAccountReady ? (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white text-gray-900">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Auto-Populate Profile</h3>
                <p className="text-sm text-gray-600">
                  We'll automatically fill in your business details using information from your Stripe account.
                </p>
              </div>
            </div>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• You'll be redirected to Stripe's secure authorization page</li>
                    <li>• Your business details will be auto-imported to save time</li>
                    <li>• You can review and edit all information before publishing</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-700">
                  By clicking "Connect with Stripe", you will be securely redirected to Stripe's website to authorize PayLift to manage payments on your behalf.
                </p>
                <p className="text-xs text-gray-600">
                  This process ensures that your financial information is handled directly by Stripe, a PCI-compliant payment processor.
                </p>
              </div>
              <SheetFooter className="mt-8"> {/* Added opening tag for SheetFooter */}
                <Button onClick={handleConnectAccount} disabled={isLoading} className="w-full" size="lg">
                  {isLoading ? 'Redirecting...' : 'Proceed to Stripe'}
                </Button>
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
              {profile.business_name || profile.billing_email ? ' Your profile has been auto-populated with account data.' : ''}
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