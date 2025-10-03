'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, FlaskConical, Palette, Settings, Zap } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmbedBuilderClient } from '@/features/creator/components/EmbedBuilderClient';
import { EnhancedABTestingManager } from '@/features/creator/components/EnhancedABTestingManager';
import { EnhancedAssetLibraryManager } from '@/features/creator/components/EnhancedAssetLibraryManager';
import { getCreatorEmbedAssets } from '@/features/creator/controllers/embed-assets';
import { CreatorProfile } from '@/features/creator/types';
import { serializeForClient } from '@/utils/serialize-for-client';

interface PlatformDesignStudioClientProps {
  userId: string;
  settings: any;
  products: any[];
}

export function PlatformDesignStudioClient({ userId, settings, products }: PlatformDesignStudioClientProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'builder');
  const [embedAssets, setEmbedAssets] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam && ['builder', 'assets', 'website', 'testing'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Create a platform owner profile that mimics CreatorProfile
  const useProduction = settings.stripe_production_enabled || false;
  const platformOwnerProfile: CreatorProfile = serializeForClient({
    id: settings.owner_id || userId,
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
    brand_gradient: settings.default_creator_gradient as any,
    brand_pattern: settings.default_creator_pattern as any,
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
    creator_id: settings.owner_id || userId,
    name: product.name || '',
    description: product.description,
    price: product.prices?.[0]?.unit_amount ? product.prices[0].unit_amount / 100 : 0,
    currency: product.prices?.[0]?.currency || 'usd',
    product_type: product.prices?.[0]?.type || 'one_time',
    stripe_product_id: product.id,
    stripe_price_id: product.prices?.[0]?.id || null,
    active: product.active ?? true,
    featured: false,
    image_url: product.image,
    metadata: product.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_test_product_id: null,
    stripe_production_product_id: null,
    environment: 'production' as const,
  })));

  // Load embed assets when switching to asset library tab
  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    
    if (value === 'assets' && embedAssets.length === 0) {
      setIsLoadingAssets(true);
      try {
        const assets = await getCreatorEmbedAssets(settings.owner_id || userId);
        setEmbedAssets(serializeForClient(assets));
      } catch (error) {
        console.error('Error loading embed assets:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Design Studio</h1>
        </div>
        <p className="text-gray-600">
          Create and manage embeddable components, test variations, and build complete websites for your platform.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Create
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Asset Library
          </TabsTrigger>
          <TabsTrigger value="website" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Website Builder
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            A/B Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <EmbedBuilderClient
            creatorProfile={platformOwnerProfile}
            products={transformedProducts}
          />
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          {isLoadingAssets ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                <p className="text-gray-600">Loading assets...</p>
              </div>
            </div>
          ) : (
            <EnhancedAssetLibraryManager
              initialAssets={embedAssets}
              creatorProfile={platformOwnerProfile}
              products={transformedProducts}
            />
          )}
        </TabsContent>

        <TabsContent value="website" className="space-y-6">
          <div className="bg-white rounded-lg border p-8">
            <div className="text-center max-w-2xl mx-auto">
              <Eye className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Builder</h2>
              <p className="text-gray-600 mb-6">
                Stack and arrange embeds to create full-featured websites for your platform.
                This feature allows you to combine multiple embeds into cohesive layouts.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Coming Soon:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Drag and drop interface for easy composition
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Responsive design that works on all devices
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Pre-built templates to get started quickly
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    SEO optimization and performance tuning
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <EnhancedABTestingManager creatorId={settings.owner_id || userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
