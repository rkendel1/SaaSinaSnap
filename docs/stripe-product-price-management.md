# Stripe Product and Price ID Management Guide

This guide explains the comprehensive Stripe Product and Price ID management system implemented in the platform, designed to ensure consistency, transparency, and reliability.

## Overview

The platform now includes robust strategies for handling Stripe Product and Price IDs, enhanced usage tracking, environment indicators, and transparent pricing change management.

## Core Features

### 1. Product and Price ID Management

#### Stable Product ID Mapping
- **Purpose**: Maintain consistent product references across Stripe updates
- **Implementation**: `ProductPriceManagementService`
- **Benefits**: Prevents broken references when Stripe products are updated

```typescript
import { ProductPriceManagementService } from '@/features/pricing/services/product-price-management';

// Create a stable mapping for a Stripe product
const stableId = await ProductPriceManagementService.createStableProductMapping(
  stripeProductId,
  tenantId
);

// Get current Stripe product ID from stable ID
const currentStripeId = await ProductPriceManagementService.getStripeProductId(
  stableId,
  tenantId
);
```

#### Price Change Impact Analysis
- **Purpose**: Analyze the business impact of pricing changes before implementation
- **Features**: Revenue projections, subscriber impact, churn predictions

```typescript
// Analyze impact of a price change
const impact = await ProductPriceManagementService.analyzePriceChangeImpact(
  productId,
  currentPrice,
  newPrice,
  tenantId
);

console.log(`Revenue impact: $${impact.revenue_impact.monthly_change}/month`);
console.log(`Affected subscribers: ${impact.existing_subscribers}`);
```

### 2. Enhanced Usage and Metering APIs

#### Comprehensive Usage Tracking
- **Service**: `EnhancedUsageService`
- **Features**: Multi-variant support, detailed analytics, overage alerts

```typescript
import { EnhancedUsageService } from '@/features/usage-tracking/services/enhanced-usage-service';

// Track a usage event
const eventId = await EnhancedUsageService.trackUsageEvent(
  userId,
  creatorId,
  'api_call',
  5, // quantity
  { source: 'mobile_app' } // metadata
);

// Get creator analytics
const analytics = await EnhancedUsageService.getCreatorUsageAnalytics(creatorId);
```

#### Creator Usage Dashboard
- **Component**: `CreatorUsageDashboard`
- **Features**: Real-time analytics, tier-based breakdowns, usage trends

```tsx
import CreatorUsageDashboard from '@/features/usage-tracking/components/CreatorUsageDashboard';

<CreatorUsageDashboard 
  creatorId={creator.id}
  className="my-6"
/>
```

### 3. Environment Visual Indicators

#### Embed Environment Detection
- **Service**: `EmbedEnvironmentService`
- **Features**: Automatic environment detection, non-intrusive indicators

```typescript
import { EmbedEnvironmentService } from '@/features/creator/services/embed-environment-service';

// Detect environment
const environment = EmbedEnvironmentService.detectEnvironment(
  stripePublishableKey,
  productData,
  creatorProfile
);

// Create environment indicator
const indicator = EmbedEnvironmentService.generateEnvironmentIndicator(
  {
    environment,
    stripeMode: 'test',
    creatorId: 'creator_123',
    embedId: 'embed_456',
    embedType: 'product_card'
  },
  {
    show: true,
    position: 'top-right',
    style: 'badge',
    opacity: 0.8,
    size: 'small'
  }
);
```

#### Enhanced Embed Script
- **File**: `src/public/static/embed.js`
- **Features**: Automatic environment indicators, improved error handling

The embed script now automatically detects and displays environment indicators:

```html
<script 
  src="https://your-platform.com/static/embed.js" 
  data-creator-id="creator_123"
  data-product-id="product_456"
  data-embed-type="product_card"
  data-show-environment-indicator="true">
</script>
```

### 4. Pricing Change Management

#### Transparent Change Notifications
- **Service**: `PricingChangeService`
- **Features**: Impact analysis, validation, subscriber notifications

```typescript
import { PricingChangeService } from '@/features/pricing/services/pricing-change-service';

// Create pricing change notification
const result = await PricingChangeService.createPricingChangeNotification(
  creatorId,
  productId,
  {
    change_type: 'price_increase',
    old_data: { price: 29.99 },
    new_data: { price: 39.99 },
    effective_date: '2024-02-01T00:00:00Z',
    reason: 'Enhanced features and improved service'
  }
);

// Validate pricing changes
const validation = await PricingChangeService.validatePricingChange(
  creatorId,
  productId,
  changeData
);

if (!validation.valid) {
  console.log('Validation errors:', validation.errors);
  console.log('Recommendations:', validation.recommendations);
}
```

## API Endpoints

### Usage Tracking API

**Track Usage Event**
```bash
POST /api/usage-tracking
Content-Type: application/json

{
  "userId": "user_123",
  "creatorId": "creator_456",
  "eventType": "api_call",
  "quantity": 5,
  "metadata": {
    "source": "mobile_app"
  }
}
```

