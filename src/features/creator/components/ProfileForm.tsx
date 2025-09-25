'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Building, Eye, Globe, Image as ImageIcon, Loader2, Palette, Save } from 'lucide-react';

import { GradientSelector, PatternSelector } from '@/components/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { updateCreatorProfileAction } from '@/features/creator-onboarding/actions/onboarding-actions';
import type { CreatorProfile } from '@/features/creator-onboarding/types';
import { Json } from '@/libs/supabase/types';
import { getBrandingStyles } from '@/utils/branding-utils';
import { generateAutoGradient, type GradientConfig, gradientToCss, type PatternConfig } from '@/utils/gradient-utils';
import { validateBusinessName, validateWebsite } from '@/utils/validation';

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
  const [customDomain, setCustomDomain] = useState(initialProfile.custom_domain || '');
  const [brandColor, setBrandColor] = useState(initialProfile.brand_color || '#000000');
  const [gradient, setGradient] = useState<GradientConfig>(() => 
    (initialProfile.brand_gradient as unknown as GradientConfig) || generateAutoGradient(initialProfile.brand_color || '#000000')
  );
  const [pattern, setPattern] = useState<PatternConfig>(() => 
    (initialProfile.brand_pattern as unknown as PatternConfig) || { type: 'none', intensity: 0.1, angle: 0 }
  );

  // Validation states
  const [isBusinessNameValid, setIsBusinessNameValid] = useState(true);
  const [isWebsiteValid, setIsWebsiteValid] = useState(true);

  // Update gradient colors if brand color changes
  useEffect(() => {
    setGradient(prev => generateAutoGradient(brandColor, prev.type));
  }, [brandColor]);

  const handleSave = async () => {
    if (!isBusinessNameValid || !isWebsiteValid) {
      toast({
        variant: 'destructive',
        description: 'Please fix the validation errors before saving.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateCreatorProfileAction({
        business_name: businessName,
        business_description: businessDescription,
        business_website: businessWebsite,
        business_logo_url: businessLogoUrl,
        custom_domain: customDomain,
        brand_color: brandColor,
        brand_gradient: gradient as unknown as Json,
        brand_pattern: pattern as unknown as Json,
      });
      toast({
        description: 'Profile updated successfully!',
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
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
              <label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                Business Name *
              </label>
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
              <label htmlFor="customDomain" className="text-sm font-medium text-gray-700">
                Custom Domain (Optional)
              </label>
              <Input
                id="customDomain"
                placeholder="shop.yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-600">
                Point your domain to our platform to use your own branding
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
        <Button onClick={handleSave} disabled={isSaving || !isBusinessNameValid || !isWebsiteValid}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Profile
        </Button>
      </div>
    </>
  );
}