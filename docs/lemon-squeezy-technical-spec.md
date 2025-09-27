# Lemon Squeezy Integration - Technical Specification

## Overview

This document provides the technical implementation details for integrating Lemon Squeezy as a payment processor within the Staryer platform's existing architecture.

## Architecture Integration

### 1. Service Structure

```typescript
// File: src/features/integrations/services/lemon-squeezy/lemon-squeezy-client.ts
export class LemonSqueezyClient {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string, isTestMode: boolean = false) {
    this.apiKey = apiKey;
    this.baseUrl = isTestMode 
      ? 'https://api.lemonsqueezy.com/v1' 
      : 'https://api.lemonsqueezy.com/v1';
  }

  // Product management
  async createProduct(storeId: string, productData: CreateProductRequest): Promise<Product>
  async updateProduct(productId: string, updates: UpdateProductRequest): Promise<Product>
  async createVariant(productId: string, variantData: CreateVariantRequest): Promise<Variant>

  // Subscription management
  async createSubscription(customerId: string, variantId: string): Promise<Subscription>
  async updateSubscription(subscriptionId: string, updates: UpdateSubscriptionRequest): Promise<Subscription>
  async cancelSubscription(subscriptionId: string): Promise<Subscription>

  // Customer management
  async createCustomer(storeId: string, customerData: CreateCustomerRequest): Promise<Customer>
  async getCustomer(customerId: string): Promise<Customer>

  // Usage reporting
  async reportUsage(subscriptionId: string, usage: UsageRecord): Promise<void>
}
```

### 2. Webhook Integration

```typescript
// File: src/app/api/webhooks/lemon-squeezy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { posthogServer } from '@/libs/posthog/posthog-server-client';

const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-signature');
  
  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  
  try {
    await handleLemonSqueezyEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Lemon Squeezy webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleLemonSqueezyEvent(event: any) {
  const supabase = await createSupabaseAdminClient();
  
  switch (event.meta.event_name) {
    case 'subscription_created':
      await handleSubscriptionCreated(event.data);
      break;
    case 'subscription_updated':
      await handleSubscriptionUpdated(event.data);
      break;
    case 'subscription_cancelled':
      await handleSubscriptionCancelled(event.data);
      break;
    case 'order_created':
      await handleOrderCreated(event.data);
      break;
    default:
      console.log(`Unhandled Lemon Squeezy event: ${event.meta.event_name}`);
  }
}
```

### 3. Database Schema Additions

```sql
-- Add Lemon Squeezy fields to creator_profiles
ALTER TABLE creator_profiles ADD COLUMN lemon_squeezy_store_id TEXT;
ALTER TABLE creator_profiles ADD COLUMN lemon_squeezy_api_key TEXT; -- encrypted
ALTER TABLE creator_profiles ADD COLUMN lemon_squeezy_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE creator_profiles ADD COLUMN lemon_squeezy_webhook_secret TEXT; -- encrypted

-- Add Lemon Squeezy product mapping
CREATE TABLE lemon_squeezy_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  staryer_tier_id UUID REFERENCES subscription_tiers(id) ON DELETE CASCADE,
  lemon_squeezy_product_id TEXT NOT NULL,
  lemon_squeezy_variant_id TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add Lemon Squeezy subscription tracking
CREATE TABLE lemon_squeezy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lemon_squeezy_subscription_id TEXT NOT NULL UNIQUE,
  lemon_squeezy_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lemon_squeezy_products_creator_id ON lemon_squeezy_products(creator_id);
CREATE INDEX idx_lemon_squeezy_subscriptions_creator_id ON lemon_squeezy_subscriptions(creator_id);
CREATE INDEX idx_lemon_squeezy_subscriptions_user_id ON lemon_squeezy_subscriptions(user_id);
```

### 4. Billing Service Extension

```typescript
// File: src/features/usage-tracking/services/lemon-squeezy-billing-service.ts
export class LemonSqueezyBillingService {
  private client: LemonSqueezyClient;

  constructor(apiKey: string, isTestMode: boolean = false) {
    this.client = new LemonSqueezyClient(apiKey, isTestMode);
  }

  /**
   * Create a metered product variant in Lemon Squeezy
   */
  async createMeteredVariant(
    storeId: string,
    productId: string,
    unitAmount: number,
    intervalUnit: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<string> {
    const variant = await this.client.createVariant(productId, {
      attributes: {
        name: 'Usage-based billing',
        price: unitAmount,
        interval: intervalUnit,
        interval_count: 1,
        is_subscription: true,
        has_usage_limits: true
      }
    });
    
    return variant.data.id;
  }

  /**
   * Report usage to Lemon Squeezy
   */
  async reportUsage(
    subscriptionId: string,
    quantity: number,
    timestamp?: Date
  ): Promise<void> {
    await this.client.reportUsage(subscriptionId, {
      quantity,
      timestamp: timestamp || new Date()
    });
  }

  /**
   * Sync usage data from Staryer's usage tracking
   */
  static async syncUsageToLemonSqueezy(
    meterId: string,
    userId: string,
    billingPeriod: string,
    usageQuantity: number,
    creatorId: string
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();
    
    // Get creator's Lemon Squeezy configuration
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('lemon_squeezy_api_key, lemon_squeezy_enabled')
      .eq('id', creatorId)
      .single();

    if (!creator?.lemon_squeezy_enabled || !creator.lemon_squeezy_api_key) {
      return; // Skip if Lemon Squeezy not enabled
    }

    // Get user's Lemon Squeezy subscription
    const { data: subscription } = await supabase
      .from('lemon_squeezy_subscriptions')
      .select('lemon_squeezy_subscription_id')
      .eq('user_id', userId)
      .eq('creator_id', creatorId)
      .single();

    if (!subscription) {
      return; // No active subscription
    }

    // Report usage
    const billingService = new LemonSqueezyBillingService(
      creator.lemon_squeezy_api_key,
      process.env.NODE_ENV !== 'production'
    );

    await billingService.reportUsage(
      subscription.lemon_squeezy_subscription_id,
      usageQuantity
    );

    // Log the sync
    await supabase.from('usage_billing_sync').insert({
      meter_id: meterId,
      user_id: userId,
      billing_period: billingPeriod,
      quantity: usageQuantity,
      provider: 'lemon-squeezy',
      sync_status: 'success',
      synced_at: new Date().toISOString()
    });
  }
}
```

