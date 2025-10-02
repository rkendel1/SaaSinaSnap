# Tiering and Usage Service - Best Practices

A comprehensive guide to implementing tiering and usage tracking effectively in your SaaS application.

## Table of Contents

1. [Tier Design](#tier-design)
2. [Usage Tracking](#usage-tracking)
3. [Enforcement Strategies](#enforcement-strategies)
4. [Customer Experience](#customer-experience)
5. [Performance](#performance)
6. [Security](#security)
7. [Billing](#billing)
8. [Monitoring](#monitoring)

## Tier Design

### Start Simple, Scale Up

**✅ DO:**
- Start with 2-3 tiers (e.g., Free, Pro, Enterprise)
- Use clear, differentiated names
- Make pricing transparent and predictable

**❌ DON'T:**
- Create too many tiers initially (confuses customers)
- Use similar names (Pro vs Pro Plus)
- Hide pricing or limits

**Example - Good Tier Structure:**
```javascript
{
  tiers: [
    { name: "Free", price: 0, api_calls: 1000 },
    { name: "Pro", price: 49, api_calls: 50000 },
    { name: "Enterprise", price: 299, api_calls: null } // unlimited
  ]
}
```

### Feature Entitlements

**✅ DO:**
- Use clear, descriptive feature names
- Include numeric limits with colons (e.g., `team_seats:10`)
- Document all features in tier descriptions

**❌ DON'T:**
- Use cryptic feature codes
- Change feature entitlements without migration plan
- Remove features from existing customers

**Example:**
```javascript
feature_entitlements: [
  'basic_analytics',           // Boolean feature
  'team_seats:5',             // Numeric limit
  'custom_domain',            // Boolean feature
  'api_rate_limit:1000',      // Rate limit config
  'storage_gb:50'             // Storage quota
]
```

### Usage Caps

**✅ DO:**
- Set reasonable limits that match your infrastructure
- Align limits with customer value
- Allow Enterprise tiers to be unlimited

**❌ DON'T:**
- Set artificially low limits to force upgrades
- Change limits without notice
- Apply strict caps without warnings

**Example:**
```javascript
usage_caps: {
  api_calls: 10000,      // Clear metric name
  storage_gb: 5,         // Understandable unit
  projects_created: 10   // Business-aligned limit
}
```

### Pricing Strategy

**✅ DO:**
- Use psychological pricing ($29.99 vs $30)
- Offer annual discounts (15-20%)
- Consider usage-based add-ons

**❌ DON'T:**
- Constantly change pricing
- Make upgrades too expensive
- Charge for basic features

**Example:**
```javascript
{
  monthly: 49.99,
  yearly: 499.99,  // ~17% discount
  overage_price: 0.001 per api_call
}
```

## Usage Tracking

### When to Track

**✅ DO Track:**
- API calls (by endpoint if needed)
- Storage usage (in GB)
- Compute time (in minutes)
- Feature-specific usage
- Business events (projects created, users invited)

**❌ DON'T Track:**
- Every single action (too granular)
- Sensitive user data
- Internal system operations
- Development/testing activity

### Tracking Implementation

**✅ DO:**
```javascript
// Track after successful operation
app.post('/api/data', async (req, res) => {
  try {
    const result = await processData(req);
    
    // Track only on success
    await trackUsage({
      event_name: 'api_calls',
      user_id: req.user.id,
      event_value: 1,
      properties: {
        endpoint: req.path,
        method: req.method
      }
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    // Don't track failed operations
    res.status(500).json({ error: error.message });
  }
});
```

**❌ DON'T:**
```javascript
// Don't track before operation
await trackUsage(...);  // ❌ Operation might fail
const result = await processData(req);
```

### Event Properties

**✅ DO:**
- Include metadata for analytics
- Use consistent property names
- Keep properties lightweight

**❌ DON'T:**
- Include PII (personal identifiable information)
- Store large objects
- Use inconsistent naming

**Example:**
```javascript
properties: {
  endpoint: '/api/users',
  method: 'GET',
  response_time: 150,
  response_status: 200,
  user_agent: 'Mozilla/5.0...'
}
```

### Batching

**✅ DO:**
```javascript
// Batch multiple events
const events = [];
for (const item of batch) {
  events.push({
    event_name: 'items_processed',
    user_id: userId,
    event_value: 1
  });
}
await trackUsageBatch(events);
```

**❌ DON'T:**
```javascript
// Don't track individually in loops
for (const item of batch) {
  await trackUsage(...);  // ❌ Too many API calls
}
```

## Enforcement Strategies

### Soft Limits (Recommended)

**✅ DO:**
- Warn at 80% of limit
- Allow temporary overages
- Recommend upgrades proactively

**Implementation:**
```javascript
const enforcement = await checkEnforcement(userId, 'api_calls');

if (enforcement.usage_percentage > 80) {
  // Show warning but allow
  res.setHeader('X-Usage-Warning', 
    `You've used ${enforcement.usage_percentage}% of your limit`);
}

if (enforcement.usage_percentage > 100) {
  // Track overage but still allow (bill later)
  await recordOverage(userId, 'api_calls', enforcement.overage_amount);
}

// Process request
const result = await handleRequest(req);
res.json(result);
```

### Hard Limits (Use Sparingly)

**❌ Only Use For:**
- Infrastructure protection
- Abuse prevention
- Free tiers

**Implementation:**
```javascript
const enforcement = await checkEnforcement(userId, 'api_calls');

if (!enforcement.allowed) {
  return res.status(429).json({
    error: 'Usage limit exceeded',
    message: 'Please upgrade to continue',
    upgrade_url: '/pricing',
    current_usage: enforcement.current_usage,
    limit: enforcement.limit_value
  });
}

// Process request
```

### Progressive Enforcement

**✅ DO:**
```javascript
const usage = enforcement.usage_percentage;

if (usage > 100) {
  // Block with upgrade prompt
  throw new UsageLimitError('Upgrade required');
} else if (usage > 90) {
  // Strong warning
  showBanner('You have exceeded 90% of your limit');
} else if (usage > 80) {
  // Gentle warning
  showToast('Approaching your usage limit');
}
```

## Customer Experience

### Transparent Usage Display

**✅ DO:**
```tsx
<UsageCard>
  <MetricName>API Calls</MetricName>
  <UsageBar 
    current={8500}
    limit={10000}
    percentage={85}
  />
  <UsageText>8,500 / 10,000 calls used (85%)</UsageText>
  <RemainingText>1,500 calls remaining this month</RemainingText>
  {percentage > 80 && (
    <WarningBanner>
      You're approaching your limit. Consider upgrading to Pro.
    </WarningBanner>
  )}
</UsageCard>
```

### Upgrade Prompts

**✅ DO:**
- Show upgrades contextually
- Highlight relevant benefits
- Make upgrading frictionless

**Example:**
```tsx
{usagePercentage > 90 && (
  <UpgradePrompt>
    <Title>You're running out of API calls</Title>
    <Description>
      Upgrade to Pro for 10x more API calls and advanced features.
    </Description>
    <Benefits>
      ✓ 100,000 API calls/month (vs 10,000)
      ✓ Priority support
      ✓ Advanced analytics
    </Benefits>
    <Button onClick={handleUpgrade}>
      Upgrade to Pro - $49/month
    </Button>
  </UpgradePrompt>
)}
```

### Notifications

**✅ DO Send:**
- 80% usage warning
- 100% usage reached
- Overage charges notification
- Billing reminders

**Example Email:**
```text
Subject: You've used 80% of your API calls

Hi [Name],

You've used 8,000 of your 10,000 monthly API calls. 
To avoid interruptions, consider upgrading to our Pro plan:

• 100,000 API calls/month
• Priority support
• Advanced analytics

Upgrade now: [Link]

Questions? Reply to this email.
```

## Performance

### Caching

**✅ DO:**
```javascript
// Cache tier info for 5 minutes
const CACHE_TTL = 300;
const tierCache = new Map();

async function getTierInfo(userId) {
  const cached = tierCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
    return cached.data;
  }
  
  const tierInfo = await fetchTierInfo(userId);
  tierCache.set(userId, {
    data: tierInfo,
    timestamp: Date.now()
  });
  
  return tierInfo;
}
```

### Database Optimization

**✅ DO:**
```sql
-- Index frequently queried columns
CREATE INDEX idx_usage_events_user_period 
ON usage_events(user_id, event_timestamp);

CREATE INDEX idx_tier_assignments_customer 
ON customer_tier_assignments(customer_id, status);
```

### Async Processing

**✅ DO:**
```javascript
// Track usage async (fire and forget)
trackUsage(event).catch(err => 
  console.error('Usage tracking failed:', err)
);

// Don't wait for tracking
const result = await processRequest(req);
return result;
```

## Security

### API Keys

**✅ DO:**
- Rotate keys regularly
- Use different keys for test/production
- Scope keys to specific operations

**❌ DON'T:**
- Commit keys to version control
- Share keys between environments
- Use creator keys in client-side code

### Rate Limiting

**✅ DO:**
```javascript
// Implement rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### Data Protection

**✅ DO:**
- Encrypt sensitive data
- Implement RLS (Row Level Security)
- Audit access logs

## Billing

### Overage Handling

**✅ DO:**
```javascript
// Calculate overages at period end
const overages = await calculateOverages(customerId, billingPeriod);

for (const overage of overages) {
  await stripe.invoiceItems.create({
    customer: customerId,
    amount: Math.round(overage.cost * 100),
    currency: 'usd',
    description: `Overage: ${overage.metric} (${overage.amount} units)`,
    metadata: {
      billing_period: billingPeriod,
      metric: overage.metric
    }
  });
}
```

### Proration

**✅ DO:**
```javascript
// Prorate when upgrading mid-cycle
await stripe.subscriptions.update(subscriptionId, {
  items: [{
    id: subscriptionItemId,
    price: newPriceId
  }],
  proration_behavior: 'create_prorations'
});
```

## Monitoring

### Key Metrics

**Monitor:**
- Average usage per tier
- Upgrade conversion rate
- Overage revenue
- Churn by tier
- API response times
- Error rates

### Alerting

**✅ DO:**
```javascript
// Alert on high error rates
if (errorRate > 0.01) {
  sendAlert('High error rate in usage tracking');
}

// Alert on failed billing
if (billingFailures > 5) {
  sendAlert('Multiple billing failures detected');
}
```

### Analytics

**✅ DO:**
```javascript
// Track key business metrics
analytics.track('tier_upgrade', {
  from_tier: 'starter',
  to_tier: 'pro',
  upgrade_cost: 70,
  usage_percentage: 95
});

analytics.track('usage_limit_hit', {
  tier: 'starter',
  metric: 'api_calls',
  overage_amount: 5000
});
```

## Common Patterns

### Pattern 1: Freemium Model

```javascript
tiers: [
  {
    name: 'Free',
    price: 0,
    usage_caps: { api_calls: 1000 },
    trial_period_days: 0
  },
  {
    name: 'Pro',
    price: 29.99,
    usage_caps: { api_calls: 50000 },
    trial_period_days: 14
  }
]
```

### Pattern 2: Per-Seat Pricing

```javascript
{
  name: 'Team',
  price: 10, // per seat
  feature_entitlements: ['team_seats:5'],
  billing_model: 'per_seat'
}
```

### Pattern 3: Usage-Based

```javascript
{
  name: 'Pay As You Go',
  price: 0,
  usage_caps: {},
  overage_prices: {
    api_calls: 0.001,
    storage_gb: 0.10
  }
}
```

## Checklist

Before going live:

- [ ] Test all tier creation and updates
- [ ] Verify Stripe integration works
- [ ] Test usage tracking and enforcement
- [ ] Implement customer portal
- [ ] Set up monitoring and alerts
- [ ] Document upgrade process
- [ ] Test billing automation
- [ ] Verify webhook handling
- [ ] Load test enforcement API
- [ ] Set up error tracking
- [ ] Document tier migration process
- [ ] Create support documentation
- [ ] Test trial period handling
- [ ] Verify proration logic
- [ ] Set up usage analytics

## Resources

- [API Reference](./TIERING_API_REFERENCE.md)
- [Testing Guide](./TIERING_TESTING_GUIDE.md)
- [Troubleshooting](./TIERING_TROUBLESHOOTING.md)
- [Quick Start](./TIERING_QUICKSTART.md)

## Support

For questions or issues:
- Documentation: https://docs.saasinasnap.com
- Support: support@saasinasnap.com
- Community: https://community.saasinasnap.com
