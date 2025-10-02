# Tiering and Usage Service Documentation

> Complete documentation for implementing subscription tiers and usage tracking in your SaaS application

## 🎯 What Is This?

The SaaSinaSnap Tiering and Usage Service provides everything you need to:
- ✅ Create subscription tiers (Free, Pro, Enterprise)
- ✅ Track customer usage (API calls, storage, etc.)
- ✅ Enforce usage limits automatically
- ✅ Bill for overages via Stripe
- ✅ Show customers their usage in real-time
- ✅ Generate revenue analytics

## 📚 Documentation

### 🚀 Start Here

**[Complete Implementation Guide](./TIERING_COMPLETE_GUIDE.md)** - Overview and navigation  
**[Quick Start Guide](./TIERING_QUICKSTART.md)** - Get running in 5 minutes ⭐

### 📖 Implementation

| Guide | Description | Time |
|-------|-------------|------|
| [Integration Examples](./TIERING_INTEGRATION_EXAMPLES.md) | Next.js, Express, React, Vue | 30 min |
| [Advanced Examples](../examples/tier-advanced-examples.js) | Real-world scenarios | 60 min |
| [Best Practices](./TIERING_BEST_PRACTICES.md) | Expert guidance | 20 min |

### 📋 Reference

| Resource | Description |
|----------|-------------|
| [API Reference](./TIERING_API_REFERENCE.md) | Complete API docs |
| [Testing Guide](./TIERING_TESTING_GUIDE.md) | Testing procedures |
| [Test Events](../tests/fixtures/tier-test-events.json) | Sample test data |

### 🆘 Support

| Resource | Description |
|----------|-------------|
| [FAQ](./TIERING_FAQ.md) | Common questions |
| [Troubleshooting](./TIERING_TROUBLESHOOTING.md) | Problem solving |

## 🏃 Quick Start

```bash
# 1. Set up environment
export CREATOR_API_KEY=your_api_key
export CREATOR_ID=your_creator_id

# 2. Create a tier
curl -X POST https://your-platform.com/api/usage/tiers \
  -H "Authorization: Bearer $CREATOR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro",
    "price": 49.99,
    "billing_cycle": "monthly",
    "usage_caps": {
      "api_calls": 50000
    }
  }'

# 3. Track usage
curl -X POST https://your-platform.com/api/v1/usage/track \
  -H "Authorization: Bearer $CREATOR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "meter_id": "meter_abc123",
    "event_name": "api_calls",
    "user_id": "user_xyz789",
    "event_value": 1
  }'
```

See [Quick Start Guide](./TIERING_QUICKSTART.md) for detailed instructions.

## 💻 Code Examples

### Next.js API Route with Usage Tracking

```typescript
// app/api/data/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check usage limits
  const enforcement = await checkEnforcement(userId, 'api_calls');
  
  if (!enforcement.allowed) {
    return NextResponse.json({ 
      error: 'Usage limit exceeded' 
    }, { status: 429 });
  }

  // Process request
  const data = await fetchData();
  
  // Track usage (async)
  trackUsage({ event_name: 'api_calls', user_id: userId });
  
  return NextResponse.json({ data });
}
```

### React Usage Display Component

