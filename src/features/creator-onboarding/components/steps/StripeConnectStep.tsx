'use client';

import { useEffect,useState } from 'react';
import { AlertCircle, CheckCircle, CreditCard, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { createStripeConnectAccountAction } from '../../actions/onboarding-actions';
import { getStripeConnectAccount } from '../../controllers/stripe-connect';
import type { CreatorProfile, StripeConnectAccount } from '../../types';

interface StripeConnectStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function StripeConnectStep({ profile, onNext }: StripeConnectStepProps) {
  const [stripeAccount, setStripeAccount] = useState<StripeConnectAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkStripeAccountStatus = async () => {
      if (profile.stripe_account_id) {
        try {
          const account = await getStripeConnectAccount(profile.stripe_account_id);
          setStripeAccount(account);
        } catch (error) {
          console.error('Failed to fetch Stripe account:', error);
        }
      }
      setIsChecking(false);
    };

    checkStripeAccountStatus();
  }, [profile.stripe_account_id]);

  const handleCreateAccount = async () => {
    setIsLoading(true);
    try {
      await createStripeConnectAccountAction();
    } catch (error) {
      console.error('Failed to create Stripe Connect account:', error);
      setIsLoading(false);
    }
  };

  const isAccountReady = stripeAccount?.charges_enabled && stripeAccount?.details_submitted;

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
        <h2 className="text-xl font-semibold mb-2">Connect Your Stripe Account</h2>
        <p className="text-muted-foreground">
          Connect your Stripe account to start accepting payments from your customers.
        </p>
      </div>

      {!profile.stripe_account_id ? (
        <div className="space-y-4">
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <h3 className="font-medium">Secure Payment Processing</h3>
                <p className="text-sm text-muted-foreground">
                  We use Stripe Connect to securely process payments on your behalf.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <h3 className="font-medium">Direct Payouts</h3>
                <p className="text-sm text-muted-foreground">
                  Receive payments directly to your bank account (minus platform fees).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <h3 className="font-medium">Complete Control</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your account, view analytics, and handle disputes through your Stripe dashboard.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCreateAccount} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Creating Account...' : 'Connect with Stripe'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By connecting your Stripe account, you agree to our{' '}
            <a href="/terms" className="underline hover:no-underline">Terms of Service</a>{' '}
            and Stripe&apos;s{' '}
            <a href="https://stripe.com/connect-account/legal" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              Connected Account Agreement
            </a>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {isAccountReady ? (
            <div className="border border-green-200 bg-green-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-900">Account Connected Successfully!</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Your Stripe account is set up and ready to accept payments.
              </p>
              {stripeAccount && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Account ID:</span>
                    <span className="font-mono text-green-800">{stripeAccount.id}</span>
                  </div>
                  {stripeAccount.business_profile?.name && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Business:</span>
                      <span className="text-green-800">{stripeAccount.business_profile.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-900">Account Setup Required</h3>
              </div>
              <p className="text-sm text-yellow-700 mb-4">
                Your Stripe account needs to be completed before you can accept payments.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.open(`https://dashboard.stripe.com/express/accounts/${profile.stripe_account_id}`, '_blank')}
              >
                Complete Setup in Stripe
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button 
            onClick={onNext} 
            disabled={!isAccountReady}
            className="w-full"
            size="lg"
          >
            {isAccountReady ? 'Continue' : 'Complete Stripe Setup First'}
          </Button>
        </div>
      )}
    </div>
  );
}