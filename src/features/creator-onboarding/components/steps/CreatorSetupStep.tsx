'use client';

import { useState } from 'react';
import { Building, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { validateBusinessName, validateWebsite } from '@/utils/validation';
import { Json } from '@/libs/supabase/types';

import { updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';
import { BusinessNameTooltip } from '../OnboardingTooltip';

interface CreatorSetupStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function CreatorSetupStep({ profile, onNext }: CreatorSetupStepProps) {
  const [formData, setFormData] = useState({
    businessName: profile.business_name || '',
    businessDescription: profile.business_description || '',
    businessWebsite: profile.business_website || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation states
  const [isBusinessNameValid, setIsBusinessNameValid] = useState(false);
  const [isWebsiteValid, setIsWebsiteValid] = useState(true); // Optional, so start as valid

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setFormData(prev => ({ ...prev, [field]: newValue }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateCreatorProfileAction({
        business_name: formData.businessName,
        business_description: formData.businessDescription,
        business_website: formData.businessWebsite,
        onboarding_step: 2, // Advance to the new combined WhiteLabelSetupStep
      });
      onNext();
    } catch (error) {
      console.error('Failed to update creator profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = isBusinessNameValid && isWebsiteValid;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Tell us about your business</h2>
        <p className="text-gray-600">
          We&apos;ll use this information to create your personalized SaaS platform.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="businessName" className="text-sm font-medium text-gray-700">
            Business Name *
          </label>
          <InputWithValidation
            id="businessName"
            placeholder="Enter your business name"
            value={formData.businessName}
            onChange={handleInputChange('businessName')}
            validator={validateBusinessName}
            onValidationChange={setIsBusinessNameValid}
            required
            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="businessDescription" className="text-sm font-medium text-gray-700">
            Business Description
          </label>
          <textarea
            id="businessDescription"
            placeholder="Describe what your business does..."
            value={formData.businessDescription}
            onChange={handleInputChange('businessDescription')}
            className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="businessWebsite" className="text-sm font-medium flex items-center gap-2 text-gray-700">
            <Globe className="h-4 w-4" />
            Business Website
          </label>
          <InputWithValidation
            id="businessWebsite"
            placeholder="https://yourwebsite.com"
            type="url"
            value={formData.businessWebsite}
            onChange={handleInputChange('businessWebsite')}
            validator={validateWebsite}
            onValidationChange={setIsWebsiteValid}
            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}