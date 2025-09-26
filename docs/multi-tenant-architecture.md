# Multi-Tenant Architecture

This document describes the multi-tenant architecture implementation for the Staryer platform, enabling secure data isolation and per-tenant features.

## Overview

The multi-tenant system provides complete data isolation between tenants using Row-Level Security (RLS) in PostgreSQL/Supabase, ensuring compliance with standards like GDPR and SOC2.

## Key Features

- **Complete Data Isolation**: RLS policies ensure tenants can only access their own data
- **Automatic Tenant Resolution**: Tenant context resolved from subdomains or custom domains
- **Comprehensive Audit Logging**: All actions logged with tenant context for compliance
- **Analytics Integration**: PostHog events include tenant context for per-tenant dashboards
- **Connector Integration**: All external integrations respect tenant boundaries
- **Usage Tracking**: Multi-tenant usage metering and billing enforcement

## Architecture Components

### 1. Database Schema

#### Core Changes
- Added `tenant_id` column to all relevant tables
- Created `tenants` table for tenant management
- Created `audit_logs` table for compliance tracking
- Created `connector_events` table for integration tracking
- Created `analytics_events` table for PostHog integration

#### Row-Level Security (RLS)
All tables have RLS policies that automatically filter data by tenant:
```sql
CREATE POLICY "tenant_isolation" ON table_name 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### 2. Tenant Context Management

#### Automatic Resolution
The system automatically resolves tenant context from:
- Subdomains: `tenant.yourplatform.com`
- Custom domains: `tenant-custom-domain.com`

#### Context Setting
```typescript
// Set tenant context for database operations
await setTenantContext(tenantId);

// Get current tenant context
const currentTenant = await getTenantContext();
```

### 3. API Layer

#### Tenant-Aware Wrappers
```typescript
import { withTenantContext, withTenantAuth } from '@/libs/api-utils/tenant-api-wrapper';

// Automatic tenant context handling
export const POST = withTenantAuth(async (request, context) => {
  // context.tenantId is automatically available
  // All database operations respect tenant isolation
});
```

### 4. Services

#### Usage Tracking Service
```typescript
import { TenantUsageTrackingService } from '@/features/usage-tracking/services/tenant-usage-tracking-service';

// Track usage with automatic tenant isolation
await TenantUsageTrackingService.trackUsage({
  meter_id: 'api-calls',
  user_id: 'customer-id',
  event_value: 1
});
```

#### Audit Logger
```typescript
import { AuditLogger } from '@/libs/audit/audit-logger';

// Log changes with tenant context
await AuditLogger.logUserUpdated(userId, oldData, newData);
```

#### Analytics Service
```typescript
import { TenantAnalytics } from '@/libs/analytics/tenant-analytics';

// Track events with tenant context
await TenantAnalytics.trackApiCall(distinctId, endpoint, method);
```

#### Connector Events
```typescript
import { ConnectorEventsService } from '@/libs/connectors/connector-events';

// Log connector actions with tenant context
await ConnectorEventsService.logSlackMessage(channel, message, userId);
```

## Usage Examples

### 1. API Usage Tracking
```javascript
// POST /api/v1/usage/track
{
  "meter_id": "api-calls-meter-id",
  "user_id": "customer-user-id", 
  "event_value": 1,
  "properties": {
    "endpoint": "/api/v1/data",
    "method": "GET"
  }
}
```

### 2. Tier Management
```javascript
// POST /api/v1/tiers
{
  "name": "Professional",
  "price": 49.99,
  "usage_caps": {
    "api_calls": 100000,
    "projects": 50
  },
  "feature_entitlements": ["custom_domain", "api_access"]
}
```

### 3. Server-Side Integration
```typescript
import { withTenantAuth, ApiResponse } from '@/libs/api-utils/tenant-api-wrapper';

export const POST = withTenantAuth(async (request, context) => {
  // Tenant context automatically available
  // All operations respect tenant isolation
  
  const data = await processData(context.user.id);
  return ApiResponse.success(data);
});
```

## Security Features

### Row-Level Security (RLS)
- Automatic filtering by tenant_id on all queries
- Prevents cross-tenant data access
- Applied at database level for maximum security

### Audit Logging
- All changes logged with tenant context
- Immutable audit trail for compliance
- Includes user, action, old/new values, and metadata

### Access Control
- Tenant-aware authentication
- Role-based access within tenants
- API endpoint protection

## Compliance Features

### GDPR Compliance
- Complete data isolation per tenant
- Audit trail for data access and changes
- Right to be forgotten implementation ready
- Data portability support

### SOC2 Compliance
- Comprehensive audit logging
- Access controls and monitoring
- Data integrity and availability
- Security incident tracking

## Performance Considerations

### Indexes
All tables include optimized indexes for tenant-based queries:
```sql
CREATE INDEX idx_table_tenant_id ON table_name(tenant_id);
```

### Query Performance
- RLS policies use efficient tenant_id filtering
- Composite indexes for tenant + other frequent filters
- Automatic query plan optimization

### Caching
- Tenant context cached per request
- Database connection pooling respects tenant boundaries
- Query result caching includes tenant context

## Monitoring and Analytics

### Per-Tenant Dashboards
- PostHog events include tenant_id
- Separate analytics per tenant
- Usage and performance metrics

### System Monitoring
- Tenant-specific error tracking
- Performance monitoring per tenant
- Resource usage analytics

## Migration Guide

### Existing Data
1. Run migration: `20241230000000_add_multi_tenant_support.sql`
2. Update existing data with tenant_id values
3. Enable RLS policies
4. Update application code to use tenant-aware services

### API Updates
1. Replace usage tracking calls with tenant-aware versions
2. Update tier management to use new APIs
3. Add audit logging to sensitive operations
4. Integrate analytics with tenant context

## Testing

### Tenant Isolation Testing
```typescript
// Test that tenants cannot access each other's data
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    await setTenantContext(tenant1Id);
    const data1 = await getData();
    
    await setTenantContext(tenant2Id);
    const data2 = await getData();
    
    expect(data1).not.toContain(data2);
  });
});
```

### Usage Tracking Testing
```typescript
// Test usage enforcement across tenants
describe('Usage Enforcement', () => {
  it('should enforce limits per tenant', async () => {
    const result = await TenantUsageTrackingService.checkUsageEnforcement(
      userId, meterId, requestedAmount
    );
    expect(result.allowed).toBe(true);
  });
});
```

## Future Enhancements

### Hybrid Multi-Tenancy
- Single database for small tenants
- Dedicated databases for enterprise tenants
- Automatic scaling based on usage

### Advanced Features
- Tenant-level feature flags
- Custom branding per tenant
- White-label deployment options
- Multi-region data residency

## Support and Maintenance

### Monitoring
- Tenant health dashboards
- Usage analytics and alerts  
- Performance monitoring
- Security incident tracking

### Backup and Recovery
- Tenant-specific backups
- Point-in-time recovery per tenant
- Data export capabilities
- Disaster recovery procedures

## Conclusion

The multi-tenant architecture provides secure, scalable, and compliant data isolation while maintaining performance and usability. The implementation follows best practices for SaaS platforms and supports future growth and compliance requirements.