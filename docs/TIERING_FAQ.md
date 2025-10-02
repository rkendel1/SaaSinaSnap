# Tiering and Usage Service - Frequently Asked Questions (FAQ)

Answers to the most common questions about implementing and using the SaaSinaSnap Tiering and Usage Service.

## General Questions

### What is the Tiering and Usage Service?

The Tiering and Usage Service is a complete subscription and usage tracking solution that allows SaaS creators to:
- Create subscription tiers with different pricing and features
- Track customer usage across various metrics (API calls, storage, etc.)
- Automatically enforce usage limits
- Bill for overages via Stripe
- Provide customer portals showing usage and billing information

### Do I need Stripe to use this service?

Yes, Stripe Connect is required for:
- Creating subscription products and prices
- Processing subscription payments
- Billing for usage overages
- Managing customer subscriptions

However, you can use the usage tracking features without Stripe integration if you only need to monitor usage without billing.

### What's the difference between tiers and usage meters?

- **Tiers (Subscription Tiers)**: Define pricing plans with features and usage limits (e.g., Free, Pro, Enterprise)
- **Usage Meters**: Define what to track and measure (e.g., API calls, storage, messages)

Tiers reference usage meters to set limits. For example, a "Pro" tier might have a limit of 100,000 API calls per month, where "API calls" is a usage meter.

### Is this service suitable for both B2C and B2B SaaS?

Yes! The service is designed to work for both:
- **B2C**: Simple per-user pricing with straightforward tiers
- **B2B**: Complex pricing with team seats, volume discounts, and custom enterprise tiers

### Can I use this for free/freemium models?

Absolutely! You can create a free tier with:
```javascript
{
  name: 'Free',
  price: 0,
  usage_caps: {
    api_calls: 1000,
    storage_gb: 1
  },
  trial_period_days: 0
}
```

---

## Setup and Configuration

### How do I get started?

1. Set up a creator account on SaaSinaSnap
2. Connect your Stripe account
3. Create your first tier
4. Set up usage meters for what you want to track
5. Integrate the tracking SDK into your application

See the [Quick Start Guide](./TIERING_QUICKSTART.md) for detailed steps.

### Can I test without affecting production?

Yes! Use Stripe's test mode:
1. Connect a Stripe test account
2. Use test API keys (they start with `sk_test_`)
3. Create test tiers and meters
4. Use test credit cards for subscriptions

All test data is completely separate from production.

### How long does setup take?

For a basic implementation:
- **Tier creation**: 5-10 minutes
- **Usage meter setup**: 5-10 minutes
- **Code integration**: 30-60 minutes
- **Testing**: 30-60 minutes

**Total**: 1-2 hours for a basic working implementation.

---

## Pricing and Billing

### How is pricing determined for tiers?

You have complete control over tier pricing:
```javascript
{
  price: 29.99,           // Your chosen price
  currency: 'usd',        // Any currency Stripe supports
  billing_cycle: 'monthly' // monthly, yearly, weekly, daily
}
```

### Can I offer annual discounts?

Yes, create separate tiers for annual billing:
```javascript
{
  name: 'Pro Monthly',
  price: 49.99,
  billing_cycle: 'monthly'
},
{
  name: 'Pro Annual',
  price: 499.99,  // ~17% discount
  billing_cycle: 'yearly'
}
```

### How do overage charges work?

When customers exceed their usage limits:
1. System calculates overage amount (usage - limit)
2. Applies per-unit overage price
3. Creates invoice item in Stripe
4. Charges on next billing cycle

Example:
```
Limit: 10,000 API calls
Actual usage: 12,000 API calls
Overage: 2,000 calls
Overage price: $0.001 per call
Charge: $2.00
```

### Can I waive overage charges?

Yes, you can:
1. Set `overage_price: 0` in tier configuration
2. Manually delete invoice items in Stripe before billing
3. Issue credits to customer account

### How do I handle proration when customers upgrade?

