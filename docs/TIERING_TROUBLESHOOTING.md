# Tiering and Usage Service - Troubleshooting Guide

Common issues and solutions for the SaaSinaSnap Tiering and Usage Service.

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Tier Management Issues](#tier-management-issues)
3. [Usage Tracking Issues](#usage-tracking-issues)
4. [Enforcement Issues](#enforcement-issues)
5. [Billing Issues](#billing-issues)
6. [Performance Issues](#performance-issues)
7. [Integration Issues](#integration-issues)

## Setup Issues

### Issue: "Creator must have Stripe Connect account set up"

**Symptoms:**
- Cannot create tiers
- Error when calling `/api/usage/tiers` POST endpoint

**Cause:**
Creator hasn't connected their Stripe account.

**Solution:**
1. Log in to creator dashboard
2. Navigate to Settings → Payments
3. Click "Connect Stripe Account"
4. Complete Stripe Connect onboarding
5. Verify connection in dashboard

**Verification:**
```bash
curl -X GET https://your-platform.com/api/creator/stripe-status \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected response:
```json
{
  "connected": true,
  "stripe_account_id": "acct_xxxxx"
}
```

---

### Issue: Missing API Keys

**Symptoms:**
- 401 Unauthorized errors
- "Invalid or missing API key" messages

**Cause:**
API key not generated or incorrectly configured.

**Solution:**
1. Go to creator dashboard → Settings → API Keys
2. Click "Generate New API Key"
3. Copy the key immediately (shown once)
4. Set in your environment:
   ```bash
   export CREATOR_API_KEY=your_api_key_here
   ```

**Testing:**
```bash
curl -X GET https://your-platform.com/api/usage/tiers \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### Issue: Environment Variables Not Loading

**Symptoms:**
- `undefined` values in code
- Connection errors

**Cause:**
Environment variables not properly configured.

**Solution:**

For development:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:32100
CREATOR_API_KEY=your_key_here
STRIPE_SECRET_KEY=sk_test_...
```

For production:
```bash
# Set in your deployment platform (Vercel, Heroku, etc.)
NEXT_PUBLIC_API_URL=https://your-domain.com
CREATOR_API_KEY=prod_key_here
STRIPE_SECRET_KEY=sk_live_...
```

**Verification:**
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Has API Key:', !!process.env.CREATOR_API_KEY);
```

---

## Tier Management Issues

### Issue: Tier Creation Fails

**Symptoms:**
- "Failed to create tier" error
- No Stripe product created

**Common Causes & Solutions:**

1. **Invalid Price Format**
   ```javascript
   // ❌ Wrong
   price: "29.99"
   
   // ✅ Correct
   price: 29.99
   ```

2. **Invalid Currency Code**
   ```javascript
   // ❌ Wrong
   currency: "USD"
   
   // ✅ Correct
   currency: "usd"
   ```

3. **Invalid Billing Cycle**
   ```javascript
   // ❌ Wrong
   billing_cycle: "month"
   
   // ✅ Correct
   billing_cycle: "monthly"
   ```

**Debugging:**
```javascript
try {
  const tier = await createTier(tierData);
} catch (error) {
  console.error('Tier creation error:', {
    message: error.message,
    response: error.response?.data,
    tierData
  });
}
```

---

### Issue: Cannot Delete Tier

**Symptoms:**
- "Tier has active customers" error
- Delete operation fails

**Cause:**
Tier has active customer subscriptions.

**Solution:**

Option 1 - Migrate customers:
```javascript
// Get customers on this tier
const customers = await getCustomersOnTier(tierId);

// Migrate to another tier
for (const customer of customers) {
  await assignCustomerToTier(
    customer.id,
    newTierId,
    { prorate: true }
  );
}

// Now delete the tier
await deleteTier(tierId);
```

Option 2 - Archive instead:
```javascript
// Deactivate the tier instead of deleting
await updateTier(tierId, {
  active: false,
  name: `[ARCHIVED] ${tier.name}`
});
```

---

### Issue: Stripe Product/Price Not Created

**Symptoms:**
- Tier created but `stripe_product_id` is null
- Cannot subscribe customers

**Cause:**
Stripe API error or insufficient permissions.

**Solution:**

1. **Check Stripe API Keys:**
   ```bash
   # Verify keys are for the correct environment
   echo $STRIPE_SECRET_KEY | head -c 8
   # Test mode: sk_test_
   # Live mode: sk_live_
   ```

2. **Check Stripe Connect Permissions:**
   - Log in to Stripe Dashboard
   - Go to Connect → Settings
   - Ensure "Create products" permission is enabled

3. **Manual Retry:**
   ```javascript
   // Retry Stripe product creation
   const tier = await getTier(tierId);
   
   if (!tier.stripe_product_id) {
     const product = await stripe.products.create({
       name: tier.name,
       description: tier.description
     }, {
       stripeAccount: creatorStripeAccountId
     });
     
     await updateTier(tierId, {
       stripe_product_id: product.id
     });
   }
   ```

---

## Usage Tracking Issues

### Issue: Events Not Being Recorded

**Symptoms:**
- Usage stays at 0
- Events don't appear in dashboard
- No usage data in database

**Debugging Steps:**

1. **Check API Response:**
   ```javascript
   const response = await fetch('/api/v1/usage/track', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(eventData)
   });
   
   const result = await response.json();
   console.log('Tracking result:', result);
   
   if (!result.success) {
     console.error('Tracking failed:', result.error);
   }
   ```

2. **Verify Event Data:**
   ```javascript
   // ✅ Correct format
   {
     meter_id: "meter_abc123",  // Required
     event_name: "api_calls",    // Required
     user_id: "user_xyz789",     // Required
     event_value: 1,             // Default: 1
     properties: {}              // Optional
   }
   ```

3. **Check Meter Exists:**
   ```bash
   curl -X GET https://your-platform.com/api/usage/meters \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

4. **Check Database:**
   ```sql
   -- Verify events are being inserted
   SELECT COUNT(*) FROM usage_events 
   WHERE user_id = 'test_user_id' 
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

**Common Fixes:**

- **Wrong meter_id:** Get correct meter ID from dashboard
- **Wrong user_id:** Ensure user ID matches your auth system
- **API key issues:** Use creator API key, not customer token
- **CORS issues:** Add proper CORS headers in API routes

---

### Issue: Usage Count Incorrect

**Symptoms:**
- Dashboard shows wrong usage
- Enforcement limits don't match actual usage

**Causes & Solutions:**

1. **Aggregation Not Running:**
   ```javascript
   // Manually trigger aggregation
   await aggregateUsage(userId, billingPeriod);
   ```

2. **Multiple Billing Periods:**
   ```javascript
   // Ensure you're checking the current period
   const currentPeriod = getCurrentBillingPeriod();
   const usage = await getUsage(userId, currentPeriod);
   ```

3. **Time Zone Issues:**
   ```javascript
   // Use UTC for consistency
   const timestamp = new Date().toISOString();
   ```

**Verification Query:**
```sql
-- Check raw events vs aggregated
SELECT 
  COUNT(*) as raw_events,
  SUM(event_value) as total_value
FROM usage_events
WHERE user_id = 'user_id'
  AND event_name = 'api_calls'
  AND event_timestamp >= '2024-01-01'
  AND event_timestamp < '2024-02-01';
```

---

### Issue: Events Being Tracked Multiple Times

**Symptoms:**
- Usage is 2x or more than expected
- Duplicate events in database

**Cause:**
Retry logic or multiple tracking calls.

**Solution:**

1. **Add Idempotency:**
   ```javascript
   const trackUsage = async (event) => {
     const idempotencyKey = `${event.user_id}-${event.event_name}-${Date.now()}`;
     
     return fetch('/api/v1/usage/track', {
       method: 'POST',
       headers: {
         'Idempotency-Key': idempotencyKey,
         ...
       },
       body: JSON.stringify(event)
     });
   };
   ```

2. **Remove Duplicate Calls:**
   ```javascript
   // ❌ Don't do this
   await trackUsage(event);
   await trackUsage(event);  // Duplicate
   
   // ✅ Track once
   await trackUsage(event);
   ```

3. **Dedupe in Database:**
   ```sql
   -- Find duplicates
   SELECT user_id, event_name, event_timestamp, COUNT(*)
   FROM usage_events
   GROUP BY user_id, event_name, event_timestamp
   HAVING COUNT(*) > 1;
   ```

---

## Enforcement Issues

### Issue: Enforcement Check Fails

**Symptoms:**
- 500 error from enforcement API
- "No active subscription tier found" error

**Debugging:**

1. **Verify Customer Has Tier:**
   ```bash
   curl -X GET "https://your-platform.com/api/usage/customer/tier?creatorId=creator_id" \
     -H "Authorization: Bearer CUSTOMER_TOKEN"
   ```

2. **Check Tier Assignment Status:**
   ```sql
   SELECT * FROM customer_tier_assignments
   WHERE customer_id = 'customer_id'
   AND status = 'active';
   ```

3. **Verify Meter Configuration:**
   ```javascript
   const meter = await getMeter(meterId);
   console.log('Meter config:', {
     event_name: meter.event_name,
     active: meter.active
   });
   ```

**Solutions:**

- **No tier assigned:** Assign customer to default tier
- **Expired trial:** Update subscription status
- **Inactive meter:** Activate the meter in dashboard

---

### Issue: Limits Not Enforced

**Symptoms:**
- Customers exceed limits without blocking
- No warnings shown

**Cause:**
Hard cap not enabled or enforcement check not called.

**Solution:**

1. **Enable Hard Cap:**
   ```javascript
   await updateMeter(meterId, {
     hard_cap: true,
     soft_limit_threshold: 0.8
   });
   ```

2. **Add Enforcement Check:**
   ```javascript
   // Before processing request
   const enforcement = await checkEnforcement(userId, metricName);
   
   if (!enforcement.allowed) {
     throw new Error('Usage limit exceeded');
   }
   
   // Process request
   await handleRequest(req);
   ```

3. **Test Enforcement:**
   ```javascript
   // Use up the limit
   for (let i = 0; i < 105; i++) {
     await trackUsage({ event_name: 'api_calls', user_id });
   }
   
   // Should now be blocked
   const enforcement = await checkEnforcement(userId, 'api_calls');
   console.log('Allowed:', enforcement.allowed); // Should be false
   ```

---

## Billing Issues

### Issue: Overages Not Billed

**Symptoms:**
- Customer exceeds limits but no charges
- No invoice items in Stripe

**Debugging:**

1. **Check Overage Calculation:**
   ```javascript
   const overages = await calculateOverages(customerId, billingPeriod);
   console.log('Overages:', overages);
   ```

2. **Verify Billing Process Ran:**
   ```sql
   SELECT * FROM tier_usage_overages
   WHERE customer_id = 'customer_id'
   AND billed = false;
   ```

3. **Check Stripe Invoice Items:**
   ```javascript
   const invoiceItems = await stripe.invoiceItems.list({
     customer: stripeCustomerId,
     limit: 10
   });
   console.log('Invoice items:', invoiceItems);
   ```

**Solutions:**

1. **Run Billing Manually:**
   ```javascript
   await processBilling({
     creatorId: 'creator_id',
     billingPeriod: '2024-01',
     action: 'process_overages'
   });
   ```

2. **Set Up Automated Billing:**
   ```javascript
   // In cron job or scheduled function
   schedule.scheduleJob('0 0 1 * *', async () => {
     const creators = await getActiveCreators();
     for (const creator of creators) {
       await processBilling({
         creatorId: creator.id,
         billingPeriod: getCurrentPeriod(),
         action: 'process_overages'
       });
     }
   });
   ```

---

### Issue: Incorrect Overage Amounts

**Symptoms:**
- Overage charges don't match usage
- Customers charged incorrectly

**Debugging:**

```javascript
// Calculate expected overage
const usage = await getUsage(userId, 'api_calls', period);
const limit = tier.usage_caps.api_calls;
const overage = Math.max(0, usage - limit);
const cost = overage * tier.overage_price;

console.log({
  usage,
  limit,
  overage,
  overage_price: tier.overage_price,
  expected_cost: cost
});
```

**Solutions:**

1. **Verify Overage Price:**
   ```javascript
   const tier = await getTier(tierId);
   console.log('Overage price:', tier.overage_price);
   ```

2. **Check Calculation Logic:**
   ```javascript
   // Ensure proper rounding
   const cost = Math.round(overage * overagePrice * 100) / 100;
   ```

---

## Performance Issues

### Issue: Slow Enforcement Checks

**Symptoms:**
- API requests take > 500ms
- Timeout errors

**Solutions:**

1. **Add Caching:**
   ```javascript
   const cache = new Map();
   const CACHE_TTL = 60000; // 1 minute
   
   async function checkEnforcement(userId, metric) {
     const cacheKey = `${userId}:${metric}`;
     const cached = cache.get(cacheKey);
     
     if (cached && Date.now() - cached.time < CACHE_TTL) {
       return cached.data;
     }
     
     const result = await fetchEnforcement(userId, metric);
     cache.set(cacheKey, { data: result, time: Date.now() });
     
     return result;
   }
   ```

2. **Optimize Database Queries:**
   ```sql
   -- Add indexes
   CREATE INDEX idx_usage_aggregates_lookup 
   ON usage_aggregates(user_id, meter_id, period_start, period_end);
   ```

3. **Use Read Replicas:**
   ```javascript
   // Use read replica for usage lookups
   const usage = await readReplica
     .from('usage_aggregates')
     .where({ user_id: userId })
     .first();
   ```

---

### Issue: High Database Load

**Symptoms:**
- Slow queries
- Database CPU at 100%
- Connection pool exhausted

**Solutions:**

1. **Batch Usage Events:**
   ```javascript
   // Collect events and insert in batches
   const eventQueue = [];
   
   function queueEvent(event) {
     eventQueue.push(event);
     
     if (eventQueue.length >= 100) {
       flushEvents();
     }
   }
   
   async function flushEvents() {
     if (eventQueue.length === 0) return;
     
     await db.insert('usage_events').values(eventQueue);
     eventQueue.length = 0;
   }
   ```

2. **Use Materialized Views:**
   ```sql
   CREATE MATERIALIZED VIEW usage_summary AS
   SELECT 
     user_id,
     meter_id,
     SUM(event_value) as total_usage,
     COUNT(*) as event_count
   FROM usage_events
   WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
   GROUP BY user_id, meter_id;
   
   -- Refresh periodically
   REFRESH MATERIALIZED VIEW CONCURRENTLY usage_summary;
   ```

---

## Integration Issues

### Issue: CORS Errors in Browser

**Symptoms:**
- "No 'Access-Control-Allow-Origin' header" error
- Requests fail from frontend

**Solution:**

```javascript
// In Next.js API route
export async function POST(request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  // Process request
  const result = await handleRequest(request);
  
  return new Response(JSON.stringify(result), { headers });
}
```

---

### Issue: Webhook Failures

**Symptoms:**
- Stripe webhooks not received
- Webhook endpoint errors

**Debugging:**

1. **Check Webhook Logs in Stripe:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - View recent deliveries
   - Check response codes and errors

2. **Verify Webhook Endpoint:**
   ```bash
   curl -X POST https://your-platform.com/api/webhooks \
     -H "Content-Type: application/json" \
     -d '{"type": "test"}'
   ```

3. **Check Signature Verification:**
   ```javascript
   const signature = request.headers['stripe-signature'];
   
   try {
     const event = stripe.webhooks.constructEvent(
       rawBody,
       signature,
       webhookSecret
     );
     // Process event
   } catch (err) {
     console.error('Webhook signature verification failed:', err);
     return Response.error();
   }
   ```

---

## Getting Help

If you've tried these solutions and still have issues:

1. **Check System Status**: https://status.saasinasnap.com
2. **Search Documentation**: https://docs.saasinasnap.com
3. **Community Forum**: https://community.saasinasnap.com
4. **Contact Support**: support@saasinasnap.com

**When Contacting Support, Include:**
- Error messages (full stack trace)
- Request/response logs
- Steps to reproduce
- Environment (production/staging/development)
- Relevant IDs (customer_id, tier_id, meter_id)

## Useful Debug Commands

```bash
# Check API health
curl https://your-platform.com/api/health

# Test authentication
curl -X GET https://your-platform.com/api/usage/tiers \
  -H "Authorization: Bearer YOUR_API_KEY"

# View recent usage events
curl -X GET "https://your-platform.com/api/usage/events?userId=USER_ID&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Check enforcement status
curl -X POST https://your-platform.com/api/usage/customer/enforcement \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"creatorId": "CREATOR_ID", "metricName": "api_calls"}'
```
