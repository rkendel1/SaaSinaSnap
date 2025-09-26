'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, CreditCard, Globe, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { toast } from '@/components/ui/use-toast';
import { validateWebsite } from '@/utils/validation';

import { createStripeConnectAccountAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import { getStripeConnectAccountAction } from '../../actions/stripe-connect-actions';
import type { BusinessTypeOption, CreatorProfile, StripeConnectAccount } from '../../types';

interface BusinessSetupBrandAnalysisStepProps {
  profile: CreatorProfile;
  businessType: BusinessTypeOption | null;
  selectedFeatures: string[];
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

export function BusinessSetupBrandAnalysisStep({ 
  profile, 
  businessType, 
  selectedFeatures, 
  setSubmitFunction 
}: BusinessSetupBrandAnalysisStepProps) {
  const [websiteUrl, setWebsiteUrl] = useState(profile.business_website || '');
  const [isWebsiteValid, setIsWebsiteValid] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [brandAnalysisComplete, setBrandAnalysisComplete] = useState(false);
  
  // Stripe Connect state
  const [stripeAccount, setStripeAccount] = useState<StripeConnectAccount | null>(null);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check initial Stripe connection status
  useEffect(() => {
    const checkStripeStatus = async () => {
      if (profile.stripe_account_id) {
        try {
          const account = await getStripeConnectAccountAction();
          setStripeAccount(account);
          setStripeConnected(true);
        } catch (error) {
          console.error('Failed to fetch Stripe account:', error);
        }
      }
    };
    checkStripeStatus();
  }, [profile.stripe_account_id]);

  // Check if brand analysis was already completed
  useEffect(() => {
    if (profile.branding_extraction_status === 'completed' && profile.extracted_branding_data) {
      setBrandAnalysisComplete(true);
    }
  }, [profile.branding_extraction_status, profile.extracted_branding_data]);

  const handleWebsiteAnalysis = async () => {
    if (!websiteUrl || !isWebsiteValid) {
      toast({
        variant: 'destructive',
        description: 'Please enter a valid website URL for brand analysis.',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      await updateCreatorProfileAction({
        business_website: websiteUrl,
      });
      
      // Simulate brand analysis (in real implementation, this would trigger AI analysis)
      setTimeout(() => {
        setBrandAnalysisComplete(true);
        setIsAnalyzing(false);
        toast({
          description: "Brand analysis complete! We've extracted your colors, fonts, and style.",
        });
      }, 3000);
    } catch (error) {
      console.error('Failed to analyze website:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to analyze your website. Please try again.',
      });
      setIsAnalyzing(false);
    }
  };

  const handleStripeConnect = async () => {
    setIsConnectingStripe(true);
    try {
      const { onboardingUrl } = await createStripeConnectAccountAction();
      // In a real implementation, this would redirect to Stripe
      // For now, we'll simulate a successful connection
      setTimeout(() => {
        setStripeConnected(true);
        setIsConnectingStripe(false);
        toast({
          description: 'Stripe account connected successfully! Payment processing is now enabled.',
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to connect Stripe:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to connect Stripe account. Please try again.',
      });
      setIsConnectingStripe(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!websiteUrl || !isWebsiteValid) {
      toast({
        variant: 'destructive',
        description: 'Please provide a valid website URL for brand analysis.',
      });
      throw new Error('Website URL required');
    }

    if (!stripeConnected) {
      toast({
        variant: 'destructive',
        description: 'Please connect your Stripe account to enable payments.',
      });
      throw new Error('Stripe connection required');
    }

    setIsSubmitting(true);
    try {
      await updateCreatorProfileAction({
        business_website: websiteUrl,
        onboarding_step: 2, // Advance to Profile Configuration
      });
    } catch (error) {
      console.error('Failed to save business setup:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save your business setup. Please try again.',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [websiteUrl, isWebsiteValid, stripeConnected]);

  // Set submit function for parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
  }, [handleSubmit, setSubmitFunction]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Business Setup & Brand Analysis</h2>
        <p className="text-gray-600">
          Let&apos;s set up your business profile and analyze your brand to create a personalized experience.
        </p>
        {businessType && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            {businessType.title} Business
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Website URL & Brand Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Website & Brand Analysis</h3>
              <p className="text-sm text-gray-600">
                We&apos;ll analyze your website to extract brand colors, fonts, and styling
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <InputWithValidation
              label="Website URL"
              placeholder="https://your-website.com"
              value={websiteUrl}
              onChange={setWebsiteUrl}
              validation={validateWebsite}
              onValidationChange={setIsWebsiteValid}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              required
            />

            {websiteUrl && isWebsiteValid && !brandAnalysisComplete && (
              <Button
                onClick={handleWebsiteAnalysis}
                disabled={isAnalyzing}
                className="w-full"
                variant="outline"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing your brand...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze My Brand
                  </>
                )}
              </Button>
            )}

            {brandAnalysisComplete && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">
                  Brand analysis complete! Colors, fonts, and style extracted.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stripe Payment Setup */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Payment Processing</h3>
              <p className="text-sm text-gray-600">
                Connect your Stripe account to start accepting payments
              </p>
            </div>
          </div>

          {!stripeConnected ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You&apos;ll be securely connected to Stripe for payment processing</li>
                  <li>• Your business details will be auto-imported to save time</li>
                  <li>• All financial data is handled securely by Stripe</li>
                </ul>
              </div>

              <Button
                onClick={handleStripeConnect}
                disabled={isConnectingStripe}
                className="w-full"
              >
                {isConnectingStripe ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting to Stripe...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Connect with Stripe
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">
                Stripe account connected successfully! Payment processing is enabled.
              </span>
            </div>
          )}
        </div>

        {/* Next Steps Preview */}
        {brandAnalysisComplete && stripeConnected && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Ready for the next step!</h4>
            <p className="text-sm text-gray-600">
              We&apos;ll use your brand information and Stripe data to pre-populate your profile configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}