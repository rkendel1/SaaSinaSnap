'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, CreditCard, ExternalLink, TestTube, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetDescription, SheetFooter,SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from '@/components/ui/use-toast';

import { createPlatformStripeConnectAccountAction } from '../../actions/platform-actions';
import type { PlatformSettings, StripeEnvironment } from '../../types';

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
  const [selectedEnvironment, setSelectedEnvironment] = useState<StripeEnvironment>('test');

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
      const { onboardingUrl } = await createPlatformStripeConnectAccountAction(selectedEnvironment);
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
    // Check if at least test environment is connected
    const hasTestConnection = settings.stripe_test_enabled;
    const hasProductionConnection = settings.stripe_production_enabled;
    
    if (!hasTestConnection && !hasProductionConnection) {
      throw new Error('Please connect at least the test Stripe environment to continue.');
    }
  };

  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null);
  }, [setSubmitFunction, settings.stripe_test_enabled, settings.stripe_production_enabled]);

  const isTestConnected = settings.stripe_test_enabled;
  const isProductionConnected = settings.stripe_production_enabled;
  const hasAnyConnection = isTestConnected || isProductionConnected;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Connect Your Platform&apos;s Stripe Account</h2>
        <p className="text-gray-600">
          Connect your Stripe accounts for both test and production environments to enable payments.
        </p>
      </div>

      {/* Environment Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test Environment */}
        <div className={`border rounded-lg p-4 ${isTestConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-3">
            <TestTube className={`h-5 w-5 ${isTestConnected ? 'text-green-600' : 'text-gray-400'}`} />
            <h3 className="font-medium">Test Environment</h3>
            {isTestConnected && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Safe environment for testing products and payments before going live.
          </p>
          {isTestConnected ? (
            <div className="text-sm text-green-700">
              <p className="font-medium">✓ Connected</p>
              <p>Account ID: {settings.stripe_test_account_id}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Not connected</p>
          )}
        </div>

        {/* Production Environment */}
        <div className={`border rounded-lg p-4 ${isProductionConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-3">
            <Zap className={`h-5 w-5 ${isProductionConnected ? 'text-green-600' : 'text-gray-400'}`} />
            <h3 className="font-medium">Production Environment</h3>
            {isProductionConnected && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Live environment for real payments and customer transactions.
          </p>
          {isProductionConnected ? (
            <div className="text-sm text-green-700">
              <p className="font-medium">✓ Connected</p>
              <p>Account ID: {settings.stripe_production_account_id}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Not connected</p>
          )}
        </div>
      </div>

      {!hasAnyConnection ? (
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
              <li>Test products safely before deploying to production.</li>
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
                  Choose which environment to connect first. We recommend starting with test mode.
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-6">
                <Label className="text-base font-medium">Select Environment</Label>
                <RadioGroup 
                  value={selectedEnvironment} 
                  onValueChange={(value) => setSelectedEnvironment(value as StripeEnvironment)}
                  className="mt-3"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="test" id="test" />
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-blue-500" />
                      <Label htmlFor="test" className="cursor-pointer">
                        <span className="font-medium">Test Mode</span>
                        <p className="text-sm text-gray-500">Safe for testing and development</p>
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="production" id="production" />
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      <Label htmlFor="production" className="cursor-pointer">
                        <span className="font-medium">Production Mode</span>
                        <p className="text-sm text-gray-500">Live payments and real money</p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              <SheetFooter>
                <Button onClick={handleConnectAccount} disabled={isLoading} className="w-full" size="lg">
                  {isLoading ? 'Redirecting...' : `Connect ${selectedEnvironment === 'test' ? 'Test' : 'Production'} Account`}
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
              <h3 className="font-medium text-green-800">
                Stripe Environment{hasAnyConnection && (isTestConnected && isProductionConnected) ? 's' : ''} Connected!
              </h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              {isTestConnected && isProductionConnected 
                ? 'Both test and production environments are ready.'
                : isTestConnected 
                  ? 'Test environment is ready. You can add production later.'
                  : 'Production environment is ready.'
              }
            </p>
            
            {(!isTestConnected || !isProductionConnected) && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="mr-3 border-green-300 text-green-700 hover:bg-green-100">
                    Connect {!isTestConnected ? 'Test' : 'Production'} Environment
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Connect Additional Environment</SheetTitle>
                    <SheetDescription>
                      Connect your {!isTestConnected ? 'test' : 'production'} environment for complete setup.
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="py-6">
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        {!isTestConnected ? (
                          <TestTube className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Zap className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <span className="font-medium">
                            {!isTestConnected ? 'Test Mode' : 'Production Mode'}
                          </span>
                          <p className="text-sm text-gray-500">
                            {!isTestConnected 
                              ? 'Safe for testing and development'
                              : 'Live payments and real money'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <SheetFooter>
                    <Button 
                      onClick={() => {
                        setSelectedEnvironment(!isTestConnected ? 'test' : 'production');
                        handleConnectAccount();
                      }} 
                      disabled={isLoading} 
                      className="w-full" 
                      size="lg"
                    >
                      {isLoading ? 'Redirecting...' : `Connect ${!isTestConnected ? 'Test' : 'Production'} Account`}
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            )}
            
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
        </div>
      )}
    </div>
  );
}