**Get Usage Analytics**
```bash
GET /api/usage-tracking?creatorId=creator_456
```

**Get Subscriber Usage Profile**
```bash
GET /api/usage-tracking?creatorId=creator_456&userId=user_123
```

### Pricing Changes API

**Create Pricing Change**
```bash
POST /api/pricing-changes
Content-Type: application/json

{
  "productId": "product_123",
  "changeType": "price_increase",
  "oldData": { "price": 29.99 },
  "newData": { "price": 39.99 },
  "effectiveDate": "2024-02-01T00:00:00Z",
  "reason": "Enhanced features"
}
```

**Get Pricing Change Analysis**
```bash
GET /api/pricing-changes?productId=product_123
```

## Integration Examples

### For Platform Owners

```typescript
import { updatePlatformProductAction } from '@/features/platform-owner/actions/product-actions';

// Update product with automatic impact analysis
const result = await updatePlatformProductAction({
  id: 'prod_123',
  name: 'Pro Plan',
  description: 'Enhanced professional features',
  monthlyPrice: 39.99, // Increased from 29.99
  yearlyPrice: 399.99,
  active: true
});

// The system automatically:
// 1. Analyzes price change impact
// 2. Creates pricing change notifications
// 3. Archives old prices and creates new ones
// 4. Maintains audit trail
```

### For Creators

```typescript
import { createOrUpdateEnhancedProductAction } from '@/features/creator/actions/product-actions';

// Enhanced product creation with new features
const product = await createOrUpdateEnhancedProductAction({
  name: 'Premium Tier',
  price: 49.99,
  product_type: 'subscription',
  // ... other product data
});

// Usage tracking integration
await EnhancedUsageService.trackUsageEvent(
  subscriberId,
  creatorId,
  'content_access',
  1,
  { content_type: 'premium_video' }
);
```

## Environment Configuration

### Test vs Production Indicators

The system automatically detects environment based on:

1. **Stripe Key Prefix**: `pk_test_` vs `pk_live_`
2. **Product Metadata**: Environment markers in product data
3. **URL Patterns**: Development/staging URLs
4. **Creator Profile Settings**: Current environment configuration

### Embed Configuration

```javascript
// Environment indicator configuration
const indicatorConfig = {
  show: true, // Show indicators (default: true for test, false for production)
  position: 'top-right', // top-left, top-right, bottom-left, bottom-right
  style: 'badge', // badge, watermark, banner
  opacity: 0.8, // 0-1
  size: 'small' // small, medium, large
};
```

## Best Practices

### 1. Product ID Management
- Always use stable product IDs for internal references
- Implement proper migration strategies for price changes
- Maintain comprehensive audit trails

### 2. Usage Tracking
- Track usage events consistently across all touchpoints
- Implement proper error handling and retry mechanisms
- Use metadata to provide context for usage events

### 3. Pricing Changes
- Always validate changes before implementation
- Provide adequate notice periods (minimum 30 days)
- Communicate value improvements that justify increases
- Consider grandfathering long-term subscribers

### 4. Environment Management
- Use test environment for all development and testing
- Ensure environment indicators are visible during testing
- Validate all changes in test before production deployment

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const result = await EnhancedUsageService.trackUsageEvent(
    userId,
    creatorId,
    eventType,
    quantity
  );
} catch (error) {
  if (error.message.includes('No active tier found')) {
    // Handle subscriber without active subscription
  } else {
    // Handle other errors
    console.error('Usage tracking error:', error);
  }
}
```

## Testing

### Manual Testing

1. **Test Usage Tracking**:
   ```bash
   curl -X POST http://127.0.0.1:32100/api/usage-tracking \
     -H "Content-Type: application/json" \
     -d '{"userId":"test_user","creatorId":"test_creator","eventType":"test_event","quantity":1}'
   ```

2. **Test Environment Detection**:
   - Create test embeds with different Stripe keys
   - Verify indicators appear correctly
   - Test in different environments

3. **Test Pricing Changes**:
   ```bash
   curl -X GET "http://127.0.0.1:32100/api/pricing-changes?productId=test_product"
   ```

### Automated Testing

The system is designed to support comprehensive testing of all features. Test implementations would cover:

- Product ID mapping and retrieval
- Usage event tracking and aggregation
- Environment detection logic
- Pricing change validation and impact analysis
- Error handling and edge cases

## Security Considerations

- All API endpoints require proper authentication
- Usage tracking includes rate limiting and validation
- Pricing changes require appropriate permissions
- Environment indicators don't expose sensitive data
- Audit trails maintain data integrity

## Performance Optimizations

- Usage events are batched for efficiency
- Analytics queries are optimized for large datasets
- Environment detection is cached where appropriate
- Price change analysis uses efficient database queries

This comprehensive system ensures reliable, transparent, and user-friendly management of Stripe products, pricing, and usage tracking across the entire platform.