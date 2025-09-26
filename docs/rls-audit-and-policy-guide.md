# RLS Audit and Policy Guide

## Overview

This document provides the complete audit results for Row-Level Security (RLS) and multi-tenant support impact analysis, along with policy examples for managing public vs tenant-specific access.

## Audit Summary

### Issue Identification
The multi-tenant migration (`20241230000000_add_multi_tenant_support.sql`) introduced strict tenant isolation but removed essential public access policies, breaking:
- Public embed functionality
- Product catalog viewing
- White-labeled landing pages
- Public API endpoints

### Solution Implemented
Created hybrid RLS policies that support both:
1. **Public access** for active content (products, pages)
2. **Tenant-isolated management** for private operations

## Feature Categorization

### 🔒 Tenant-Specific Features (Requires RLS)
These features require strict tenant isolation and user authentication:

#### Creator Dashboard Features
- **Creator Profile Management**: Edit business info, branding, settings
- **Product Management**: Create, edit, delete products
- **Page Management**: Create, edit, delete white-labeled pages
- **Analytics Viewing**: View creator performance metrics
- **Webhook Management**: Configure and manage webhook endpoints
- **Usage Tracking**: View usage metrics and billing information

#### Admin/Platform Features
- **Tenant Management**: Create, manage, configure tenants
- **Audit Log Viewing**: Access compliance and security logs
- **Usage Enforcement**: Manage limits and billing
- **Subscription Management**: Handle tier assignments and overages

#### Customer/User Features (within tenant)
- **Account Management**: User profile and settings
- **Subscription Management**: View and manage subscriptions
- **Usage Monitoring**: View personal usage statistics

### 🌐 Global/Shared Features (Should Bypass RLS)
These features provide public access and should NOT require tenant context:

#### Public Viewing Features
- **Product Catalog Browsing**: View active products from any creator
- **Landing Page Access**: View white-labeled pages when active
- **Creator Profile Viewing**: View public creator information
- **Pricing Display**: Show pricing information for products

#### Embed Functionality
- **Product Embeds**: Display products on external websites
- **Pricing Embeds**: Show pricing tables on external sites
- **Creator Branding**: Display creator logos, colors, styling
- **Checkout Process**: Process purchases from embedded widgets
- **Trial Access**: Provide trial access to products

#### Public APIs
- **Health Checks**: System status and monitoring
- **Asset Serving**: Serve public assets and configurations
- **CORS-enabled Endpoints**: Support cross-origin requests

## RLS Policy Examples

### 1. Hybrid Access Pattern (Recommended)
For tables that need both public viewing and private management:

```sql
-- Example: creator_products table
-- Public can view active products
create policy "Public can view active products" on creator_products
  for select using (active = true);

-- Creators can manage their own products within tenant context
create policy "Creators can manage their tenant products" on creator_products
  for all using (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = creator_id
  );
```

### 2. Strict Tenant Isolation Pattern
For sensitive tables that should never be publicly accessible:

```sql
-- Example: creator_analytics table
create policy "Tenant isolation for creator analytics" on creator_analytics
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);
```

### 3. User-Specific Within Tenant Pattern
For user data within tenant boundaries:

```sql
-- Example: users table
create policy "Users can manage own data within tenant" on users
  for all using (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = id
  );
```

### 4. Admin-Only Pattern
For platform administration:

```sql
-- Example: tenants table
create policy "Platform owners can manage tenants" on tenants
  for all using (auth.jwt() ->> 'role' = 'platform_admin');
```

### 5. Public Read, Private Write Pattern
For content that should be publicly readable but privately managed:

```sql
-- Alternative approach for white_labeled_pages
create policy "Public read access for active pages" on white_labeled_pages
  for select using (active = true);

create policy "Creators write access within tenant" on white_labeled_pages
  for insert, update, delete using (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = creator_id
  );
```

## Implementation Patterns

### Client-Side Implementation

#### For Public APIs (Embed functionality)
```typescript
// Use regular server client (respects RLS policies)
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  
  // This will use public access policies
  const { data } = await supabase
    .from('creator_products')
    .select('*')
    .eq('active', true)
    .eq('creator_id', creatorId);
}
```

