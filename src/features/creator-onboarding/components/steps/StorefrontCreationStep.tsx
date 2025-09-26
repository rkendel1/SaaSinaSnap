'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Eye, Layout, Loader2, Palette, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

import { generateAIPageContentAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import { saveWhiteLabeledPageContentAction } from '../../actions/white-labeled-page-actions';
import type { BusinessTypeOption, CreatorProfile } from '../../types';

interface StorefrontCreationStepProps {
  profile: CreatorProfile;
  businessType: BusinessTypeOption | null;
  selectedFeatures: string[];
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

interface GeneratedPages {
  home: string;
  pricing: string;
  account: string;
}

export function StorefrontCreationStep({ 
  profile, 
  businessType, 
  selectedFeatures, 
  setSubmitFunction 
}: StorefrontCreationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPages | null>(null);
  const [customizationPrompt, setCustomizationPrompt] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  // White-label customization state
  const [primaryColor, setPrimaryColor] = useState(profile.brand_color || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af'); // Secondary color not in schema yet
  const [fontStyle, setFontStyle] = useState('Inter'); // Font family not in schema yet
  const [businessName, setBusinessName] = useState(profile.business_name || '');
  const [tagline, setTagline] = useState(profile.business_description || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateAndSavePagesContent = async (currentProfile: CreatorProfile, prompt?: string) => {
    setIsGenerating(true);
    try {
      // Use AI to generate pages based on business type and extracted branding
      const businessInfo = `Business: ${currentProfile.business_name || 'SaaSinaSnap'}, Type: ${businessType?.title || 'SaaS'}, Website: ${currentProfile.business_website || ''}`;
      const brandInfo = currentProfile.extracted_branding_data ? 
        `Brand Colors: ${currentProfile.extracted_branding_data.primaryColors?.join(', ')}, Fonts: ${currentProfile.extracted_branding_data.fonts?.primary}` : 
        'Default branding';
      
      const fullPrompt = prompt || `Create professional pages for ${businessInfo}. ${brandInfo}. Focus on ${selectedFeatures.join(', ')}.`;

      // Generate pages using AI
      const [homePageHtml, pricingPageHtml, accountPageHtml] = await Promise.all([
        generateAIPageContentAction(currentProfile, 'home', fullPrompt),
        generateAIPageContentAction(currentProfile, 'pricing', fullPrompt),
        generateAIPageContentAction(currentProfile, 'account', fullPrompt),
      ]);

      setGeneratedPages({
        home: homePageHtml,
        pricing: pricingPageHtml,
        account: accountPageHtml,
      });
      
      // Save the generated pages to the database
      await Promise.all([
        saveWhiteLabeledPageContentAction(
          currentProfile.id,
          'landing',
          homePageHtml,
          {
            heroTitle: currentProfile.business_name ? `Welcome to ${currentProfile.business_name}` : 'Welcome to SaaSinaSnap',
            heroSubtitle: currentProfile.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency',
            primaryColor: primaryColor,
            secondaryColor: secondaryColor,
            fontFamily: fontStyle,
          }
        ),
        saveWhiteLabeledPageContentAction(
          currentProfile.id,
          'pricing',
          pricingPageHtml,
          {
            metaTitle: `Pricing - ${currentProfile.business_name || 'SaaSinaSnap'}`,
            metaDescription: `View pricing plans for ${currentProfile.business_name || 'SaaSinaSnap'}`,
            primaryColor: primaryColor,
            secondaryColor: secondaryColor,
            fontFamily: fontStyle,
          }
        ),
      ]);

      if (!prompt) {
        toast({
          description: "AI has generated your storefront pages based on your brand analysis!",
        });
      } else {
        toast({
          description: "AI has updated your pages based on your customization request!",
        });
      }
    } catch (error) {
      console.error('Failed to generate or save pages content:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to generate storefront pages. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomizeWithAI = async () => {
    if (!customizationPrompt.trim()) {
      toast({
        variant: 'destructive',
        description: 'Please enter a customization request.',
      });
      return;
    }

    setIsCustomizing(true);
    try {
      await generateAndSavePagesContent(profile, customizationPrompt);
      setCustomizationPrompt('');
    } catch (error) {
      console.error('Failed to customize pages:', error);
    } finally {
      setIsCustomizing(false);
    }
  };

  const handleStyleUpdate = async () => {
    try {
      await updateCreatorProfileAction({
        brand_color: primaryColor,
        business_name: businessName,
        business_description: tagline,
      });

      // Regenerate pages with new styling
      await generateAndSavePagesContent(profile);
      
      toast({
        description: "Storefront styling updated successfully!",
      });
    } catch (error) {
      console.error('Failed to update styling:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to update styling. Please try again.',
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!generatedPages) {
      toast({
        variant: 'destructive',
        description: 'Please generate your storefront pages first.',
      });
      throw new Error('Pages not generated');
    }

    setIsSubmitting(true);
    try {
      await updateCreatorProfileAction({
        brand_color: primaryColor,
        business_name: businessName,
        business_description: tagline,
        onboarding_step: 4, // Advance to Integration Setup
      });
    } catch (error) {
      console.error('Failed to save storefront creation:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save your storefront setup. Please try again.',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [generatedPages, primaryColor, secondaryColor, fontStyle, businessName, tagline]);

  // Auto-generate pages on component mount if not already done
  useEffect(() => {
    if (!generatedPages && profile.business_name && !isGenerating) {
      generateAndSavePagesContent(profile);
    }
  }, [profile.business_name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set submit function for parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
  }, [handleSubmit, setSubmitFunction]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Storefront Creation</h2>
        <p className="text-gray-600">
          AI will create your storefront pages and you can customize the design to match your brand.
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="generate">AI Generation</TabsTrigger>
          <TabsTrigger value="customize">Design & Style</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* AI Page Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI-Generated Pages</h3>
                <p className="text-sm text-gray-600">
                  Create professional pages automatically using your brand information
                </p>
              </div>
            </div>

            {!generatedPages ? (
              <div className="text-center space-y-4">
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      <p className="text-sm text-gray-600">
                        AI is generating your storefront pages based on your brand analysis...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Sparkles className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">
                        Ready to generate your storefront pages
                      </p>
                      <Button 
                        onClick={() => generateAndSavePagesContent(profile)}
                        className="mx-auto"
                      >
                        Generate Pages with AI
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Pages generated successfully! Home, Pricing, and Account pages are ready.
                  </span>
                </div>

                {/* AI Customization */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-blue-900">AI Customization</h4>
                  <p className="text-sm text-blue-800">
                    Want to adjust your pages? Describe what you&apos;d like to change:
                  </p>
                  <Textarea
                    placeholder="e.g., Make it more professional, add testimonials, change the color scheme..."
                    value={customizationPrompt}
                    onChange={(e) => setCustomizationPrompt(e.target.value)}
                    className="bg-white"
                  />
                  <Button
                    onClick={handleCustomizeWithAI}
                    disabled={isCustomizing || !customizationPrompt.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {isCustomizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Customizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Customize with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Design & Style Customization Tab */}
        <TabsContent value="customize" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Palette className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Brand Customization</h3>
                <p className="text-sm text-gray-600">
                  Customize colors, fonts, and content to match your brand
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Brand Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Your business tagline or description"
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Visual Styling */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Visual Styling</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Style
                  </label>
                  <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="Inter">Inter (Modern)</option>
                    <option value="Roboto">Roboto (Clean)</option>
                    <option value="Open Sans">Open Sans (Friendly)</option>
                    <option value="Poppins">Poppins (Playful)</option>
                    <option value="Lato">Lato (Professional)</option>
                  </select>
                </div>
              </div>
            </div>

            <Button onClick={handleStyleUpdate} className="w-full">
              <Layout className="mr-2 h-4 w-4" />
              Apply Style Changes
            </Button>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Page Preview</h3>
                <p className="text-sm text-gray-600">
                  Preview your generated storefront pages
                </p>
              </div>
            </div>

            {generatedPages ? (
              <Tabs defaultValue="home" className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-4">
                  <TabsTrigger value="home">Home Page</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing Page</TabsTrigger>
                  <TabsTrigger value="account">Account Portal</TabsTrigger>
                </TabsList>
                
                <TabsContent value="home">
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={generatedPages.home}
                      title="Home Page Preview"
                      className="w-full h-96 border-0"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="pricing">
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={generatedPages.pricing}
                      title="Pricing Page Preview"
                      className="w-full h-96 border-0"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="account">
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={generatedPages.account}
                      title="Account Portal Preview"
                      className="w-full h-96 border-0"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Generate your pages first to see the preview</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}