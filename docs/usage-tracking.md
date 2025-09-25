# Usage Tracking and Metered Billing

This document describes the Usage Tracking and Metered Billing system implemented in Staryer.

## Overview

The Usage Tracking system allows SaaS creators to:
- Define usage-based metrics (API calls, storage, messages, etc.)
- Set plan limits and overage pricing
- Track usage events in real-time
- Automatically enforce billing rules
- Generate analytics and reports
- Sync usage data to Stripe for billing

## Architecture

```
[Client SDK] → [Usage API] → [Usage Service] → [Database]
                    ↓              ↓
            [Billing Service] → [Stripe API]
                    ↓
            [Usage Dashboard] ← [Analytics]
```

## Database Schema

### Core Tables

- **usage_meters**: Defines the different types of usage metrics
- **meter_plan_limits**: Sets limits and pricing for each plan
- **usage_events**: Raw usage events from applications
- **usage_aggregates**: Pre-computed usage totals
- **usage_alerts**: Limit violation notifications
- **usage_billing_sync**: Tracks sync with billing systems

## API Endpoints

### Track Usage
```http
POST /api/usage/track
```

Track a usage event:
```json
{
  "event_name": "api_calls",
  "user_id": "user_123",
  "value": 1,
  "properties": {
    "endpoint": "/api/data",
    "method": "GET"
  }
}
```

### Create Meter
```http
POST /api/usage/meters
```

Create a new usage meter:
```json
{
  "event_name": "api_calls",
  "display_name": "API Calls",
  "description": "Number of API requests made",
  "aggregation_type": "count",
  "unit_name": "calls",
  "billing_model": "metered",
  "plan_limits": [
    {
      "plan_name": "starter",
      "limit_value": 10000,
      "overage_price": 0.01,
      "soft_limit_threshold": 0.8,
      "hard_cap": false
    }
  ]
}
```

### List Meters
```http
GET /api/usage/meters
```

Returns all meters for the authenticated creator.

## SDK Usage

### Initialize
```javascript
import { initUsageTracking } from '@staryer/usage-sdk';

initUsageTracking({
  creatorId: 'your-creator-id',
  baseURL: 'https://your-platform.com'
});
```

### Track Events
```javascript
import { trackUsage } from '@staryer/usage-sdk';

// Basic usage tracking
await trackUsage({
  userId: 'user-123',
  eventName: 'api_calls',
  value: 1
});

// With properties
await trackUsage({
  userId: 'user-123',
  eventName: 'messages_sent',
  value: 1,
  properties: {
    type: 'text',
    channel: 'general'
  }
});
```

### React Hook
```javascript
import { useUsageTracking } from '@staryer/usage-sdk';

function MyComponent() {
  const { trackAPICall, trackFeatureUsage } = useUsageTracking();

  const handleAPICall = async () => {
    await fetch('/api/data');
    trackAPICall('user-123', '/api/data', 'GET');
  };

  return <button onClick={handleAPICall}>Fetch Data</button>;
}
```

## Meter Types

### Count
Counts the number of events (default value = 1).
```json
{
  "aggregation_type": "count",
  "unit_name": "requests"
}
```

### Sum
Sums the values of all events.
```json
{
  "aggregation_type": "sum",
  "unit_name": "bytes"
}
```

### Max
Takes the maximum value from all events.
```json
{
  "aggregation_type": "max",
  "unit_name": "concurrent_users"
}
```

### Unique
Counts unique values (simplified implementation).
```json
{
  "aggregation_type": "unique",
  "unit_name": "unique_users"
}
```

### Duration
Sums duration values (in seconds, minutes, etc.).
```json
{
  "aggregation_type": "duration",
  "unit_name": "minutes"
}
```

## Plan Limits

### Soft Limits
Send alerts when usage reaches a percentage of the limit:
```json
{
  "limit_value": 10000,
  "soft_limit_threshold": 0.8,
  "hard_cap": false
}
```

### Hard Limits
Block usage when limit is exceeded:
```json
{
  "limit_value": 10000,
  "hard_cap": true
}
```

### Overage Pricing
Charge for usage over the limit:
```json
{
  "limit_value": 10000,
  "overage_price": 0.01,
  "hard_cap": false
}
```

### Unlimited Plans
Set limit_value to null for unlimited usage:
```json
{
  "limit_value": null,
  "overage_price": null
}
```

## Billing Integration

### Stripe Metered Billing
The system can sync usage data to Stripe for automated billing:

1. Create metered prices in Stripe
2. Set up subscription items with usage-based pricing
3. System automatically reports usage to Stripe
4. Stripe generates invoices based on usage

### Usage Sync
```javascript
// Sync usage to Stripe
await BillingService.syncUsageToBilling(
  meterId,
  userId,
  billingPeriod,
  usageQuantity,
  stripeAccountId,
  subscriptionItemId
);
```

## Dashboard Features

The Usage Dashboard provides:
- Real-time usage metrics
- Usage trends and analytics
- Top users by usage
- Revenue impact analysis
- Alert management
- Meter configuration

Access at: `/creator/dashboard/usage`

## Common Use Cases

### API Rate Limiting
```javascript
// Track API calls
trackUsage({
  userId: 'user-123',
  eventName: 'api_calls',
  value: 1,
  properties: { endpoint: '/api/users' }
});

// Configure limits
{
  "plan_limits": [
    {
      "plan_name": "free",
      "limit_value": 1000,
      "hard_cap": true
    },
    {
      "plan_name": "pro",
      "limit_value": 10000,
      "overage_price": 0.001
    }
  ]
}
```

### Storage Usage
```javascript
// Track storage usage
trackUsage({
  userId: 'user-123',
  eventName: 'storage_used',
  value: 1048576, // bytes
  properties: { file_type: 'image' }
});
```

### Feature Usage
```javascript
// Track feature usage time
trackUsage({
  userId: 'user-123',
  eventName: 'feature_usage',
  value: 300, // seconds
  properties: { feature: 'advanced_editor' }
});
```

## Next Steps

1. **Implement Workers**: Add background workers for usage aggregation
2. **Advanced Alerts**: Email/webhook notifications for limit violations
3. **Usage Forecasting**: Predict usage patterns and costs
4. **Custom Reporting**: Flexible reporting and export features
5. **Multi-tenant Support**: Usage tracking across multiple tenants

## Security Considerations

- All usage data is scoped to the creator who owns the meter
- Row-level security policies protect access to usage data
- API endpoints require authentication
- SDK supports API key authentication for server-side tracking

## Performance

- Usage events are written asynchronously
- Aggregates are pre-computed for fast dashboard queries
- Efficient indexing on frequently queried columns
- Batch processing for high-volume usage data