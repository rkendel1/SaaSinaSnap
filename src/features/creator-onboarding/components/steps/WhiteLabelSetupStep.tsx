'use client';

import { useState } from 'react';
import { Eye, Globe, Palette, Smartphone, Code, Link2, Monitor } from 'lucide-react';

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
  const [deliveryMethod, setDeliveryMethod] = useState<'hosted' | 'embed'>('hosted');
  const [embedMode, setEmbedMode] = useState<'iframe' | 'inline'>('inline');
  const [pageConfig, setPageConfig] = useState({
    heroTitle: `Welcome to ${profile.business_name || 'Your SaaS'}`,
    heroSubtitle: profile.business_description || 'Discover our amazing products and services',
    ctaText: 'Get Started',
    showTestimonials: true,
    showPricing: true,
    showFaq: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update creator profile with domain (only for hosted method)
      await updateCreatorProfileAction({
        custom_domain: deliveryMethod === 'hosted' ? customDomain || null : null,
        onboarding_step: 5,
      });

      // TODO: Create white-labeled page with pageConfig and delivery method preferences
      // This would include storing the delivery method and embed preferences in the database
      
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
        <h2 className="text-xl font-semibold mb-2">Customize Your Storefront</h2>
        <p className="text-muted-foreground">
          Create a branded experience for your customers with white-labeled pages.
        </p>
      </div>

      {/* Delivery Method Selection */}
      <div className="space-y-4 border rounded-lg p-6 bg-gray-50">
        <h3 className="font-medium flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Delivery Method
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to deliver your branded pages to customers.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            deliveryMethod === 'hosted' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'
          }`}>
            <input
              type="radio"
              name="deliveryMethod"
              value="hosted"
              checked={deliveryMethod === 'hosted'}
              onChange={(e) => setDeliveryMethod(e.target.value as 'hosted' | 'embed')}
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-medium">Hosted Pages</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Standalone pages hosted on our platform or your custom domain
                </p>
              </div>
            </div>
          </label>

          <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            deliveryMethod === 'embed' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'
          }`}>
            <input
              type="radio"
              name="deliveryMethod"
              value="embed"
              checked={deliveryMethod === 'embed'}
              onChange={(e) => setDeliveryMethod(e.target.value as 'hosted' | 'embed')}
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <Code className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-medium">Embed Script</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Embed directly into your existing website with a JavaScript snippet
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Embed Options */}
        {deliveryMethod === 'embed' && (
          <div className="mt-4 p-4 border rounded-lg bg-white">
            <h4 className="font-medium mb-3">Embed Options</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <label className={`border rounded p-3 cursor-pointer text-sm ${
                embedMode === 'inline' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="embedMode"
                  value="inline"
                  checked={embedMode === 'inline'}
                  onChange={(e) => setEmbedMode(e.target.value as 'iframe' | 'inline')}
                  className="sr-only"
                />
                <div className="font-medium">Inline HTML</div>
                <div className="text-gray-600">Content inherits your site&apos;s styles</div>
              </label>

              <label className={`border rounded p-3 cursor-pointer text-sm ${
                embedMode === 'iframe' ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="embedMode"
                  value="iframe"
                  checked={embedMode === 'iframe'}
                  onChange={(e) => setEmbedMode(e.target.value as 'iframe' | 'inline')}
                  className="sr-only"
                />
                <div className="font-medium">Iframe</div>
                <div className="text-gray-600">Isolated content with consistent styling</div>
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowEmbedCode(!showEmbedCode)}
            >
              <Code className="h-4 w-4 mr-2" />
              {showEmbedCode ? 'Hide' : 'Show'} Integration Code
            </Button>

            {showEmbedCode && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-sm font-medium">1. Include the embed script</label>
                  <div className="mt-1 p-3 bg-gray-900 text-gray-100 text-sm rounded font-mono overflow-x-auto">
                    {`<script src="${window.location?.origin || 'https://yourapp.com'}/embed.js"></script>`}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">2. Add the embed container</label>
                  <div className="mt-1 p-3 bg-gray-900 text-gray-100 text-sm rounded font-mono overflow-x-auto">
                    {`<div data-staryer-embed 
     data-creator="${profile.custom_domain || 'your-creator-slug'}" 
     data-mode="${embedMode}" 
     data-page="landing">
</div>`}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <strong>Note:</strong> The embed script will automatically initialize when the page loads. 
                  You can customize styling with data-custom-styles, data-height, and data-width attributes.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Custom Domain - only show for hosted method */}
          {deliveryMethod === 'hosted' && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Custom Domain (Optional)
              </h3>
              <div className="space-y-2">
                <Input
                  placeholder="shop.yourdomain.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Point your domain to our platform to use your own branding
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-medium">Page Content</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hero Title</label>
                <Input
                  value={pageConfig.heroTitle}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hero Subtitle</label>
                <textarea
                  value={pageConfig.heroSubtitle}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Call-to-Action Text</label>
                <Input
                  value={pageConfig.ctaText}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Page Sections</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={pageConfig.showTestimonials}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, showTestimonials: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Testimonials Section</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={pageConfig.showPricing}
                  onChange={(e) => setPageConfig(prev => ({ ...prev, showPricing: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Pricing Section</span>
              </label>
              <label className="flex items-center space-x-2">
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
          <h3 className="font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </h3>
          
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 text-center">
              <h1 className="text-2xl font-bold mb-2">{pageConfig.heroTitle}</h1>
              <p className="text-blue-100 mb-4">{pageConfig.heroSubtitle}</p>
              <div className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium">
                {pageConfig.ctaText}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {pageConfig.showPricing && (
                <div className="border rounded p-4 text-center">
                  <h3 className="font-medium text-gray-900 mb-2">Pricing</h3>
                  <div className="text-2xl font-bold text-blue-600">$29</div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
              )}

              {pageConfig.showTestimonials && (
                <div className="border rounded p-4">
                  <h3 className="font-medium text-gray-900 mb-2">What Our Customers Say</h3>
                  <p className="text-sm text-gray-600 italic">
                    "                    &ldquo;This product changed the way we do business...&rdquo;"
                  </p>
                  <p className="text-xs text-gray-400 mt-1">- Happy Customer</p>
                </div>
              )}

              {pageConfig.showFaq && (
                <div className="border rounded p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Frequently Asked Questions</h3>
                  <div className="text-sm text-gray-600">
                    <div className="mb-2">
                      <div className="font-medium">How does it work?</div>
                      <div className="text-gray-500">It&apos;s simple and easy to get started...</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
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