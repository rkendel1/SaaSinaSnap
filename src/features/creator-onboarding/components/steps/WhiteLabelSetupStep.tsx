'use client';

import { useEffect, useState } from 'react';
import { Eye, Globe, Lightbulb, Loader2, Palette, Smartphone } from 'lucide-react';

import { GradientSelector, PatternSelector } from '@/components/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Json } from '@/libs/supabase/types';
import { getBrandingStyles } from '@/utils/branding-utils';
import { COLOR_PALETTE_PRESETS, type ColorPalette,createPaletteFromBranding, generateSuggestedPalettes, getBestPaletteFromExtractedData } from '@/utils/color-palette-utils';
import { generateAutoGradient, type GradientConfig, gradientToCss, type PatternConfig } from '@/utils/gradient-utils';
import { getURL } from '@/utils/get-url'; // Import getURL

import { applyColorPaletteAction, createDefaultWhiteLabeledPagesAction, getBrandingSuggestionsAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';
import { ColorPaletteSelector } from '../ColorPaletteSelector'; // Re-import ColorPaletteSelector
import { BrandColorTooltip } from '../OnboardingTooltip';

interface WhiteLabelSetupStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void; // New prop
}

export function WhiteLabelSetupStep({ profile, onNext, setSubmitFunction }: WhiteLabelSetupStepProps) {
  // Branding states
  const [brandColor, setBrandColor] = useState(profile.brand_color || '#000000');
  const [gradient, setGradient] = useState<GradientConfig>(() => {
    if (profile.brand_gradient) {
      return profile.brand_gradient;
    }
    return generateAutoGradient(brandColor);
  });
  const [pattern, setPattern] = useState<PatternConfig>(() => {
    if (profile.brand_pattern) {
      return profile.brand_pattern;
    }
    return { type: 'none', intensity: 0.1, angle: 0 };
  });

  // Page config states
  const [pageConfig, setPageConfig] = useState({
    heroTitle: `Welcome to ${profile.business_name || 'Your SaaS'}`,
    heroSubtitle: profile.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency',
    ctaText: 'Get Started',
    showTestimonials: true,
    showPricing: true,
    showFaq: true,
  });

  // Custom domain state
  const [pageSlug, setPageSlug] = useState(profile.page_slug || ''); // Changed from customDomain to pageSlug

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandingSuggestions, setBrandingSuggestions] = useState<{
    suggestedColors: string[];
    suggestedFonts: string[];
    extractionStatus: string | null;
    extractionError: string | null;
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedPalettes, setSuggestedPalettes] = useState<ColorPalette[]>([]);
  const [showPalettes, setShowPalettes] = useState(false);
  const [autoAppliedMessage, setAutoAppliedMessage] = useState<string | null>(null);

  // Load branding suggestions on component mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await getBrandingSuggestionsAction();
        setBrandingSuggestions(suggestions);
        
        let palettes: ColorPalette[] = [];
        
        if (suggestions?.suggestedColors && suggestions.suggestedColors.length > 0) {
          palettes = generateSuggestedPalettes(suggestions.suggestedColors);
          setShowSuggestions(true);
          setShowPalettes(true);

          // Auto-apply if branding was extracted and not yet manually set
          if (
            suggestions.extractionStatus === 'completed' &&
            profile.extracted_branding_data &&
            profile.brand_color === '#000000' // Check if current brand color is still the default
          ) {
            const bestPalette = getBestPaletteFromExtractedData(profile.extracted_branding_data);
            if (bestPalette) {
              await handleApplyPalette(bestPalette);
              setAutoAppliedMessage(`We've automatically applied branding from your website: ${bestPalette.name}`);
            }
          }
        } else {
          // Show preset palettes if no extracted colors
          palettes = COLOR_PALETTE_PRESETS;
          setShowPalettes(true);
        }
        
        // Add current branding as first palette if exists and is not the default
        if (brandColor !== '#000000') {
          const currentPalette = createPaletteFromBranding(brandColor, gradient, pattern);
          palettes.unshift(currentPalette);
        }
        
        setSuggestedPalettes(palettes);
      } catch (error) {
        console.error('Failed to load branding suggestions:', error);
        // Still show preset palettes on error
        setSuggestedPalettes(COLOR_PALETTE_PRESETS);
        setShowPalettes(true);
      }
    };

    loadSuggestions();
  }, [profile.extracted_branding_data, profile.brand_color, brandColor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update gradient colors if brand color changes
  useEffect(() => {
    setGradient(prev => generateAutoGradient(brandColor, prev.type));
  }, [brandColor]);

  const handleBrandColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setBrandColor(newColor);
  };

  const handleApplyPalette = async (palette: ColorPalette) => {
    setIsSubmitting(true); // Use isSubmitting for loading state
    try {
      await applyColorPaletteAction(palette);
      setBrandColor(palette.primary);
      setGradient(palette.gradient);
      setPattern(palette.pattern);
      // Optionally, update profile in parent state if needed
    } catch (error) {
      console.error('Failed to apply palette:', error);
      // Show a toast error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageConfigChange = (field: keyof typeof pageConfig) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setPageConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateCreatorProfileAction({
        page_slug: pageSlug || profile.id, // Use pageSlug, fallback to profile.id if empty
        brand_color: brandColor,
        brand_gradient: gradient as unknown as Json,
        brand_pattern: pattern as unknown as Json,
        onboarding_step: 4, // Advance to the next step (Product Import)
      });

      // Create the default white-labeled pages with the configured content
      await createDefaultWhiteLabeledPagesAction(pageConfig);
    } catch (error) {
      console.error('Failed to setup white-label page:', error);
      throw error; // Re-throw to propagate error to parent flow
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expose handleSubmit to the parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null); // Clean up on unmount
  }, [setSubmitFunction, pageSlug, brandColor, gradient, pattern, pageConfig, profile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const brandingStyles = getBrandingStyles({
    brandColor: brandColor,
    brandGradient: gradient,
    brandPattern: pattern,
  });

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

      {autoAppliedMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          <p className="font-medium mb-1">Heads up!</p>
          <p>{autoAppliedMessage}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Branding Settings */}
        <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-medium text-lg flex items-center gap-2 text-gray-900">
            <Palette className="h-5 w-5" />
            Brand Design
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="brandColor" className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Palette className="h-4 w-4" />
                  Primary Brand Color
                </label>
                <BrandColorTooltip />
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  id="brandColor"
                  type="color"
                  value={brandColor}
                  onChange={handleBrandColorChange}
                  className="w-16 h-10 border-gray-300 bg-white text-gray-900"
                />
                <Input
                  placeholder="#000000"
                  value={brandColor}
                  onChange={handleBrandColorChange}
                  className="flex-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Color Palette Suggestions */}
            {suggestedPalettes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Suggested Color Palettes</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPalettes(!showPalettes)}
                    className="text-xs text-gray-600 hover:bg-gray-100"
                  >
                    {showPalettes ? 'Hide' : 'Show'}
                  </Button>
                </div>
                
                {showPalettes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <ColorPaletteSelector
                      palettes={suggestedPalettes}
                      onApplyPalette={handleApplyPalette}
                      currentBrandColor={brandColor}
                      isLoading={isSubmitting}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Legacy Individual Color Suggestions - Show only if we have extracted colors but user prefers individual colors */}
            {brandingSuggestions && brandingSuggestions.suggestedColors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Individual Colors</span>
                  {brandingSuggestions.extractionStatus === 'processing' && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs text-gray-600 hover:bg-gray-100"
                  >
                    {showSuggestions ? 'Hide' : 'Show'}
                  </Button>
                </div>
                
                {showSuggestions && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    {brandingSuggestions.extractionStatus === 'completed' && brandingSuggestions.suggestedColors.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">
                          Colors extracted from your website:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {brandingSuggestions.suggestedColors.slice(0, 6).map((color, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setBrandColor(color);
                                setGradient(prev => generateAutoGradient(color, prev.type));
                              }}
                              className="w-8 h-8 rounded-md border-2 border-gray-200 shadow-sm hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={`Use ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {brandingSuggestions.extractionStatus === 'processing' && (
                      <p className="text-xs text-gray-600">
                        Analyzing your website for branding suggestions...
                      </p>
                    )}
                    
                    {brandingSuggestions.extractionStatus === 'failed' && (
                      <p className="text-xs text-red-600">
                        {brandingSuggestions.extractionError || 'Failed to analyze website'}
                      </p>
                    )}
                    
                    {brandingSuggestions.extractionStatus === 'completed' && brandingSuggestions.suggestedColors.length === 0 && (
                      <p className="text-xs text-gray-600">
                        No branding suggestions found from your website.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Gradient Selector */}
            <GradientSelector
              value={gradient}
              onChange={setGradient}
              primaryColor={brandColor}
            />

            {/* Pattern Selector */}
            <PatternSelector
              value={pattern}
              onChange={setPattern}
              primaryColor={brandColor}
              gradientCss={gradientToCss(gradient)}
            />
          </div>
        </div>

        {/* Page Configuration Settings */}
        <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-medium text-lg flex items-center gap-2 text-gray-900">
            <Globe className="h-5 w-5" />
            Storefront Content
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pageSlug" className="text-sm font-medium text-gray-700"> {/* Changed htmlFor */}
                Custom URL Slug (Optional)
              </label>
              <Input
                id="pageSlug" // Changed id
                placeholder="your-brand-name-slug"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-600">
                This will be used in your storefront URL: `{getURL()}/c/{pageSlug || profile.id}`. Please enter a simple, URL-friendly name (e.g., `my-shop`, `products`).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Title</label>
              <Input
                value={pageConfig.heroTitle}
                onChange={handlePageConfigChange('heroTitle')}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Subtitle</label>
              <Textarea
                value={pageConfig.heroSubtitle}
                onChange={handlePageConfigChange('heroSubtitle')}
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Call-to-Action Text</label>
              <Input
                value={pageConfig.ctaText}
                onChange={handlePageConfigChange('ctaText')}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={pageConfig.showTestimonials}
                  onChange={handlePageConfigChange('showTestimonials')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Testimonials Section</span>
              </label>
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={pageConfig.showPricing}
                  onChange={handlePageConfigChange('showPricing')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Pricing Section</span>
              </label>
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={pageConfig.showFaq}
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <h3 className="font-medium text-lg p-4 border-b border-gray-200 flex items-center gap-2 text-gray-900">
          <Eye className="h-5 w-5" />
          Live Preview of Your Storefront
        </h3>
        <div className="p-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-sm">
            <div className="text-gray-900 p-6 text-center" style={brandingStyles.gradientBackground}>
              <h1 className="text-2xl font-bold mb-2">{pageConfig.heroTitle}</h1>
              <p className="text-gray-700 mb-4">{pageConfig.heroSubtitle}</p>
              <div className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium">
                {pageConfig.ctaText}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {pageConfig.showPricing && (
                <div className="border rounded p-4 text-center border-gray-200" style={brandingStyles.brandBorder}>
                  <h3 className="font-medium text-gray-900 mb-2" style={brandingStyles.gradientText}>Pricing</h3>
                  <div className="text-2xl font-bold text-gray-900">$29</div>
                  <div className="text-sm text-gray-600">per month</div>
                </div>
              )}

              {pageConfig.showTestimonials && (
                <div className="border rounded p-4 border-gray-200" style={brandingStyles.brandBorder}>
                  <h3 className="font-medium text-gray-900 mb-2">What Our Customers Say</h3>
                  <p className="text-sm text-gray-600 italic">
                    "This product changed the way we do business..."
                  </p>
                  <p className="text-xs text-gray-500 mt-1">- Happy Customer</p>
                </div>
              )}

              {pageConfig.showFaq && (
                <div className="border rounded p-4 border-gray-200" style={brandingStyles.brandBorder}>
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
        </div>
        <div className="flex items-center justify-center gap-2 text-gray-600 pb-4">
          <Smartphone className="h-4 w-4" />
          <span className="text-sm">Responsive on all devices</span>
        </div>
      </div>

      {/* Removed internal navigation buttons */}
    </div>
  );
}