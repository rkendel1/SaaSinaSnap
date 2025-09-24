'use client';

import { useEffect, useState } from 'react';
import { Building, Globe, Lightbulb, Loader2, Palette, Upload } from 'lucide-react';

import { GradientSelector, PatternSelector } from '@/components/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { COLOR_PALETTE_PRESETS, createPaletteFromBranding, generateSuggestedPalettes, type ColorPalette } from '@/utils/color-palette-utils';
import { generateAutoGradient, gradientToCss, type GradientConfig, type PatternConfig } from '@/utils/gradient-utils';
import { validateBusinessName, validateWebsite } from '@/utils/validation';

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
      return profile.brand_gradient as unknown as GradientConfig;
    }
    return generateAutoGradient(formData.brandColor);
  });

  const [pattern, setPattern] = useState<PatternConfig>(() => {
    if (profile.brand_pattern) {
      return profile.brand_pattern as unknown as PatternConfig;
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

  // Load branding suggestions on component mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await getBrandingSuggestionsAction();
        setBrandingSuggestions(suggestions);
        
        // Generate suggested palettes from extracted colors
        let palettes: ColorPalette[] = [];
        
        if (suggestions?.suggestedColors.length > 0) {
          palettes = generateSuggestedPalettes(suggestions.suggestedColors);
          setShowSuggestions(true);
          setShowPalettes(true);
        } else {
          // Show preset palettes if no extracted colors
          palettes = COLOR_PALETTE_PRESETS;
          setShowPalettes(true);
        }
        
        // Add current branding as first palette if exists
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        brand_gradient: gradient,
        brand_pattern: pattern,
        onboarding_step: 2,
      });
      onNext();
    } catch (error) {
      console.error('Failed to update creator profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Tell us about your business</h2>
        <p className="text-muted-foreground">
          We&apos;ll use this information to create your personalized SaaS platform.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="businessName" className="text-sm font-medium">
            Business Name *
          </label>
          <Input
            id="businessName"
            placeholder="Enter your business name"
            value={formData.businessName}
            onChange={handleInputChange('businessName')}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="businessDescription" className="text-sm font-medium">
            Business Description
          </label>
          <textarea
            id="businessDescription"
            placeholder="Describe what your business does..."
            value={formData.businessDescription}
            onChange={handleInputChange('businessDescription')}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="businessWebsite" className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Business Website
          </label>
          <Input
            id="businessWebsite"
            placeholder="https://yourwebsite.com"
            type="url"
            value={formData.businessWebsite}
            onChange={handleInputChange('businessWebsite')}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label htmlFor="brandColor" className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Brand Color
            </label>
            <BrandColorTooltip />
          </div>
          <div className="flex gap-2 items-center">
            <Input
              id="brandColor"
              type="color"
              value={formData.brandColor}
              onChange={handleInputChange('brandColor')}
              className="w-16 h-10"
            />
            <Input
              placeholder="#000000"
              value={formData.brandColor}
              onChange={handleInputChange('brandColor')}
              className="flex-1"
            />
          </div>
        </div>

        {/* Color Palette Suggestions */}
        {suggestedPalettes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Suggested Color Palettes</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPalettes(!showPalettes)}
                className="text-xs"
              >
                {showPalettes ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showPalettes && (
              <div className="bg-muted/30 rounded-lg p-4">
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
              <span className="text-sm font-medium">Individual Colors</span>
              {brandingSuggestions.extractionStatus === 'processing' && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-xs"
              >
                {showSuggestions ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showSuggestions && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {brandingSuggestions.extractionStatus === 'completed' && brandingSuggestions.suggestedColors.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Colors extracted from your website:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brandingSuggestions.suggestedColors.slice(0, 6).map((color, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, brandColor: color }));
                            setGradient(prev => generateAutoGradient(color, prev.type));
                          }}
                          className="w-8 h-8 rounded-md border-2 border-white shadow-sm hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={`Use ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {brandingSuggestions.extractionStatus === 'processing' && (
                  <p className="text-xs text-muted-foreground">
                    Analyzing your website for branding suggestions...
                  </p>
                )}
                
                {brandingSuggestions.extractionStatus === 'failed' && (
                  <p className="text-xs text-red-600">
                    {brandingSuggestions.extractionError || 'Failed to analyze website'}
                  </p>
                )}
                
                {brandingSuggestions.extractionStatus === 'completed' && brandingSuggestions.suggestedColors.length === 0 && (
                  <p className="text-xs text-muted-foreground">
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
          <label className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Business Logo (Optional)
          </label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload your business logo
            </p>
            <Button variant="outline" size="sm" disabled>
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