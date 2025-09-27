import { CreatorProduct, CreatorProfile, WhiteLabeledPage } from '../types';

import { ClassicLandingPage } from './classic/landing-page';
import { CorporateLandingPage } from './corporate/landing-page';
import { MinimalLandingPage } from './minimal/landing-page';
import { ModernLandingPage } from './modern/landing-page';
import { PageTemplateProps,TemplateTheme } from './types';

interface TemplateRouterProps {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
  pageType: 'landing' | 'pricing' | 'account';
  theme?: TemplateTheme;
}

export function TemplateRouter({ 
  creator, 
  products, 
  pageConfig, 
  pageType, 
  theme = 'modern' 
}: TemplateRouterProps) {
  const templateProps: PageTemplateProps = {
    creator,
    products,
    pageConfig,
    theme,
    pageType
  };

  // For now, we only have landing page templates
  // Later we'll add pricing and account page templates for each theme
  if (pageType === 'landing') {
    switch (theme) {
      case 'classic':
        return <ClassicLandingPage {...templateProps} />;
      case 'minimal':
        return <MinimalLandingPage {...templateProps} />;
      case 'corporate':
        return <CorporateLandingPage {...templateProps} />;
      case 'modern':
      default:
        return <ModernLandingPage {...templateProps} />;
    }
  }

  // Fallback to modern theme for other page types
  if (pageType === 'pricing') {
    // TODO: Implement pricing page templates
    return <ModernLandingPage {...templateProps} />;
  }

  if (pageType === 'account') {
    // TODO: Implement account page templates  
    return <ModernLandingPage {...templateProps} />;
  }

  // Default fallback
  return <ModernLandingPage {...templateProps} />;
}

/**
 * Get the theme for a creator from their profile or page config
 */
export function getCreatorTheme(creator: CreatorProfile, pageConfig?: WhiteLabeledPage): TemplateTheme {
  // Check if theme is stored in page config
  if (pageConfig?.page_config && typeof pageConfig.page_config === 'object') {
    const config = pageConfig.page_config as any;
    if (config.theme && ['modern', 'classic', 'minimal', 'corporate'].includes(config.theme)) {
      return config.theme as TemplateTheme;
    }
  }

  // Check if theme is stored in creator profile
  if (creator.extracted_branding_data && typeof creator.extracted_branding_data === 'object') {
    const brandingData = creator.extracted_branding_data as any;
    if (brandingData.preferredTheme && ['modern', 'classic', 'minimal', 'corporate'].includes(brandingData.preferredTheme)) {
      return brandingData.preferredTheme as TemplateTheme;
    }
  }

  // Default to modern theme
  return 'modern';
}