'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Building, Eye, Globe, Image as ImageIcon, Loader2, Mail, Palette, Phone, Save } from 'lucide-react'; // Added Mail and Phone icons

import { GradientSelector, PatternSelector } from '@/components/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { Label } from '@/components/ui/label'; // Added Label import
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { updateCreatorProfileAction } from '@/features/creator-onboarding/actions/onboarding-actions';
import type { BillingAddress, CreatorProfile } from '@/features/creator-onboarding/types'; // Imported BillingAddress
import { Json } from '@/libs/supabase/types';
import { getBrandingStyles } from '@/utils/branding-utils';
import { generateAutoGradient, type GradientConfig, gradientToCss, type PatternConfig } from '@/utils/gradient-utils';
import { validateBusinessName, validateEmail, validatePhone, validateWebsite } from '@/utils/validation'; // Added validateEmail and validatePhone
import { getURL } from '@/utils/get-url'; // Import getURL
import { Switch } from '@/components/ui/switch'; // Import Switch component
import { updateStripeCustomerBillingDetailsAction } from '../actions/profile-actions'; // Import new action

interface ProfileFormProps {
  initialProfile: CreatorProfile;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState(initialProfile.business_name || '');
  const [businessDescription, setBusinessDescription] = useState(initialProfile.business_description || '');
  const [businessWebsite, setBusinessWebsite] = useState(initialProfile.business_website || '');
  const [businessLogoUrl, setBusinessLogoUrl] = useState(initialProfile.business_logo_url || '');
  const [pageSlug, setPageSlug] = useState(initialProfile.page_slug || ''); // Changed from customDomain to pageSlug
  const [brandColor, setBrandColor] = useState(initialProfile.brand_color || '#000000');
  const [gradient, setGradient] = useState<GradientConfig>(() => 
    (initialProfile.brand_gradient as unknown as GradientConfig) || generateAutoGradient(initialProfile.brand_color || '#000000')
  );
  const [pattern, setPattern] = useState<PatternConfig>(() => 
    (initialProfile.brand_pattern as unknown as PatternConfig) || { type: 'none', intensity: 0.1, angle: 0 }
  );
  // New billing states
  const [billingEmail, setBillingEmail] = useState(initialProfile.billing_email || '');
  const [billingPhone, setBillingPhone] = useState(initialProfile.billing_phone || '');
  const [billingAddress, setBillingAddress] = useState<BillingAddress>(
    (initialProfile.billing_address as unknown as BillingAddress) || {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    }
  );

  // Validation states
  const [isBusinessNameValid, setIsBusinessNameValid] = useState(true);
  const [isWebsiteValid, setIsWebsiteValid] = useState(true);
  const [isBillingEmailValid, setIsBillingEmailValid] = useState(true); // New validation state
  const [isBillingPhoneValid, setIsBillingPhoneValid] = useState(true); // New validation state

  // Stripe sync state
  const [shouldSyncWithStripe, setShouldSyncWithStripe] = useState(false);

  // Update gradient colors if brand color changes
  useEffect(() => {
    setGradient(prev => generateAutoGradient(brandColor, prev.type));
  }, [brandColor]);