Proration is handled automatically by Stripe when you update a subscription. The customer is charged/credited the difference for the remaining billing period.

```javascript
// Upgrade is automatically prorated
await upgradeCustomerToTier(customerId, newTierId, {
  prorate: true
});
```

---

## Usage Tracking

### What types of usage can I track?

You can track any countable metric:
- **API calls**: Number of requests to your API
- **Storage**: GB of data stored
- **Compute time**: Minutes of processing time
- **Messages**: Number of messages sent
- **Projects**: Number of projects created
- **Team seats**: Number of users on account
- **Features**: Usage of specific features

### How accurate is usage tracking?

Usage tracking is very accurate when implemented correctly:
- Events are recorded in real-time
- Timestamps are precise to the millisecond
- Aggregations are calculated regularly
- Database transactions ensure consistency

**Best practices for accuracy:**
- Track after successful operations
- Use idempotency keys to prevent duplicates
- Implement retries for failed tracking calls

### What happens if tracking fails?

If usage tracking fails (network issues, API downtime):
- The customer's request is NOT blocked
- An error is logged for debugging
- You can implement retry logic
- Missing events can be backfilled if needed

**Recommended approach:**
```javascript
try {
  await trackUsage(event);
} catch (error) {
  console.error('Tracking failed:', error);
  // Don't throw - let the request succeed
}
```

### How often is usage aggregated?

- **Real-time**: Individual events recorded immediately
- **Aggregation**: Every 5-15 minutes
- **Dashboard updates**: Near real-time (1-2 minute delay)
- **Billing calculations**: End of billing period

### Can I track usage retroactively?

Yes, you can backfill usage data:
```javascript
await trackUsage({
  eventName: 'api_calls',
  userId: 'user_123',
  eventValue: 100,
  timestamp: '2024-01-15T10:30:00Z' // Past timestamp
});
```

However, this should only be used for data recovery, not regular operations.

---

## Usage Enforcement

### Should I use soft or hard limits?

**Soft Limits (Recommended):**
- ✅ Warn at 80% of limit
- ✅ Allow temporary overages
- ✅ Bill for overages
- ✅ Better user experience

**Hard Limits:**
- ⚠️ Block usage when limit reached
- ⚠️ Can frustrate customers
- ⚠️ Only for free tiers or abuse prevention

### What's the difference between soft and hard caps?

```javascript
// Soft cap - warn but allow
{
  hard_cap: false,
  soft_limit_threshold: 0.8  // Warn at 80%
}
// Result: Customer can exceed limit, will be billed for overage

// Hard cap - block at limit
{
  hard_cap: true
}
// Result: Customer blocked when limit reached, must upgrade
```

### How fast is enforcement checking?

Enforcement checks are typically:
- **Average**: 50-150ms
- **With caching**: 10-20ms
- **99th percentile**: < 300ms

We recommend caching enforcement results for 30-60 seconds for high-traffic applications.

### Can I bypass limits for specific customers?

Yes, several options:
1. **Upgrade to unlimited tier**: Assign to Enterprise tier with no limits
2. **Increase limits**: Update tier limits for all customers on that tier
3. **Custom tier**: Create special tier for specific customer
4. **Manual override**: Temporarily disable enforcement (not recommended)

---

## Features and Entitlements

### How do feature entitlements work?

Feature entitlements define what features are available in each tier:

```javascript
feature_entitlements: [
  'basic_analytics',      // Boolean - feature on/off
  'team_seats:10',       // Number - feature with limit
  'api_rate_limit:1000', // Config - feature with setting
  'custom_domain'        // Boolean - feature on/off
]
```

Check in your code:
```javascript
if (tierInfo.feature_entitlements.includes('advanced_analytics')) {
  // Show advanced analytics
}
```

### Can I add features to existing tiers?

Yes, you can update tier feature entitlements at any time:
```javascript
await updateTier(tierId, {
  feature_entitlements: [
    ...existingFeatures,
    'new_feature'
  ]
});
```

