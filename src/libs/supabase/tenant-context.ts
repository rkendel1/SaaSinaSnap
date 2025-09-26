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
 * Set tenant context in the database session
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  if (!tenantId || tenantId.trim() === '') {
    throw new Error('Tenant ID is required');
  }

  // Validate UUID format
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
 * Ensure tenant context is properly set and return the tenant ID
 */
export async function ensureTenantContext(): Promise<string> {
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
      throw new Error(`Tenant context not set: ${error.message}`);
    }

    if (!tenantId) {
      throw new Error('Tenant context is null - database context was not properly set');
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

    return tenantId;
  } catch (error) {
    console.error('Error in getTenantContext:', error);
    return null;
  }
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

    return tenant;
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
  tenantId?: string
): Promise<T> {
  let actualTenantId = tenantId;
  
  // If no tenantId provided, try to get from headers
  if (!actualTenantId) {
    try {
      const headersList = headers();
      actualTenantId = headersList.get('x-tenant-id');
    } catch (error) {
      // headers() not available in this context
    }
  }

  if (!actualTenantId) {
    throw new Error('Database operation requires tenant context');
  }

  // Validate tenantId first
  if (typeof actualTenantId !== 'string' || !actualTenantId.trim()) {
    throw new Error('Tenant ID is required');
  }

  // Check current context first, then set if needed
  try {
    const currentTenantId = await ensureTenantContext();
    if (currentTenantId !== actualTenantId) {
      await setTenantContext(actualTenantId);
    }
  } catch (error) {
    // If getting current context fails, try to set the new one
    await setTenantContext(actualTenantId);
  }
  
  try {
    // Get supabase client and execute the operation
    const supabase = await createSupabaseAdminClient();
    const result = await operation(supabase);
    return result;
  } catch (error) {
    console.error('Error in tenant context operation:', error);
    throw error;
  }
}