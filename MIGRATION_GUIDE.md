# Complete Database Schema Rebuild Migration Guide

## Overview

The `20250109000000_complete_schema_rebuild.sql` migration provides a comprehensive solution to rebuild the entire SaaSinaSnap database schema. This migration:

1. **Drops all existing columns** in the database schema
2. **Rebuilds the entire database** schema with proper relationships
3. **Implements comprehensive Row-Level Security (RLS)** policies
4. **Ensures proper migration sequence** without runtime errors
5. **Maintains data integrity** throughout the process

## ⚠️ Important Warnings

**This migration will COMPLETELY DROP AND RECREATE all database tables. All existing data will be PERMANENTLY LOST.**

- Only run this migration on development/staging environments initially
- Create a full database backup before running this migration
- Test thoroughly before applying to production
- Consider data migration strategies if you need to preserve existing data

## What This Migration Does

### 🗑️ Complete Schema Drop
- Drops all RLS policies to avoid dependency issues
- Drops all functions and triggers
- Drops all tables in proper dependency order (36 tables total)
- Drops storage policies and buckets
- Drops custom types and indexes

### 🏗️ Complete Schema Rebuild
- Recreates 4 custom PostgreSQL types
- Creates 36 tables with proper relationships and constraints
- Implements 52 RLS policies for comprehensive security
- Creates 40 strategic indexes for performance
- Sets up 7 utility functions for tenant management
- Configures 18 triggers for automated updates
- Sets up storage buckets and policies
- Configures realtime subscriptions

## Schema Components

### Core Architecture
- **Multi-tenant architecture** with tenant isolation
- **User management** extending Supabase auth
- **Stripe integration** for payments and subscriptions
- **Creator system** for SaaS builders
- **Usage tracking and metering** for billing
- **Comprehensive audit logging** for compliance

### Tables Created (36 total)
1. **Authentication & Users**: users, customers, tenants
2. **Stripe Integration**: products, prices, subscriptions
3. **Creator System**: creator_profiles, creator_products, creator_analytics, creator_webhooks
4. **Subscription Management**: subscription_tiers, customer_tier_assignments, tier_analytics, tier_usage_overages
5. **Usage Tracking**: usage_meters, meter_plan_limits, usage_events, usage_aggregates, usage_alerts, usage_billing_sync
6. **White-labeling**: white_labeled_pages, embed_assets, asset_sharing_logs
7. **API Management**: api_keys, api_key_usage, api_key_rotations, creator_api_key_configs
8. **Environment Management**: stripe_environment_configs, product_environment_deployments, environment_sync_logs
9. **File Analysis**: site_analysis, generated_headers
10. **Analytics**: analytics_events, connector_events
11. **System**: platform_settings, audit_logs

### Security Features
- **Row-Level Security** on all 36 tables
- **Tenant isolation** with 27 tenant-specific policies
- **Role-based access control** with user roles
- **Storage security** with bucket-level policies
- **API key management** with usage tracking

## How to Run This Migration

### Using Supabase CLI (Recommended)
```bash
# Make sure you're in the project directory
cd /path/to/SaaSinaSnap

# Run the migration
supabase db reset

# Or apply specific migration
supabase migration up --include-all
```

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `20250109000000_complete_schema_rebuild.sql`
4. Click "Run" to execute the migration

### Using Direct SQL Connection
```bash
# Connect to your database
psql "your-database-connection-string"

# Run the migration file
\i supabase/migrations/20250109000000_complete_schema_rebuild.sql
```

## Verification Steps

After running the migration, verify it was successful:

### 1. Check Table Count
```sql
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 36
```

### 2. Check RLS Policies
```sql
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
-- Should return 52
```

### 3. Check Functions
```sql
SELECT count(*) FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Should return 7
```

### 4. Test Tenant Functions
```sql
-- Test creating a tenant
SELECT create_tenant('Test Tenant', 'test-subdomain');

-- Test setting tenant context
SELECT set_current_tenant('your-tenant-id');

-- Test getting tenant context
SELECT get_current_tenant();
```

## Post-Migration Setup

### 1. Configure Tenant Context
For multi-tenant applications, ensure you set the tenant context in your application:

```javascript
// Example: Set tenant context in your app
await supabase.rpc('set_current_tenant', { tenant_uuid: 'your-tenant-id' });
```

### 2. Test RLS Policies
Verify that RLS policies are working correctly by testing data access with different user contexts.

### 3. Configure Storage
The migration creates a `creator-assets` storage bucket. Configure additional settings as needed in your Supabase dashboard.

### 4. Set Up Realtime
Realtime subscriptions are configured for key tables. Test your realtime functionality.

## Rollback Strategy

⚠️ **This migration cannot be easily rolled back** due to its comprehensive nature. If you need to rollback:

1. Restore from a database backup taken before the migration
2. Or run the individual CREATE statements from previous migration files

## Troubleshooting

### Common Issues

1. **Foreign Key Violations**: Ensure all referenced tables exist before creating dependent tables
2. **RLS Policy Conflicts**: Check that policies don't conflict with existing ones
3. **Index Creation Failures**: Verify table structure before index creation
4. **Function Dependencies**: Ensure all referenced functions are created in order

### Support

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify your database permissions
3. Ensure you're using PostgreSQL 15+ 
4. Review the migration file for any syntax issues

## Migration Statistics

- **Total Lines**: 1,446
- **Tables Created**: 36
- **RLS Policies**: 52
- **Indexes**: 40
- **Functions**: 7
- **Triggers**: 18
- **File Size**: ~53KB

This migration provides a complete, production-ready database schema for the SaaSinaSnap platform with comprehensive security, performance optimization, and multi-tenant support.