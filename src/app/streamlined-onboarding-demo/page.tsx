'use client';

import { useState } from 'react';

import { StreamlinedOnboardingFlow } from '@/features/creator-onboarding/components/streamlined/StreamlinedOnboardingFlow';
import type { CreatorProfile } from '@/features/creator-onboarding/types';

export default function StreamlinedOnboardingDemoPage() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Mock creator profile for demo
  const mockProfile: CreatorProfile = {
    id: 'demo-creator-id',
    user_id: 'demo-user-id',
    business_name: 'Demo Creator',
    business_description: 'Creating amazing SaaS products',
    business_website: 'https://democreator.com',
    page_slug: 'demo-creator',
    onboarding_completed: false,
    stripe_account_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Add other required fields as defaults
    business_email: null,
    billing_email: null,
    billing_phone: null,
    billing_address: null,
    business_logo: null,
    brand_color: null,
    brand_font: null,
    brand_gradient: null,
    brand_pattern: null,
    extracted_branding_data: null,
    branding_extraction_status: null,
    branding_extraction_date: null,
    branding_extraction_error: null,
    enabled_integrations: null,
    webhook_endpoints: null,
    stripe_account_id: null,
    stripe_access_token: null,
    stripe_refresh_token: null,
    onboarding_step: 1,
    onboarding_completed_date: null,
    white_label_pages_generated: null,
    white_label_generation_date: null,
    white_label_generation_error: null,
    embed_assets_generated: null,
    embed_css: null,
    embed_header_component: null,
    embed_generation_date: null,
    embed_generation_error: null,
    redirect_rules: null,
    redirect_rules_generated: null,
    redirect_setup_date: null,
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setTimeout(() => {
      alert('🎉 Onboarding Complete! This would redirect to the dashboard with setup tasks.');
    }, 500);
  };

  if (!showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-2xl">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Staryer!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your streamlined onboarding is complete. In the real app, you'd now see:
          </p>
          <div className="bg-white rounded-lg shadow-lg p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">What happens next:</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✅ <strong>Automatic white-label pages</strong> generated in the background</li>
              <li>✅ <strong>Brand extraction</strong> from your website (if provided)</li>
              <li>✅ <strong>Embed assets</strong> created with your branding</li>
              <li>✅ <strong>Redirect rules</strong> configured for creators vs subscribers</li>
              <li>🎯 <strong>Post-onboarding tasks</strong> available in the dashboard</li>
            </ul>
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Onboarding Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <StreamlinedOnboardingFlow
      profile={mockProfile}
      onComplete={handleOnboardingComplete}
    />
  );
}