Existing customers get the new features immediately.

### How do I remove features without breaking existing customers?

1. **Create new tier version** instead of updating existing
2. **Grandfather existing customers** on old tier
3. **Migrate gradually** with customer notification
4. **Provide upgrade incentive** to move to new tier

### Can features have limits?

Yes, use the `feature:limit` syntax:
```javascript
feature_entitlements: [
  'team_seats:5',        // Max 5 team members
  'projects:10',         // Max 10 projects
  'api_calls:50000'      // Max 50k API calls/month
]
```

---

## Customer Experience

### How should I display usage to customers?

Best practices:
1. **Show percentage used**: "75% of limit used"
2. **Visual progress bar**: Color-coded (green/yellow/red)
3. **Remaining amount**: "2,500 API calls remaining"
4. **Next billing date**: "Resets on Feb 1st"
5. **Upgrade prompt**: "Need more? Upgrade to Pro"

See [Integration Examples](./TIERING_INTEGRATION_EXAMPLES.md) for code samples.

### When should I notify customers about usage?

Recommended notification thresholds:
- **80% used**: Gentle email reminder
- **90% used**: Warning email with upgrade link
- **100% used**: Immediate email about overage/blocking
- **Overage**: Invoice notification with charges

### How do I handle trial periods?

Trial periods are built-in:
```javascript
{
  name: 'Pro',
  price: 49.99,
  trial_period_days: 14  // 14-day free trial
}
```

The system automatically:
- Tracks trial start/end dates
- Prevents charges during trial
- Notifies when trial ends
- Converts to paid subscription

### Should I allow customers to downgrade?

Generally yes, but consider:
- **Proration**: Credit for unused time
- **Data limits**: What happens if they exceed new limits?
- **Feature access**: Remove features gracefully
- **Timing**: End of billing period vs immediate

---

## Technical Questions

### What databases are supported?

The service uses Supabase (PostgreSQL) for:
- Tier definitions
- Customer assignments
- Usage events
- Aggregated usage
- Billing records

### Can I use this with my existing auth system?

Yes! The service is auth-agnostic. Just provide:
- User IDs from your auth system
- API keys for authentication
- Customer tokens for API calls

Works with:
- NextAuth
- Auth0
- Supabase Auth
- Firebase Auth
- Custom auth systems

### How do I handle high traffic?

For high-traffic applications:
1. **Cache enforcement results** (30-60 seconds)
2. **Batch usage events** (100 events per batch)
3. **Use async tracking** (fire and forget)
4. **Implement rate limiting** (prevent abuse)
5. **Use read replicas** (for usage queries)

### Can I export usage data?

Yes, via:
1. **API**: Query usage events and aggregates
2. **CSV export**: Download from dashboard
3. **Webhook**: Stream events to your system
4. **Database access**: Direct queries (if needed)

### How do I migrate from another billing system?

Steps:
1. **Map existing plans** to SaaSinaSnap tiers
2. **Import customer subscriptions** via API
3. **Backfill usage data** (if needed)
4. **Run parallel** for 1-2 billing cycles
5. **Switch over** when confident

We provide migration tools and support.

---

## Troubleshooting

### Why isn't usage being tracked?

Common issues:
1. ❌ Wrong meter ID
2. ❌ Invalid API key
3. ❌ User not authenticated
4. ❌ Network/firewall issues
5. ❌ CORS errors (in browser)

See [Troubleshooting Guide](./TIERING_TROUBLESHOOTING.md) for solutions.

### Why are limits not being enforced?

Check:
1. ✓ Hard cap enabled (if needed)
2. ✓ Enforcement check is called
3. ✓ Customer has active tier
4. ✓ Limits are configured correctly
5. ✓ Usage is being tracked

### Why am I seeing duplicate events?

Causes:
- Retry logic without idempotency
- Multiple tracking calls
- Client-side code running twice

Solution: Add idempotency keys.

### How do I reset usage for testing?