### 5. OAuth Integration (API Key Setup)

```typescript
// File: src/app/api/lemon-squeezy-setup/route.ts
export async function POST(request: NextRequest) {
  const { apiKey, storeId, testMode } = await request.json();
  
  // Verify the user is authenticated
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Validate API key by making a test request
    const client = new LemonSqueezyClient(apiKey, testMode);
    const stores = await client.getStores();
    
    const validStore = stores.data.find(store => store.id === storeId);
    if (!validStore) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    // Update creator profile
    await updateCreatorProfile(user.id, {
      lemon_squeezy_api_key: apiKey, // This will be encrypted in the service
      lemon_squeezy_store_id: storeId,
      lemon_squeezy_enabled: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid API key or store ID' }, { status: 400 });
  }
}
```

## Event Handling

### Webhook Event Mapping

| Lemon Squeezy Event | Staryer Action | PostHog Event |
|-------------------|----------------|---------------|
| `subscription_created` | Create user subscription record | `subscription.created` |
| `subscription_updated` | Update subscription status | `subscription.updated` |
| `subscription_cancelled` | Mark subscription as cancelled | `subscription.cancelled` |
| `order_created` | Process one-time payment | `payment.completed` |
| `subscription_payment_success` | Update payment status | `payment.success` |
| `subscription_payment_failed` | Handle failed payment | `payment.failed` |

### Error Handling

```typescript
// Webhook retry logic
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // ms

async function processWebhookWithRetry(event: any, attempt = 0): Promise<void> {
  try {
    await handleLemonSqueezyEvent(event);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.log(`Webhook processing failed, retrying in ${RETRY_DELAYS[attempt]}ms`);
      setTimeout(() => processWebhookWithRetry(event, attempt + 1), RETRY_DELAYS[attempt]);
    } else {
      console.error('Webhook processing failed after all retries:', error);
      // Log to monitoring system
      await logWebhookFailure(event, error);
    }
  }
}
```

## Security Considerations

### 1. API Key Management
- Store API keys encrypted in database
- Use environment-specific keys (test/production)
- Implement key rotation mechanism

### 2. Webhook Security
- Verify webhook signatures using HMAC
- Implement rate limiting on webhook endpoints
- Log all webhook attempts for monitoring

### 3. Data Protection
- Encrypt sensitive Lemon Squeezy data at rest
- Use HTTPS for all API communications
- Implement proper access controls

## Testing Strategy

### 1. Unit Tests
```typescript
// Example test structure
describe('LemonSqueezyClient', () => {
  it('should create a subscription successfully', async () => {
    const client = new LemonSqueezyClient('test-api-key', true);
    const subscription = await client.createSubscription('customer-id', 'variant-id');
    expect(subscription.data.id).toBeDefined();
  });

  it('should handle API errors gracefully', async () => {
    const client = new LemonSqueezyClient('invalid-key', true);
    await expect(client.getStores()).rejects.toThrow('Unauthorized');
  });
});
```

### 2. Integration Tests
- Test webhook event processing
- Test subscription lifecycle
- Test usage billing synchronization
- Test error scenarios and retries

### 3. End-to-End Tests
- Complete creator onboarding flow
- Subscription creation and management
- Payment processing
- Usage tracking and billing

## Performance Considerations

### 1. API Rate Limiting
- Implement request queuing for bulk operations
- Cache frequently accessed data
- Use batch operations where possible

### 2. Database Optimization
- Add appropriate indexes for Lemon Squeezy tables
- Implement connection pooling
- Monitor query performance

### 3. Webhook Processing
- Process webhooks asynchronously
- Implement event deduplication
- Monitor webhook processing latency

## Monitoring and Observability

### 1. Metrics to Track
- API response times and error rates
- Webhook processing success/failure rates
- Subscription creation and cancellation rates
- Usage billing synchronization accuracy

### 2. Alerting
- Failed webhook processing
- API rate limit approaching
- Subscription synchronization failures
- High error rates

### 3. Logging
- All API requests and responses
- Webhook events and processing results
- Error conditions and stack traces
- Performance metrics

## Deployment Plan

### Phase 1: Infrastructure (Week 1)
- Database schema migrations
- Environment variable setup
- Basic service structure

### Phase 2: Core Integration (Week 2-3)
- API client implementation
- Webhook handling
- Basic subscription management

### Phase 3: Advanced Features (Week 4-5)
- Usage-based billing
- Customer portal integration
- Affiliate program support

### Phase 4: Testing & Polish (Week 6)
- Comprehensive testing
- Performance optimization
- Documentation updates

## Rollback Plan

### Quick Rollback
- Feature flag to disable Lemon Squeezy integration
- Database rollback scripts for schema changes
- Monitoring to detect issues early

### Data Migration
- Export existing Lemon Squeezy data before major changes
- Maintain parallel processing during transition
- Gradual migration with validation at each step