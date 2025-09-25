'use client';

import { useEffect, useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { toast } from '@/components/ui/use-toast';
import { validateWebsite } from '@/utils/validation';

import { updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';

interface WebsiteUrlStepProps {
  profile: CreatorProfile;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

export function WebsiteUrlStep({ profile, setSubmitFunction }: WebsiteUrlStepProps) {
  const [websiteUrl, setWebsiteUrl] = useState(profile.business_website || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWebsiteValid, setIsWebsiteValid] = useState(true);

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
      await updateCreatorProfileAction({
        business_website: websiteUrl,
        onboarding_step: 2, // Advance to the next step
      });
      toast({
        description: "We've started analyzing your website for branding information!",
      });
    } catch (error) {
      console.error('Failed to save website URL:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save your website URL. Please try again.',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null);
  }, [handleSubmit, setSubmitFunction]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">What's your website?</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Provide your website URL so we can automatically extract your branding, colors, and voice to personalize your storefront.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="websiteUrl" className="text-sm font-medium text-gray-700">
              Your Website URL
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
          </div>
        </div>
      </div>
    </div>
  );
}