```tsx
import { useEffect, useState } from 'react';

function UsageDisplay() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetch('/api/usage/customer/tier')
      .then(res => res.json())
      .then(data => setUsage(data.tier_info.usage_summary));
  }, []);

  return (
    <div>
      {Object.entries(usage).map(([metric, data]) => (
        <div key={metric}>
          <span>{metric}: {data.current_usage} / {data.limit_value}</span>
          <div className="progress-bar">
            <div style={{ width: `${data.usage_percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

More examples: [Integration Examples](./TIERING_INTEGRATION_EXAMPLES.md)

## 🎯 Common Use Cases

### Freemium SaaS
```javascript
Tiers: Free (limited) → Pro (full features) → Enterprise (unlimited)
```
**Example**: [E-commerce Setup](../examples/tier-advanced-examples.js#L13)

### Usage-Based Pricing
```javascript
Base fee + per-unit charges for API calls, storage, etc.
```
**Example**: [Analytics Platform](../examples/tier-advanced-examples.js#L74)

### Team/Seat-Based
```javascript
Price per seat with volume discounts
```
**Example**: [Team Management](../examples/tier-advanced-examples.js#L188)

## 🧪 Testing

Run the test suite:

```bash
# Load test fixtures
node scripts/load-test-data.js

# Run enforcement tests
npm run test:tiering -- --suite=enforcement

# Load test
k6 run tests/load/tier-enforcement-load-test.js
```

See [Testing Guide](./TIERING_TESTING_GUIDE.md) for details.

## 🔧 Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_CREATOR_ID=your_creator_id
CREATOR_API_KEY=your_api_key
STRIPE_SECRET_KEY=sk_test_xxx

# Optional
USAGE_METER_ID_API_CALLS=meter_abc123
USAGE_METER_ID_STORAGE=meter_def456
```

### Tier Configuration

```javascript
{
  name: 'Pro',                    // Display name
  price: 99.99,                   // Monthly price
  currency: 'usd',                // Currency code
  billing_cycle: 'monthly',       // Billing frequency
  feature_entitlements: [         // Available features
    'advanced_analytics',
    'team_seats:25'
  ],
  usage_caps: {                   // Usage limits
    api_calls: 100000,
    storage_gb: 50
  },
  trial_period_days: 14           // Free trial
}
```

## 📊 Performance

Expected performance with proper implementation:

| Operation | Average | 99th Percentile |
|-----------|---------|-----------------|
| Enforcement check | 50-100ms | < 300ms |
| Usage tracking | 20-50ms | < 100ms |
| Tier info retrieval | 100-150ms | < 400ms |

With caching: **10-20ms** for enforcement checks

## 🔐 Security

Best practices:
- ✅ Use API keys for authentication
- ✅ Never expose keys in client code
- ✅ Rotate keys regularly (every 90 days)
- ✅ Implement rate limiting (1000 req/min)
- ✅ Validate all inputs
- ✅ Use HTTPS everywhere
- ✅ Secure webhook endpoints

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Stripe Connect required" | Connect Stripe account in settings |
| Usage not tracking | Check API key and meter ID |
| Limits not enforced | Call enforcement check or enable hard_cap |
| Slow responses | Implement caching (30-60s TTL) |

Full guide: [Troubleshooting](./TIERING_TROUBLESHOOTING.md)

## 📞 Support

- **Documentation**: https://docs.saasinasnap.com
- **Community**: https://community.saasinasnap.com
- **Email**: support@saasinasnap.com
- **Status**: https://status.saasinasnap.com

## 🗺️ Documentation Map

```
docs/
├── TIERING_COMPLETE_GUIDE.md     ← Start here for overview
├── TIERING_QUICKSTART.md          ← 5-minute setup
├── TIERING_API_REFERENCE.md       ← API endpoints
├── TIERING_INTEGRATION_EXAMPLES.md ← Framework examples
├── TIERING_BEST_PRACTICES.md      ← Expert guidance
├── TIERING_TESTING_GUIDE.md       ← Testing procedures
├── TIERING_FAQ.md                 ← Common questions
├── TIERING_TROUBLESHOOTING.md     ← Problem solving
└── tier-management-system.md      ← Technical details

examples/
├── tier-management-example.js     ← Basic examples
└── tier-advanced-examples.js      ← Real-world scenarios

tests/fixtures/
└── tier-test-events.json          ← Test data
```

## 🎓 Learning Path

### Beginner (1-2 hours)
1. Read [Quick Start Guide](./TIERING_QUICKSTART.md)
2. Create test tiers
3. Implement basic tracking
4. Run test suite

### Intermediate (1-2 days)
1. Follow beginner path
2. Study [Best Practices](./TIERING_BEST_PRACTICES.md)
3. Implement proper error handling
4. Add monitoring
5. Deploy to staging

### Advanced (3-5 days)
1. Follow intermediate path
2. Study [Advanced Examples](../examples/tier-advanced-examples.js)
3. Implement custom features
4. Optimize performance
5. Build customer portal
6. Deploy to production

## 🚀 Next Steps

1. **First time?** → [Quick Start Guide](./TIERING_QUICKSTART.md)
2. **Ready to build?** → [Integration Examples](./TIERING_INTEGRATION_EXAMPLES.md)
3. **Need details?** → [Complete Guide](./TIERING_COMPLETE_GUIDE.md)
4. **Have questions?** → [FAQ](./TIERING_FAQ.md)

## 📝 Contributing

Found an issue or want to improve the docs?
1. Open an issue on GitHub
2. Submit a pull request
3. Contact support@saasinasnap.com

## 📄 License

Part of the SaaSinaSnap platform. See main repository for license.

---

**Ready to monetize your SaaS?** Start with the [Quick Start Guide](./TIERING_QUICKSTART.md) →
