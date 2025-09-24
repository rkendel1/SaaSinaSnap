'use client';

import { useEffect,useState } from 'react';

import { Button } from '@/components/ui/button';
import { initializeCreatorOnboardingAction } from '@/features/creator-onboarding/actions/onboarding-actions';
import { CreatorOnboardingFlow } from '@/features/creator-onboarding/components/CreatorOnboardingFlow';
import type { CreatorProfile } from '@/features/creator-onboarding/types';

export default function CreatorOnboardingPage() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        const creatorProfile = await initializeCreatorOnboardingAction();
        setProfile(creatorProfile);
        setIsFlowOpen(true);
      } catch (error) {
        console.error('Failed to initialize onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeOnboarding();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing your creator account...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Unable to Access Creator Onboarding</h1>
          <p className="text-muted-foreground mb-6">
            There was an issue setting up your creator account. Please try again or contact support.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to PayLift Creator</h1>
          <p className="text-muted-foreground text-lg">
            Lifts creators instantly into monetization. Let&apos;s set up your SaaS platform in just a few simple steps.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-semibold">1</span>
              </div>
              <h3 className="font-medium mb-1">Setup</h3>
              <p className="text-sm text-muted-foreground">Configure your business profile and connect Stripe</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-semibold">2</span>
              </div>
              <h3 className="font-medium mb-1">Customize</h3>
              <p className="text-sm text-muted-foreground">Add products and design your branded storefront</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-semibold">3</span>
              </div>
              <h3 className="font-medium mb-1">Launch</h3>
              <p className="text-sm text-muted-foreground">Go live and start accepting payments</p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => setIsFlowOpen(true)}
              className="min-w-[200px]"
            >
              {profile.onboarding_completed ? 'Review Setup' : 'Start Onboarding'}
            </Button>
            {profile.onboarding_completed && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Your SaaS platform is already set up and ready!
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Check out our{' '}
            <a href="/docs/creator-guide" className="text-primary hover:underline">Creator Guide</a>{' '}
            or{' '}
            <a href="/support" className="text-primary hover:underline">contact support</a>.
          </p>
        </div>
      </div>

      {profile && (
        <CreatorOnboardingFlow
          profile={profile}
          isOpen={isFlowOpen}
          onClose={(completed?: boolean) => { // Updated signature
            setIsFlowOpen(false);
            if (completed) { // Check the passed 'completed' flag
              window.location.href = '/creator/dashboard';
            }
          }}
        />
      )}
    </div>
  );
}