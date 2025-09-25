'use client';

import { useEffect, useState } from 'react';
import { LayoutTemplate, Loader2,Palette, Settings } from 'lucide-react';

import { GradientSelector, PatternSelector } from '@/components/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Json } from '@/libs/supabase/types';
import { getBrandingStyles } from '@/utils/branding-utils';
import { generateAutoGradient, type GradientConfig, gradientToCss, type PatternConfig } from '@/utils/gradient-utils';

import { saveDefaultCreatorBrandingAction, saveDefaultWhiteLabeledPageConfigAction, updatePlatformOwnerSettingsAction } from '../../actions/platform-actions';
import type { DefaultCreatorBranding, DefaultWhiteLabeledPageConfig, PlatformSettings } from '../../types';

interface DefaultCreatorSettingsStepProps {
  settings: PlatformSettings;
  onNext: () => void;
}

export function DefaultCreatorSettingsStep({ settings, onNext }: DefaultCreatorSettingsStepProps) {
  const [defaultBrandColor, setDefaultBrandColor] = useState(settings.default_creator_brand_color || '#ea580c');
  const [defaultGradient, setDefaultGradient] = useState<GradientConfig>(() => 
    (settings.default_creator_gradient as unknown as GradientConfig) || generateAutoGradient(defaultBrandColor)
  );
  const [defaultPattern, setDefaultPattern] = useState<PatternConfig>(() => 
    (settings.default_creator_pattern as unknown as PatternConfig) || { type: 'none', intensity: 0.1, angle: 0 }
  );
  const [defaultPageConfig, setDefaultPageConfig] = useState<DefaultWhiteLabeledPageConfig>(() => 
    (settings.default_white_labeled_page_config as unknown as DefaultWhiteLabeledPageConfig) || {
      heroTitle: 'Welcome to Your New SaaS',
      heroSubtitle: 'Launch your business with ease',
      ctaText: 'Get Started',
      showTestimonials: true,
      showPricing: true,
      showFaq: true,
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Update gradient colors if brand color changes
    setDefaultGradient(prev => generateAutoGradient(defaultBrandColor, prev.type));
  }, [defaultBrandColor]);

  const handleBrandColorChange = (color: string) => {
    setDefaultBrandColor(color);
  };

  const handlePageConfigChange = (field: keyof DefaultWhiteLabeledPageConfig) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setDefaultPageConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const branding: DefaultCreatorBranding = {
        brandColor: defaultBrandColor,
        brandGradient: defaultGradient,
        brandPattern: defaultPattern,
      };
      await saveDefaultCreatorBrandingAction(branding);
      await saveDefaultWhiteLabeledPageConfigAction(defaultPageConfig);
      await updatePlatformOwnerSettingsAction({ platform_owner_onboarding_completed: false }); // Mark as not completed yet, as this is an intermediate step
      onNext();
    } catch (error) {
      console.error('Failed to save default creator settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const brandingStyles = getBrandingStyles({
    brandColor: defaultBrandColor,
    brandGradient: defaultGradient,
    brandPattern: defaultPattern,
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="h-12 w-12 mx-auto mb-4 text-primary" />
        {/* Adjusted text color */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Default Creator Settings</h2>
        {/* Adjusted text color */}
        <p className="text-gray-600">
          Set the default branding and page configurations for new creators joining your platform.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Branding Settings */}
        /* Adjusted for light theme */
        <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
          {/* Adjusted text color */}
          <h3 className="font-medium text-lg flex items-center gap-2 text-gray-900">
            <Palette className="h-5 w-5" />
            Default Branding
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              {/* Adjusted text color */}
              <label htmlFor="defaultBrandColor" className="text-sm font-medium text-gray-700">
                Primary Brand Color
              </label>
              <div className="flex gap-2 items-center">
                {/* Adjusted for light theme */}
                <Input
                  id="defaultBrandColor"
                  type="color"
                  value={defaultBrandColor}
                  onChange={(e) => handleBrandColorChange(e.target.value)}
                  className="w-16 h-10 border-gray-300 bg-white text-gray-900"
                />
                {/* Adjusted for light theme */}
                <Input
                  placeholder="#000000"
                  value={defaultBrandColor}
                  onChange={(e) => handleBrandColorChange(e.target.value)}
                  className="flex-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            <GradientSelector
              value={defaultGradient}
              onChange={setDefaultGradient}
              primaryColor={defaultBrandColor}
            />

            <PatternSelector
              value={defaultPattern}
              onChange={setDefaultPattern}
              primaryColor={defaultBrandColor}
              gradientCss={gradientToCss(defaultGradient)}
            />
          </div>
        </div>

        {/* Page Configuration Settings */}
        /* Adjusted for light theme */
        <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
          {/* Adjusted text color */}
          <h3 className="font-medium text-lg flex items-center gap-2 text-gray-900">
            <LayoutTemplate className="h-5 w-5" />
            Default Landing Page
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              {/* Adjusted text color */}
              <label className="text-sm font-medium text-gray-700">Hero Title</label>
              {/* Adjusted for light theme */}
              <Input
                value={defaultPageConfig.heroTitle}
                onChange={handlePageConfigChange('heroTitle')}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              {/* Adjusted text color */}
              <label className="text-sm font-medium text-gray-700">Hero Subtitle</label>
              {/* Adjusted for light theme */}
              <Textarea
                value={defaultPageConfig.heroSubtitle}
                onChange={handlePageConfigChange('heroSubtitle')}
                className="min-h-[80px] border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              {/* Adjusted text color */}
              <label className="text-sm font-medium text-gray-700">Call-to-Action Text</label>
              {/* Adjusted for light theme */}
              <Input
                value={defaultPageConfig.ctaText}
                onChange={handlePageConfigChange('ctaText')}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* Adjusted border color */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              {/* Adjusted text color */}
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={defaultPageConfig.showTestimonials}
                  onChange={handlePageConfigChange('showTestimonials')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Testimonials Section</span>
              </label>
              {/* Adjusted text color */}
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={defaultPageConfig.showPricing}
                  onChange={handlePageConfigChange('showPricing')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Pricing Section</span>
              </label>
              {/* Adjusted text color */}
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={defaultPageConfig.showFaq}
                  onChange={handlePageConfigChange('showFaq')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show FAQ Section</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      /* Adjusted for light theme */
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        /* Adjusted for light theme */
        <h3 className="font-medium text-lg p-4 border-b border-gray-200 flex items-center gap-2 text-gray-900">
          <LayoutTemplate className="h-5 w-5" />
          Live Preview of Default Creator Page
        </h3>
        <div className="p-4">
          /* Adjusted for light theme */
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-sm">
            {/* Adjusted text color */}
            <div className="text-gray-900 p-6 text-center" style={brandingStyles.gradientBackground}>
              <h1 className="text-2xl font-bold mb-2">{defaultPageConfig.heroTitle}</h1>
              {/* Adjusted text color */}
              <p className="text-gray-700 mb-4">{defaultPageConfig.heroSubtitle}</p>
              <div className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium">
                {defaultPageConfig.ctaText}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {defaultPageConfig.showPricing && (
                /* Adjusted border color */
                <div className="border rounded p-4 text-center border-gray-200" style={brandingStyles.brandBorder}>
                  {/* Adjusted text color */}
                  <h3 className="font-medium text-gray-900 mb-2" style={brandingStyles.gradientText}>Pricing</h3>
                  {/* Adjusted text color */}
                  <div className="text-2xl font-bold text-gray-900">$29</div>
                  {/* Adjusted text color */}
                  <div className="text-sm text-gray-600">per month</div>
                </div>
              )}

              {defaultPageConfig.showTestimonials && (
                /* Adjusted border color */
                <div className="border rounded p-4 border-gray-200" style={brandingStyles.brandBorder}>
                  {/* Adjusted text color */}
                  <h3 className="font-medium text-gray-900 mb-2">What Our Customers Say</h3>
                  {/* Adjusted text color */}
                  <p className="text-sm text-gray-600 italic">
                    "This product changed the way we do business..."
                  </p>
                  {/* Adjusted text color */}
                  <p className="text-xs text-gray-500 mt-1">- Happy Customer</p>
                </div>
              )}

              {defaultPageConfig.showFaq && (
                /* Adjusted border color */
                <div className="border rounded p-4 border-gray-200" style={brandingStyles.brandBorder}>
                  {/* Adjusted text color */}
                  <h3 className="font-medium text-gray-900 mb-2">Frequently Asked Questions</h3>
                  {/* Adjusted text color */}
                  <div className="text-sm text-gray-600">
                    <div className="mb-2">
                      <div className="font-medium">How does it work?</div>
                      {/* Adjusted text color */}
                      <div className="text-gray-500">It&apos;s simple and easy to get started...</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Defaults & Continue
        </Button>
      </div>
    </div>
  );
}