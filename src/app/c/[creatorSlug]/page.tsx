import { notFound } from 'next/navigation';

import { CreatorLandingPage } from '@/features/creator/components/creator-landing-page';
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { getCreatorProducts } from '@/features/creator/controllers/get-creator-products';
import { getWhiteLabeledPage } from '@/features/creator/controllers/get-white-labeled-page';

interface CreatorPageProps {
  params: Promise<{ creatorSlug: string }>;
  searchParams: Promise<{ preview?: string }>; // Changed to Promise
}

export default async function CreatorPage({ params, searchParams }: CreatorPageProps) {
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
    getWhiteLabeledPage(creator.id, 'landing')
  ]);

  return (
    <CreatorLandingPage 
      creator={creator}
      products={products}
      pageConfig={pageConfig}
    />
  );
}

export async function generateMetadata({ params, searchParams }: CreatorPageProps) { // Add searchParams
  const { creatorSlug } = await params;
  const resolvedSearchParams = await searchParams; // Await here
  const isPreview = resolvedSearchParams.preview === 'true'; // Get preview flag
  const creator = await getCreatorBySlug(creatorSlug, isPreview); // Pass isPreview
  
  if (!creator) {
    return {
      title: 'Creator Not Found',
    };
  }

  return {
    title: creator.business_name || 'SaaS Platform',
    description: creator.business_description || 'Discover our amazing products and services',
    openGraph: {
      title: creator.business_name || 'SaaS Platform',
      description: creator.business_description || 'Discover our amazing products and services',
      images: creator.business_logo_url ? [creator.business_logo_url] : [],
    },
  };
}