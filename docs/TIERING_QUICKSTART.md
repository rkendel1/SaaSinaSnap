# Tiering and Usage Service - Quick Start Guide

Welcome! This guide will help you get started with SaaSinaSnap's powerful tiering and usage service in just 5 minutes.

## What You'll Learn

- How to create subscription tiers for your SaaS
- How to track usage and enforce limits
- How to integrate the service into your application
- How to test your integration

## Prerequisites

- A SaaSinaSnap creator account
- Stripe Connect account set up (for billing)
- Node.js 16+ installed
- Basic knowledge of JavaScript/TypeScript

## Step 1: Understand the Core Concepts

### Subscription Tiers
Subscription tiers define the pricing and feature packages you offer to customers. Each tier includes:
- **Price & Billing Cycle**: Monthly, yearly, or custom billing
- **Feature Entitlements**: Features available in this tier
- **Usage Caps**: Limits on metered resources (API calls, storage, etc.)
- **Trial Period**: Optional free trial duration

### Usage Tracking
Track how customers use your service with:
- **Usage Meters**: Define what to track (API calls, storage, messages)
- **Usage Events**: Real-time tracking of customer actions
- **Usage Enforcement**: Automatic limit checking and blocking

### Billing Automation
Automatic billing for:
- **Subscription Charges**: Regular tier pricing
- **Overage Billing**: Charges when customers exceed limits
- **Analytics**: Revenue and usage insights

## Step 2: Create Your First Tier (5 minutes)

### Option A: Using the Dashboard

1. Log in to your creator dashboard
2. Navigate to **Usage → Tiers**
3. Click **Create Tier**
4. Fill in the form:
   ```
   Name: Starter
   Price: $29.99/month
   Features: basic_analytics, team_seats:5, email_support
   Usage Caps: api_calls=10000, storage_gb=5
   Trial: 14 days
   ```
5. Click **Save**

### Option B: Using the API

```javascript
const response = await fetch('https://your-platform.com/api/usage/tiers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_CREATOR_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: 29.99,
    currency: 'usd',
    billing_cycle: 'monthly',
    feature_entitlements: [
      'basic_analytics',
      'team_seats:5',
      'email_support'
    ],
    usage_caps: {
      api_calls: 10000,
      storage_gb: 5
    },
    trial_period_days: 14
  })
});

const result = await response.json();
console.log('Tier created:', result.tier.id);
```

## Step 3: Set Up Usage Tracking (5 minutes)

### Create Usage Meters

First, define what you want to track:

```javascript
// Create a meter for API calls
const response = await fetch('https://your-platform.com/api/usage/meters', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_CREATOR_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event_name: 'api_calls',
    display_name: 'API Calls',
    description: 'Number of API requests made',
    aggregation_type: 'count',
    unit_name: 'calls',
    billing_model: 'metered'
  })
});

const meter = await response.json();
console.log('Meter created:', meter.id);
```

### Track Usage in Your Application

Add usage tracking to your API endpoints:

```javascript
// Example: Express.js middleware
app.use(async (req, res, next) => {
  // Your API logic here
  
  // Track the API call
  await fetch('https://your-platform.com/api/v1/usage/track', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${YOUR_CREATOR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meter_id: 'your-meter-id',
      event_name: 'api_calls',
      user_id: req.user.id,
      event_value: 1
    })
  });
  
  next();
});
```

## Step 4: Enforce Usage Limits (5 minutes)

Add enforcement before processing requests:

```javascript
async function checkAndTrackUsage(userId, metricName, requestedUsage = 1) {
  // Check if user can perform this action
  const response = await fetch('https://your-platform.com/api/usage/customer/enforcement', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getUserToken(userId)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      creatorId: YOUR_CREATOR_ID,
      metricName,
      requestedUsage
    })
  });

  const result = await response.json();
  
  if (!result.enforcement.allowed) {
    throw new Error('Usage limit exceeded. Please upgrade your plan.');
  }
  
  // Show warning if approaching limit
  if (result.enforcement.should_warn) {
    console.log(`Warning: ${result.enforcement.usage_percentage}% of limit used`);
  }
  
  return result.enforcement;
}

// Use in your API
app.post('/api/data', async (req, res) => {
  try {
    // Check usage before processing
    await checkAndTrackUsage(req.user.id, 'api_calls');
    
    // Process the request
    const data = await processRequest(req);
    
    res.json({ success: true, data });
  } catch (error) {
    if (error.message.includes('Usage limit exceeded')) {
      res.status(429).json({
        error: 'Usage limit exceeded',
        message: 'You have reached your plan limit. Please upgrade to continue.',
        upgrade_url: '/pricing'
      });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});
```

## Step 5: Test Your Integration (5 minutes)

### Manual Testing

1. **Create a test customer subscription**:
   ```bash
   curl -X POST https://your-platform.com/api/usage/customer/assign \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "customerId": "test-customer-123",
       "creatorId": "your-creator-id",
       "tierId": "your-tier-id"
     }'
   ```

2. **Track some usage events**:
   ```bash
   curl -X POST https://your-platform.com/api/v1/usage/track \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "meter_id": "your-meter-id",
       "event_name": "api_calls",
       "user_id": "test-customer-123",
       "event_value": 1
     }'
   ```

3. **Check usage status**:
   ```bash
   curl -X GET "https://your-platform.com/api/usage/customer/tier?creatorId=your-creator-id" \
     -H "Authorization: Bearer CUSTOMER_TOKEN"
   ```

### Automated Testing

See `docs/TIERING_TESTING_GUIDE.md` for comprehensive testing procedures and sample test events.

## Next Steps

Now that you have the basics working:

1. **Add More Tiers**: Create Pro and Enterprise tiers with different limits
2. **Implement Customer Portal**: Show customers their usage and allow upgrades
3. **Set Up Billing Automation**: Enable automatic overage billing
4. **Add Analytics**: Track revenue and usage patterns

## Getting Help

- **Full Documentation**: See `docs/tier-management-system.md`
- **API Reference**: See `docs/TIERING_API_REFERENCE.md`
- **Examples**: Check `examples/tier-management-example.js`
- **Testing Guide**: See `docs/TIERING_TESTING_GUIDE.md`
- **Troubleshooting**: See `docs/TIERING_TROUBLESHOOTING.md`

## Common Patterns

### Pattern 1: Freemium Model
```javascript
{
  name: 'Free',
  price: 0,
  usage_caps: { api_calls: 1000, storage_gb: 1 }
}
```

### Pattern 2: Tiered with Overages
```javascript
{
  name: 'Pro',
  price: 99.99,
  usage_caps: { api_calls: 100000 },
  // Customers can exceed limits and pay for overages
}
```

### Pattern 3: Unlimited Enterprise
```javascript
{
  name: 'Enterprise',
  price: 299.99,
  usage_caps: {} // No limits
}
```

## Summary

You've learned how to:
- ✅ Create subscription tiers
- ✅ Set up usage tracking
- ✅ Enforce usage limits
- ✅ Test your integration

Your tiering and usage service is now ready to monetize your SaaS! 🎉
