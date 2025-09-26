import { notFound } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { CreatorPricingPage } from '@/features/creator/components/creator-pricing-page';
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { getCreatorProducts } from '@/features/creator/controllers/get-creator-products';
import { getWhiteLabeledPage } from '@/features/creator/controllers/get-white-labeled-page';

interface CreatorPricingPageProps {
  params: Promise<{ creatorSlug: string }>;
  searchParams: Promise<{ preview?: string }>; // Changed to Promise
}

export default async function CreatorPricing({ params, searchParams }: CreatorPricingPageProps) {
  const { creatorSlug } = await params;
  const resolvedSearchParams = await searchParams; // Await here
  const isPreview = resolvedSearchParams.preview === 'true'; // Get preview flag
  
  // Get creator profile
  const creator = await getCreatorBySlug(creatorSlug, isPreview); // Pass isPreview
  if (!creator) {
    notFound();
  }

  // Get creator's products and white-labeled page config
  const [products, pageConfig] = await Promise.all([
    getCreatorProducts(creator.id),
    getWhiteLabeledPage(creator.id, 'pricing')
  ]);

  return (
    <CreatorPricingPage 
      creator={creator}
      products={products}
      pageConfig={pageConfig}
    />
  );
}

export async function generateMetadata({ params, searchParams }: CreatorPricingPageProps) { // Add searchParams
  const { creatorSlug } = await params;
  const resolvedSearchParams = await searchParams; // Await here
  const isPreview = resolvedSearchParams.preview === 'true'; // Get preview flag
  const creator = await getCreatorBySlug(creatorSlug, isPreview); // Pass isPreview
  
  if (!creator) {
    return {
      title: 'Pricing Not Found',
    };
  }

  return {
    title: `Pricing - ${creator.business_name}`,
    description: `View pricing plans for ${creator.business_name}`,
  };
}