'use client';

import { useEffect, useState } from 'react';
import { Eye, Sparkles, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { getBrandingStyles } from '@/utils/branding-utils';
import { generateAutoGradient } from '@/utils/gradient-utils';

import { updateCreatorProfileAction } from '../../actions/onboarding-actions';
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

  const getFontFamily = () => {
    const extractedFont = profile.extracted_branding_data?.fonts?.primary;
    return extractedFont ? `'${extractedFont}', sans-serif` : 'sans-serif';
  };

  const generatePagesContent = async (currentProfile: CreatorProfile, prompt?: string) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, prompt ? 1500 : 2000)); // Simulate AI generation time, faster for iterative

    const businessName = currentProfile.business_name || 'Your SaaS Business';
    const businessDescription = currentProfile.business_description || 'Your amazing new storefront, crafted by AI.';
    const brandColor = brandingStyles.brandColor;
    const gradientBackground = brandingStyles.gradientBackground.backgroundImage;
    const gradientText = brandingStyles.gradientText.backgroundImage;
    const fontFamily = getFontFamily();

    // Simulate AI adjusting content based on prompt
    let heroTitle = `Welcome to ${businessName}`;
    let heroSubtitle = businessDescription;
    let ctaText = 'Get Started';

    if (prompt) {
      if (prompt.toLowerCase().includes('more professional')) {
        heroTitle = `Elevate Your Business with ${businessName}`;
        heroSubtitle = `Discover robust solutions designed for enterprise-level performance.`;
        ctaText = 'Explore Solutions';
      } else if (prompt.toLowerCase().includes('more playful')) {
        heroTitle = `Unleash Fun with ${businessName}!`;
        heroSubtitle = `Dive into a world of exciting features and delightful experiences.`;
        ctaText = 'Let\'s Play!';
      }
      // Add more AI logic here based on prompt
    }

    setGeneratedPages({
      home: `
        <div style="font-family: ${fontFamily}; text-align: center; padding: 40px; background: ${gradientBackground}; color: white;">
          <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; background: ${gradientText}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${heroTitle}</h1>
          <p style="font-size: 1.125rem; color: rgba(255,255,255,0.9);">${heroSubtitle}</p>
          <button style="background-color: white; color: ${brandColor}; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; margin-top: 20px;">${ctaText}</button>
        </div>
        <div style="font-family: ${fontFamily}; padding: 40px; text-align: center; background-color: #f9fafb;">
          <h2 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">Key Features</h2>
          <p style="color: #4b5563;">Discover what makes us great.</p>
        </div>
      `,
      pricing: `
        <div style="font-family: ${fontFamily}; text-align: center; padding: 40px; background: ${gradientBackground}; color: white;">
          <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; background: ${gradientText}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Our Plans</h1>
          <p style="font-size: 1.125rem; color: rgba(255,255,255,0.9);">Find the perfect plan for your needs.</p>
        </div>
        <div style="font-family: ${fontFamily}; padding: 40px; display: flex; justify-content: center; gap: 20px; background-color: #ffffff;">
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; width: 300px;">
            <h3 style="font-size: 1.5rem; font-weight: bold; color: #1f2937;">Basic</h3>
            <p style="font-size: 2rem; font-weight: bold; color: ${brandColor};">$19/month</p>
            <button style="background-color: ${brandColor}; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; margin-top: 20px;">Choose Plan</button>
          </div>
        </div>
      `,
      account: `
        <div style="font-family: ${fontFamily}; text-align: center; padding: 40px; background: ${gradientBackground}; color: white;">
          <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; background: ${gradientText}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Manage Your Account</h1>
          <p style="font-size: 1.125rem; color: rgba(255,255,255,0.9);">View your subscriptions and billing history.</p>
        </div>
        <div style="font-family: ${fontFamily}; padding: 40px; background-color: #f9fafb;">
          <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">Subscription Status</h2>
          <p style="color: #4b5563;">You are currently on the Basic Plan.</p>
        </div>
      `,
    });
    
    setIsGenerating(false);
    if (!prompt) { // Only show toast for initial generation
      toast({
        description: "We've generated your storefront pages based on your brand!",
      });
    }
  };

  useEffect(() => {
    generatePagesContent(profile);
  }, [profile]); // Regenerate if profile changes

  const handleIterativeChange = async () => {
    if (!iterativePrompt.trim()) return;
    setIsIterating(true);
    await generatePagesContent(profile, iterativePrompt);
    setIterativePrompt('');
    setIsIterating(false);
    toast({
      description: "AI has updated your pages based on your request!",
    });
  };

  const handleSubmit = async () => {
    // In a real implementation, you would save the generated page content
    // For now, we just advance the step
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
                <TabsTrigger value="home">Home Page</TabsTrigger>
                <TabsTrigger value="pricing">Pricing Page</TabsTrigger>
                <TabsTrigger value="account">Account Portal</TabsTrigger>
              </TabsList>
              <TabsContent value="home" className="p-4">
                <iframe
                  srcDoc={generatedPages.home}
                  title="Home Page Preview"
                  className="w-full h-64 border rounded-md"
                />
              </TabsContent>
              <TabsContent value="pricing" className="p-4">
                <iframe
                  srcDoc={generatedPages.pricing}
                  title="Pricing Page Preview"
                  className="w-full h-64 border rounded-md"
                />
              </TabsContent>
              <TabsContent value="account" className="p-4">
                <iframe
                  srcDoc={generatedPages.account}
                  title="Account Portal Preview"
                  className="w-full h-64 border rounded-md"
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