```sql
-- Reset usage for a test user
DELETE FROM usage_events 
WHERE user_id = 'test_user_id';

DELETE FROM usage_aggregates 
WHERE user_id = 'test_user_id';
```

---

## Best Practices

### How many tiers should I have?

**Recommended: 3-4 tiers**
- Free/Starter (entry point)
- Pro/Growth (most popular)
- Enterprise (high-end)
- (Optional) Custom/Business

Too many tiers confuse customers.

### How should I price my tiers?

Common strategies:
1. **Cost-plus**: Cost + desired margin
2. **Value-based**: Price based on customer value
3. **Competitive**: Match market rates
4. **Tiered multiplier**: 3x-5x between tiers

Example progression: $0 → $29 → $99 → $299

### Should I offer unlimited plans?

Pros:
- ✅ Simple pricing
- ✅ Reduces customer anxiety
- ✅ Good for premium tiers

Cons:
- ❌ Risk of abuse
- ❌ Unpredictable costs
- ❌ May need to add limits later

**Recommendation**: Unlimited for Enterprise, limited for others.

### How often should I review pricing?

- **Monthly**: Usage patterns and costs
- **Quarterly**: Tier performance and conversions
- **Yearly**: Major pricing updates
- **As needed**: Market changes or new features

---

## Support and Resources

### Where can I find more documentation?

- [Quick Start Guide](./TIERING_QUICKSTART.md)
- [API Reference](./TIERING_API_REFERENCE.md)
- [Best Practices](./TIERING_BEST_PRACTICES.md)
- [Testing Guide](./TIERING_TESTING_GUIDE.md)
- [Troubleshooting](./TIERING_TROUBLESHOOTING.md)
- [Integration Examples](./TIERING_INTEGRATION_EXAMPLES.md)

### How do I get help?

1. **Documentation**: Check docs first
2. **Community**: https://community.saasinasnap.com
3. **Support Email**: support@saasinasnap.com
4. **GitHub Issues**: Report bugs and request features

### Can I get implementation help?

Yes! We offer:
- 📧 Email support (included)
- 💬 Live chat (Pro+ creators)
- 📞 Phone support (Enterprise)
- 🤝 Professional services (custom implementation)

### Is there a community?

Yes! Join our community:
- Discord: https://discord.gg/saasinasnap
- Forum: https://community.saasinasnap.com
- Newsletter: https://saasinasnap.com/newsletter

---

## Advanced Topics

### Can I have per-seat pricing?

Yes, implement with feature entitlements:
```javascript
{
  name: 'Team',
  price: 10, // per seat
  feature_entitlements: ['team_seats:5']
}
```

Then multiply by seats:
```javascript
const totalPrice = tierPrice * numberOfSeats;
```

### How do I handle multiple currencies?

Create separate tiers for each currency:
```javascript
{
  name: 'Pro (USD)',
  price: 49.99,
  currency: 'usd'
},
{
  name: 'Pro (EUR)',
  price: 44.99,
  currency: 'eur'
}
```

### Can I offer pay-as-you-go pricing?

Yes:
```javascript
{
  name: 'Pay As You Go',
  price: 0,              // No base fee
  usage_caps: {},        // No limits
  overage_price: 0.001   // Charge per unit
}
```

### How do I implement volume discounts?

Create tiers with better per-unit economics:
```javascript
{
  name: 'Starter',
  price: 29,
  usage_caps: { api_calls: 10000 }
  // $0.0029 per call
},
{
  name: 'Pro',
  price: 99,
  usage_caps: { api_calls: 50000 }
  // $0.00198 per call - 32% cheaper
}
```

---

## Still Have Questions?

If your question isn't answered here:

1. **Search the docs**: Use Cmd/Ctrl+F or search bar
2. **Check examples**: See [Integration Examples](./TIERING_INTEGRATION_EXAMPLES.md)
3. **Ask the community**: Post in our forum
4. **Contact support**: support@saasinasnap.com

We're here to help! 🚀
