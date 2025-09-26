/**
 * RESTORE PUBLIC ACCESS POLICIES
 * Note: This migration restores public access to creator_products and white_labeled_pages
 * while maintaining tenant isolation for private operations.
 * 
 * The multi-tenant migration (20241230000000_add_multi_tenant_support.sql) removed
 * the public access policies, breaking public embed functionality and landing pages.
 * 
 * This fix implements a hybrid approach:
 * - Public read access for active content (products and pages)
 * - Tenant-isolated management access for creators
 */

-- Restore public access policies for creator_products
-- This allows public viewing of active products for embed functionality
create policy "Public can view active products" on creator_products
  for select using (active = true);

-- Add tenant-aware creator management policy for creator_products
-- This allows creators to manage their products within their tenant context
create policy "Creators can manage their tenant products" on creator_products
  for all using (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = creator_id
  );

-- Restore public access policies for white_labeled_pages  
-- This allows public viewing of active landing pages
create policy "Public can view active pages" on white_labeled_pages
  for select using (active = true);

-- Add tenant-aware creator management policy for white_labeled_pages
-- This allows creators to manage their pages within their tenant context
create policy "Creators can manage their tenant pages" on white_labeled_pages
  for all using (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = creator_id
  );

/**
 * POLICY EXPLANATION:
 * 
 * These policies implement a hybrid access model:
 * 
 * 1. PUBLIC ACCESS (for embed APIs and public viewing):
 *    - Anyone can SELECT from creator_products WHERE active = true
 *    - Anyone can SELECT from white_labeled_pages WHERE active = true
 *    - This enables public embed functionality, product catalogs, and landing pages
 * 
 * 2. TENANT-ISOLATED MANAGEMENT (for creator dashboards):
 *    - Creators can perform ALL operations on their own data
 *    - BUT only when tenant context is properly set
 *    - AND only on their own records (creator_id = auth.uid())
 * 
 * This approach maintains:
 * - Public accessibility for marketing/embed use cases
 * - Complete tenant isolation for management operations
 * - Security boundaries between different tenants
 * - Compliance with multi-tenant architecture
 */

/**
 * IMPACT ON APIS:
 * 
 * After this migration:
 * ✅ /api/embed/creator/[creatorId] - Can read active creator profiles
 * ✅ /api/embed/product/[creatorId]/[productId] - Can read active products  
 * ✅ /api/embed/pricing/[creatorId] - Can read active products for pricing
 * ✅ /api/embed/checkout-session - Can access product data for checkout
 * ✅ Public landing pages - Can view active white-labeled pages
 * 
 * Tenant-specific operations still require proper tenant context:
 * 🔒 Creator dashboard product management - Requires tenant context + auth
 * 🔒 Creator dashboard page management - Requires tenant context + auth
 * 🔒 Analytics and private data - Remains tenant-isolated
 */