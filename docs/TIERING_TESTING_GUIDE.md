# Tiering and Usage Service - Testing Guide

This guide provides comprehensive testing procedures, sample test events, and validation steps to ensure your tiering and usage service integration works correctly.

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Test Data and Events](#test-data-and-events)
3. [Testing Procedures](#testing-procedures)
4. [Validation Checklist](#validation-checklist)
5. [Automated Testing](#automated-testing)

## Test Environment Setup

### 1. Create Test Creator Account

```bash
# Use your platform's signup process or API
curl -X POST https://your-platform.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-creator@example.com",
    "password": "TestPassword123!",
    "role": "creator"
  }'
```

### 2. Set Up Stripe Connect (Test Mode)

1. Log in to your test creator account
2. Navigate to Settings → Payments
3. Connect a Stripe test account
4. Note your test API keys

### 3. Create Test Environment Variables

```bash
# .env.test
TEST_CREATOR_ID=your-test-creator-id
TEST_CREATOR_API_KEY=your-test-api-key
TEST_CUSTOMER_ID=test-customer-123
TEST_BASE_URL=https://your-platform.com
```

## Test Data and Events

### Sample Test Events

Load these test events from `tests/fixtures/tier-test-events.json`:

```json
{
  "test_tiers": [
    {
      "name": "Test Free Tier",
      "description": "Free tier for testing basic functionality",
      "price": 0,
      "currency": "usd",
      "billing_cycle": "monthly",
      "feature_entitlements": [
        "basic_analytics",
        "team_seats:1"
      ],
      "usage_caps": {
        "api_calls": 100,
        "storage_gb": 1,
        "projects_created": 3
      },
      "trial_period_days": 0
    },
    {
      "name": "Test Pro Tier",
      "description": "Pro tier for testing advanced features",
      "price": 10.00,
      "currency": "usd",
      "billing_cycle": "monthly",
      "feature_entitlements": [
        "advanced_analytics",
        "team_seats:5",
        "api_access"
      ],
      "usage_caps": {
        "api_calls": 1000,
        "storage_gb": 10,
        "projects_created": 50
      },
      "is_default": true,
      "trial_period_days": 7
    },
    {
      "name": "Test Enterprise Tier",
      "description": "Enterprise tier with unlimited usage",
      "price": 50.00,
      "currency": "usd",
      "billing_cycle": "monthly",
      "feature_entitlements": [
        "enterprise_analytics",
        "team_seats:unlimited",
        "api_access",
        "priority_support"
      ],
      "usage_caps": {},
      "trial_period_days": 14
    }
  ],
  "test_meters": [
    {
      "event_name": "api_calls",
      "display_name": "API Calls",
      "description": "Number of API requests made",
      "aggregation_type": "count",
      "unit_name": "calls",
      "billing_model": "metered"
    },
    {
      "event_name": "storage_used",
      "display_name": "Storage Used",
      "description": "Amount of storage used in GB",
      "aggregation_type": "sum",
      "unit_name": "GB",
      "billing_model": "metered"
    },
    {
      "event_name": "projects_created",
      "display_name": "Projects Created",
      "description": "Number of projects created",
      "aggregation_type": "count",
      "unit_name": "projects",
      "billing_model": "metered"
    }
  ],
  "test_usage_events": [
    {
      "description": "Normal API call within limits",
      "event_name": "api_calls",
      "event_value": 1,
      "properties": {
        "endpoint": "/api/users",
        "method": "GET",
        "response_time": 150
      }
    },
    {
      "description": "Batch API calls",
      "event_name": "api_calls",
      "event_value": 10,
      "properties": {
        "endpoint": "/api/batch",
        "method": "POST",
        "batch_size": 10
      }
    },
    {
      "description": "Storage usage event",
      "event_name": "storage_used",
      "event_value": 0.5,
      "properties": {
        "file_type": "image",
        "file_size_bytes": 536870912
      }
    },
    {
      "description": "Project creation",
      "event_name": "projects_created",
      "event_value": 1,
      "properties": {
        "project_type": "web_app",
        "template_used": "starter"
      }
    }
  ]
}
```

## Testing Procedures

### Test Suite 1: Tier Creation and Management

#### Test 1.1: Create Basic Tier

**Objective**: Verify that tiers can be created successfully

```javascript
async function testCreateTier() {
  console.log('Test 1.1: Create Basic Tier');
  
  const response = await fetch(`${process.env.TEST_BASE_URL}/api/usage/tiers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TEST_CREATOR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Starter',
      description: 'Test starter tier',
      price: 29.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: ['basic_analytics', 'team_seats:5'],
      usage_caps: {
        api_calls: 10000,
        storage_gb: 5
      },
      trial_period_days: 14
    })
  });

  const result = await response.json();
  
  // Assertions
  console.assert(result.success === true, 'Tier creation should succeed');
  console.assert(result.tier.id, 'Tier should have an ID');
  console.assert(result.tier.stripe_product_id, 'Tier should have Stripe product ID');
  console.assert(result.tier.stripe_price_id, 'Tier should have Stripe price ID');
  
  console.log('✅ Test 1.1 passed');
  return result.tier;
}
```

#### Test 1.2: List All Tiers

**Objective**: Verify tier listing functionality

```javascript
async function testListTiers() {
  console.log('Test 1.2: List All Tiers');
  
  const response = await fetch(`${process.env.TEST_BASE_URL}/api/usage/tiers`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.TEST_CREATOR_API_KEY}`
    }
  });

  const result = await response.json();
  
  // Assertions
  console.assert(result.success === true, 'Tier listing should succeed');
  console.assert(Array.isArray(result.tiers), 'Should return array of tiers');
  console.assert(result.tiers.length > 0, 'Should have at least one tier');
  
  console.log(`✅ Test 1.2 passed (${result.tiers.length} tiers found)`);
  return result.tiers;
}
```

#### Test 1.3: Update Tier

**Objective**: Verify tier update functionality

```javascript
async function testUpdateTier(tierId) {
  console.log('Test 1.3: Update Tier');
  
  const response = await fetch(`${process.env.TEST_BASE_URL}/api/usage/tiers/${tierId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.TEST_CREATOR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      price: 39.99,
      description: 'Updated test tier description'
    })
  });

  const result = await response.json();
  
  // Assertions
  console.assert(result.success === true, 'Tier update should succeed');
  console.assert(result.tier.price === 39.99, 'Price should be updated');
  
  console.log('✅ Test 1.3 passed');
  return result.tier;
}
```

### Test Suite 2: Customer Assignment and Tier Info

#### Test 2.1: Assign Customer to Tier

**Objective**: Verify customer can be assigned to a tier

```javascript
async function testAssignCustomerToTier(customerId, tierId) {
  console.log('Test 2.1: Assign Customer to Tier');
  
  const response = await fetch(`${process.env.TEST_BASE_URL}/api/usage/customer/assign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TEST_CREATOR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerId,
      creatorId: process.env.TEST_CREATOR_ID,
      tierId
    })
  });

  const result = await response.json();
  
  // Assertions
  console.assert(result.success === true, 'Customer assignment should succeed');
  console.assert(result.assignment.customer_id === customerId, 'Customer ID should match');
  console.assert(result.assignment.tier_id === tierId, 'Tier ID should match');
  
  console.log('✅ Test 2.1 passed');
  return result.assignment;
}
```

#### Test 2.2: Get Customer Tier Info

**Objective**: Verify customer tier information retrieval

```javascript
async function testGetCustomerTierInfo(customerToken) {
  console.log('Test 2.2: Get Customer Tier Info');
  
  const response = await fetch(
    `${process.env.TEST_BASE_URL}/api/usage/customer/tier?creatorId=${process.env.TEST_CREATOR_ID}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    }
  );

  const result = await response.json();
  
  // Assertions
  console.assert(result.success === true, 'Should get tier info successfully');
  console.assert(result.tier_info.tier, 'Should have tier information');
  console.assert(result.tier_info.usage_summary, 'Should have usage summary');
  
  console.log('✅ Test 2.2 passed');
  return result.tier_info;
}
```

### Test Suite 3: Usage Tracking

#### Test 3.1: Track Single Usage Event

**Objective**: Verify usage events can be tracked

```javascript
async function testTrackUsage(meterId, userId) {
  console.log('Test 3.1: Track Single Usage Event');
  
  const response = await fetch(`${process.env.TEST_BASE_URL}/api/v1/usage/track`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TEST_CREATOR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meter_id: meterId,
      event_name: 'api_calls',
      user_id: userId,
      event_value: 1,
      properties: {
        endpoint: '/api/test',
        method: 'GET'
      }
    })
  });

  const result = await response.json();
  
  // Assertions
  console.assert(result.success === true, 'Usage tracking should succeed');
  console.assert(result.event, 'Should return event data');
  
  console.log('✅ Test 3.1 passed');
  return result.event;
}
```

#### Test 3.2: Track Multiple Events Rapidly

**Objective**: Test system under load

```javascript
async function testBulkUsageTracking(meterId, userId, count = 50) {
  console.log(`Test 3.2: Track ${count} Usage Events`);
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    promises.push(
      fetch(`${process.env.TEST_BASE_URL}/api/v1/usage/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TEST_CREATOR_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meter_id: meterId,
          event_name: 'api_calls',
          user_id: userId,
          event_value: 1
        })
      })
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Assertions
  const successCount = results.filter(r => r.ok).length;
  console.assert(successCount === count, `All ${count} events should be tracked`);
  console.log(`✅ Test 3.2 passed (${duration}ms for ${count} events)`);
}
```

### Test Suite 4: Usage Enforcement

#### Test 4.1: Check Enforcement Within Limits

**Objective**: Verify enforcement allows usage within limits

```javascript
async function testEnforcementWithinLimits(customerToken) {
  console.log('Test 4.1: Check Enforcement Within Limits');
  
  const response = await fetch(`${process.env.TEST_BASE_URL}/api/usage/customer/enforcement`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      creatorId: process.env.TEST_CREATOR_ID,
      metricName: 'api_calls',
      requestedUsage: 1
    })
  });

  const result = await response.json();
  
  // Assertions
  console.assert(result.success === true, 'Enforcement check should succeed');
  console.assert(result.enforcement.allowed === true, 'Should allow usage within limits');
  
  console.log('✅ Test 4.1 passed');
  return result.enforcement;
}
```

#### Test 4.2: Check Enforcement At Limit

**Objective**: Test behavior when approaching limit

```javascript
async function testEnforcementAtLimit(customerToken, meterId, userId) {
  console.log('Test 4.2: Check Enforcement At Limit');
  
  // First, use up the limit (assuming limit is 100 for test tier)
  for (let i = 0; i < 95; i++) {
    await fetch(`${process.env.TEST_BASE_URL}/api/v1/usage/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TEST_CREATOR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meter_id: meterId,
        event_name: 'api_calls',
        user_id: userId,
        event_value: 1
      })
    });
  }
  
  // Now check enforcement
  const response = await fetch(`${process.env.TEST_BASE_URL}/api/usage/customer/enforcement`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      creatorId: process.env.TEST_CREATOR_ID,
      metricName: 'api_calls',
      requestedUsage: 1
    })
  });

  const result = await response.json();
  
  // Assertions
  console.assert(result.enforcement.should_warn === true, 'Should warn when near limit');
  console.assert(result.enforcement.usage_percentage > 80, 'Usage percentage should be high');
  
  console.log('✅ Test 4.2 passed');
  return result.enforcement;
}
```

#### Test 4.3: Check Enforcement Over Limit

**Objective**: Test blocking when limit exceeded

```javascript
async function testEnforcementOverLimit(customerToken, meterId, userId) {
  console.log('Test 4.3: Check Enforcement Over Limit');
  
  // Use up remaining limit and exceed
  for (let i = 0; i < 10; i++) {
    await fetch(`${process.env.TEST_BASE_URL}/api/v1/usage/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TEST_CREATOR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meter_id: meterId,
        event_name: 'api_calls',
        user_id: userId,
        event_value: 1
      })
    });
  }
  
  // Now check enforcement (should be blocked if hard_cap is enabled)
  const response = await fetch(`${process.env.TEST_BASE_URL}/api/usage/customer/enforcement`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      creatorId: process.env.TEST_CREATOR_ID,
      metricName: 'api_calls',
      requestedUsage: 1
    })
  });

  const result = await response.json();
  
  // Assertions (depends on hard_cap setting)
  console.log(`Allowed: ${result.enforcement.allowed}, Usage: ${result.enforcement.usage_percentage}%`);
  
  console.log('✅ Test 4.3 passed');
  return result.enforcement;
}
```

### Test Suite 5: Tier Upgrades

#### Test 5.1: Get Upgrade Options

**Objective**: Verify upgrade recommendations

```javascript
async function testGetUpgradeOptions(customerToken) {
  console.log('Test 5.1: Get Upgrade Options');
  
  const response = await fetch(
    `${process.env.TEST_BASE_URL}/api/usage/customer/upgrade-options?creatorId=${process.env.TEST_CREATOR_ID}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    }
  );

  const result = await response.json();
  
  // Assertions
  console.assert(result.success === true, 'Should get upgrade options');
  console.assert(Array.isArray(result.upgrade_options), 'Should return array of options');
  
  console.log(`✅ Test 5.1 passed (${result.upgrade_options.length} options found)`);
  return result.upgrade_options;
}
```

## Validation Checklist

Use this checklist to ensure all functionality is working correctly:

### Tier Management
- [ ] Can create new tiers with all required fields
- [ ] Stripe product and price are created automatically
- [ ] Can list all tiers for a creator
- [ ] Can update tier pricing and limits
- [ ] Can delete unused tiers
- [ ] Default tier is properly marked

### Customer Assignment
- [ ] Can assign customers to tiers
- [ ] Assignment creates proper database records
- [ ] Trial periods are tracked correctly
- [ ] Billing cycle dates are set properly

### Usage Tracking
- [ ] Usage events are recorded successfully
- [ ] Event properties are stored correctly
- [ ] Timestamps are accurate
- [ ] Aggregation happens correctly

### Usage Enforcement
- [ ] Enforcement allows usage within limits
- [ ] Warnings appear at 80% threshold
- [ ] Hard caps block usage when enabled
- [ ] Unlimited tiers allow unlimited usage
- [ ] Enforcement is fast (<100ms response time)

### Upgrade Flow
- [ ] Upgrade options are recommended correctly
- [ ] Upgrade costs are calculated accurately
- [ ] Proration works for mid-cycle upgrades
- [ ] Stripe subscription is updated properly

### Billing Automation
- [ ] Overages are calculated correctly
- [ ] Invoice items are created in Stripe
- [ ] Analytics are generated
- [ ] Usage warnings are sent

## Automated Testing

### Running the Test Suite

```bash
# Run all tests
npm run test:tiering

