import { notFound } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { CreatorLandingPage } from '@/features/creator/components/creator-landing-page';
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { getCreatorProducts } from '@/features/creator/controllers/get-creator-products';
import { getWhiteLabeledPage } from '@/features/creator/controllers/get-white-labeled-page';
import { WhiteLabeledPage } from '@/features/creator/types'; // Import the updated WhiteLabeledPage type

interface CreatorPageProps {
  params: Promise<{ creatorSlug: string }>;
  searchParams: Promise<{ preview?: string; page?: string }>; // Changed to Promise
}

export default async function CreatorPage({ params, searchParams }: CreatorPageProps) {
  const { creatorSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === 'true';
  const pageType = resolvedSearchParams.page || 'landing'; // Support different page types
  
  // Get creator profile
  const creator = await getCreatorBySlug(creatorSlug, isPreview);
  if (!creator) {
    notFound();
  }

  // Get creator's products and white-labeled page config for the specific page type
  const [products, pageConfig] = await Promise.all([
    getCreatorProducts(creator.id),
    getWhiteLabeledPage(creator.id, pageType)
  ]);

  return (
    <>
      {/* Enhanced JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: creator.business_name || 'SaaSinaSnap Creator',
            description: creator.business_description || 'Innovative SaaS solutions',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com'}/c/${creatorSlug}`,
            logo: creator.business_logo_url,
            sameAs: creator.business_website ? [creator.business_website] : [],
            address: creator.billing_address ? {
              '@type': 'PostalAddress',
              streetAddress: creator.billing_address.line1,
              addressLocality: creator.billing_address.city,
              addressRegion: creator.billing_address.state,
              postalCode: creator.billing_address.postal_code,
              addressCountry: creator.billing_address.country,
            } : undefined,
          }),
        }}
      />
      
      <CreatorLandingPage 
        creator={creator}
        products={products}
        pageConfig={pageConfig as WhiteLabeledPage}
        pageType={pageType}
      />
    </>
  );
}

export async function generateMetadata({ params, searchParams }: CreatorPageProps) {
  const { creatorSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === 'true';
  const pageType = resolvedSearchParams.page || 'landing'; // Default to landing page
  
  const creator = await getCreatorBySlug(creatorSlug, isPreview);
  
  if (!creator) {
    return {
      title: 'Creator Not Found',
      description: 'The requested creator page could not be found.',
    };
  }

  // Get the white-labeled page config for better metadata
  const pageConfig = await getWhiteLabeledPage(creator.id, pageType);

  // Generate SEO-optimized metadata
  const businessName = creator.business_name || 'SaaSinaSnap Creator';
  const businessDescription = creator.business_description || 'Discover amazing SaaS solutions and products';
  
  // Enhanced title based on page type
  const pageTypeTitle = pageType === 'pricing' ? 'Pricing' : 
                       pageType === 'testimonials' ? 'Customer Reviews' :
                       pageType === 'products' ? 'Products & Services' : '';
  const title = pageTypeTitle ? `${businessName} - ${pageTypeTitle}` : businessName;
  
  // Enhanced description
  const description = pageConfig?.meta_description || 
                     creator.business_description || 
                     `Explore ${businessName}'s innovative SaaS solutions. ${pageTypeTitle ? `View our ${pageTypeTitle.toLowerCase()}.` : ''} Get started today!`;

  // SEO keywords based on business
  const keywords = [
    businessName.toLowerCase(),
    'saas',
    'software',
    'solutions',
    ...(creator.business_description?.toLowerCase().split(' ').filter(word => word.length > 3) || [])
  ].join(', ');

  const siteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com'}/c/${creatorSlug}`;
  const imageUrl = creator.business_logo_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com'}/og-default.png`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: businessName }],
    creator: businessName,
    publisher: 'SaaSinaSnap',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: 'SaaSinaSnap',
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${businessName} - ${description}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: `@${businessName.replace(/\s+/g, '').toLowerCase()}`,
    },
    alternates: {
      canonical: siteUrl,
    },
    other: {
      'business:contact_data:street_address': creator.billing_address?.line1 || '',
      'business:contact_data:locality': creator.billing_address?.city || '',
      'business:contact_data:region': creator.billing_address?.state || '',
      'business:contact_data:postal_code': creator.billing_address?.postal_code || '',
      'business:contact_data:country_name': creator.billing_address?.country || '',
    },
  };
}