  const handleBillingAddressChange = (field: keyof BillingAddress) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    setBillingAddress(prev => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const handleSave = async () => {
    if (!isBusinessNameValid || !isWebsiteValid || !isBillingEmailValid || !isBillingPhoneValid) {
      toast({
        variant: 'destructive',
        description: 'Please fix the validation errors before saving.',
      });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update Supabase profile
      await updateCreatorProfileAction({
        business_name: businessName,
        business_description: businessDescription,
        business_website: businessWebsite,
        business_logo_url: businessLogoUrl,
        page_slug: pageSlug || initialProfile.id, // Use pageSlug, fallback to profile.id if empty
        brand_color: brandColor,
        brand_gradient: gradient as unknown as Json,
        brand_pattern: pattern as unknown as Json,
        billing_email: billingEmail,
        billing_phone: billingPhone,
        billing_address: billingAddress as unknown as Json,
      });
      toast({
        description: 'Profile updated successfully!',
      });

      // 2. Conditionally update Stripe if toggle is on and Stripe is connected
      if (shouldSyncWithStripe && initialProfile.stripe_account_enabled) {
        const confirmStripeUpdate = window.confirm(
          'Do you want to update your billing details in Stripe as well? This will sync your email, phone, and address with your Stripe customer account.'
        );

        if (confirmStripeUpdate) {
          const stripeUpdateResult = await updateStripeCustomerBillingDetailsAction(
            billingEmail,
            billingPhone,
            billingAddress
          );

          if (stripeUpdateResult.success) {
            toast({
              description: stripeUpdateResult.message || 'Stripe billing details updated successfully.',
            });
          } else {
            toast({
              variant: 'destructive',
              description: stripeUpdateResult.error || 'Failed to update Stripe billing details.',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
      setShouldSyncWithStripe(false); // Reset toggle after save attempt
    }
  };

  const brandingStyles = getBrandingStyles({
    brandColor: brandColor,
    brandGradient: gradient,
    brandPattern: pattern,
  });

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Information
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                Business Name *
              </Label>
              <InputWithValidation
                id="businessName"
                placeholder="Enter your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
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
              <Textarea
                id="businessDescription"
                placeholder="Describe what your business does..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="min-h-[100px] border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
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
                value={businessWebsite}
                onChange={(e) => setBusinessWebsite(e.target.value)}
                validator={validateWebsite}
                onValidationChange={setIsWebsiteValid}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="businessLogoUrl" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Business Logo URL
              </label>
              <Input
                id="businessLogoUrl"
                placeholder="https://yourwebsite.com/logo.png"
                type="url"
                value={businessLogoUrl}
                onChange={(e) => setBusinessLogoUrl(e.target.value)}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              {businessLogoUrl && (
                <div className="mt-2">
                  <Image 
                    src={businessLogoUrl} 
                    alt="Business Logo Preview" 
                    width={80} 
                    height={80} 
                    className="max-h-20 w-auto rounded-md border border-gray-200" 
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="pageSlug" className="text-sm font-medium text-gray-700"> {/* Changed htmlFor */}
                Custom URL Slug (Optional)
              </label>
              <Input
                id="pageSlug" // Changed id
                placeholder="your-brand-name"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-600">
                This will be used in your storefront URL: `{getURL()}/c/{pageSlug || initialProfile.id}`
              </p>
            </div>
          </div>
        </div>

        {/* Branding Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Design
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="brandColor" className="text-sm font-medium text-gray-700">
                Primary Brand Color
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  id="brandColor"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-16 h-10 border-gray-300 bg-white text-gray-900"
                />
                <Input
                  placeholder="#000000"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            <GradientSelector
              value={gradient}
              onChange={setGradient}
              primaryColor={brandColor}
            />

            <PatternSelector
              value={pattern}
              onChange={setPattern}
              primaryColor={brandColor}
              gradientCss={gradientToCss(gradient)}
            />
          </div>
        </div>
      </div>

      {/* Billing Contact Information */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Billing Contact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="billingEmail" className="text-sm font-medium text-gray-700">
              Billing Email
            </Label>
            <InputWithValidation
              id="billingEmail"
              placeholder="billing@yourbusiness.com"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              validator={validateEmail}
              onValidationChange={setIsBillingEmailValid}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingPhone" className="text-sm font-medium text-gray-700">
              Billing Phone
            </Label>
            <InputWithValidation
              id="billingPhone"
              placeholder="+15551234567"
              type="tel"
              value={billingPhone}
              onChange={(e) => setBillingPhone(e.target.value)}
              validator={validatePhone}
              onValidationChange={setIsBillingPhoneValid}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Billing Address */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Billing Address</Label>
          <Input
            placeholder="Address Line 1"
            value={billingAddress?.line1 || ''}
            onChange={handleBillingAddressChange('line1')}
            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
          />
          <Input
            placeholder="Address Line 2 (Optional)"
            value={billingAddress?.line2 || ''}
            onChange={handleBillingAddressChange('line2')}
            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="City"
              value={billingAddress?.city || ''}
              onChange={handleBillingAddressChange('city')}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
            <Input
              placeholder="State/Province"
              value={billingAddress?.state || ''}
              onChange={handleBillingAddressChange('state')}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Postal Code"
              value={billingAddress?.postal_code || ''}
              onChange={handleBillingAddressChange('postal_code')}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
            <Input
              placeholder="Country"
              value={billingAddress?.country || ''}
              onChange={handleBillingAddressChange('country')}
              className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {initialProfile.stripe_account_enabled && (
          <div className="flex items-center justify-between border-t pt-4">
            <Label htmlFor="sync-stripe-billing" className="text-sm font-medium text-gray-700">
              Sync with Stripe
              <p className="text-xs text-gray-500 mt-1">Update these billing details in your Stripe customer account.</p>
            </Label>
            <Switch
              id="sync-stripe-billing"
              checked={shouldSyncWithStripe}
              onCheckedChange={setShouldSyncWithStripe}
            />
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <h3 className="font-medium text-lg p-4 border-b border-gray-200 flex items-center gap-2 text-gray-900">
          <Eye className="h-5 w-5" />
          Live Preview of Your Storefront
        </h3>
        <div className="p-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-sm">
            <div className="text-gray-900 p-6 text-center" style={brandingStyles.gradientBackground}>
              <h1 className="text-2xl font-bold mb-2">{businessName || 'Your SaaS Business'}</h1>
              <p className="text-gray-700 mb-4">{businessDescription || 'Your amazing products and services'}</p>
              <div className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium">
                Get Started
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="border rounded p-4 text-center border-gray-200" style={brandingStyles.brandBorder}>
                <h3 className="font-medium text-gray-900 mb-2" style={brandingStyles.gradientText}>Pricing</h3>
                <div className="text-2xl font-bold text-gray-900">$29</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !isBusinessNameValid || !isWebsiteValid || !isBillingEmailValid || !isBillingPhoneValid}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Profile
        </Button>
      </div>
    </>
  );
}