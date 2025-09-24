import { Resend } from 'resend';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import CreatorWelcomeEmail from '../components/emails/creator-welcome-email';
import CreatorPaymentFailedEmail from '../components/emails/creator-payment-failed-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCreatorBrandedEmail({
  type,
  creatorId,
  customerEmail,
  customerName,
  data = {},
}: {
  type: 'welcome' | 'payment_failed' | 'subscription_cancelled';
  creatorId: string;
  customerEmail: string;
  customerName: string;
  data?: Record<string, any>;
}) {
  try {
    // Get creator details for branding
    const supabase = await createSupabaseServerClient();
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('id', creatorId)
      .single();

    if (!creator) {
      throw new Error('Creator not found');
    }

    const brandColor = creator.brand_color || '#3b82f6';
    const fromEmail = `noreply@${creator.custom_domain || 'staryer.com'}`;
    const fromName = creator.business_name || 'Staryer';
    
    let emailComponent;
    let subject;

    switch (type) {
      case 'welcome':
        subject = `Welcome to ${creator.business_name}!`;
        emailComponent = CreatorWelcomeEmail({
          creatorName: creator.business_name || 'Our Platform',
          creatorLogoUrl: creator.business_logo_url || undefined,
          customerName,
          productName: data.productName || 'Premium Plan',
          brandColor,
          accountUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/c/${creator.custom_domain}/account`,
        });
        break;

      case 'payment_failed':
        subject = `Payment Failed - Action Required`;
        emailComponent = CreatorPaymentFailedEmail({
          creatorName: creator.business_name || 'Our Platform',
          creatorLogoUrl: creator.business_logo_url || undefined,
          customerName,
          brandColor,
          updatePaymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/c/${creator.custom_domain}/manage-subscription`,
          nextRetryDate: data.nextRetryDate || 'Soon',
        });
        break;

      default:
        throw new Error(`Unsupported email type: ${type}`);
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return { success: false, reason: 'No email service configured' };
    }

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: customerEmail,
      subject,
      react: emailComponent,
    });

    console.log('Creator branded email sent:', {
      type,
      creatorId,
      customerEmail,
      emailId: result.data?.id,
    });

    return { success: true, emailId: result.data?.id };

  } catch (error) {
    console.error('Error sending creator branded email:', error);
    return { success: false, error: (error as Error).message };
  }
}