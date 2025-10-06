'use client';

// React imports
import { useCallback, useEffect, useState } from 'react';
// External imports
import { CheckCircle, CreditCard, Globe, Loader2, Sparkles, Wand2 } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { toast } from '@/components/ui/use-toast';
import { validateWebsite } from '@/utils/validation';

// Services and Actions
import { createStripeConnectAccountAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import { getStripeConnectAccountAction } from '../../actions/stripe-connect-actions';
import type { PrePopulatedData } from '../../services/brand-analysis-service';
import { BrandAnalysisService } from '../../services/brand-analysis-service';
// Types
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

  // State for extracted data preview
  const [extractedData, setExtractedData] = useState<PrePopulatedData | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; missingFields: string[] } | null>(null);

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
      // Update profile with website URL
      await updateCreatorProfileAction({
        business_website: websiteUrl,
      });
      
      // Perform actual brand analysis
      const brandingData = await BrandAnalysisService.analyzeWebsite(websiteUrl);
      
      // Validate the extracted data
      const validation = BrandAnalysisService.validateExtractedData(brandingData);
      setValidationResult(validation);

      if (validation.isValid) {
        // Prepare data for pre-population
        const prePopulatedData = BrandAnalysisService.preparePrePopulatedData(brandingData);
        setExtractedData(prePopulatedData);
        setBrandAnalysisComplete(true);
        
        // Show preview with animation
        setTimeout(() => {
          setPreviewVisible(true);
        }, 500);

        toast({
          description: "Brand analysis complete! We've extracted your brand information.",
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Partial Data Extracted',
          description: `Some information couldn't be found: ${validation.missingFields.join(', ')}`,
        });
      }
    } catch (error) {
      console.error('Failed to analyze website:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to analyze your website. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStripeConnect = async () => {
    setIsConnectingStripe(true);
    try {
      const { stripeConnectUrl } = await createStripeConnectAccountAction();
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
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Glad you&apos;re here! 🎉</h1>
          <p className="text-lg text-gray-700 mb-4">
            Welcome to your platform setup. Let&apos;s get you up and running quickly.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-3">What to expect:</h3>
          <div className="text-sm text-blue-800 space-y-2 text-left">
            <p>✅ <strong>Quick Setup (3-4 steps):</strong> Business info, profile, integrations, and launch</p>
            <p>🚀 <strong>Fast Launch:</strong> Get your platform running in minutes</p>
            <p>🎨 <strong>Post-Launch Tasks:</strong> Customize your storefront, add products, and set up embeds at your own pace</p>
            <p>🤖 <strong>AI Assistance:</strong> We&apos;ll help you throughout the process with smart suggestions</p>
          </div>
        </div>
      </div>

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
              onChange={(e) => setWebsiteUrl(e.target.value)}
              validator={validateWebsite}
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

            {brandAnalysisComplete && extractedData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Brand analysis complete! We found your brand information.
                  </span>
                </div>

                {/* Extracted Data Preview */}
                <div className={`space-y-6 transition-all duration-500 ${previewVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wand2 className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Here's what we found!</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {BrandAnalysisService.generatePrePopulationPreview(extractedData).map((category, i) => (
                        <div key={i} className="space-y-2">
                          <h5 className="text-sm font-medium text-blue-900">{category.category}</h5>
                          <div className="grid gap-2">
                            {category.items.map((item, j) => (
                              <div key={j} className="flex justify-between text-sm">
                                <span className="text-blue-800">{item.label}:</span>
                                <span className="text-blue-900 font-medium">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {validationResult && validationResult.missingFields.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        Some information couldn't be found automatically. You'll be able to add:
                        {validationResult.missingFields.map(field => (
                          <span key={field} className="inline-block px-2 py-1 m-1 bg-yellow-100 rounded-full text-xs">
                            {field}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                </div>
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