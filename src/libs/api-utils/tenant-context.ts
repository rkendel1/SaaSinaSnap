'use server';

import { headers } from 'next/headers';

export interface TenantContext {
  tenantId: string;
  tenantName: string;
}

/**
 * Get the current tenant context from headers
 * This is set by the tenant middleware
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantName = headersList.get('x-tenant-name');

  if (!tenantId) {
    return null;
  }

  return {
    tenantId,
    tenantName: tenantName || 'Unknown',
  };
}

/**
 * Ensure tenant context exists, throw error if not
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext();
  if (!context) {
    throw new Error('Tenant context is required but not found');
  }
  return context;
}