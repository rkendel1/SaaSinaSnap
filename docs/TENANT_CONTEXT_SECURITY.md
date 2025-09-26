# Tenant Context Security & Multi-Tenancy Enhancements

This document describes the enhanced tenant context validation and security measures implemented to ensure proper multi-tenant data isolation.

## Overview

The multi-tenant system now includes comprehensive defensive checks and validation to ensure that `setTenantContext()` is always called before tenant-aware database operations, with enhanced logging and monitoring capabilities.

## Key Enhancements

### 1. Enhanced Tenant Context Validation

#### `setTenantContext()` Improvements
- **UUID Format Validation**: Validates tenant IDs are properly formatted UUIDs
- **Enhanced Error Logging**: Detailed logging with timestamps, error codes, and context
- **Input Validation**: Rejects empty or invalid tenant IDs early

```typescript
// Before
await setTenantContext(tenantId);

// After - includes validation and logging
await setTenantContext(tenantId); // Validates UUID format, logs errors with context
```

#### `ensureTenantContext()` Improvements
- **Null Validation**: Checks for null tenant context after database validation
- **Enhanced Error Messages**: More descriptive error messages for debugging
- **Debug Logging**: Logs successful validations for monitoring

### 2. Defensive Database Operations Wrapper

#### `withTenantContext()` Function
A new defensive wrapper that ensures all database operations have proper tenant context:

```typescript
// Usage
const result = await withTenantContext(async (supabase) => {
  return await supabase
    .from('table_name')
    .select('*')
    .eq('some_field', value);
});

// Features:
// - Automatically gets tenant context from multiple sources
// - Validates UUID format
// - Handles context mismatches
// - Provides comprehensive error logging
// - Ensures proper tenant isolation
```

**Context Resolution Order:**
1. Explicit context parameter
2. Headers (`x-tenant-id`)  
3. Existing database context
4. Throws error if none available

### 3. Enhanced API Wrapper Security

#### `withTenantContext()` API Wrapper Improvements
- **Mandatory Tenant ID Validation**: Rejects requests without proper tenant context
- **UUID Format Validation**: Validates tenant ID format before processing
- **Context Validation**: Ensures database context matches request context
- **Enhanced Error Logging**: Detailed logging for debugging and monitoring

```typescript
// Enhanced validation flow:
export function withTenantContext(handler: TenantApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 1. Extract and validate tenant ID from headers
    // 2. Validate UUID format
    // 3. Set and validate database context
    // 4. Execute handler with validated context
    // 5. Enhanced error handling and logging
  };
}
```

### 4. Service Layer Improvements

#### AuditLogger
```typescript
// Before - direct database access
static async log(entry: AuditLogEntry): Promise<string> {
  const supabase = await createSupabaseAdminClient();
  // ... database operation
}

// After - defensive validation
static async log(entry: AuditLogEntry): Promise<string> {
  return withTenantContext(async (supabase) => {
    const tenantId = await ensureTenantContext();
    // ... validated database operation with logging
  });
}
```

#### TenantAnalytics
- **Context Validation**: Ensures tenant context before analytics operations
- **Fallback Strategies**: Multiple ways to obtain tenant context
- **Error Handling**: Graceful handling when context is unavailable

#### TenantUsageTrackingService
- **Defensive Validation**: All operations use `withTenantContext()` wrapper
- **Enhanced Error Logging**: Detailed context in error messages
- **Meter Validation**: Ensures meters belong to the correct tenant

### 5. Database-Level Enhancements

#### Enhanced PostgreSQL Functions
```sql
-- Validates tenant context with logging
CREATE OR REPLACE FUNCTION validate_tenant_context_for_operation(
  p_operation_name text,
  p_table_name text default null,
  p_resource_id text default null
)

-- Enhanced set_current_tenant with validation
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_uuid uuid)

-- Monitoring and statistics functions
CREATE OR REPLACE FUNCTION get_tenant_context_stats(p_hours_back integer)
```

#### Database Triggers
```sql
-- Automatic tenant context validation on inserts
CREATE TRIGGER tenant_context_check_trigger
  BEFORE INSERT ON usage_events
  FOR EACH ROW EXECUTE FUNCTION check_tenant_context_before_insert();
```

#### Monitoring Views
```sql
-- Real-time monitoring of tenant context issues
CREATE VIEW tenant_context_monitoring AS ...
```

## Security Benefits

### 1. **Data Isolation Guarantees**
- All database operations require valid tenant context
- Automatic validation prevents cross-tenant data access
- UUID format validation prevents injection attacks

