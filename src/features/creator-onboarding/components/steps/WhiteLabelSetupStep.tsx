'use client';

import { useState } from 'react';
import { Eye, Globe, Palette, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';

interface WhiteLabelSetupStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function WhiteLabelSetupStep({ profile, onNext }: WhiteLabelSetupStepProps) {
  const [customDomain, setCustomDomain] = useState(profile.custom_domain || '');
  const [pageConfig, setPageConfig] = useState({
    heroTitle: `Welcome to ${profile.business_name || 'Your SaaS'}`,
    heroSubtitle: profile.business_description || 'Discover our amazing products and services',
    ctaText: 'Get Started',
    showTestimonials: true,
    showPricing: true,
    showFaq: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create default white-labeled page
      await updateCreatorProfileAction({
        custom_domain: customDomain || null,
        onboarding_step: 5,
      });

      // TODO: Create white-labeled page with pageConfig
      onNext();
    } catch (error) {
      console.error('Failed to setup white-label page:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Palette className="h-12 w-12 mx-auto mb-4 text-primary" />
        {/* Adjusted text color */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Customize Your Storefront</h2>
        {/* Adjusted text color */}
        <p className="text-gray-600">
          Create a branded experience for your customers with white-labeled pages.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          /* Adjusted for light theme */
          <div className="space-y-4 bg-white rounded-lg p-6 border border-gray-200">
            {/* Adjusted text color */}
            <h3 className="font-medium flex items-center gap-2 text-gray-900">
              <Globe className="h-4 w-4" />
              Custom Domain (Optional)
            </h3>
            <div className="space-y-2">
              {/* Adjusted for light theme */}
              <Input
                placeholder="shop.yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              {/* Adjusted text color */}
              <p className="text-xs text-gray-600">
                Point your domain to our platform to use your own branding
              </p>
            </div>
          </div>

          /* Adjusted for light theme */
          <div className="space-y-4 bg-white rounded-lg p-6 border border-gray-200">
            {/* Adjusted text color */}
            <h3 className="font-medium text-gray-900">Page Content</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Hero Title</label>
                {/* Adjusted for light theme */}
                <Input
                  value={pageConfig.heroTitle}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Hero Subtitle</label>
                {/* Adjusted for light theme */}
                <textarea
                  value={pageConfig.heroSubtitle}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Call-to-Action Text</label>
                {/* Adjusted for light theme */}
                <Input
                  value={pageConfig.ctaText}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          /* Adjusted for light theme */
          <div className="space-y-4 bg-white rounded-lg p-6 border border-gray-200">
            {/* Adjusted text color */}
            <h3 className="font-medium text-gray-900">Page Sections</h3>
            <div className="space-y-2">
              {/* Adjusted text color */}
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={pageConfig.showTestimonials}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, showTestimonials: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Testimonials Section</span>
              </label>
              {/* Adjusted text color */}
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={pageConfig.showPricing}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, showPricing: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Pricing Section</span>
              </label>
              {/* Adjusted text color */}
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={pageConfig.showFaq}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, showFaq: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show FAQ Section</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Adjusted text color */}
          <h3 className="font-medium flex items-center gap-2 text-gray-900">
            <Eye className="h-4 w-4" />
            Preview
          </h3>
          
          /* Adjusted for light theme */
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 text-center">
              <h1 className="text-2xl font-bold mb-2">{pageConfig.heroTitle}</h1>
              <p className="text-blue-100 mb-4">{pageConfig.heroSubtitle}</p>
              <div className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium">
                {pageConfig.ctaText}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {pageConfig.showPricing && (
                /* Adjusted border color */
                <div className="border rounded p-4 text-center border-gray-200">
                  {/* Adjusted text color */}
                  <h3 className="font-medium text-gray-900 mb-2">Pricing</h3>
                  {/* Adjusted text color */}
                  <div className="text-2xl font-bold text-blue-600">$29</div>
                  {/* Adjusted text color */}
                  <div className="text-sm text-gray-600">per month</div>
                </div>
              )}

              {pageConfig.showTestimonials && (
                /* Adjusted border color */
                <div className="border rounded p-4 border-gray-200">
                  {/* Adjusted text color */}
                  <h3 className="font-medium text-gray-900 mb-2">What Our Customers Say</h3>
                  {/* Adjusted text color */}
                  <p className="text-sm text-gray-600 italic">
                    "                    &ldquo;This product changed the way we do business...&rdquo;"
                  </p>
                  {/* Adjusted text color */}
                  <p className="text-xs text-gray-500 mt-1">- Happy Customer</p>
                </div>
              )}

              {pageConfig.showFaq && (
                /* Adjusted border color */
                <div className="border rounded p-4 border-gray-200">
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

          {/* Adjusted text color */}
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm">Responsive on all devices</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Setting Up...' : 'Continue'}
      </Button>
    </div>
  );
}