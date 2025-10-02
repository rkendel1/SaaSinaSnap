# Subscription Tier Management System

This document describes the comprehensive subscription tier management system that extends the Usage Tracking platform with automated billing, feature entitlements, and customer portals.

## 📚 Documentation Index

**Getting Started:**
- [Quick Start Guide](./TIERING_QUICKSTART.md) - Get up and running in 5 minutes
- [Integration Examples](./TIERING_INTEGRATION_EXAMPLES.md) - Next.js, Express, React, Vue examples

**Reference:**
- [API Reference](./TIERING_API_REFERENCE.md) - Complete API documentation
- [Testing Guide](./TIERING_TESTING_GUIDE.md) - Test procedures and sample events
- [Best Practices](./TIERING_BEST_PRACTICES.md) - Implementation guidelines

**Support:**
- [FAQ](./TIERING_FAQ.md) - Frequently asked questions
- [Troubleshooting](./TIERING_TROUBLESHOOTING.md) - Common issues and solutions

**Resources:**
- [Test Events](../tests/fixtures/tier-test-events.json) - Sample test data
- [Example Code](../examples/tier-management-example.js) - Working examples

## Overview

The Tier Management System allows SaaS creators to:
- Define subscription tiers with pricing, features, and usage caps
- Automatically enforce usage limits based on customer tiers
- Bill for overages beyond tier limits via Stripe
- Provide customer portals showing usage and billing information
- Generate analytics and insights on tier performance

## Architecture

```
[Customer Usage] → [Tier Enforcement] → [Usage Tracking] → [Billing Automation]
       ↓                    ↓                   ↓               ↓
[Feature Flags] ← [Tier Assignment] ← [Usage Analytics] ← [Stripe Integration]
       ↓                    ↓                   ↓               ↓
[Customer Portal] ← [Upgrade Recommendations] ← [Revenue Tracking] ← [Invoice Items]
```

## Database Schema

### Core Tables

#### `subscription_tiers`
Defines the subscription plans/tiers that creators offer:
```sql
- id: UUID (primary key)
- creator_id: UUID (foreign key to creator_profiles)
- name: TEXT (tier name, e.g., "Pro", "Enterprise")
- description: TEXT (optional description)
- price: DECIMAL (monthly/yearly price)
- currency: TEXT (3-letter currency code)
- billing_cycle: TEXT (monthly, yearly, weekly, daily)
- feature_entitlements: JSONB (array of feature names/limits)
- usage_caps: JSONB (object with metric_name: limit_value)
- active: BOOLEAN (whether tier is available)
- is_default: BOOLEAN (default tier for new customers)
- stripe_price_id: TEXT (Stripe price ID)
- stripe_product_id: TEXT (Stripe product ID)
- trial_period_days: INTEGER (free trial period)
```

#### `customer_tier_assignments`
Tracks which tier each customer is subscribed to:
```sql
- id: UUID (primary key)
- customer_id: UUID (foreign key to auth.users)
- creator_id: UUID (foreign key to creator_profiles)
- tier_id: UUID (foreign key to subscription_tiers)
- status: TEXT (active, canceled, past_due, trialing, paused)
- current_period_start: TIMESTAMP
- current_period_end: TIMESTAMP
- stripe_subscription_id: TEXT (Stripe subscription ID)
```

#### `tier_usage_overages`
Records usage beyond tier limits for billing:
```sql
- id: UUID (primary key)
- customer_id: UUID
- creator_id: UUID
- tier_id: UUID
- meter_id: UUID (foreign key to usage_meters)
- billing_period: TEXT (YYYY-MM format)
- limit_value: BIGINT (tier limit)
- actual_usage: NUMERIC (actual usage amount)
- overage_amount: NUMERIC (usage beyond limit)
- overage_price: DECIMAL (price per unit overage)
- overage_cost: DECIMAL (total overage cost)
- billed: BOOLEAN (whether overage has been billed)
```

#### `tier_analytics`
Pre-computed analytics for tier performance:
```sql
- id: UUID (primary key)
- creator_id: UUID
- tier_id: UUID
- period_start: TIMESTAMP
- period_end: TIMESTAMP
- period_type: TEXT (daily, weekly, monthly, yearly)
- active_customers: INTEGER
- new_customers: INTEGER
- churned_customers: INTEGER
- total_revenue: DECIMAL
- overage_revenue: DECIMAL
- average_usage_percentage: DECIMAL
- usage_metrics: JSONB (detailed usage statistics)
```

