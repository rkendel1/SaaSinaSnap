'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, Palette } from 'lucide-react';

import { GradientSelector, PatternSelector } from '@/components/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COLOR_PALETTE_PRESETS, createPaletteFromBranding, generateSuggestedPalettes, getBestPaletteFromExtractedData, type ColorPalette } from '@/utils/color-palette-utils';
import { generateAutoGradient, gradientToCss, type GradientConfig, type PatternConfig } from '@/utils/gradient-utils';
import { Json } from '@/libs/supabase/types';

import { applyColorPaletteAction, getBrandingSuggestionsAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';
import { ColorPaletteSelector } from '../ColorPaletteSelector';
import { BrandColorTooltip } from '../OnboardingTooltip';

interface BrandingStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function BrandingStep({ profile, onNext }: BrandingStepProps) {
  const [brandColor, setBrandColor] = useState(profile.brand_color || '#000000');

  // Initialize gradient and pattern from profile or create defaults
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

  const handleBrandColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setBrandColor(newColor);
    setGradient(prev => generateAutoGradient(newColor, prev.type));
  };

  const handleApplyPalette = async (palette: ColorPalette) => {
    try {
      // Apply palette to backend
      await applyColorPaletteAction(palette);
      
      // Update local state
      setBrandColor(palette.primary);
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
        brand_color: brandColor,
        brand_gradient: gradient as unknown as Json,
        brand_pattern: pattern as unknown as Json,
        onboarding_step: 3, // Advance to the next step (Stripe Connect)
      });
      onNext();
    } catch (error) {
      console.error('Failed to update creator branding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Palette className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Customize Your Brand</h2>
        <p className="text-gray-600">
          Set the colors, gradients, and patterns that will define your white-labeled storefront.
        </p>
      </div>

      {autoAppliedMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          <p className="font-medium mb-1">Heads up!</p>
          <p>{autoAppliedMessage}</p>
        </div>
      )}

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

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}