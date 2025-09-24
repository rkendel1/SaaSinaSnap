'use client';

import { useEffect, useState } from 'react';
import { Building, Globe, Lightbulb, Loader2, Palette, Upload } from 'lucide-react';

import { GradientSelector, PatternSelector } from '@/components/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { COLOR_PALETTE_PRESETS, createPaletteFromBranding, generateSuggestedPalettes, getBestPaletteFromExtractedData, type ColorPalette } from '@/utils/color-palette-utils';
import { generateAutoGradient, gradientToCss, type GradientConfig, type PatternConfig } from '@/utils/gradient-utils';
import { validateBusinessName, validateWebsite } from '@/utils/validation';
import { Json } from '@/libs/supabase/types';

import { applyColorPaletteAction, getBrandingSuggestionsAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';
import { ColorPaletteSelector } from '../ColorPaletteSelector';
import { BrandColorTooltip, BusinessNameTooltip } from '../OnboardingTooltip';

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
    brandColor: profile.brand_color || '#000000',
  });

  // Initialize gradient and pattern from profile or create defaults
  const [gradient, setGradient] = useState<GradientConfig>(() => {
    if (profile.brand_gradient) {
      return profile.brand_gradient;
    }
    return generateAutoGradient(formData.brandColor);
  });

  const [pattern, setPattern] = useState<PatternConfig>(() => {
    if (profile.brand_pattern) {
      return profile.brand_pattern;
    }
    return { type: 'none', intensity: 0.1, angle: 0 };
  });

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


  // Form validation states
  const [isBusinessNameValid, setIsBusinessNameValid] = useState(false);
  const [isWebsiteValid, setIsWebsiteValid] = useState(true); // Optional, so start as valid

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
        if (formData.brandColor !== '#000000') {
          const currentPalette = createPaletteFromBranding(formData.brandColor, gradient, pattern);
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
  }, [profile.extracted_branding_data, profile.brand_color]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setFormData(prev => ({ ...prev, [field]: newValue }));
    
    // If brand color changes, update gradient colors automatically
    if (field === 'brandColor') {
      setGradient(prev => generateAutoGradient(newValue, prev.type));
    }
  };

  const handleApplyPalette = async (palette: ColorPalette) => {
    try {
      // Apply palette to backend
      await applyColorPaletteAction(palette);
      
      // Update local state
      setFormData(prev => ({ ...prev, brandColor: palette.primary }));
      setGradient(palette.gradient);
      setPattern(palette.pattern);
      
      // Update suggested palettes to reflect current selection
      const currentPalette = createPaletteFromBranding(palette.primary, palette.gradient, palette.pattern);
      setSuggestedPalettes(prev => {
        const filtered = prev.filter(p => p.name !== 'Current Brand');
        return [currentPalette, ...filtered];
      });
    } catch (error) {
      console.error('Failed to apply palette:', error);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateCreatorProfileAction({
        business_name: formData.businessName,
        business_description: formData.businessDescription,
        business_website: formData.businessWebsite,
        brand_color: formData.brandColor,
        brand_gradient: gradient as unknown as Json,
        brand_pattern: pattern as unknown as Json,
        onboarding_step: 2,
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
        {/* Adjusted text color */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Tell us about your business</h2>
        {/* Adjusted text color */}
        <p className="text-gray-600">
          We&apos;ll use this information to create your personalized SaaS platform.
        </p>
      </div>

      {autoAppliedMessage && (
        /* Adjusted for light theme */
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          <p className="font-medium mb-1">Heads up!</p>
          <p>{autoAppliedMessage}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          {/* Adjusted text color */}
          <label htmlFor="businessName" className="text-sm font-medium text-gray-700">
            Business Name *
          </label>
          {/* Adjusted for light theme */}
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
          {/* Adjusted text color */}
          <label htmlFor="businessDescription" className="text-sm font-medium text-gray-700">
            Business Description
          </label>
          {/* Adjusted for light theme */}
          <textarea
            id="businessDescription"
            placeholder="Describe what your business does..."
            value={formData.businessDescription}
            onChange={handleInputChange('businessDescription')}
            className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
          />
        </div>

        <div className="space-y-2">
          {/* Adjusted text color */}
          <label htmlFor="businessWebsite" className="text-sm font-medium flex items-center gap-2 text-gray-700">
            <Globe className="h-4 w-4" />
            Business Website
          </label>
          {/* Adjusted for light theme */}
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

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* Adjusted text color */}
            <label htmlFor="brandColor" className="text-sm font-medium flex items-center gap-2 text-gray-700">
              <Palette className="h-4 w-4" />
              Brand Color
            </label>
            <BrandColorTooltip />
          </div>
          <div className="flex gap-2 items-center">
            {/* Adjusted for light theme */}
            <Input
              id="brandColor"
              type="color"
              value={formData.brandColor}
              onChange={handleInputChange('brandColor')}
              className="w-16 h-10 border-gray-300 bg-white text-gray-900"
            />
            {/* Adjusted for light theme */}
            <Input
              placeholder="#000000"
              value={formData.brandColor}
              onChange={handleInputChange('brandColor')}
              className="flex-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Color Palette Suggestions */}
        {suggestedPalettes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {/* Adjusted text color */}
              <span className="text-sm font-medium text-gray-700">Suggested Color Palettes</span>
              {/* Adjusted for light theme */}
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
              /* Adjusted for light theme */
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <ColorPaletteSelector
                  palettes={suggestedPalettes}
                  onApplyPalette={handleApplyPalette}
                  currentBrandColor={formData.brandColor}
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
              {/* Adjusted text color */}
              <span className="text-sm font-medium text-gray-700">Individual Colors</span>
              {brandingSuggestions.extractionStatus === 'processing' && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              )}
              {/* Adjusted text color */}
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
              /* Adjusted for light theme */
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                {brandingSuggestions.extractionStatus === 'completed' && brandingSuggestions.suggestedColors.length > 0 && (
                  <div>
                    {/* Adjusted text color */}
                    <p className="text-xs text-gray-600 mb-2">
                      Colors extracted from your website:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brandingSuggestions.suggestedColors.slice(0, 6).map((color, index) => (
                        /* Adjusted border color */
                        <button
                          key={index}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, brandColor: color }));
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
                  /* Adjusted text color */
                  <p className="text-xs text-gray-600">
                    Analyzing your website for branding suggestions...
                  </p>
                )}
                
                {brandingSuggestions.extractionStatus === 'failed' && (
                  /* Adjusted text color */
                  <p className="text-xs text-red-600">
                    {brandingSuggestions.extractionError || 'Failed to analyze website'}
                  </p>
                )}
                
                {brandingSuggestions.extractionStatus === 'completed' && brandingSuggestions.suggestedColors.length === 0 && (
                  /* Adjusted text color */
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
          primaryColor={formData.brandColor}
        />

        {/* Pattern Selector */}
        <PatternSelector
          value={pattern}
          onChange={setPattern}
          primaryColor={formData.brandColor}
          gradientCss={gradientToCss(gradient)}
        />

        <div className="space-y-2">
          {/* Adjusted text color */}
          <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
            <Upload className="h-4 w-4" />
            Business Logo (Optional)
          </label>
          {/* Adjusted for light theme */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            {/* Adjusted text color */}
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-500" />
            {/* Adjusted text color */}
            <p className="text-sm text-gray-600 mb-2">
              Upload your business logo
            </p>
            {/* Adjusted for light theme */}
            <Button variant="outline" size="sm" disabled className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Choose File (Coming Soon)
            </Button>
          </div>
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