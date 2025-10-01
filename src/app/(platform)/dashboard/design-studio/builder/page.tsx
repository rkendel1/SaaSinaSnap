import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { EmbedBuilderClient } from '@/features/creator/components/EmbedBuilderClient';
import { CreatorProfile } from '@/features/creator/types';
import { getOrCreatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { getProducts } from '@/features/pricing/controllers/get-products';

export default async function PlatformEmbedBuilderPage() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [settings, products] = await Promise.all([
    getOrCreatePlatformSettings(user.id),
    getProducts({ includeInactive: false }),
  ]);

  // Create a platform owner profile that mimics CreatorProfile
  const platformOwnerProfile: CreatorProfile = {
    id: settings.owner_id || user.id,
    business_name: 'SaaSinaSnap Platform',
    business_description: 'The main platform for SaaSinaSnap',
    business_website: null,
    business_logo_url: null,
    stripe_account_id: settings.stripe_account_id,
    stripe_account_enabled: settings.stripe_account_enabled,
    onboarding_completed: true,
    onboarding_step: null,
    brand_color: settings.default_creator_brand_color || '#ea580c',
    brand_gradient: settings.default_creator_gradient as any,
    brand_pattern: settings.default_creator_pattern as any,
    page_slug: settings.owner_id || 'platform',
    created_at: settings.created_at,
    updated_at: settings.updated_at,
    stripe_access_token: settings.stripe_access_token,
    stripe_refresh_token: settings.stripe_refresh_token,
    branding_extracted_at: null,
    branding_extraction_error: null,
    branding_extraction_status: null,
    extracted_branding_data: null,
    billing_email: null,
    billing_phone: null,
    billing_address: null,
  };

  // Transform platform products to match creator products format
  const transformedProducts = products.map(product => ({
    id: product.id,
    creator_id: settings.owner_id || user.id,
    name: product.name,
    description: product.description,
    image: product.image,
    active: product.active ?? true,
    metadata: product.metadata || {},
    created_at: product.created_at,
    updated_at: product.updated_at,
    stripe_test_product_id: product.stripe_product_id,
    stripe_production_product_id: product.stripe_product_id,
    environment: 'production' as const,
    product_category: null,
    features: [],
    benefits: [],
    target_audience: null,
    use_cases: [],
    comparison_points: [],
    success_metrics: [],
    onboarding_guide: null,
  }));

  return (
    <EmbedBuilderClient
      creatorProfile={platformOwnerProfile}
      products={transformedProducts}
    />
  );
}
