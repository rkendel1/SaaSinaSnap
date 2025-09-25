'use server';

import { revalidatePath } from 'next/cache'; // Import revalidatePath
import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { AIEmbedCustomizerService } from '@/features/creator/services/ai-embed-customizer';
import { EnhancedEmbedGeneratorService, type EmbedGenerationOptions, type GeneratedEmbed } from '@/features/creator/services/enhanced-embed-generator';
import type { ColorPalette } from '@/utils/color-palette-utils';
import { getBrandingStyles } from '@/utils/branding-utils';
import { generateAutoGradient } from '@/utils/gradient-utils';

import { getBrandingSuggestions, getOrCreateCreatorProfile, updateCreatorProfile } from '../controllers/creator-profile';
import { generateStripeOAuthLink } from '../controllers/stripe-connect';
import { createWhiteLabeledPage } from '../controllers/white-labeled-pages';
import type { CreatorProfile, CreatorProfileUpdate } from '../types';

export async function updateCreatorProfileAction(profileData: CreatorProfileUpdate) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const updatedProfile = await updateCreatorProfile(user.id, profileData);

  // If onboarding is completed, revalidate relevant paths
  if (profileData.onboarding_completed === true) {
    revalidatePath(`/c/${updatedProfile.page_slug}`); // Use page_slug
    revalidatePath(`/c/${updatedProfile.page_slug}/pricing`); // Use page_slug
    revalidatePath('/creator/dashboard');
  }

  return updatedProfile;
}

export async function createStripeConnectAccountAction(): Promise<{ onboardingUrl: string }> {
  const user = await getAuthenticatedUser();

  if (!user?.id || !user.email) {
    throw new Error('Not authenticated');
  }

  try {
    // Generate the OAuth link for Standard accounts, specifying the 'creator' flow
    const onboardingUrl = await generateStripeOAuthLink(user.id, user.email, 'creator');

    // We don't update stripe_account_id here, it will be updated in the callback route
    // after the user completes the OAuth flow.

    return { onboardingUrl };
  } catch (error) {
    console.error('Error generating Stripe OAuth link:', error);
    throw new Error('Failed to generate Stripe Connect link');
  }
}

export async function completeOnboardingStepAction(step: number) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const nextStep = step + 1;
  // This action will only update the step.
  // The 'onboarding_completed' flag will be explicitly set by the ReviewStep
  // when the user chooses to launch their SaaS.
  return updateCreatorProfile(user.id, {
    onboarding_step: nextStep,
  });
}

export async function initializeCreatorOnboardingAction() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  // Get or create creator profile
  const profile = await getOrCreateCreatorProfile(user.id);

  if (profile.onboarding_completed) {
    redirect('/creator/dashboard');
  }

  return profile;
}

export async function getBrandingSuggestionsAction() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return getBrandingSuggestions(user.id);
}

export async function applyColorPaletteAction(palette: ColorPalette) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return updateCreatorProfile(user.id, {
    brand_color: palette.primary,
    brand_gradient: palette.gradient as any,
    brand_pattern: palette.pattern as any,
  });
}

export async function createDefaultWhiteLabeledPagesAction(pageConfig: {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  showTestimonials: boolean;
  showPricing: boolean;
  showFaq: boolean;
}) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorId = user.id;

  // Create landing page
  await createWhiteLabeledPage({
    creator_id: creatorId,
    page_slug: 'landing',
    page_title: 'Home',
    page_config: pageConfig as any,
    active: true,
  });

  // Create pricing page
  await createWhiteLabeledPage({
    creator_id: creatorId,
    page_slug: 'pricing',
    page_title: 'Pricing',
    page_config: pageConfig as any,
    active: true,
  });
}

