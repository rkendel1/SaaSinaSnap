'use server';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export interface CustomDomain {
  id: string;
  creator_id: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  verification_token?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Add a custom domain for a creator
 */
export async function addCustomDomain(
  creatorId: string,
  domain: string
): Promise<{ success: boolean; domainId?: string; verificationToken?: string; error?: string }> {
  try {
    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(domain)) {
      return { success: false, error: 'Invalid domain format' };
    }

    const supabase = await createSupabaseAdminClient();
    
    // Check if domain already exists
    const { data: existing } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('domain', domain)
      .single();

    if (existing) {
      return { success: false, error: 'Domain already in use' };
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    const { data, error } = await supabase
      .from('custom_domains')
      .insert({
        creator_id: creatorId,
        domain,
        status: 'pending',
        verification_token: verificationToken,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding custom domain:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      domainId: data.id,
      verificationToken,
    };
  } catch (error) {
    console.error('Error adding custom domain:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Verify a custom domain
 */
export async function verifyCustomDomain(
  domainId: string
): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    const { data: domain, error: fetchError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('id', domainId)
      .single();

    if (fetchError || !domain) {
      return { success: false, verified: false, error: 'Domain not found' };
    }

    // In a real implementation, you would check DNS records here
    // For now, we'll simulate verification
    const isVerified = await checkDNSRecords(domain.domain, domain.verification_token);

    if (isVerified) {
      const { error: updateError } = await supabase
        .from('custom_domains')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', domainId);

      if (updateError) {
        return { success: false, verified: false, error: updateError.message };
      }

      return { success: true, verified: true };
    }

    return { success: true, verified: false };
  } catch (error) {
    console.error('Error verifying custom domain:', error);
    return { success: false, verified: false, error: (error as Error).message };
  }
}

/**
 * Get custom domains for a creator
 */
export async function getCreatorCustomDomains(
  creatorId: string
): Promise<CustomDomain[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom domains:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching custom domains:', error);
    return [];
  }
}

/**
 * Delete a custom domain
 */
export async function deleteCustomDomain(
  domainId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', domainId);

    if (error) {
      console.error('Error deleting custom domain:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting custom domain:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate a verification token
 */
function generateVerificationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Check DNS records for domain verification
 * This is a placeholder - in production, you would use DNS lookup libraries
 */
async function checkDNSRecords(domain: string, verificationToken: string): Promise<boolean> {
  // In a real implementation, you would:
  // 1. Use dns.promises.resolveTxt() to check for TXT record with verification token
  // 2. Use dns.promises.resolveCname() to check if CNAME points to your platform
  // 3. Return true only if both checks pass
  
  // For now, return false to keep domains in pending state
  // Creators will need to set up DNS manually
  return false;
}

/**
 * Get DNS configuration instructions for a domain
 */
export async function getDNSInstructions(
  domain: string,
  verificationToken: string,
  platformDomain: string
): Promise<{
  verificationRecord: { type: string; name: string; value: string };
  cnameRecord: { type: string; name: string; value: string };
}> {
  // Extract subdomain if present
  const parts = domain.split('.');
  const isSubdomain = parts.length > 2;
  
  return {
    verificationRecord: {
      type: 'TXT',
      name: domain,
      value: `saasinasnap-verification=${verificationToken}`,
    },
    cnameRecord: {
      type: 'CNAME',
      name: isSubdomain ? parts[0] : '@',
      value: platformDomain,
    },
  };
}
