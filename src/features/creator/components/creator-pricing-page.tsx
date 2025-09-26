import Image from 'next/image';
import Link from 'next/link';

import { type CreatorBranding,getBrandingStyles } from '@/utils/branding-utils';

import { createCreatorCheckoutAction } from '../actions/create-creator-checkout-action';
import { CreatorProduct, CreatorProfile, WhiteLabeledPage } from '../types';
import { TemplateRouter, getCreatorTheme } from '../templates/template-router';

import { CreatorProductCard } from './creator-product-card';

interface CreatorPricingPageProps {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
}

export function CreatorPricingPage({ creator, products, pageConfig }: CreatorPricingPageProps) {
  // Get theme from creator settings or default to modern
  const theme = getCreatorTheme(creator, pageConfig);
  
  // Use template router to render the appropriate template
  // For now, this will fallback to landing page templates since we haven't implemented pricing-specific templates yet
  return (
    <TemplateRouter 
      creator={creator}
      products={products}
      pageConfig={pageConfig}
      pageType="pricing"
      theme={theme}
    />
  );
}
