import { Metadata } from 'next';

import { EnhancedOnboardingFlow } from '@/features/creator-onboarding/components/EnhancedOnboardingFlow';
import type { CreatorProfile } from '@/features/creator-onboarding/types';

export const metadata: Metadata = {
  title: 'Enhanced Onboarding Demo - PayLift',
  description: 'Preview of the improved SaaS creator signup and onboarding experience',
};

// Mock profile for demo purposes
const mockProfile: CreatorProfile = {
  id: 'demo-creator-id',
  business_name: 'Demo Business',
  business_description: 'A demo business for testing onboarding',
  business_website: 'https://example.com',
  business_logo_url: null,
  stripe_account_id: null,
  stripe_account_enabled: false,
  onboarding_completed: false,
  onboarding_step: 1,
  brand_color: '#3b82f6',
  brand_gradient: { type: 'linear', colors: ['#3b82f6', '#0ea5e9'], direction: 45 },
  brand_pattern: { type: 'none', intensity: 0.1, angle: 0 },
  custom_domain: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stripe_access_token: null,
  stripe_refresh_token: null,
  // Added missing fields for CreatorProfile type
  branding_extracted_at: null,
  branding_extraction_error: null,
  branding_extraction_status: null,
  extracted_branding_data: null,
};

export default function OnboardingDemoPage() {
  return (
    <EnhancedOnboardingFlow
      profile={mockProfile}
      onClose={() => alert('Demo Onboarding Completed!')}
    />
  );
}