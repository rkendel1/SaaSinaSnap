/**
 * Multi-Tenant Usage Examples
 * This file demonstrates how to use the multi-tenant features
 */

// Example 1: Track usage for a specific tenant
async function trackUsageExample() {
  // Usage would be tracked via API call from your application
  const response = await fetch('/api/v1/usage/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
      // Tenant context is automatically resolved from subdomain/domain
    },
    body: JSON.stringify({
      meter_id: 'api-calls-meter-id',
      user_id: 'customer-user-id',
      event_value: 1,
      properties: {
        endpoint: '/api/v1/data',
        method: 'GET',
        response_time: 150
      }
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Usage tracked successfully:', result.data);
    console.log('Current usage:', result.data.enforcement.current_usage);
    console.log('Remaining quota:', result.data.enforcement.remaining);
  } else {
    console.error('Usage tracking failed:', result.error);
  }
}

// Example 2: Create subscription tiers for a tenant
async function createTierExample() {
  const response = await fetch('/api/v1/tiers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creatorToken}`,
    },
    body: JSON.stringify({
      name: 'Professional',
      description: 'For growing businesses',
      price: 49.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'custom_domain',
        'team_seats:10',
        'api_access',
        'premium_support'
      ],
      usage_caps: {
        'api_calls': 100000,
        'projects_created': 50,
        'storage_gb': 100
      },
      trial_period_days: 14
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Tier created successfully:', result.data);
  } else {
    console.error('Tier creation failed:', result.error);
  }
}

// Example 3: Server-side usage with tenant context
async function serverSideUsageExample() {
  // In your Next.js API route or server action
  
  import { withTenantAuth } from '@/libs/api-utils/tenant-api-wrapper';
  import { TenantUsageTrackingService } from '@/features/usage-tracking/services/tenant-usage-tracking-service';
  import { AuditLogger } from '@/libs/audit/audit-logger';
  import { TenantAnalytics } from '@/libs/analytics/tenant-analytics';
  
  const handler = withTenantAuth(async (request, context) => {
    try {
      // The tenant context is automatically set
      console.log('Current tenant:', context.tenantId);
      console.log('Authenticated user:', context.user.id);
      
      // Track usage with automatic tenant isolation
      const usageEvent = await TenantUsageTrackingService.trackUsage({
        meter_id: 'api-calls-meter',
        user_id: context.user.id,
        event_value: 1,
        properties: {
          endpoint: '/api/protected-resource',
          user_agent: request.headers.get('user-agent')
        }
      });
      
      // Log audit trail
      await AuditLogger.logApiAccess(
        '/api/protected-resource',
        'GET',
        context.user.id,
        { action: 'data_retrieved' }
      );
      
      // Track analytics
      await TenantAnalytics.trackFeatureUsage(
        context.user.id,
        'data_export',
        'executed',
        context.user.id,
        { format: 'json', records: 1500 }
      );
      
      return ApiResponse.success({ 
        message: 'Data retrieved successfully',
        usage_tracked: true
      });
      
    } catch (error) {
      return ApiResponse.error(error.message, 500);
    }
  });
}

// Example 4: Connector integration with tenant context
async function connectorExample() {
  import { ConnectorEventsService } from '@/libs/connectors/connector-events';
  
  // Log Slack notification
  const slackEventId = await ConnectorEventsService.logSlackMessage(
    '#alerts',
    'Usage limit reached for customer ABC',
    'admin-user-id',
    'slack-message-id-123'
  );
  
  // Update status when message is sent
  await ConnectorEventsService.updateEventStatus(
    slackEventId, 
    'completed'
  );
  
  // Log PostHog event
  await ConnectorEventsService.logPostHogEvent(
    'tier_upgraded',
    { 
      old_tier: 'free',
      new_tier: 'pro',
      upgrade_reason: 'usage_limit_reached'
    },
    'customer-distinct-id',
    'customer-user-id'
  );
  
  // Log CRM sync
  await ConnectorEventsService.logCrmSync(
    'salesforce',
    'contact',
    {
      contact_id: 'sf-contact-123',
      fields_updated: ['tier', 'usage_quota', 'last_activity']
    },
    'admin-user-id',
    'sf-contact-123'
  );
}

// Example 5: Analytics with tenant context
async function analyticsExample() {
  import { TenantAnalytics } from '@/libs/analytics/tenant-analytics';
  
  // Track various events with automatic tenant context
  
  // User authentication
  await TenantAnalytics.trackAuth(
    'user-distinct-id',
    'login',
    'user-id',
    { login_method: 'email' }
  );
  
  // API usage
  await TenantAnalytics.trackApiCall(
    'user-distinct-id',
    '/api/v1/data/export',
    'POST',
    250, // response time
    200, // status code
    'user-id'
  );
  
  // Feature usage
  await TenantAnalytics.trackFeatureUsage(
    'user-distinct-id',
    'dashboard',
    'viewed',
    'user-id',
    { page: 'analytics', duration: 45 }
  );
  
  // Tier changes
  await TenantAnalytics.trackTierChange(
    'user-distinct-id',
    'free',
    'professional',
    'user-id',
    { upgrade_reason: 'manual', payment_method: 'stripe' }
  );
  
  // Errors
  await TenantAnalytics.trackError(
    'user-distinct-id',
    'api_error',
    'Rate limit exceeded',
    'at processRequest (api.js:45)',
    'user-id'
  );
}

// Example 6: Audit logging
async function auditExample() {
  import { AuditLogger } from '@/libs/audit/audit-logger';
  
  // Log user changes
  await AuditLogger.logUserUpdated(
    'user-id',
    { email: 'old@example.com', name: 'Old Name' },
    { email: 'new@example.com', name: 'New Name' },
    { updated_by: 'admin-id', reason: 'profile_update' }
  );
  
  // Log tier changes
  await AuditLogger.logTierChanged(
    'customer-id',
    { tier: 'free', price: 0 },
    { tier: 'pro', price: 49.99 },
    { 
      change_reason: 'upgrade',
      payment_method: 'stripe',
      stripe_subscription_id: 'sub_123'
    }
  );
  
  // Log configuration changes
  await AuditLogger.logConfigChange(
    'api_settings',
    { rate_limit: 100, timeout: 30 },
    { rate_limit: 200, timeout: 60 },
    { changed_by: 'admin-id', reason: 'performance_optimization' }
  );
  
  // Get audit logs for compliance
  const auditLogs = await AuditLogger.getAuditLogs(
    'user', // resource type
    'user-123', // resource id
    50, // limit
    0 // offset
  );
  
  console.log('Audit trail:', auditLogs);
}

// Example 7: Tenant setup and management (platform owner functionality)
async function tenantManagementExample() {
  import { createTenant, getTenantBySubdomain } from '@/libs/supabase/tenant-context';
  
  // Create a new tenant
  const tenant = await createTenant(
    'Acme Corporation',
    'acme', // subdomain: acme.yourplatform.com
    {
      branding: {
        primary_color: '#1a365d',
        logo_url: 'https://acme.com/logo.png'
      },
      features: {
        custom_domain: true,
        white_label: true,
        api_access: true
      },
      limits: {
        max_users: 1000,
        max_projects: 100
      }
    }
  );
  
  console.log('Tenant created:', tenant);
  
  // Later, resolve tenant from subdomain
  const resolvedTenant = await getTenantBySubdomain('acme');
  console.log('Resolved tenant:', resolvedTenant);
}

// Example 8: Usage enforcement check
async function usageEnforcementExample() {
  import { TenantUsageTrackingService } from '@/features/usage-tracking/services/tenant-usage-tracking-service';
  
  // Check if user can perform action
  const enforcement = await TenantUsageTrackingService.checkUsageEnforcement(
    'customer-user-id',
    'api-calls-meter-id',
    5 // requesting 5 API calls
  );
  
  if (enforcement.allowed) {
    console.log('Action allowed');
    console.log('Current usage:', enforcement.current_usage);
    console.log('Remaining quota:', enforcement.remaining);
    
    // Proceed with action and track usage
    // ... perform the actual API calls ...
    
    // Track the usage
    await TenantUsageTrackingService.trackUsage({
      meter_id: 'api-calls-meter-id',
      user_id: 'customer-user-id',
      event_value: 5
    });
  } else {
    console.log('Action blocked:', enforcement.reason);
    // Suggest upgrade or wait for quota reset
  }
}

export {
  trackUsageExample,
  createTierExample,
  serverSideUsageExample,
  connectorExample,
  analyticsExample,
  auditExample,
  tenantManagementExample,
  usageEnforcementExample
};