#### For Tenant-Specific APIs (Dashboard functionality)
```typescript
// Use tenant-aware wrapper
import { withTenantAuth } from '@/libs/api-utils/tenant-api-wrapper';

export const POST = withTenantAuth(async (request, context) => {
  // context.tenantId is automatically set
  // All database operations respect tenant isolation
  
  const supabase = await createSupabaseServerClient();
  // Tenant context is already set via middleware
});
```

#### For Admin Operations
```typescript
// Use admin client with explicit tenant context
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { setTenantContext } from '@/libs/supabase/tenant-context';

export async function adminOperation(tenantId: string) {
  await setTenantContext(tenantId);
  const supabase = await createSupabaseAdminClient();
  
  // Operations now respect tenant context
}
```

### Database Function Patterns

#### Tenant Context Management
```sql
-- Set tenant context for session
create or replace function set_current_tenant(tenant_uuid uuid)
returns void as $$
begin
  perform set_config('app.current_tenant', tenant_uuid::text, true);
end;
$$ language plpgsql security definer;

-- Get current tenant context
create or replace function get_current_tenant()
returns uuid as $$
begin
  return current_setting('app.current_tenant', true)::uuid;
exception 
  when others then
    return null;
end;
$$ language plpgsql;
```

#### Public Access Helper
```sql
-- Check if access should be public (for hybrid policies)
create or replace function is_public_access()
returns boolean as $$
begin
  -- Return true if no tenant context is set (public access)
  return get_current_tenant() is null;
end;
$$ language plpgsql;

-- Example usage in policy
create policy "Hybrid access example" on some_table
  for select using (
    active = true AND is_public_access()
    OR
    tenant_id = current_setting('app.current_tenant')::uuid
  );
```

## Testing Guidelines

### 1. Public Access Tests
```typescript
describe('Public Access', () => {
  it('should allow public viewing of active products', async () => {
    // Test without authentication or tenant context
    const response = await fetch('/api/embed/product/creator-id/product-id');
    expect(response.ok).toBe(true);
  });
  
  it('should deny access to inactive products', async () => {
    const response = await fetch('/api/embed/product/creator-id/inactive-product-id');
    expect(response.status).toBe(404);
  });
});
```

### 2. Tenant Isolation Tests
```typescript
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    await setTenantContext(tenant1Id);
    const data1 = await getCreatorProducts(creatorId);
    
    await setTenantContext(tenant2Id);
    const data2 = await getCreatorProducts(creatorId);
    
    // Should return different data or no data for tenant2
    expect(data1).not.toEqual(data2);
  });
});
```

### 3. Hybrid Access Tests
```typescript
describe('Hybrid Access', () => {
  it('should allow public viewing and tenant management', async () => {
    // Public access - no tenant context
    const publicData = await supabase
      .from('creator_products')
      .select('*')
      .eq('active', true);
    
    // Tenant access - with context
    await setTenantContext(tenantId);
    const tenantData = await supabase
      .from('creator_products')
      .select('*');
    
    // Public should be subset of tenant data
    expect(publicData.data.length).toBeLessThanOrEqual(tenantData.data.length);
  });
});
```

## Security Considerations

### 1. Data Exposure Prevention
- Always use `active = true` condition for public policies
- Never expose sensitive fields in public policies
- Implement proper field-level security where needed

### 2. Audit Logging
- Log all policy changes and access patterns
- Monitor for unusual cross-tenant access attempts
- Track public API usage patterns

### 3. Performance Impact
- Index tenant_id columns for efficient filtering
- Monitor query performance with RLS enabled
- Consider materialized views for complex public queries

## Migration Strategy

### Phase 1: Fix Critical Issues (Completed)
- ✅ Restore public access policies for `creator_products`
- ✅ Restore public access policies for `white_labeled_pages`
- ✅ Document policy patterns and implementation

### Phase 2: Comprehensive Review (Future)
- Review all tables for appropriate RLS policies
- Implement missing policies for new tables
- Add field-level security where needed

### Phase 3: Advanced Features (Future)
- Implement role-based access within tenants
- Add feature flags for tenant-specific functionality
- Enhance audit logging and monitoring

## Conclusion

The RLS audit identified critical issues with public access that have been resolved through hybrid policies. The implemented solution maintains:

- **Public accessibility** for marketing and embed use cases
- **Complete tenant isolation** for management operations  
- **Security boundaries** between different tenants
- **Compliance** with multi-tenant architecture requirements

The hybrid approach provides the flexibility needed for a SaaS platform while maintaining security and compliance standards.