## API Endpoints

### Tier Management (Creator APIs)

#### `POST /api/usage/tiers`
Create a new subscription tier:
```json
{
  "name": "Pro",
  "description": "Advanced features for growing businesses",
  "price": 99.99,
  "currency": "usd",
  "billing_cycle": "monthly",
  "feature_entitlements": [
    "advanced_analytics",
    "team_seats:25",
    "api_access",
    "priority_support"
  ],
  "usage_caps": {
    "api_calls": 100000,
    "projects_created": 100,
    "storage_gb": 50
  },
  "trial_period_days": 14
}
```

#### `GET /api/usage/tiers`
Get all tiers for the authenticated creator.

#### `PUT /api/usage/tiers/{tierId}`
Update an existing tier.

#### `DELETE /api/usage/tiers/{tierId}`
Delete a tier (only if no active customers).

### Customer APIs

#### `GET /api/usage/customer/tier?creatorId={id}`
Get customer's current tier information including usage summary.

#### `POST /api/usage/customer/enforcement`
Check if customer can perform an action based on tier limits:
```json
{
  "creatorId": "uuid",
  "metricName": "api_calls",
  "requestedUsage": 1
}
```

Response:
```json
{
  "success": true,
  "enforcement": {
    "allowed": true,
    "current_usage": 8500,
    "limit_value": 10000,
    "usage_percentage": 85,
    "should_warn": true,
    "should_block": false
  }
}
```

#### `GET /api/usage/customer/upgrade-options?creatorId={id}`
Get recommended tier upgrades based on usage patterns.

### Billing Automation

#### `POST /api/usage/billing/process`
Process billing automation tasks:
```json
{
  "creatorId": "uuid",
  "billingPeriod": "2024-01",
  "action": "process_overages" | "calculate_analytics" | "send_warnings"
}
```

## Services

### TierManagementService

Core service for tier operations:

```typescript
// Create a tier
const tier = await TierManagementService.createTier(creatorId, tierData);

// Assign customer to tier
const assignment = await TierManagementService.assignCustomerToTier(
  customerId, 
  creatorId, 
  tierId, 
  stripeSubscriptionId
);

// Check tier enforcement
const enforcement = await TierManagementService.checkTierEnforcement(
  customerId, 
  creatorId, 
  'api_calls', 
  1
);

// Get customer tier info
const tierInfo = await TierManagementService.getCustomerTierInfo(
  customerId, 
  creatorId
);

// Get upgrade options
const options = await TierManagementService.getTierUpgradeOptions(
  customerId, 
  creatorId
);
```

### BillingAutomationService

Handles automated billing processes:

```typescript
// Process billing cycle for all customers
const result = await BillingAutomationService.processBillingCycle(
  creatorId, 
  '2024-01'
);

// Calculate tier analytics
await BillingAutomationService.calculateTierAnalytics(
  creatorId,
  '2024-01-01',
  '2024-01-31',
  'monthly'
);

// Send usage warnings
await BillingAutomationService.sendUsageWarnings(creatorId);
```

## UI Components

### Creator Dashboard

#### TierManagementDashboard
Complete interface for managing subscription tiers:
- Visual tier cards with pricing and features
- Create/edit modal with form validation
- Bulk operations and safety checks
- Real-time tier status updates

```tsx
import { TierManagementDashboard } from '@/features/usage-tracking/components/TierManagementDashboard';

function TiersPage() {
  return (
    <div>
      <h1>Subscription Tiers</h1>
      <TierManagementDashboard />
    </div>
  );
}
```

### Customer Portal

#### CustomerTierPortal
Comprehensive customer view of subscription details:
- Current tier information and features
- Real-time usage tracking with visual progress bars
- Overage alerts and costs
- Smart upgrade recommendations

```tsx
import { CustomerTierPortal } from '@/features/usage-tracking/components/CustomerTierPortal';

function CustomerPortal({ creatorId }) {
  return (
    <div>
      <h1>Your Subscription</h1>
      <CustomerTierPortal creatorId={creatorId} />
    </div>
  );
}
```

## Integration with Usage Tracking

The tier system integrates seamlessly with the existing usage tracking:

