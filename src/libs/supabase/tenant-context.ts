/**
 * Tenant Context Management
 * Handles setting and getting tenant context for multi-tenant operations
 */

import { createSupabaseAdminClient } from './supabase-admin';
import { Json, Tables } from './types'; // Import Json and Tables

export interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  settings: Json | null; // Allow Json | null for settings
  active: boolean | null; // Allow null for active
  created_at: string;
  updated_at: string;
}

/**
 * Set the current tenant context for database operations
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  const supabase = await createSupabaseAdminClient();
  
  // Set the tenant context using the PostgreSQL function
  const { error } = await supabase.rpc('set_current_tenant', {
    tenant_uuid: tenantId
  });
  
  if (error) {
    throw new Error(`Failed to set tenant context: ${error.message}`);
  }
}

/**
 * Get the current tenant context
 */
export async function getTenantContext(): Promise<string | null> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase.rpc('get_current_tenant');
  
  if (error) {
    console.error('Failed to get tenant context:', error);
    return null;
  }
  
  return data;
}

/**
 * Create a new tenant
 */
export async function createTenant(
  name: string,
  subdomain?: string | null, // Allow null or undefined
  settings?: Record<string, any> | null // Allow null or undefined
): Promise<Tenant> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase.rpc('create_tenant', {
    tenant_name: name,
    tenant_subdomain: subdomain as string | undefined, // Explicitly cast to string | undefined
    tenant_settings: settings || {} // Ensure it's an object if null/undefined
  });
  
  if (error) {
    throw new Error(`Failed to create tenant: ${error.message}`);
  }
  
  // Fetch the created tenant
  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', data)
    .single();
    
  if (fetchError) {
    throw new Error(`Failed to fetch created tenant: ${fetchError.message}`);
  }
  
  return tenant as Tenant; // Cast to our Tenant interface
}

/**
 * Get tenant by subdomain
 */
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('active', true)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get tenant by subdomain: ${error.message}`);
  }
  
  return data as Tenant; // Cast to our Tenant interface
}

/**
 * Get tenant by custom domain
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('custom_domain', domain)
    .eq('active', true)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get tenant by domain: ${error.message}`);
  }
  
  return data as Tenant; // Cast to our Tenant interface
}

/**
 * Extract tenant from request (subdomain or custom domain)
 */
export function extractTenantFromRequest(host: string): {
  tenantIdentifier: string | null;
  type: 'subdomain' | 'domain' | null;
} {
  // Handle localhost and dev environments
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return { tenantIdentifier: null, type: null };
  }
  
  // Check if it's a custom domain (no .staryer.com or similar)
  const parts = host.split('.');
  
  // If it's a subdomain like "tenant.staryer.com"
  if (parts.length >= 3 && (parts[parts.length - 2] === 'staryer' || parts[parts.length - 2] === 'your-platform')) {
    return {
      tenantIdentifier: parts[0],
      type: 'subdomain'
    };
  }
  
  // Otherwise, treat as custom domain
  return {
    tenantIdentifier: host,
    type: 'domain'
  };
}

/**
 * Resolve tenant from request and set context
 */
export async function resolveTenantFromRequest(host: string): Promise<Tenant | null> {
  const { tenantIdentifier, type } = extractTenantFromRequest(host);
  
  if (!tenantIdentifier) {
    return null;
  }
  
  let tenant: Tenant | null = null;
  
  if (type === 'subdomain') {
    tenant = await getTenantBySubdomain(tenantIdentifier);
  } else if (type === 'domain') {
    tenant = await getTenantByDomain(tenantIdentifier);
  }
  
  if (tenant) {
    await setTenantContext(tenant.id);
  }
  
  return tenant;
}

/**
 * Ensure tenant context is set, throw error if not
 */
export async function ensureTenantContext(): Promise<string> {
  const supabase = await createSupabaseAdminClient();
  
  const { data, error } = await supabase.rpc('ensure_tenant_context');
  
  if (error) {
    throw new Error(`Tenant context not set: ${error.message}`);
  }
  
  return data;
}

/**
 * Create Supabase client with tenant context already set
 */
export async function createTenantAwareSupabaseClient(tenantId: string) {
  await setTenantContext(tenantId);
  return createSupabaseAdminClient();
}