'use client';

import { useEffect, useState } from 'react';
import { Eye, Loader2,Sparkles, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { getBrandingStyles } from '@/utils/branding-utils';
import { generateAutoGradient } from '@/utils/gradient-utils';

import { generateAIPageContentAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import { saveWhiteLabeledPageContentAction } from '../../actions/white-labeled-page-actions'; // Import new action
import type { CreatorProfile } from '../../types';

interface AIGeneratedPagesStepProps {
  profile: CreatorProfile;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

export function AIGeneratedPagesStep({ profile, setSubmitFunction }: AIGeneratedPagesStepProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedPages, setGeneratedPages] = useState<Record<string, string>>({});
  const [iterativePrompt, setIterativePrompt] = useState('');
  const [isIterating, setIsIterating] = useState(false);

  const brandingStyles = getBrandingStyles({
    brandColor: profile.brand_color || '#3b82f6',
    brandGradient: profile.brand_gradient || generateAutoGradient(profile.brand_color || '#3b82f6'),
    brandPattern: profile.brand_pattern || { type: 'none', intensity: 0.1, angle: 0 },
  });

  const generateAndSavePagesContent = async (currentProfile: CreatorProfile, prompt?: string) => {
    setIsGenerating(true);
    try {
      const [homePageHtml, pricingPageHtml, accountPageHtml] = await Promise.all([
        generateAIPageContentAction(currentProfile, 'home', prompt),
        generateAIPageContentAction(currentProfile, 'pricing', prompt),
        generateAIPageContentAction(currentProfile, 'account', prompt),
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
          'landing', // Use 'landing' slug for the home page
          homePageHtml,
          // Extract page config from AI session if available, or use defaults
          {
            heroTitle: currentProfile.business_name ? `Welcome to ${currentProfile.business_name}` : 'Welcome to SaaSinaSnap',
            heroSubtitle: currentProfile.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency',
            ctaText: 'Get Started',
            showTestimonials: true,
            showPricing: true,
            showFaq: true,
          },
          `Home - ${currentProfile.business_name || 'SaaSinaSnap'}`, // Directly provide metaTitle
          currentProfile.business_description || 'Your amazing new storefront, crafted by AI.', // Directly provide metaDescription
        ),
        saveWhiteLabeledPageContentAction(
          currentProfile.id,
          'pricing',
          pricingPageHtml,
          // Extract page config from AI session if available, or use defaults
          {
            heroTitle: 'Choose Your Plan',
            heroSubtitle: 'Find the perfect plan that fits your needs and budget',
            ctaText: 'View All Plans',
            showTestimonials: true,
            showPricing: true,
            showFaq: true,
          },
          `Pricing - ${currentProfile.business_name || 'SaaSinaSnap'}`, // Directly provide metaTitle
          `View pricing plans for ${currentProfile.business_name || 'SaaSinaSnap'}`, // Directly provide metaDescription
        ),
        // Account page is dynamic, no need to save static HTML
      ]);

      if (!prompt) {
        toast({
          description: "We've generated your storefront pages based on your brand!",
        });
      } else {
        toast({
          description: "AI has updated your pages based on your request!",
        });
      }
    } catch (error) {
      console.error('Failed to generate or save pages content:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to generate or save pages. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateAndSavePagesContent(profile);
  }, [profile]); // Regenerate if profile changes

  const handleIterativeChange = async () => {
    if (!iterativePrompt.trim()) return;
    setIsIterating(true);
    await generateAndSavePagesContent(profile, iterativePrompt);
    setIterativePrompt('');
    setIsIterating(false);
  };

  const handleSubmit = async () => {
    // In this step, the pages are already saved by generateAndSavePagesContent
    // We just need to advance the onboarding step
    await updateCreatorProfileAction({
      onboarding_step: 6, // Advance to the next step
    });
  };

  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null);
  }, [handleSubmit, setSubmitFunction]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Wand2 className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">AI Generated Storefront</h2>
        <p className="text-gray-600">
          Here's a preview of your new storefront pages, generated by AI based on your website's branding and content. You can customize everything later.
        </p>
      </div>

      {isGenerating ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your pages...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <Tabs defaultValue="home">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="home" className="data-[state=active]:text-white">Home Page</TabsTrigger>
                <TabsTrigger value="pricing" className="data-[state=active]:text-white">Pricing Page</TabsTrigger>
                <TabsTrigger value="account" className="data-[state=active]:text-white">Account Portal</TabsTrigger>
              </TabsList>
              <TabsContent value="home" className="p-4">
                <iframe
                  srcDoc={generatedPages.home}
                  title="Home Page Preview"
                  className="w-full h-64 border rounded-md"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Allow scripts, popups, forms for interactive embeds
                />
              </TabsContent>
              <TabsContent value="pricing" className="p-4">
                <iframe
                  srcDoc={generatedPages.pricing}
                  title="Pricing Page Preview"
                  className="w-full h-64 border rounded-md"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </TabsContent>
              <TabsContent value="account" className="p-4">
                <iframe
                  srcDoc={generatedPages.account}
                  title="Account Portal Preview"
                  className="w-full h-64 border rounded-md"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Iterative Changes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Request Iterative Changes</h3>
            </div>
            <p className="text-sm text-blue-800">
              Tell our AI how you'd like to refine these pages. For example: "Make the hero section more vibrant" or "Change the font to something more modern."
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 'Make the pricing cards more prominent'"
                value={iterativePrompt}
                onChange={(e) => setIterativePrompt(e.target.value)}
                disabled={isIterating}
              />
              <Button onClick={handleIterativeChange} disabled={isIterating || !iterativePrompt.trim()}>
                {isIterating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}