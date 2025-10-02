'use server';

import { resendClient } from '@/libs/resend/resend-client';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { sendCreatorBrandedEmail } from './email-service';

export interface DripCampaign {
  id: string;
  name: string;
  creatorId: string;
  emailSequence: DripEmail[];
  isActive: boolean;
}

export interface DripEmail {
  delayDays: number;
  emailType: 'welcome' | 'feature_update' | 'engagement' | 'upsell';
  subject: string;
  content: {
    featureTitle?: string;
    featureDescription?: string;
    learnMoreUrl?: string;
  };
}

/**
 * Create a new drip campaign for a creator
 */
export async function createDripCampaign(
  creatorId: string,
  name: string,
  emailSequence: DripEmail[]
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('drip_campaigns')
      .insert({
        name,
        creator_id: creatorId,
        email_sequence: emailSequence,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating drip campaign:', error);
      return { success: false, error: error.message };
    }

    return { success: true, campaignId: data.id };
  } catch (error) {
    console.error('Error creating drip campaign:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Subscribe a customer to a drip campaign
 */
export async function subscribeToDripCampaign(
  campaignId: string,
  customerEmail: string,
  customerName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    const { error } = await supabase
      .from('drip_campaign_subscribers')
      .insert({
        campaign_id: campaignId,
        customer_email: customerEmail,
        customer_name: customerName,
        subscribed_at: new Date().toISOString(),
        current_step: 0,
      });

    if (error) {
      console.error('Error subscribing to drip campaign:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error subscribing to drip campaign:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Process drip campaign emails (should be called by a cron job or scheduled task)
 */
export async function processDripCampaigns(): Promise<void> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    // Get all active campaigns
    const { data: campaigns } = await supabase
      .from('drip_campaigns')
      .select('*')
      .eq('is_active', true);

    if (!campaigns) return;

    for (const campaign of campaigns) {
      // Get subscribers who are due for their next email
      const { data: subscribers } = await supabase
        .from('drip_campaign_subscribers')
        .select('*')
        .eq('campaign_id', campaign.id)
        .lt('current_step', campaign.email_sequence.length);

      if (!subscribers) continue;

      for (const subscriber of subscribers) {
        const currentEmail = campaign.email_sequence[subscriber.current_step];
        
        if (!currentEmail) continue;

        // Check if enough time has passed since subscription
        const subscribedDate = new Date(subscriber.subscribed_at);
        const daysSinceSubscription = Math.floor(
          (Date.now() - subscribedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceSubscription >= currentEmail.delayDays) {
          // Send the email
          const result = await sendCreatorBrandedEmail({
            type: currentEmail.emailType === 'welcome' ? 'welcome' : 'feature_update',
            creatorId: campaign.creator_id,
            customerEmail: subscriber.customer_email,
            customerName: subscriber.customer_name,
            data: currentEmail.content,
          });

          if (result.success) {
            // Update subscriber's current step
            await supabase
              .from('drip_campaign_subscribers')
              .update({ 
                current_step: subscriber.current_step + 1,
                last_email_sent_at: new Date().toISOString(),
              })
              .eq('id', subscriber.id);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing drip campaigns:', error);
  }
}

/**
 * Get all drip campaigns for a creator
 */
export async function getCreatorDripCampaigns(
  creatorId: string
): Promise<DripCampaign[]> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('drip_campaigns')
      .select('*')
      .eq('creator_id', creatorId);

    if (error) {
      console.error('Error fetching drip campaigns:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching drip campaigns:', error);
    return [];
  }
}