```typescript
// Usage tracking automatically checks tier enforcement
await trackUsage({
  event_name: 'api_calls',
  user_id: customerId,
  value: 1,
  properties: {
    endpoint: '/api/users',
    method: 'GET'
  }
});
// If user exceeds tier limits, this will throw an error or warn
```

## Stripe Integration

### Automatic Product/Price Creation
When you create a tier, the system automatically:
1. Creates a Stripe Product with tier details
2. Creates a Stripe Price with billing cycle and amount
3. Stores Stripe IDs for future reference

### Overage Billing
The system automatically:
1. Calculates usage overages at billing period end
2. Creates Stripe Invoice Items for overages
3. Adds items to customer's next invoice

### Subscription Management
- Tier changes update Stripe subscriptions with proration
- Trial periods are managed through Stripe
- Webhooks keep local data in sync with Stripe

## Feature Entitlements

Feature entitlements support flexible patterns:

```json
{
  "feature_entitlements": [
    "basic_analytics",           // Simple boolean feature
    "team_seats:10",            // Feature with numeric limit
    "custom_domain",            // Boolean feature
    "api_rate_limit:1000",      // Rate limit configuration
    "storage_gb:50"             // Storage quota
  ]
}
```

Check feature access in your application:
```typescript
// Check if customer has feature access
const hasAdvancedAnalytics = await customer_has_feature_access(
  customerId,
  creatorId,
  'advanced_analytics'
);

// Get feature limit
const teamSeatsLimit = await get_customer_feature_limit(
  customerId,
  creatorId,
  'team_seats'
);
```

## Usage Enforcement

### Soft Limits
- Generate warnings when usage approaches limits (default: 80%)
- Allow usage to continue with notifications
- Recommend upgrades to prevent overages

### Hard Limits
- Block usage when limits are exceeded
- Return HTTP 429 (Too Many Requests) errors
- Force upgrade or overage payment to continue

### Overage Billing
- Track usage beyond limits automatically
- Calculate costs based on tier overage pricing
- Bill overages on next invoice cycle

## Analytics and Insights

The system provides comprehensive analytics:

### Tier Performance
- Active customers per tier
- Revenue breakdown by tier
- Churn rates and upgrade patterns

### Usage Patterns
- Average usage percentage by tier
- Most constrained metrics
- Upgrade recommendations based on usage

### Revenue Optimization
- Overage revenue tracking
- Tier optimization suggestions
- Customer lifetime value by tier

## Workflow Examples

### 1. Setting Up Tiers
```javascript
// Create tiers for your SaaS
await setupSubscriptionTiers();
```

### 2. Enforcing Usage Limits
```javascript
// Check before processing API request
const enforcement = await checkTierEnforcement(userId, 'api_calls');
if (!enforcement.allowed) {
  return res.status(429).json({ 
    error: 'Usage limit exceeded',
    upgrade_required: true 
  });
}
```

### 3. Customer Portal Integration
```jsx
// Show customer their tier and usage
<CustomerTierPortal creatorId={creatorId} />
```

### 4. Automated Billing
```javascript
// Run monthly billing process
await processBillingForAllCreators();
```

## Best Practices

### Tier Design
- Start with 3-4 tiers maximum
- Use clear value propositions for each tier
- Set reasonable usage caps that encourage upgrades
- Offer free trials to reduce signup friction

### Usage Enforcement
- Use soft limits (warnings) before hard limits
- Provide clear upgrade paths when limits are reached
- Make overage pricing transparent and fair

### Customer Experience
- Show usage clearly in customer portals
- Send proactive notifications before limits
- Make upgrading simple and immediate

### Billing Automation
- Run billing processes at consistent times
- Monitor for failed billing attempts
- Provide clear invoices and receipts

## Monitoring and Alerting

Set up monitoring for:
- Failed billing processes
- High usage customers approaching limits  
- Tier assignment errors
- Stripe webhook failures
- Customer churn indicators

## Security Considerations

- All API endpoints require proper authentication
- Tier assignments are validated against Stripe subscriptions
- Usage data is segregated by creator
- Billing operations use Stripe Connect for security
- Customer data access is restricted to authorized users

## Performance Optimization

- Usage aggregates are pre-computed for fast lookups
- Tier enforcement checks are cached
- Analytics are calculated asynchronously
- Database queries are optimized with proper indexes

This tier management system provides a complete solution for SaaS creators to monetize their products with flexible subscription tiers, automated billing, and excellent customer experience.