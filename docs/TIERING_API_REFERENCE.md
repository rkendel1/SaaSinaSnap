# Tiering and Usage Service - API Reference

Complete API reference for the SaaSinaSnap Tiering and Usage Service.

## Base URL

```
Production: https://your-platform.com/api
Development: http://localhost:32100/api
```

## Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer YOUR_API_KEY
```

### Authentication Types

1. **Creator API Key**: For creator-level operations (tier management, analytics)
2. **Customer Token**: For customer-specific operations (usage info, enforcement checks)
3. **System Token**: For automated processes (billing, background jobs)

## API Endpoints

### Tier Management

#### Create Tier

Create a new subscription tier for your SaaS.

```http
POST /api/usage/tiers
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
Content-Type: application/json
```

**Request Body:**
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
    "storage_gb": 50,
    "projects_created": 100
  },
  "is_default": false,
  "trial_period_days": 14
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "tier": {
    "id": "tier_abc123",
    "creator_id": "creator_xyz789",
    "name": "Pro",
    "description": "Advanced features for growing businesses",
    "price": 99.99,
    "currency": "usd",
    "billing_cycle": "monthly",
    "feature_entitlements": [...],
    "usage_caps": {...},
    "stripe_product_id": "prod_StripeId",
    "stripe_price_id": "price_StripeId",
    "active": true,
    "is_default": false,
    "trial_period_days": 14,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid API key
- `500 Internal Server Error`: Server error

---

#### List Tiers

Get all tiers for the authenticated creator.

```http
GET /api/usage/tiers
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
```

**Query Parameters:**
- `active` (optional): Filter by active status (true/false)

**Response:** `200 OK`
```json
{
  "success": true,
  "tiers": [
    {
      "id": "tier_abc123",
      "name": "Starter",
      "price": 29.99,
      ...
    },
    {
      "id": "tier_def456",
      "name": "Pro",
      "price": 99.99,
      ...
    }
  ]
}
```

---

#### Get Tier

Get details of a specific tier.

```http
GET /api/usage/tiers/:tierId
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
```

**Response:** `200 OK`
```json
{
  "success": true,
  "tier": {
    "id": "tier_abc123",
    "name": "Pro",
    ...
  }
}
```

**Error Responses:**

- `404 Not Found`: Tier not found

---

#### Update Tier

Update an existing tier.

```http
PUT /api/usage/tiers/:tierId
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "price": 109.99,
  "description": "Updated description",
  "usage_caps": {
    "api_calls": 150000,
    "storage_gb": 75
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "tier": {
    "id": "tier_abc123",
    "price": 109.99,
    ...
  }
}
```

---

#### Delete Tier

Delete a tier (only if no active customers).

```http
DELETE /api/usage/tiers/:tierId
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Tier deleted successfully"
}
```

**Error Responses:**

- `400 Bad Request`: Tier has active customers
- `404 Not Found`: Tier not found

---

#### Clone Tier

Create a copy of an existing tier.

```http
POST /api/usage/tiers/:tierId/clone
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Pro Plus",
  "price": 149.99
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "tier": {
    "id": "tier_new123",
    "name": "Pro Plus",
    ...
  }
}
```

---

#### Preview Tier Impact

Preview the impact of tier changes on usage and revenue.

```http
POST /api/usage/tiers/preview
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "price": 129.99,
  "usage_caps": {
    "api_calls": 120000
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "preview": {
    "projected_overages": [
      {
        "metric": "api_calls",
        "current_usage": 105000,
        "new_limit": 120000,
        "projected_overage": 0,
        "overage_cost": 0
      }
    ],
    "revenue_impact": {
      "base_revenue": 129.99,
      "overage_revenue": 0,
      "total_revenue": 129.99
    }
  }
}
```

---

### Customer Management

#### Assign Customer to Tier

Assign a customer to a subscription tier.

```http
POST /api/usage/customer/assign
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerId": "cus_abc123",
  "creatorId": "creator_xyz789",
  "tierId": "tier_def456",
  "stripeSubscriptionId": "sub_stripe123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "assignment": {
    "id": "assign_abc123",
    "customer_id": "cus_abc123",
    "tier_id": "tier_def456",
    "status": "active",
    "current_period_start": "2024-01-15T00:00:00Z",
    "current_period_end": "2024-02-15T00:00:00Z",
    "trial_end": "2024-01-29T00:00:00Z",
    ...
  }
}
```

---

#### Get Customer Tier Info

Get the current tier information for a customer.

```http
GET /api/usage/customer/tier?creatorId={creatorId}
```

**Headers:**
```http
Authorization: Bearer CUSTOMER_TOKEN
```

**Query Parameters:**
- `creatorId` (required): The creator ID

**Response:** `200 OK`
```json
{
  "success": true,
  "tier_info": {
    "tier": {
      "id": "tier_abc123",
      "name": "Pro",
      "price": 99.99,
      ...
    },
    "assignment": {
      "status": "active",
      "current_period_start": "2024-01-15T00:00:00Z",
      "current_period_end": "2024-02-15T00:00:00Z",
      ...
    },
    "usage_summary": {
      "api_calls": {
        "current_usage": 45230,
        "limit_value": 100000,
        "usage_percentage": 45.23,
        "overage_amount": 0
      },
      "storage_gb": {
        "current_usage": 23.5,
        "limit_value": 50,
        "usage_percentage": 47.0,
        "overage_amount": 0
      }
    },
    "next_billing_date": "2024-02-15T00:00:00Z",
    "overages": []
  }
}
```

**Error Responses:**

- `404 Not Found`: No active subscription found

---

#### Check Tier Enforcement

Check if a customer can perform an action based on tier limits.

```http
POST /api/usage/customer/enforcement
```

**Headers:**
```http
Authorization: Bearer CUSTOMER_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "creatorId": "creator_xyz789",
  "metricName": "api_calls",
  "requestedUsage": 1
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "enforcement": {
    "allowed": true,
    "current_usage": 45230,
    "limit_value": 100000,
    "usage_percentage": 45.23,
    "should_warn": false,
    "should_block": false,
    "reason": null
  }
}
```

**Example - Near Limit:**
```json
{
  "success": true,
  "enforcement": {
    "allowed": true,
    "current_usage": 85000,
    "limit_value": 100000,
    "usage_percentage": 85.0,
    "should_warn": true,
    "should_block": false,
    "reason": "Approaching usage limit"
  }
}
```

**Example - Exceeded Limit:**
```json
{
  "success": true,
  "enforcement": {
    "allowed": false,
    "current_usage": 100500,
    "limit_value": 100000,
    "usage_percentage": 100.5,
    "should_warn": true,
    "should_block": true,
    "reason": "Usage limit exceeded"
  }
}
```

---

#### Get Upgrade Options

Get recommended tier upgrades for a customer.

```http
GET /api/usage/customer/upgrade-options?creatorId={creatorId}
```

**Headers:**
```http
Authorization: Bearer CUSTOMER_TOKEN
```

**Query Parameters:**
- `creatorId` (required): The creator ID

**Response:** `200 OK`
```json
{
  "success": true,
  "upgrade_options": [
    {
      "tier": {
        "id": "tier_enterprise",
        "name": "Enterprise",
        "price": 299.99,
        ...
      },
      "upgrade_cost": 200.00,
      "upgrade_savings": 50.00,
      "recommended": true,
      "reason": "Based on your high usage of api_calls, Enterprise tier would save you $50/month on overage charges"
    }
  ]
}
```

---

### Usage Tracking

#### Track Usage Event

Track a usage event for a customer.

```http
POST /api/v1/usage/track
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "meter_id": "meter_abc123",
  "event_name": "api_calls",
  "user_id": "user_xyz789",
  "event_value": 1,
  "properties": {
    "endpoint": "/api/users",
    "method": "GET",
    "response_time": 150
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "event": {
    "id": "evt_abc123",
    "meter_id": "meter_abc123",
    "user_id": "user_xyz789",
    "event_value": 1,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "enforcement": {
    "allowed": true,
    "current_usage": 45231,
    "limit": 100000,
    "remaining": 54769
  }
}
```

**Error Responses:**

- `429 Too Many Requests`: Usage limit exceeded (when hard cap enabled)

---

#### Create Usage Meter

Create a new usage meter.

```http
POST /api/usage/meters
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "event_name": "api_calls",
  "display_name": "API Calls",
  "description": "Number of API requests made",
  "aggregation_type": "count",
  "unit_name": "calls",
  "billing_model": "metered"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "meter": {
    "id": "meter_abc123",
    "creator_id": "creator_xyz789",
    "event_name": "api_calls",
    "display_name": "API Calls",
    "aggregation_type": "count",
    "active": true,
    ...
  }
}
```

---

#### List Usage Meters

Get all usage meters for the authenticated creator.

```http
GET /api/usage/meters
```

**Headers:**
```http
Authorization: Bearer CREATOR_API_KEY
```

**Response:** `200 OK`
```json
{
  "success": true,
  "meters": [
    {
      "id": "meter_abc123",
      "event_name": "api_calls",
      "display_name": "API Calls",
      ...
    }
  ]
}
```

---

### Billing Automation

#### Process Billing

Process billing automation tasks.

```http
POST /api/usage/billing/process
```

**Headers:**
```http
Authorization: Bearer SYSTEM_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "creatorId": "creator_xyz789",
  "billingPeriod": "2024-01",
  "action": "process_overages"
}
```

**Actions:**
- `process_overages`: Calculate and bill for usage overages
- `calculate_analytics`: Generate tier analytics
- `send_warnings`: Send usage warning notifications

**Response:** `200 OK`
```json
{
  "success": true,
  "result": {
    "action": "process_overages",
    "processed": 45,
    "total_overage_revenue": 234.56,
    "errors": []
  }
}
```

---

## Data Types

### Tier Object

```typescript
{
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'weekly' | 'daily';
  feature_entitlements: string[];
  usage_caps: Record<string, number>;
  active: boolean;
  is_default: boolean;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  trial_period_days: number | null;
  created_at: string;
  updated_at: string;
}
```

### Customer Assignment Object

```typescript
{
  id: string;
  customer_id: string;
  creator_id: string;
  tier_id: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'paused';
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### Usage Event Object

```typescript
{
  id: string;
  meter_id: string;
  user_id: string;
  event_value: number;
  properties: Record<string, any> | null;
  event_timestamp: string;
  created_at: string;
}
```

### Enforcement Result Object

```typescript
{
  allowed: boolean;
  reason?: string;
  current_usage: number;
  limit_value: number | null;
  usage_percentage: number | null;
  should_warn?: boolean;
  should_block?: boolean;
}
```

---

## Rate Limits

- **Creator API**: 1000 requests per minute
- **Customer API**: 100 requests per minute per customer
- **Usage Tracking**: 10,000 events per minute per creator

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642248600
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded or usage limit exceeded |
| 500 | Internal Server Error - Server error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "details": {}
}
```

---

## Webhooks

Subscribe to tier and usage events via webhooks.

### Available Events

- `tier.created` - New tier created
- `tier.updated` - Tier updated
- `tier.deleted` - Tier deleted
- `customer.assigned` - Customer assigned to tier
- `customer.upgraded` - Customer upgraded tier
- `customer.downgraded` - Customer downgraded tier
- `usage.limit_approaching` - Customer approaching usage limit (80%)
- `usage.limit_exceeded` - Customer exceeded usage limit
- `billing.overage_calculated` - Overage charges calculated

### Webhook Payload

```json
{
  "event": "usage.limit_approaching",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "customer_id": "cus_abc123",
    "creator_id": "creator_xyz789",
    "metric_name": "api_calls",
    "current_usage": 85000,
    "limit_value": 100000,
    "usage_percentage": 85.0
  }
}
```

---

## SDK Support

Official SDKs available:

- **JavaScript/TypeScript**: `npm install @saasinasnap/usage-sdk`
- **Python**: `pip install saasinasnap-usage`
- **Ruby**: `gem install saasinasnap-usage`
- **Go**: `go get github.com/saasinasnap/usage-sdk-go`

See SDK-specific documentation for usage examples.

---

## Support

- **Documentation**: https://docs.saasinasnap.com
- **API Status**: https://status.saasinasnap.com
- **Support**: support@saasinasnap.com
