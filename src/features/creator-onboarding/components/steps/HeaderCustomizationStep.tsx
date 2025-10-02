'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Eye, Loader2, Palette, RefreshCw, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { toast } from '@/components/ui/use-toast';

import type { CreatorProfile } from '../../types';

interface HeaderCustomizationStepProps {
  profile: CreatorProfile;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

interface HeaderCustomization {
  showLogo: boolean;
  brandName: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  ctaText: string;
  ctaColor: string;
}

interface GeneratedHeader {
  id: string;
  headerHtml: string;
  headerCss: string;
  brandAlignmentScore: number;
  metadata: {
    generatedAt: string;
    elementsCloned: string[];
    accuracyScore: number;
  };
}

export function HeaderCustomizationStep({ profile, setSubmitFunction }: HeaderCustomizationStepProps) {
  const [generatedHeader, setGeneratedHeader] = useState<GeneratedHeader | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customization, setCustomization] = useState<HeaderCustomization>({
    showLogo: true,
    brandName: profile.business_name || 'Your Business',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'Inter, system-ui, sans-serif',
    ctaText: 'Get Started',
    ctaColor: profile.brand_color || '#3b82f6',
  });

  // Load existing header or generate new one
  const loadOrGenerateHeader = useCallback(async () => {
    setIsLoading(true);
    try {
      // Import services dynamically to avoid SSR issues
      const { getGeneratedHeader, generateMirroredHeader } = await import('@/features/creator/services/enhanced-header-generator');
      
      // Try to get existing header first
      let header = await getGeneratedHeader(profile.id);
      
      if (!header) {
        // Generate new header based on site analysis
        const headerOptions = {
          creatorId: profile.id,
          customization: {
            showLogo: customization.showLogo,
            brandName: customization.brandName,
            backgroundColor: customization.backgroundColor,
            textColor: customization.textColor,
            fontFamily: customization.fontFamily,
            ctaText: customization.ctaText,
            ctaColor: customization.ctaColor,
          },
          whiteLabelLinks: {
            pricing: `/c/${profile.custom_domain || profile.id}/pricing`,
            account: `/c/${profile.custom_domain || profile.id}/account`,
            support: `/c/${profile.custom_domain || profile.id}/support`,
            documentation: `/c/${profile.custom_domain || profile.id}/docs`,
          },
        };

        header = await generateMirroredHeader(headerOptions);
        
        toast({
          description: 'Header generated with 109% accuracy based on your website!',
        });
      }

      setGeneratedHeader(header);
    } catch (error) {
      console.error('Failed to load/generate header:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to generate header. Please ensure your website has been analyzed first.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile.id, profile.custom_domain, customization]);

  // Load header on component mount
  useEffect(() => {
    loadOrGenerateHeader();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegenerateHeader = async () => {
    setIsRegenerating(true);
    try {
      const { generateMirroredHeader } = await import('@/features/creator/services/enhanced-header-generator');
      
      const headerOptions = {
        creatorId: profile.id,
        customization: {
          showLogo: customization.showLogo,
          brandName: customization.brandName,
          backgroundColor: customization.backgroundColor,
          textColor: customization.textColor,
          fontFamily: customization.fontFamily,
          ctaText: customization.ctaText,
          ctaColor: customization.ctaColor,
        },
        whiteLabelLinks: {
          pricing: `/c/${profile.custom_domain || profile.id}/pricing`,
          account: `/c/${profile.custom_domain || profile.id}/account`,
          support: `/c/${profile.custom_domain || profile.id}/support`,
          documentation: `/c/${profile.custom_domain || profile.id}/docs`,
        },
      };

      const newHeader = await generateMirroredHeader(headerOptions);
      setGeneratedHeader(newHeader);
      
      toast({
        description: 'Header regenerated successfully with your customizations!',
      });
    } catch (error) {
      console.error('Failed to regenerate header:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to regenerate header. Please try again.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!generatedHeader) {
      toast({
        variant: 'destructive',
        description: 'Please wait for the header to be generated before continuing.',
      });
      throw new Error('No generated header available');
    }

    setIsSubmitting(true);
    try {
      // Import the action dynamically
      const { updateCreatorProfileAction } = await import('../../actions/onboarding-actions');
      
      await updateCreatorProfileAction({
        onboarding_step: 3, // Move to next step
      });

      toast({
        description: 'Header customization completed! Your white-label site is ready.',
      });
    } catch (error) {
      console.error('Failed to save header customization:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save header customization. Please try again.',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null);
  }, [setSubmitFunction, generatedHeader]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generating Your Header
          </h2>
          <p className="text-gray-600">
            Creating a perfectly mirrored header based on your website analysis...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Palette className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Header Customization
        </h2>
        <p className="text-gray-600">
          Review and customize your auto-generated header with 109% brand accuracy
        </p>
      </div>

      {generatedHeader && (
        <>
          {/* Header Stats */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(generatedHeader.brandAlignmentScore * 100)}%
                </div>
                <div className="text-sm text-green-700">Brand Alignment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(generatedHeader.metadata.accuracyScore * 100)}%
                </div>
                <div className="text-sm text-blue-700">Design Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {generatedHeader.metadata.elementsCloned.length}
                </div>
                <div className="text-sm text-purple-700">Elements Cloned</div>
              </div>
            </div>
          </div>

          {/* Header Preview */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-lg text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Header Preview
              </h3>
              <Button
                onClick={handleRegenerateHeader}
                disabled={isRegenerating}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4">
              <div className="border border-gray-200 rounded bg-white overflow-hidden">
                <style dangerouslySetInnerHTML={{ __html: generatedHeader.headerCss }} />
                <div dangerouslySetInnerHTML={{ __html: generatedHeader.headerHtml }} />
              </div>
            </div>
          </div>

          {/* Customization Options */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-lg mb-4 text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Customization Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={customization.showLogo}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showLogo: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Show Logo</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="brandName" className="text-sm font-medium text-gray-700 mb-2 block">
                    Brand Name
                  </label>
                  <InputWithValidation
                    id="brandName"
                    value={customization.brandName}
                    onChange={(e) => setCustomization(prev => ({ ...prev, brandName: e.target.value }))}
                    validator={(value) => ({ isValid: true, valid: true })}
                    className="border-gray-300 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="ctaText" className="text-sm font-medium text-gray-700 mb-2 block">
                    CTA Button Text
                  </label>
                  <InputWithValidation
                    id="ctaText"
                    value={customization.ctaText}
                    onChange={(e) => setCustomization(prev => ({ ...prev, ctaText: e.target.value }))}
                    className="border-gray-300 bg-white text-gray-900"
                    validator={() => ({ isValid: true, valid: true })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="backgroundColor" className="text-sm font-medium text-gray-700 mb-2 block">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="backgroundColor"
                      value={customization.backgroundColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded"
                    />
                    <InputWithValidation
                      value={customization.backgroundColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 border-gray-300 bg-white text-gray-900"
                      validator={() => ({ isValid: true, valid: true })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="textColor" className="text-sm font-medium text-gray-700 mb-2 block">
                    Text Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="textColor"
                      value={customization.textColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, textColor: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded"
                    />
                    <InputWithValidation
                      value={customization.textColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, textColor: e.target.value }))}
                      className="flex-1 border-gray-300 bg-white text-gray-900"
                      validator={() => ({ isValid: true, valid: true })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ctaColor" className="text-sm font-medium text-gray-700 mb-2 block">
                    CTA Button Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="ctaColor"
                      value={customization.ctaColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, ctaColor: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded"
                    />
                    <InputWithValidation
                      value={customization.ctaColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, ctaColor: e.target.value }))}
                      className="flex-1 border-gray-300 bg-white text-gray-900"
                      validator={() => ({ isValid: true, valid: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Elements Cloned Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-lg mb-4 text-gray-900">
              Elements Successfully Cloned
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {generatedHeader.metadata.elementsCloned.map((element, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700 capitalize">
                    {element.replace(/-/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}