export async function generateAIPageContentAction(
  creatorProfile: CreatorProfile,
  pageType: 'home' | 'pricing' | 'account',
  iterativePrompt?: string
): Promise<string> {
  // This action will use the AIEmbedCustomizerService to get AI suggestions
  // and then construct the HTML for the pages.

  const brandingStyles = getBrandingStyles({
    brandColor: creatorProfile.brand_color || '#3b82f6',
    brandGradient: creatorProfile.brand_gradient || generateAutoGradient(creatorProfile.brand_color || '#3b82f6'),
    brandPattern: creatorProfile.brand_pattern || { type: 'none', intensity: 0.1, angle: 0 },
  });

  const getFontFamily = () => {
    const extractedFont = creatorProfile.extracted_branding_data?.fonts?.primary;
    return extractedFont ? `'${extractedFont}', sans-serif` : 'sans-serif';
  };

  const fontFamily = getFontFamily();
  const businessName = creatorProfile.business_name || 'Your SaaS Business';
  const businessDescription = creatorProfile.business_description || 'Your amazing new storefront, crafted by AI.';
  const brandColor = brandingStyles.brandColor;
  const gradientBackground = brandingStyles.gradientBackground.backgroundImage;
  const gradientText = brandingStyles.gradientText.backgroundImage;

  // Initialize AI session or get current options
  let currentOptions: EmbedGenerationOptions = {
    embedType: 'hero_section', // Use a generic embed type for page content generation
    creator: creatorProfile,
    customization: {
      content: {
        title: `Welcome to ${businessName}`,
        description: businessDescription,
        ctaText: 'Get Started',
      },
      primaryColor: brandColor, // Moved directly under customization
      fontFamily: fontFamily,    // Moved directly under customization
    },
  };

  if (iterativePrompt) {
    // Simulate AI processing the iterative prompt
    // In a real scenario, you'd call AIEmbedCustomizerService.processMessage
    // to get updated options based on the prompt.
    // For now, we'll apply simple logic based on keywords.
    if (iterativePrompt.toLowerCase().includes('more professional')) {
      currentOptions.customization!.content!.title = `Elevate Your Business with ${businessName}`;
      currentOptions.customization!.content!.description = `Discover robust solutions designed for enterprise-level performance.`;
      currentOptions.customization!.content!.ctaText = 'Explore Solutions';
      currentOptions.customization!.voiceAndTone = { tone: 'professional', voice: 'formal' };
    } else if (iterativePrompt.toLowerCase().includes('more playful')) {
      currentOptions.customization!.content!.title = `Unleash Fun with ${businessName}!`;
      currentOptions.customization!.content!.description = `Dive into a world of exciting features and delightful experiences.`;
      currentOptions.customization!.content!.ctaText = 'Let\'s Play!';
      currentOptions.customization!.voiceAndTone = { tone: 'playful', voice: 'informal' };
    }
    // More complex AI integration would happen here
  }

  // Construct HTML based on pageType and currentOptions
  switch (pageType) {
    case 'home':
      return `
        <div style="font-family: ${fontFamily}; text-align: center; padding: 40px; background: ${gradientBackground}; color: white;">
          <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; background: ${gradientText}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${currentOptions.customization?.content?.title || `Welcome to ${businessName}`}</h1>
          <p style="font-size: 1.125rem; color: rgba(255,255,255,0.9);">${currentOptions.customization?.content?.description || businessDescription}</p>
          <button style="background-color: white; color: ${brandColor}; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; margin-top: 20px;">${currentOptions.customization?.content?.ctaText || 'Get Started'}</button>
        </div>
        <div style="font-family: ${fontFamily}; padding: 40px; text-align: center; background-color: #f9fafb;">
          <h2 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">Key Features</h2>
          <p style="color: #4b5563;">Discover what makes us great.</p>
        </div>
      `;
    case 'pricing':
      return `
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
      `;
    case 'account':
      return `
        <div style="font-family: ${fontFamily}; text-align: center; padding: 40px; background: ${gradientBackground}; color: white;">
          <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; background: ${gradientText}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Manage Your Account</h1>
          <p style="font-size: 1.125rem; color: rgba(255,255,255,0.9);">View your subscriptions and billing history.</p>
        </div>
        <div style="font-family: ${fontFamily}; padding: 40px; background-color: #f9fafb;">
          <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">Subscription Status</h2>
          <p style="color: #4b5563;">You are currently on the Basic Plan.</p>
        </div>
      `;
    default:
      return `<div>Page content not available for ${pageType}</div>`;
  }
}