### 2. **Audit Trail**
- All tenant context operations are logged
- Failed validation attempts are tracked
- Monitoring dashboard for security analysis

### 3. **Defensive Programming**
- Multiple validation layers
- Graceful error handling
- Comprehensive logging for debugging

### 4. **Performance Monitoring**
- Context validation statistics
- Failed operation tracking
- Response time monitoring

## Implementation Guidelines

### For New Services
```typescript
// Use the defensive wrapper for all database operations
export class MyService {
  static async myOperation(data: any): Promise<Result> {
    return withTenantContext(async (supabase) => {
      const tenantId = await ensureTenantContext();
      
      // Your database operations here
      const result = await supabase
        .from('my_table')
        .insert({ ...data, tenant_id: tenantId });
        
      return result.data;
    });
  }
}
```

### For API Routes
```typescript
// Use the enhanced API wrapper
export const POST = withTenantContext(async (request, context) => {
  // context.tenantId is validated and guaranteed to be available
  // context.supabase is pre-configured with tenant context
  
  const data = await getRequestData(request);
  const result = await MyService.myOperation(data);
  
  return ApiResponse.success(result);
});
```

### For Direct Database Access
```typescript
// Always ensure tenant context is set
const tenantId = await ensureTenantContext();
const supabase = await createTenantAwareSupabaseClient(tenantId);

// Or use the defensive wrapper
const result = await withTenantContext(async (supabase) => {
  return await supabase.from('table').select('*');
});
```

## Error Scenarios & Handling

### 1. **Missing Tenant Context**
```
Error: Database operation requires tenant context. Ensure setTenantContext() is called first.
```
**Resolution**: Ensure tenant context is set via middleware or explicitly

### 2. **Invalid Tenant ID Format**
```
Error: Invalid tenant ID format: invalid-uuid
```
**Resolution**: Validate tenant ID format before setting context

### 3. **Context Mismatch**
```
Warning: Tenant context mismatch detected, resetting...
```
**Action**: Automatically resets context to correct value

### 4. **Database Validation Failure**
```
Error: Tenant context not set: [database error message]
```
**Resolution**: Check database connectivity and RLS policies

## Monitoring & Alerts

### Database Queries for Monitoring
```sql
-- Get tenant context statistics
SELECT * FROM get_tenant_context_stats(24);

-- Monitor failed validations
SELECT * FROM tenant_context_monitoring 
WHERE status = 'CONTEXT_FAILURE' 
ORDER BY created_at DESC LIMIT 100;

-- Check tenant activity
SELECT tenant_name, COUNT(*) as operations
FROM tenant_context_monitoring 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY tenant_name;
```

### Log Analysis
Search for these patterns in application logs:
- `"Tenant context validation failed"`
- `"Database operation attempted without tenant context"`
- `"Invalid tenant ID format"`
- `"Tenant context mismatch detected"`

## Testing

Comprehensive test suite covers:
- ✅ Tenant ID validation (empty, invalid format, valid UUIDs)
- ✅ Context validation (missing, null, mismatched)
- ✅ Defensive wrapper functionality
- ✅ API wrapper security
- ✅ Service integration
- ✅ Error scenarios and edge cases

Run tests:
```bash
npm run test src/__tests__/multi-tenant/
```

## Migration Guide

### Updating Existing Services
1. **Import defensive wrapper**: `import { withTenantContext } from '@/libs/supabase/tenant-context'`
2. **Wrap database operations**: Use `withTenantContext()` for all database access
3. **Update error handling**: Handle new error types and enhanced error messages
4. **Add logging**: Leverage enhanced logging capabilities

### Database Migration
```bash
# Apply the enhanced tenant validation migration
npx supabase migration up --linked

# Generate updated types
npm run generate-types
```

## Best Practices

1. **Always Use Defensive Wrappers**: Use `withTenantContext()` for database operations
2. **Validate Early**: Check tenant context as early as possible in request flow
3. **Log Comprehensively**: Use the enhanced logging for debugging and monitoring
4. **Monitor Regularly**: Review tenant context statistics and failed validations
5. **Test Thoroughly**: Include tenant context validation in all tests
6. **Handle Errors Gracefully**: Provide meaningful error messages to developers

## Security Checklist

- ✅ All database operations require tenant context
- ✅ UUID format validation prevents injection
- ✅ Cross-tenant access is prevented
- ✅ Failed validations are logged and monitored
- ✅ Database-level triggers provide additional validation
- ✅ Comprehensive test coverage ensures security
- ✅ Monitoring views provide real-time visibility
- ✅ Audit trails track all tenant operations

This implementation provides defense-in-depth security for multi-tenant data isolation while maintaining performance and developer experience.