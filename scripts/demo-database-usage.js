#!/usr/bin/env node

/**
 * Demo Database Usage Script
 * Shows how to interact with the Staryer database after setup
 */

console.log('🎭 Staryer Database Demo Usage Examples\n');

console.log('After running the setup-staryer-database.sql script, you can:');

console.log('\n1️⃣ CONNECT TO YOUR DATABASE:');
console.log(`
// JavaScript/Node.js with Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)
`);

console.log('\n2️⃣ SET TENANT CONTEXT (Multi-tenant):');
console.log(`
// Set tenant context for data isolation
await supabase.rpc('set_current_tenant', { 
  tenant_uuid: '00000000-0000-0000-0000-000000000001' 
})
`);

console.log('\n3️⃣ QUERY TEST DATA:');
console.log(`
// Get all creators in the demo tenant
const { data: creators } = await supabase
  .from('creator_profiles')
  .select('*')
  .eq('tenant_id', '00000000-0000-0000-0000-000000000001')

console.log('Demo creators:', creators)
`);

console.log('\n4️⃣ VIEW USAGE ANALYTICS:');
console.log(`
// Get usage events for the last 7 days
const { data: usage } = await supabase
  .from('usage_events')
  .select('*')
  .gte('event_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  .order('event_timestamp', { ascending: false })

console.log('Recent usage:', usage.length, 'events')
`);

console.log('\n5️⃣ CHECK SUBSCRIPTION STATUS:');
console.log(`
// Get active subscriptions
const { data: subscriptions } = await supabase
  .from('customer_tier_assignments')
  .select('*, subscription_tiers(*), creator_profiles(*)')
  .eq('status', 'active')

console.log('Active subscriptions:', subscriptions)
`);

console.log('\n6️⃣ BROWSE PRODUCTS:');
console.log(`
// Get all active creator products (public access)
const { data: products } = await supabase
  .from('creator_products')
  .select('*, creator_profiles(business_name)')
  .eq('active', true)

console.log('Available products:', products)
`);

console.log('\n7️⃣ AUDIT TRAIL EXAMPLE:');
console.log(`
// Add an audit log entry
const { data: auditId } = await supabase.rpc('add_audit_log', {
  p_action: 'user_login',
  p_resource_type: 'auth',
  p_resource_id: 'user_123',
  p_new_value: { login_method: 'email', success: true }
})
`);

console.log('\n8️⃣ DIRECT SQL QUERIES:');
console.log(`
-- Get usage summary by creator
SELECT 
  cp.business_name,
  COUNT(ue.id) as total_events,
  SUM(ue.event_value) as total_usage
FROM creator_profiles cp
LEFT JOIN usage_meters um ON cp.id = um.creator_id
LEFT JOIN usage_events ue ON um.id = ue.meter_id
WHERE ue.event_timestamp > NOW() - INTERVAL '30 days'
GROUP BY cp.id, cp.business_name;

-- Check tenant data isolation
SELECT 
  t.name as tenant_name,
  COUNT(DISTINCT cp.id) as creators,
  COUNT(DISTINCT u.id) as users
FROM tenants t
LEFT JOIN creator_profiles cp ON t.id = cp.tenant_id
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name;
`);

console.log('\n📊 TEST DATA OVERVIEW:');
console.log(`
The database includes:
• 1 Demo tenant: "Staryer Demo Platform"
• 2 Creators: "TechGuru Solutions" & "Creative Studio Pro" 
• 2 End users with active subscriptions
• 4 Products across different categories
• 9000+ usage events over 30 days
• Complete audit trail of all actions
• API keys for integrations
• White-labeled pages for branding
`);

console.log('\n🚀 NEXT STEPS:');
console.log(`
1. Run the setup script in your Supabase project
2. Configure your app's connection to Supabase
3. Set up authentication flow with the test users
4. Implement tenant context switching in your app
5. Connect Stripe for payment processing
6. Set up usage tracking in your product
7. Configure audit logging for compliance
`);

console.log('\n📚 USEFUL QUERIES FOR DEVELOPMENT:');
console.log(`
-- Reset demo usage data
DELETE FROM usage_events WHERE created_at > NOW() - INTERVAL '1 day';

-- Create new tenant
SELECT create_tenant('My New Tenant', 'mynew');

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Monitor performance
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats WHERE schemaname = 'public';
`);

console.log('\n✅ Database setup complete! Ready for development and testing.');