import { notFound } from 'next/navigation';

import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { getCreatorProducts } from '@/features/creator/controllers/get-creator-products';
import { getWhiteLabeledPage } from '@/features/creator/controllers/get-white-labeled-page';
import { CreatorPricingPage } from '@/features/creator/components/creator-pricing-page';

interface CreatorPricingPageProps {
  params: Promise<{ creatorSlug: string }>;
}

export default async function CreatorPricing({ params }: CreatorPricingPageProps) {
  const { creatorSlug } = await params;
  
  // Get creator profile
  const creator = await getCreatorBySlug(creatorSlug);
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

export async function generateMetadata({ params }: CreatorPricingPageProps) {
  const { creatorSlug } = await params;
  const creator = await getCreatorBySlug(creatorSlug);
  
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