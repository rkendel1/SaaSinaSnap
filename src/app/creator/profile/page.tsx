'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building, Globe, Image as ImageIcon, Loader2, Palette, Save, Settings, Eye } from 'lucide-react';

import { GradientSelector, PatternSelector } from '@/components/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getBrandingStyles } from '@/utils/branding-utils';
import { generateAutoGradient, gradientToCss, type GradientConfig, type PatternConfig } from '@/utils/gradient-utils';
import { validateBusinessName, validateWebsite } from '@/utils/validation';
import { Json } from '@/libs/supabase/types';

import { updateCreatorProfileAction } from '@/features/creator-onboarding/actions/onboarding-actions';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import type { CreatorProfile } from '@/features/creator-onboarding/types';

export default function CreatorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessLogoUrl, setBusinessLogoUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [brandColor, setBrandColor] = useState('#000000');
  const [gradient, setGradient] = useState<GradientConfig>(() => generateAutoGradient('#000000'));
  const [pattern, setPattern] = useState<PatternConfig>({ type: 'none', intensity: 0.1, angle: 0 });

  // Validation states
  const [isBusinessNameValid, setIsBusinessNameValid] = useState(true);
  const [isWebsiteValid, setIsWebsiteValid] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await getAuthenticatedUser(); // Get the authenticated user
        if (!user?.id) {
          router.push('/login'); // Redirect if no user ID found
          return;
        }

        const fetchedProfile = await getCreatorProfile(user.id); // Pass user.id
        if (!fetchedProfile) {
          router.push('/login'); // Redirect if no profile found
          return;
        }
        setProfile(fetchedProfile);
        // Initialize form states with fetched data
        setBusinessName(fetchedProfile.business_name || '');
        setBusinessDescription(fetchedProfile.business_description || '');
        setBusinessWebsite(fetchedProfile.business_website || '');
        setBusinessLogoUrl(fetchedProfile.business_logo_url || '');
        setCustomDomain(fetchedProfile.custom_domain || '');
        setBrandColor(fetchedProfile.brand_color || '#000000');
        setGradient((fetchedProfile.brand_gradient as unknown as GradientConfig) || generateAutoGradient(fetchedProfile.brand_color || '#000000'));
        setPattern((fetchedProfile.brand_pattern as unknown as PatternConfig) || { type: 'none', intensity: 0.1, angle: 0 });
      } catch (error) {
        console.error('Failed to fetch creator profile:', error);
        toast({
          variant: 'destructive',
          description: 'Failed to load profile data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  // Update gradient colors if brand color changes
  useEffect(() => {
    setGradient(prev => generateAutoGradient(brandColor, prev.type));
  }, [brandColor]);

  const handleSave = async () => {
    if (!profile) return;

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">
            There was an issue loading your creator profile. Please ensure you are logged in.
          </p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const brandingStyles = getBrandingStyles({
    brandColor: brandColor,
    brandGradient: gradient,
    brandPattern: pattern,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Creator Profile
          </h1>
          <Button variant="outline" asChild>
            <Link href="/creator/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

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
                    <img src={businessLogoUrl} alt="Business Logo Preview" className="max-h-20 w-auto rounded-md border border-gray-200" />
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
      </div>
    </div>
  );
}