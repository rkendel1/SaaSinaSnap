// Server-side tenant context management functions
'use server';

import { headers } from 'next/headers';

import { createSupabaseAdminClient } from './supabase-admin';

// Types
interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  custom_domain?: string;
  settings?: any;
  active?: boolean;
}

/**
 * Get the platform tenant ID constant
 */
export async function getPlatformTenantId(): Promise<string> {
  return '00000000-0000-0000-0000-000000000000';
}

/**
 * Set tenant context in the database session
 */
export async function setTenantContext(tenantId: string | null): Promise<void> { // Allow tenantId to be null
  if (!tenantId || tenantId.trim() === '') {
    // If tenantId is null or empty, set app.current_tenant to null
    try {
      const supabase = await createSupabaseAdminClient();
      const { error } = await supabase.rpc('set_current_tenant', {
        tenant_uuid: null // Set to null for platform-level operations
      });

      if (error) {
        console.error('Failed to set tenant context to NULL:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Failed to set tenant context to NULL: ${error.message}`);
      }
      console.log('Tenant context set to NULL successfully for platform-level operation.');
      return;
    } catch (error) {
      console.error('Error in setTenantContext (setting to NULL):', error);
      throw error;
    }
  }

  // Validate UUID format if a non-null tenantId is provided
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    throw new Error('Invalid tenant ID format');
  }

  try {
    const supabase = await createSupabaseAdminClient();
    const { error } = await supabase.rpc('set_current_tenant', {
      tenant_uuid: tenantId
    });

    if (error) {
      console.error('Failed to set tenant context:', {
        tenantId,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to set tenant context: ${error.message}`);
    }

    console.log('Tenant context set successfully:', { tenantId });
  } catch (error) {
    console.error('Error in setTenantContext:', error);
    throw error;
  }
}

/**
 * Ensure tenant context is properly set and return the tenant ID (or null for platform-level)
 */
export async function ensureTenantContext(): Promise<string | null> { // Allow return type to be null
  try {
    const supabase = await createSupabaseAdminClient();
    const { data: tenantId, error } = await supabase.rpc('ensure_tenant_context');

    if (error) {
      console.error('Tenant context validation error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        timestamp: new Date().toISOString()
      });
      // If the error is specifically about the setting not being found, return null
      if (error.message.includes('unrecognized configuration parameter "app.current_tenant"')) {
        return null;
      }
      throw new Error(`Tenant context not set: ${error.message}`);
    }

    // If the RPC returns the PLATFORM_TENANT_ID, treat it as null for application logic
    const platformTenantId = await getPlatformTenantId();
    if (tenantId === platformTenantId) {
      return null;
    }

    return tenantId;
  } catch (error) {
    console.error('Error in ensureTenantContext:', error);
    throw error;
  }
}

/**
 * Get current tenant context if set
 */
export async function getTenantContext(): Promise<string | null> {
  try {
    const supabase = await createSupabaseAdminClient();
    const { data: tenantId, error } = await supabase.rpc('get_current_tenant');

    if (error) {
      console.error('Error getting tenant context:', error);
      return null;
    }

    // If the RPC returns the PLATFORM_TENANT_ID, treat it as null for application logic
    const platformTenantId = await getPlatformTenantId();
    if (tenantId === platformTenantId) {
      return null;
    }

    return tenantId;
  } catch (error) {
    console.error('Error in getTenantContext:', error);
    return null;
  }
}

/**
 * Extract tenant information from request host
 */
export async function extractTenantFromRequest(host: string): Promise<{ tenantIdentifier: string | null; type: 'subdomain' | 'domain' | null }> {
  if (!host) {
    return { tenantIdentifier: null, type: null };
  }

  // Handle localhost and IP addresses
  if (host.includes('localhost') || host.match(/^\d+\.\d+\.\d+\.\d+/)) {
    return { tenantIdentifier: null, type: null };
  }

  // Remove port if present
  const cleanHost = host.split(':')[0];

  // Check if this looks like a subdomain pattern (*.staryer.com)
  if (cleanHost.includes('.staryer.com')) {
    const subdomain = cleanHost.split('.')[0];
    return { tenantIdentifier: subdomain, type: 'subdomain' };
  }

  // Otherwise treat as custom domain
  return { tenantIdentifier: cleanHost, type: 'domain' };
}

/**
 * Resolve tenant from request host (for middleware)
 */
export async function resolveTenantFromRequest(host: string): Promise<Tenant | null> {
  if (!host) {
    return null;
  }

  try {
    const supabase = await createSupabaseAdminClient();
    
    // Try to match by custom domain first
    let { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('custom_domain', host)
      .eq('active', true)
      .single();

    // If not found by custom domain, try subdomain
    if (!tenant && !error) {
      const subdomain = host.split('.')[0]; // Extract subdomain
      const result = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('active', true)
        .single();
      
      tenant = result.data;
      error = result.error;
    }

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error resolving tenant from request:', error);
      return null;
    }

    return tenant as Tenant | null;
  } catch (error) {
    console.error('Error in resolveTenantFromRequest:', error);
    return null;
  }
}

/**
 * Wrapper function to execute operations with tenant context
 */
export async function withTenantContext<T>(
  operation: (supabase?: any) => Promise<T>,
  tenantId?: string | null // Allow tenantId to be null
): Promise<T> {
  let actualTenantId = tenantId;
  
  // If no tenantId provided, try to get from headers
  if (actualTenantId === undefined) { // Check for undefined specifically
    try {
      const headersList = headers();
      actualTenantId = headersList.get('x-tenant-id');
    } catch (error) {
      // headers() not available in this context
      actualTenantId = null; // Default to null if headers not available
    }
  }

  // If still no tenantId, default to PLATFORM_TENANT_ID
  if (!actualTenantId) {
    actualTenantId = await getPlatformTenantId();
  }

  // Validate tenantId first (only if it's not the PLATFORM_TENANT_ID)
  const platformTenantId = await getPlatformTenantId();
  if (actualTenantId !== platformTenantId && (typeof actualTenantId !== 'string' || !actualTenantId.trim())) {
    throw new Error('Tenant ID is required');
  }

  // Check current context first, then set if needed
  try {
    const currentTenantId = await getTenantContext(); // Use getTenantContext which handles PLATFORM_TENANT_ID
    if (currentTenantId !== actualTenantId) {
      await setTenantContext(actualTenantId);
    }
  } catch (error) {
    // If getting current context fails, try to set the new one
    await setTenantContext(actualTenantId);
  }
  
  try {
    // Get supabase client and execute the operation
    const supabase = await createSupabaseAdminClient(); // Admin client will now set context
    const result = await operation(supabase);
    return result;
  } catch (error) {
    console.error('Error in tenant context operation:', error);
    throw error;
  }
}