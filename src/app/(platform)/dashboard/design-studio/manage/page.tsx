import { redirect } from 'next/navigation';
import { Code } from 'lucide-react';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { EnhancedAssetLibraryManager } from '@/features/creator/components/EnhancedAssetLibraryManager';
import { getCreatorEmbedAssets } from '@/features/creator/controllers/embed-assets';
import { CreatorProfile } from '@/features/creator/types';
import { getOrCreatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { getProducts } from '@/features/pricing/controllers/get-products';
import { serializeForClient } from '@/utils/serialize-for-client';

export default async function PlatformEmbedsManagePage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const [settings, products] = await Promise.all([
    getOrCreatePlatformSettings(authenticatedUser.id),
    getProducts({ includeInactive: true }), // Fetch all products for management
  ]);

  // Get embed assets for platform owner
  const embedAssets = await getCreatorEmbedAssets(settings.owner_id || authenticatedUser.id);

  // Create a platform owner profile that mimics CreatorProfile
  // Use production settings by default, fall back to test if production not available
  const useProduction = settings.stripe_production_enabled || false;
  const platformOwnerProfile: CreatorProfile = serializeForClient({
    id: settings.owner_id || authenticatedUser.id,
    business_name: 'SaaSinaSnap Platform',
    business_description: 'The main platform for SaaSinaSnap',
    business_website: null,
    business_logo_url: null,
    stripe_account_id: useProduction 
      ? settings.stripe_production_account_id 
      : settings.stripe_test_account_id,
    stripe_account_enabled: useProduction 
      ? settings.stripe_production_enabled 
      : settings.stripe_test_enabled,
    onboarding_completed: true,
    onboarding_step: null,
    brand_color: settings.default_creator_brand_color || '#ea580c',
    brand_gradient: settings.default_creator_gradient,
    brand_pattern: settings.default_creator_pattern,
    custom_domain: settings.owner_id || 'platform',
    created_at: settings.created_at,
    updated_at: settings.updated_at,
    stripe_access_token: useProduction 
      ? settings.stripe_production_access_token 
      : settings.stripe_test_access_token,
    stripe_refresh_token: useProduction 
      ? settings.stripe_production_refresh_token 
      : settings.stripe_test_refresh_token,
    branding_extracted_at: null,
    branding_extraction_error: null,
    branding_extraction_status: null,
    extracted_branding_data: null,
    billing_email: null,
    billing_phone: null,
    billing_address: null,
  });

  // Transform platform products to match creator products format
  const transformedProducts = serializeForClient(products.map(product => ({
    id: product.id,
    creator_id: settings.owner_id || authenticatedUser.id,
    name: product.name || '',
    description: product.description,
    image: product.image,
    active: product.active ?? true,
    metadata: product.metadata || {},
    created_at: product.created_at,
    updated_at: product.updated_at,
    stripe_test_product_id: null,
    stripe_production_product_id: null,
    environment: 'production' as const,
    product_category: null,
    features: [],
    benefits: [],
    target_audience: null,
    use_cases: [],
    comparison_points: [],
    success_metrics: [],
    onboarding_guide: null,
  })));

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <Code className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Design Studio & Asset Library</h1>
            <p className="text-gray-600">
              Manage embeds, scripts, and all your platform design assets. Preview with design tokens and copy embed codes.
            </p>
          </div>
        </div>
      </div>

      <EnhancedAssetLibraryManager
        initialAssets={serializeForClient(embedAssets)}
        creatorProfile={platformOwnerProfile}
        products={transformedProducts}
      />
    </div>
  );
}