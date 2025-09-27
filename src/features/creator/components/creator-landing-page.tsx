import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { type CreatorBranding, getBrandingStyles } from '@/utils/branding-utils';

import { createCreatorCheckoutAction } from '../actions/create-creator-checkout-action';
import { getCreatorTheme,TemplateRouter } from '../templates/template-router';
import { CreatorProduct, CreatorProfile, WhiteLabeledPage } from '../types';

import { CreatorProductCard } from './creator-product-card';
import { EmbedShowcaseCarousel } from './embed-showcase-carousel';

interface CreatorLandingPageProps {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
  pageType?: string;
}

export function CreatorLandingPage({ creator, products, pageConfig, pageType = 'landing' }: CreatorLandingPageProps) {
  // Get theme from creator settings or default to modern
  const theme = getCreatorTheme(creator, pageConfig);
  
  // Use template router to render the appropriate template
  return (
    <TemplateRouter 
      creator={creator}
      products={products}
      pageConfig={pageConfig}
      pageType="landing"
      theme={theme}
    />
  );
}