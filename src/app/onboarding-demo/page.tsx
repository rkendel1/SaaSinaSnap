'use client';

import { useState } from 'react';
import { ArrowRight, Check, Eye, Palette, Shield, Sparkles, Star, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { SuccessAnimation, useSuccessAnimation } from '@/components/ui/success-animation';
import { StreamlinedOnboardingFlow } from '@/features/creator-onboarding/components/streamlined/StreamlinedOnboardingFlow'; // Updated import
import { Tables } from '@/libs/supabase/types';
import { validateBusinessName, validateEmail } from '@/utils/validation';

export default function OnboardingDemoPage() {
  const [currentDemo, setCurrentDemo] = useState<'signup' | 'validation' | 'features'>('signup');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const { isSuccess, triggerSuccess } = useSuccessAnimation();

  // Mock functions for demo
  const mockSignInWithOAuth = async (provider: 'github' | 'google') => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    triggerSuccess();
    return { data: null, error: null };
  };

  const mockSignInWithEmail = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    triggerSuccess();
    return { data: null, error: null };
  };

  // Mock profile for demo purposes
  const mockProfile: Tables<'creator_profiles'> = {
    id: 'demo-creator-id',
     // Added tenant_id
    business_name: 'Demo Business',
    business_description: 'A demo business for testing onboarding',
    business_website: 'https://example.com',
    business_logo_url: null,
    business_logo: null, // Added missing property
    business_logo_file_path: null, // Added missing property
    business_type: null, // Added missing property
    stripe_account_id: null,
    stripe_account_enabled: false,
    onboarding_completed: false,
    onboarding_completed_date: null, // Added missing property
    onboarding_step: 1,
    brand_color: '#3b82f6',
    brand_gradient: { type: 'linear', colors: ['#3b82f6', '#0ea5e9'], direction: 45 },
    brand_pattern: { type: 'none', intensity: 0.1, angle: 0 },
    page_slug: 'demo-creator-id', // Changed from custom_domain to page_slug
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_access_token: null,
    stripe_refresh_token: null,
    branding_extracted_at: null,
    branding_extraction_error: null,
    branding_extraction_status: null,
    extracted_branding_data: null,
    target_market: null, // Added missing property
    uploaded_assets: null, // Added missing property
    white_label_pages_generated: null, // Added missing property
    // Added missing fields for CreatorProfile type
    billing_email: 'billing@example.com',
    billing_phone: '+15551234567',
    billing_address: {
      line1: '123 Demo Street',
      city: 'Demoville',
      state: 'CA',
      postal_code: '90210',
      country: 'US',
    },
  };

  return (
    <StreamlinedOnboardingFlow
      profile={mockProfile as any}
      onComplete={() => alert('Demo Onboarding Completed!')}
    />
  );
}