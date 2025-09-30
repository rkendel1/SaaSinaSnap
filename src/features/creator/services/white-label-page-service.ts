import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/get-platform-settings';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { generateCleanSlug } from '@/utils/slug-utils';

import type { CreatorProfile } from '../types';

export interface DefaultPageConfig {
  pageSlug: string;
  pageTitle: string;
  pageDescription: string;
  metaTitle: string;
  metaDescription: string;
  pageConfig: any;
}

/**
 * Generate default white-label pages for a creator
 */
export async function createDefaultWhiteLabelPages(creatorId: string, creatorProfile: CreatorProfile): Promise<void> {
  const supabase = await createSupabaseAdminClient();
  
  const businessName = creatorProfile.business_name || 'Creator';
  const businessDescription = creatorProfile.business_description || 'Innovative SaaS solutions';
  
  // Generate base slug from business info
  const baseSlug = creatorProfile.business_website 
    ? generateCleanSlug(creatorProfile.business_website)
    : generateCleanSlug(businessName);

  // Fetch platform settings for default page configuration
  let defaultPageConfig: any = {
    heroTitle: 'Welcome to SaaSinaSnap',
    heroSubtitle: 'SaaS in a Snap - Launch your business with ease',
    ctaText: 'Get Started',
    showTestimonials: true,
    showPricing: true,
    showFaq: true,
  };

  try {
    const platformSettings = await getPlatformSettings();
    if (platformSettings?.default_white_labeled_page_config) {
      defaultPageConfig = {
        ...defaultPageConfig,
        ...(platformSettings.default_white_labeled_page_config as any),
      };
    }
  } catch (error) {
    console.warn('Could not retrieve platform settings for default white-label pages:', error);
  }

  const defaultPages: DefaultPageConfig[] = [
    {
      pageSlug: 'landing',
      pageTitle: `${businessName} - Home`,
      pageDescription: businessDescription,
      metaTitle: `${businessName} | Innovative SaaS Solutions`,
      metaDescription: `${businessDescription}. Get started with ${businessName} today and transform your business.`,
      pageConfig: {
        heroTitle: defaultPageConfig.heroTitle?.replace('SaaSinaSnap', businessName) || `Welcome to ${businessName}`,
        heroSubtitle: defaultPageConfig.heroSubtitle?.replace('SaaSinaSnap', businessName) || businessDescription,
        ctaText: defaultPageConfig.ctaText || 'Get Started',
        showTestimonials: defaultPageConfig.showTestimonials ?? true,
        showPricing: defaultPageConfig.showPricing ?? true,
        showFaq: defaultPageConfig.showFaq ?? true,
        primaryColor: creatorProfile.brand_color || '#6366f1',
        layout: 'modern',
        sections: ['hero', 'features', 'testimonials', 'pricing', 'cta'],
      },
    },
    {
      pageSlug: 'pricing',
      pageTitle: `${businessName} - Pricing`,
      pageDescription: `View pricing plans and choose the best option for your needs with ${businessName}.`,
      metaTitle: `${businessName} Pricing | Flexible Plans for Every Business`,
      metaDescription: `Transparent pricing for ${businessName}. Choose from our flexible plans designed to grow with your business. Start free today.`,
      pageConfig: {
        heroTitle: 'Simple, Transparent Pricing',
        heroSubtitle: 'Choose the plan that fits your needs',
        ctaText: defaultPageConfig.ctaText || 'Start Free Trial',
        showTestimonials: defaultPageConfig.showTestimonials ?? false,
        showPricing: defaultPageConfig.showPricing ?? true,
        showFaq: defaultPageConfig.showFaq ?? true,
        primaryColor: creatorProfile.brand_color || '#6366f1',
        layout: 'pricing-focused',
        sections: ['hero', 'pricing', 'faq', 'cta'],
      },
    },
    {
      pageSlug: 'testimonials',
      pageTitle: `${businessName} - Customer Reviews`,
      pageDescription: `Read what our customers say about ${businessName} and see how we've helped businesses succeed.`,
      metaTitle: `${businessName} Reviews | What Our Customers Say`,
      metaDescription: `Real customer testimonials and success stories from ${businessName} users. See how we've helped businesses like yours succeed.`,
      pageConfig: {
        heroTitle: 'Trusted by Thousands',
        heroSubtitle: 'See what our customers say about us',
        ctaText: defaultPageConfig.ctaText || 'Join Our Community',
        showTestimonials: defaultPageConfig.showTestimonials ?? true,
        showPricing: defaultPageConfig.showPricing ?? false,
        showFaq: defaultPageConfig.showFaq ?? false,
        primaryColor: creatorProfile.brand_color || '#6366f1',
        layout: 'testimonial-focused',
        sections: ['hero', 'testimonials', 'stats', 'cta'],
        testimonials: [
          {
            name: 'Sarah Johnson',
            role: 'Product Manager',
            company: 'TechCorp',
            content: `${businessName} has transformed how we deliver our products. The experience is seamless and our customers love it!`,
            rating: 5,
          },
          {
            name: 'Mike Chen',
            role: 'Startup Founder',
            company: 'InnovateLab',
            content: `The white-labeled experience is exactly what we needed. Our brand stays consistent throughout the entire customer journey.`,
            rating: 5,
          },
          {
            name: 'Emily Rodriguez',
            role: 'Marketing Director',
            company: 'GrowthTech',
            content: `Implementation was smooth and the results exceeded our expectations. Highly recommend ${businessName}!`,
            rating: 5,
          },
        ],
      },
    },
    {
      pageSlug: 'about',
      pageTitle: `${businessName} - About Us`,
      pageDescription: `Learn more about ${businessName}, our mission, and how we're revolutionizing the SaaS industry.`,
      metaTitle: `About ${businessName} | Our Story and Mission`,
      metaDescription: `Discover the story behind ${businessName}. Learn about our mission to help businesses succeed with innovative SaaS solutions.`,
      pageConfig: {
        heroTitle: `About ${businessName}`,
        heroSubtitle: 'Building the future of SaaS, one solution at a time',
        ctaText: defaultPageConfig.ctaText || 'Get In Touch',
        showTestimonials: defaultPageConfig.showTestimonials ?? false,
        showPricing: defaultPageConfig.showPricing ?? false,
        showFaq: defaultPageConfig.showFaq ?? false,
        primaryColor: creatorProfile.brand_color || '#6366f1',
        layout: 'story-focused',
        sections: ['hero', 'story', 'team', 'values', 'cta'],
      },
    },
    {
      pageSlug: 'contact',
      pageTitle: `${businessName} - Contact Us`,
      pageDescription: `Get in touch with ${businessName}. We're here to help you succeed with our SaaS solutions.`,
      metaTitle: `Contact ${businessName} | Get Support and Sales Help`,
      metaDescription: `Contact ${businessName} for support, sales, or partnership opportunities. We're here to help you succeed.`,
      pageConfig: {
        heroTitle: 'Get In Touch',
        heroSubtitle: "We're here to help you succeed",
        ctaText: defaultPageConfig.ctaText || 'Send Message',
        showTestimonials: defaultPageConfig.showTestimonials ?? false,
        showPricing: defaultPageConfig.showPricing ?? false,
        showFaq: defaultPageConfig.showFaq ?? true,
        primaryColor: creatorProfile.brand_color || '#6366f1',
        layout: 'contact-focused',
        sections: ['hero', 'contact-form', 'contact-info', 'faq'],
      },
    },
  ];

  // Create pages in batch
  const pagesToInsert = defaultPages.map(page => ({
    creator_id: creatorId,
    page_slug: page.pageSlug,
    page_title: page.pageTitle,
    page_description: page.pageDescription,
    meta_title: page.metaTitle,
    meta_description: page.metaDescription,
    page_config: page.pageConfig,
    active: true,
  }));

  const { error } = await supabase
    .from('white_labeled_pages')
    .upsert(pagesToInsert, { 
      onConflict: 'creator_id,page_slug',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error creating default white-label pages:', error);
    throw error;
  }
}

/**
 * Update white-label page SEO metadata based on creator profile
 */
export async function updatePageSEOMetadata(creatorId: string, creatorProfile: CreatorProfile): Promise<void> {
  const supabase = await createSupabaseAdminClient();
  
  const businessName = creatorProfile.business_name || 'Creator';
  
  // Get all pages for this creator
  const { data: pages, error: fetchError } = await supabase
    .from('white_labeled_pages')
    .select('*')
    .eq('creator_id', creatorId);

  if (fetchError) {
    console.error('Error fetching pages for SEO update:', fetchError);
    return;
  }

  if (!pages || pages.length === 0) {
    return;
  }

  // Update each page with improved SEO
  const updates = pages.map(page => {
    const pageType = page.page_slug;
    let metaTitle = page.meta_title;
    let metaDescription = page.meta_description;

    // Generate improved meta titles and descriptions
    switch (pageType) {
      case 'landing':
        metaTitle = `${businessName} | ${creatorProfile.business_description || 'Innovative SaaS Solutions'}`;
        metaDescription = `${creatorProfile.business_description || 'Discover innovative SaaS solutions'} with ${businessName}. Get started today and transform your business.`;
        break;
      case 'pricing':
        metaTitle = `${businessName} Pricing | Flexible Plans for Every Business`;
        metaDescription = `Transparent pricing for ${businessName}. Choose from our flexible plans designed to grow with your business. Start free today.`;
        break;
      case 'testimonials':
        metaTitle = `${businessName} Reviews | What Our Customers Say`;
        metaDescription = `Real customer testimonials and success stories from ${businessName} users. See how we've helped businesses like yours succeed.`;
        break;
      case 'about':
        metaTitle = `About ${businessName} | Our Story and Mission`;
        metaDescription = `Discover the story behind ${businessName}. Learn about our mission to help businesses succeed with innovative SaaS solutions.`;
        break;
      case 'contact':
        metaTitle = `Contact ${businessName} | Get Support and Sales Help`;
        metaDescription = `Contact ${businessName} for support, sales, or partnership opportunities. We're here to help you succeed.`;
        break;
    }

    return {
      id: page.id,
      meta_title: metaTitle,
      meta_description: metaDescription,
      updated_at: new Date().toISOString(),
    };
  });

  // Batch update all pages
  const { error: updateError } = await supabase
    .from('white_labeled_pages')
    .upsert(updates);

  if (updateError) {
    console.error('Error updating page SEO metadata:', updateError);
    throw updateError;
  }
}

/**
 * Get SEO-optimized canonical URL for a creator page
 */
export function getCanonicalUrl(creatorSlug: string, pageSlug = 'landing'): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com';
  
  if (pageSlug === 'landing') {
    return `${baseUrl}/c/${creatorSlug}`;
  }
  
  return `${baseUrl}/c/${creatorSlug}?page=${pageSlug}`;
}

/**
 * Generate social sharing URLs for a creator page
 */
export function generateSocialSharingUrls(creatorSlug: string, pageSlug = 'landing', creatorProfile?: CreatorProfile) {
  const url = getCanonicalUrl(creatorSlug, pageSlug);
  const businessName = creatorProfile?.business_name || 'SaaS Creator';
  const description = creatorProfile?.business_description || 'Innovative SaaS solutions';
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`Check out ${businessName}`);
  const encodedDescription = encodeURIComponent(description);
  
  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };
}