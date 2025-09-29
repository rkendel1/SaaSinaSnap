'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CreatorProfile } from '@/features/creator-onboarding/types';
import { type CreatorBranding, getBrandingStyles } from '@/utils/branding-utils';

import { updateTemplateThemeAction } from '../actions/template-actions';
import { TEMPLATE_CONFIGS, TemplateTheme } from '../templates/types';

interface TemplateSelectorProps {
  creator: CreatorProfile;
  currentTheme?: TemplateTheme;
  onThemeSelect?: (theme: TemplateTheme) => void;
}

export function TemplateSelector({ creator, currentTheme = 'modern', onThemeSelect }: TemplateSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme>(currentTheme);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creator.brand_color || '#ea580c',
    brandGradient: creator.brand_gradient,
    brandPattern: creator.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);
  
  const handleThemeSelect = (theme: TemplateTheme) => {
    setSelectedTheme(theme);
    onThemeSelect?.(theme);
  };

  const handleApplyTemplate = () => {
    startTransition(async () => {
      try {
        await updateTemplateThemeAction(selectedTheme);
        toast({
          title: 'Template Updated',
          description: `Your site now uses the ${TEMPLATE_CONFIGS[selectedTheme].name} template.`,
        });
      } catch (error) {
        toast({
          title: 'Update Failed',
          description: 'Failed to update template. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handlePreviewTemplate = () => {
    // Open preview in new tab
    const previewUrl = `/c/${creator.page_slug}?preview=true&theme=${selectedTheme}`;
    window.open(previewUrl, '_blank');
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 
          className="text-2xl font-bold mb-2"
          style={brandingStyles.gradientText}
        >
          Choose Your Template
        </h2>
        <p className="text-gray-600">
          Select a template that matches your brand and business style
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {Object.values(TEMPLATE_CONFIGS).map((template) => (
          <div
            key={template.theme}
            className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedTheme === template.theme
                ? 'border-current shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={selectedTheme === template.theme ? { borderColor: branding.brandColor } : {}}
            onClick={() => handleThemeSelect(template.theme)}
          >
            {/* Selection indicator */}
            {selectedTheme === template.theme && (
              <div 
                className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                style={brandingStyles.accent}
              >
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
            
            {/* Template preview */}
            <div className="mb-4">
              <div 
                className="w-full h-32 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 mb-4 transition-all duration-300"
                style={selectedTheme === template.theme ? brandingStyles.subtleGradientBackground : {}}
              >
                <div className="text-sm font-medium">
                  {template.name} Preview
                </div>
              </div>
            </div>
            
            {/* Template info */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              
              {/* Features */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {template.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div 
                        className="w-1 h-1 rounded-full"
                        style={brandingStyles.accent}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          disabled={isPending}
          onClick={handlePreviewTemplate}
        >
          Preview Template
        </Button>
        <Button
          disabled={isPending || selectedTheme === currentTheme}
          onClick={handleApplyTemplate}
          style={brandingStyles.primaryButton}
        >
          {isPending ? 'Applying...' : 'Apply Template'}
        </Button>
      </div>
    </div>
  );
}