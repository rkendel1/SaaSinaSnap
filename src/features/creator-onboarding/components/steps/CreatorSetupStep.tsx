'use client';

import { useEffect, useState } from 'react';
import { Building, Globe, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { Textarea } from '@/components/ui/textarea';
import { Json } from '@/libs/supabase/types';
import { validateBusinessName, validateEmail, validatePhone, validateWebsite } from '@/utils/validation';
import { getURL } from '@/utils/get-url'; // Import getURL

import { updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { BillingAddress, CreatorProfile } from '../../types';
import { BusinessNameTooltip } from '../OnboardingTooltip';

interface CreatorSetupStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

interface FormDataState {
  businessName: string;
  businessDescription: string;
  businessWebsite: string;
  pageSlug: string; // Added pageSlug to form state
  billingEmail: string;
  billingPhone: string;
  billingAddress: BillingAddress | null;
}

export function CreatorSetupStep({ profile, onNext, setSubmitFunction }: CreatorSetupStepProps) {
  const [formData, setFormData] = useState<FormDataState>({
    businessName: profile.business_name || '',
    businessDescription: profile.business_description || '',
    businessWebsite: profile.business_website || '',
    pageSlug: profile.page_slug || '', // Initialize pageSlug from profile
    billingEmail: profile.billing_email || '',
    billingPhone: profile.billing_phone || '',
    billingAddress: (profile.billing_address as unknown as BillingAddress) || { // Cast to unknown first
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
  });

  // Check if data was auto-populated from Stripe
  const hasStripeAutoPopulatedData = Boolean(
    profile.business_name || 
    profile.billing_email || 
    profile.billing_phone || 
    (profile.billing_address && (profile.billing_address as any).line1)
  );

  // Check if data was auto-populated from website extraction
  const hasWebsiteAutoPopulatedData = profile.branding_extraction_status === 'completed' && 
                                      profile.extracted_branding_data &&
                                      (profile.extracted_branding_data.primaryColors.length > 0 ||
                                       profile.extracted_branding_data.fonts.primary);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation states
  const [isBusinessNameValid, setIsBusinessNameValid] = useState(false);
  const [isWebsiteValid, setIsWebsiteValid] = useState(true);
  const [isBillingEmailValid, setIsBillingEmailValid] = useState(true);
  const [isBillingPhoneValid, setIsBillingPhoneValid] = useState(true);
  const [isBillingAddressValid, setIsBillingAddressValid] = useState(true);

  // Effect to automatically generate pageSlug from businessWebsite
  useEffect(() => {
    if (formData.businessWebsite && isWebsiteValid) {
      let generatedSlug = formData.businessWebsite.trim().toLowerCase();
      // Remove protocol (http/https)
      generatedSlug = generatedSlug.replace(/^(https?:\/\/)/, '');
      // Remove www.
      generatedSlug = generatedSlug.replace(/^www\./, '');
      // Remove top-level domain (e.g., .com, .org, .net)
      generatedSlug = generatedSlug.replace(/\.[a-z0-9-]{2,6}(?:\.[a-z0-9-]{2})?$/, '');
      // Replace non-alphanumeric characters (except hyphens) with hyphens
      generatedSlug = generatedSlug.replace(/[^a-z0-9-]/g, '-');
      // Remove leading/trailing hyphens
      generatedSlug = generatedSlug.replace(/^-+|-+$/g, '');
      // Replace multiple hyphens with a single hyphen
      generatedSlug = generatedSlug.replace(/-+/g, '-');

      if (generatedSlug && generatedSlug !== formData.pageSlug) {
        setFormData(prev => ({ ...prev, pageSlug: generatedSlug }));
      }
    } else if (!formData.businessWebsite && formData.pageSlug !== '') {
      // Clear slug if website is cleared
      setFormData(prev => ({ ...prev, pageSlug: '' }));
    }
  }, [formData.businessWebsite, isWebsiteValid]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleInputChange = (field: keyof FormDataState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setFormData(prev => ({ ...prev, [field]: newValue }));
  };

  const handleBillingAddressChange = (field: keyof BillingAddress) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    setFormData(prev => ({
      ...prev,
      billingAddress: {
        ...(prev.billingAddress as BillingAddress), // Ensure it's treated as BillingAddress
        [field]: newValue,
      },
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateCreatorProfileAction({
        business_name: formData.businessName,
        business_description: formData.businessDescription,
        business_website: formData.businessWebsite,
        page_slug: formData.pageSlug || profile.id, // Use pageSlug, fallback to profile.id if empty
        billing_email: formData.billingEmail,
        billing_phone: formData.billingPhone,
        billing_address: formData.billingAddress as unknown as Json,
        onboarding_step: 4, // Advance to the next step
      });
    } catch (error) {
      console.error('Failed to update creator profile:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null);
  }, [setSubmitFunction, handleSubmit]); // Added handleSubmit to dependencies

  const isFormValid = isBusinessNameValid && isWebsiteValid && isBillingEmailValid && isBillingPhoneValid && isBillingAddressValid;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Review Your Business Information</h2>
        <p className="text-gray-600">
          {hasStripeAutoPopulatedData || hasWebsiteAutoPopulatedData
            ? "We've pre-filled some details from your Stripe account and website. Please review and update as needed."
            : "Please provide your business details. We'll use this information to create your personalized SaaS platform."
          }
        </p>
      </div>

      {(hasStripeAutoPopulatedData || hasWebsiteAutoPopulatedData) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
              <span className="text-xs text-white font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Information Auto-Imported</h3>
              <p className="text-sm text-blue-800">
                Some fields have been automatically filled using data from your {hasStripeAutoPopulatedData && 'Stripe account'}
                {hasStripeAutoPopulatedData && hasWebsiteAutoPopulatedData && ' and '}
                {hasWebsiteAutoPopulatedData && 'website analysis'}.
                Please review all information to ensure accuracy before proceeding.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Business Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-medium text-lg text-gray-900 flex items-center gap-2">
            <Building className="h-5 w-5" />
            General Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label htmlFor="businessWebsite" className="text-sm font-medium text-gray-700 flex items-center gap-2">
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

          <div className="space-y-2">
            <label htmlFor="businessDescription" className="text-sm font-medium text-gray-700">
              Business Description
            </label>
            <Textarea
              id="businessDescription"
              placeholder="Describe what your business does..."
              value={formData.businessDescription}
              onChange={handleInputChange('businessDescription')}
              className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pageSlug" className="text-sm font-medium text-gray-700">
              Custom URL Slug (Optional)
            </label>
            <Input
              id="pageSlug"
              placeholder="your-brand-name-slug"
              value={formData.pageSlug}
              onChange={handleInputChange('pageSlug')}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-600">
              This will be used in your storefront URL: `{getURL()}/c/{formData.pageSlug || profile.id}`. Please enter a simple, URL-friendly name (e.g., `my-shop`, `products`).
            </p>
          </div>
        </div>

        {/* Billing Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-medium text-lg text-gray-900 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Billing Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="billingEmail" className="text-sm font-medium text-gray-700">
                Billing Email
              </label>
              <InputWithValidation
                id="billingEmail"
                placeholder="billing@yourbusiness.com"
                type="email"
                value={formData.billingEmail}
                onChange={handleInputChange('billingEmail')}
                validator={validateEmail}
                onValidationChange={setIsBillingEmailValid}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="billingPhone" className="text-sm font-medium text-gray-700">
                Billing Phone
              </label>
              <InputWithValidation
                id="billingPhone"
                placeholder="+15551234567"
                type="tel"
                value={formData.billingPhone}
                onChange={handleInputChange('billingPhone')}
                validator={validatePhone}
                onValidationChange={setIsBillingPhoneValid}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Billing Address</label>
            <Input
              placeholder="Address Line 1"
              value={formData.billingAddress?.line1 || ''}
              onChange={handleBillingAddressChange('line1')}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
            <Input
              placeholder="Address Line 2 (Optional)"
              value={formData.billingAddress?.line2 || ''}
              onChange={handleBillingAddressChange('line2')}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="City"
                value={formData.billingAddress?.city || ''}
                onChange={handleBillingAddressChange('city')}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              <Input
                placeholder="State/Province"
                value={formData.billingAddress?.state || ''}
                onChange={handleBillingAddressChange('state')}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Postal Code"
                value={formData.billingAddress?.postal_code || ''}
                onChange={handleBillingAddressChange('postal_code')}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              <Input
                placeholder="Country"
                value={formData.billingAddress?.country || ''}
                onChange={handleBillingAddressChange('country')}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}