# Run specific test suite
npm run test:tiering -- --suite=enforcement

# Run with coverage
npm run test:tiering -- --coverage
```

### CI/CD Integration

Add to your `.github/workflows/test.yml`:

```yaml
- name: Run Tiering Tests
  run: npm run test:tiering
  env:
    TEST_CREATOR_ID: ${{ secrets.TEST_CREATOR_ID }}
    TEST_CREATOR_API_KEY: ${{ secrets.TEST_CREATOR_API_KEY }}
    TEST_BASE_URL: https://staging.your-platform.com
```

## Performance Testing

### Load Testing Script

```javascript
// tests/load/tier-enforcement-load-test.js
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
};

export default function () {
  const response = http.post(
    'https://your-platform.com/api/usage/customer/enforcement',
    JSON.stringify({
      creatorId: 'test-creator-id',
      metricName: 'api_calls',
      requestedUsage: 1
    }),
    {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
    }
  );

  check(response, {
    'is status 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

Run with:
```bash
k6 run tests/load/tier-enforcement-load-test.js
```

## Troubleshooting Tests

### Common Issues

1. **"Creator must have Stripe Connect account set up"**
   - Solution: Connect Stripe test account in creator settings

2. **"Usage limit exceeded" in tests**
   - Solution: Reset test customer usage or increase test tier limits

3. **"Tier not found" errors**
   - Solution: Ensure tiers are created before assignment tests

4. **Slow response times**
   - Check database indexes
   - Review query performance
   - Consider caching implementation

## Next Steps

After completing these tests:
1. Document any issues found
2. Set up continuous monitoring
3. Implement automated regression tests
4. Add performance benchmarks

For more information, see:
- API Reference: `docs/TIERING_API_REFERENCE.md`
- Best Practices: `docs/TIERING_BEST_PRACTICES.md`
- Troubleshooting: `docs/TIERING_TROUBLESHOOTING.md`
