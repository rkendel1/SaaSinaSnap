'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types'; // Import Database type

import { CreatorProfile } from '../types';

export interface TrialConfiguration {
  enabled: boolean;
  duration_days: number;
  requires_payment_method: boolean;
  automatic_conversion: boolean;
}

export async function getCreatorTrialConfig(creatorId: string): Promise<TrialConfiguration> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('creator_profiles')
    .select('extracted_branding_data') // Changed from 'metadata'
    .eq('id', creatorId)
    .single();

  if (error) {
    console.error('Error fetching creator trial config:', error);
    return {
      enabled: false,
      duration_days: 0,
      requires_payment_method: false,
      automatic_conversion: false,
    };
  }

  // Explicitly cast data to the expected type after error check
  const profileData = data as Pick<Database['public']['Tables']['creator_profiles']['Row'], 'extracted_branding_data'> | null;

  // Ensure data and data.extracted_branding_data are not null before accessing
  const metadata = (profileData?.extracted_branding_data || {}) as Record<string, any>;
  const trialConfig = (metadata.trial_config as TrialConfiguration) || {};

  return {
    enabled: trialConfig.enabled || false,
    duration_days: trialConfig.duration_days || 7,
    requires_payment_method: trialConfig.requires_payment_method || true,
    automatic_conversion: trialConfig.automatic_conversion || true,
  };
}

export async function createTrialSubscription(params: {
  creatorId: string;
  productId: string;
  stripePriceId: string;
  customerId: string;
  trialDays: number;
}) {
  // This would integrate with Stripe to create a trial subscription
  // Implementation would depend on specific trial requirements
  const { creatorId, productId, stripePriceId, customerId, trialDays } = params;
  
  console.log('Creating trial subscription:', {
    creatorId,
    productId,
    stripePriceId,
    customerId,
    trialDays,
  });

  // Return mock trial subscription for now
  return {
    id: `trial_${Date.now()}`,
    status: 'trialing',
    trial_end: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
  };
}