'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, CreditCard, Globe, Loader2, Sparkles, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { toast } from '@/components/ui/use-toast';
import { validateWebsite } from '@/utils/validation';

import { createStripeConnectAccountAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import { getStripeConnectAccountAction } from '../../actions/stripe-connect-actions';
import { uploadFile } from '../../services/file-upload-service';
import type { BusinessTypeOption, CreatorProfile, StripeConnectAccount } from '../../types';

interface EnhancedBusinessSetupStepProps {
  profile: CreatorProfile;
  businessType: BusinessTypeOption | null;
  selectedFeatures: string[];
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

export function EnhancedBusinessSetupStep({ 
  profile, 
  businessType, 
  selectedFeatures, 
  setSubmitFunction 
}: EnhancedBusinessSetupStepProps) {
  const [websiteUrl, setWebsiteUrl] = useState(profile.business_website || '');
  const [isWebsiteValid, setIsWebsiteValid] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [brandAnalysisComplete, setBrandAnalysisComplete] = useState(false);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string>(profile.business_logo_url || '');
  const [logoSource, setLogoSource] = useState<'url' | 'file'>('url');
  const [logoUrl, setLogoUrl] = useState(profile.business_logo_url || '');
  
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

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setLogoSource('file');
    
    // Upload file immediately for preview
    setIsUploading(true);
    try {
      const result = await uploadFile(file, profile.id);
      if (result.success && result.url) {
        setUploadedLogoUrl(result.url);
        toast({
          description: 'Logo uploaded successfully!',
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Failed to upload file',
      });
    } finally {
      setIsUploading(false);
    }
  }, [profile.id]);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setUploadedLogoUrl('');
    setLogoSource('url');
  }, []);

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true);
    try {
      const { stripeConnectUrl } = await createStripeConnectAccountAction();
      if (stripeConnectUrl) {
        window.open(stripeConnectUrl, '_blank');
        toast({
          description: 'Please complete your Stripe setup in the new tab, then return here.',
        });
      }
    } catch (error) {
      console.error('Failed to create Stripe Connect account:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to set up Stripe Connect. Please try again.',
      });
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const handleAnalyzeBrand = async () => {
    if (!websiteUrl || !isWebsiteValid) {
      toast({
        variant: 'destructive',
        description: 'Please enter a valid website URL first.',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Import the site analysis service dynamically to avoid SSR issues
      const { analyzeSite } = await import('@/features/creator/services/site-analysis-service');
      
      await analyzeSite(profile.id, websiteUrl, profile.tenant_id);
      setBrandAnalysisComplete(true);
      
      toast({
        description: 'Brand analysis completed! Your header will be generated automatically.',
      });
    } catch (error) {
      console.error('Brand analysis error:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to analyze your website. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!isWebsiteValid) {
      toast({
        variant: 'destructive',
        description: 'Please enter a valid website URL to continue.',
      });
      throw new Error('Invalid website URL');
    }

    setIsSubmitting(true);
    try {
      // Determine final logo URL
      const finalLogoUrl = logoSource === 'file' ? uploadedLogoUrl : logoUrl;
      
      await updateCreatorProfileAction({
        business_website: websiteUrl,
        business_logo_url: finalLogoUrl,
        business_logo_file_path: logoSource === 'file' ? uploadedLogoUrl : null,
        onboarding_step: 2,
      });

      // If we haven't analyzed the brand yet and have a website, do it now
      if (websiteUrl && !brandAnalysisComplete) {
        await handleAnalyzeBrand();
      }

      toast({
        description: 'Business setup completed successfully!',
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
  };

  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null);
  }, [setSubmitFunction, websiteUrl, isWebsiteValid, logoUrl, logoSource, uploadedLogoUrl, brandAnalysisComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Business Setup & Brand Analysis
        </h2>
        <p className="text-gray-600">
          Set up your business information and let us analyze your brand for the perfect white-label experience
        </p>
      </div>

      {/* Website URL Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-lg mb-4 text-gray-900">Website Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="websiteUrl" className="text-sm font-medium text-gray-700 mb-2 block">
              Your Website URL *
            </label>
            <InputWithValidation
              id="websiteUrl"
              placeholder="https://yourbusiness.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              validator={validateWebsite}
              onValidationChange={setIsWebsiteValid}
              required
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll analyze your website to create a perfectly matching header
            </p>
          </div>

          {websiteUrl && isWebsiteValid && (
            <Button
              onClick={handleAnalyzeBrand}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Your Brand...
                </>
              ) : brandAnalysisComplete ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Brand Analysis Complete
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Brand
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Logo Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-lg mb-4 text-gray-900">Business Logo</h3>
        
        <div className="space-y-4">
          {/* Logo Source Toggle */}
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="logoSource"
                value="url"
                checked={logoSource === 'url'}
                onChange={(e) => e.target.checked && setLogoSource('url')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Use Logo URL</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="logoSource"
                value="file"
                checked={logoSource === 'file'}
                onChange={(e) => e.target.checked && setLogoSource('file')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Upload Logo File</span>
            </label>
          </div>

          {logoSource === 'url' ? (
            <div>
              <label htmlFor="logoUrl" className="text-sm font-medium text-gray-700 mb-2 block">
                Logo URL
              </label>
              <InputWithValidation
                id="logoUrl"
                placeholder="https://yourbusiness.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                validator={(url) => !url ? { isValid: true } : validateWebsite(url)}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Upload Logo File
              </label>
              <FileUpload
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                currentFile={selectedFile}
                currentUrl={uploadedLogoUrl}
                placeholder="Upload your business logo"
                disabled={isUploading}
              />
            </div>
          )}

          {/* Logo Preview */}
          {((logoSource === 'url' && logoUrl) || (logoSource === 'file' && uploadedLogoUrl)) && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className="border border-gray-200 rounded p-4 bg-gray-50">
                <img
                  src={logoSource === 'url' ? logoUrl : uploadedLogoUrl}
                  alt="Logo preview"
                  className="h-12 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stripe Connect Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-lg mb-4 text-gray-900">Payment Processing</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your Stripe account to start accepting payments immediately.
          </p>
          
          {stripeConnected ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-700">Stripe Connected</p>
                <p className="text-sm text-green-600">
                  {stripeAccount?.business_profile?.name || 'Your account is ready to accept payments'}
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleConnectStripe}
              disabled={isConnectingStripe}
              className="flex items-center gap-2"
            >
              {isConnectingStripe ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Connect Stripe Account
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Business Type and Features Summary */}
      {businessType && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-lg mb-4 text-gray-900">Selected Configuration</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Business Type:</span> {businessType.title}
            </p>
            {selectedFeatures.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">Selected Features:</span> {selectedFeatures.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}