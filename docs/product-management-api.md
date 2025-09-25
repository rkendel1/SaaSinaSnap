# Enhanced Product Management API Documentation

## Overview

The Enhanced Product Management API provides comprehensive product management capabilities for creators using Stripe's connected accounts. This API supports advanced product creation, editing, archival, deletion, and bulk operations with full Stripe API integration.

## Authentication

All API endpoints require authentication. Users must be logged in and have a connected Stripe account to perform product management operations.

```typescript
// Authentication is handled automatically in server actions
const user = await getAuthenticatedUser();
const creatorProfile = await getCreatorProfile(user.id);
```

## Core Types

### EnhancedProductData

```typescript
interface EnhancedProductData {
  id?: string;                          // Product ID (for updates)
  name: string;                         // Product name (required)
  description?: string;                 // Product description
  images?: string[];                    // Array of image URLs
  price: number;                        // Price in dollars
  currency: string;                     // Currency code (default: 'usd')
  product_type: 'one_time' | 'subscription' | 'usage_based';
  active: boolean;                      // Whether product is active
  metadata?: Record<string, string>;    // Custom metadata
  
  // Pricing configuration
  pricing_tiers?: PricingTier[];        // For tiered pricing
  
  // Subscription options
  billing_interval?: 'month' | 'year' | 'week' | 'day';
  billing_interval_count?: number;      // Interval multiplier
  trial_period_days?: number;           // Free trial period
  
  // Usage-based pricing
  usage_type?: 'metered' | 'licensed';
  aggregate_usage?: 'sum' | 'last_during_period' | 'last_ever' | 'max';
  
  // Branding and SEO
  statement_descriptor?: string;        // Appears on card statements
  unit_label?: string;                  // e.g., "per user", "per seat"
  
  // Organization
  features?: string[];                  // Product features list
  category?: string;                    // Product category
  tags?: string[];                     // Product tags
  
  // Audit trail
  archived_at?: string;                // Archival timestamp
  archived_reason?: string;            // Reason for archival
  deleted_at?: string;                 // Deletion timestamp
  deletion_reason?: string;            // Reason for deletion
}
```

### PricingTier

```typescript
interface PricingTier {
  id?: string;
  price: number;                       // Price for this tier
  currency: string;                    // Currency code
  interval?: 'month' | 'year' | 'week' | 'day';
  interval_count?: number;             // Billing frequency
  up_to?: number;                      // Upper limit for this tier
  flat_amount?: number;                // Fixed component
  unit_amount?: number;                // Variable component
}
```

## API Functions

### Product Creation and Updates

#### `createOrUpdateEnhancedProductAction(productData: EnhancedProductData): Promise<void>`

Creates a new product or updates an existing one with enhanced Stripe capabilities.

**Parameters:**
- `productData`: EnhancedProductData object containing product information

**Example:**
```typescript
const productData: EnhancedProductData = {
  name: "Premium Analytics Tool",
  description: "Advanced analytics with real-time insights",
  images: [
    "https://example.com/hero.jpg",
    "https://example.com/dashboard.jpg"
  ],
  price: 49.99,
  currency: "usd",
  product_type: "subscription",
  active: true,
  billing_interval: "month",
  trial_period_days: 14,
  statement_descriptor: "ANALYTICS PRO",
  unit_label: "per workspace",
  features: [
    "Real-time Analytics",
    "Custom Dashboards",
    "API Access",
    "Priority Support"
  ],
  category: "Business Intelligence",
  tags: ["analytics", "dashboard", "enterprise"],
  metadata: {
    priority: "high",
    target_audience: "enterprise"
  }
};

await createOrUpdateEnhancedProductAction(productData);
```

**Stripe Operations:**
- Creates/updates product with full metadata
- Manages price creation and archival
- Handles subscription configuration
- Supports multiple images and advanced options

### Legacy Compatibility

#### `createOrUpdateCreatorProductAction(productData: ProductData): Promise<void>`

Maintains backward compatibility with the existing product creation system.

**Example:**
```typescript
const legacyProduct = {
  name: "Basic Product",
  description: "Simple product",
  price: 19.99,
  image_url: "https://example.com/image.jpg",
  active: true,
  product_type: "one_time"
};

await createOrUpdateCreatorProductAction(legacyProduct);
```

### Product Archival

#### `archiveCreatorProductAction(productId: string, reason?: string): Promise<void>`

Archives a product, making it unavailable for new purchases while preserving historical data.

**Parameters:**
- `productId`: The ID of the product to archive
- `reason`: Optional reason for archival

**Example:**
```typescript
await archiveCreatorProductAction("prod-123", "Temporarily out of stock");
```

**Effects:**
- Sets product as inactive in database
- Archives product in Stripe
- Maintains historical purchase data
- Tracks archival timestamp and reason

### Product Deletion

#### `deleteCreatorProductAction(productId: string, reason?: string): Promise<void>`

Permanently deletes a product with safety checks for active subscriptions.

**Parameters:**
- `productId`: The ID of the product to delete
- `reason`: Optional reason for deletion

**Example:**
```typescript
try {
  await deleteCreatorProductAction("prod-123", "Product discontinued");
} catch (error) {
  // Handle error - might be due to active subscriptions
  console.error(error.message);
}
```

**Safety Features:**
- Prevents deletion of products with active subscriptions
- Soft delete with audit trail
- Stripe product deletion
- Error handling for constraints

### Product Duplication

#### `duplicateCreatorProductAction(productId: string, newName?: string): Promise<void>`

Creates a copy of an existing product with optional name customization.

**Parameters:**
- `productId`: The ID of the product to duplicate
- `newName`: Optional new name for the duplicated product

**Example:**
```typescript
// Duplicate with custom name
await duplicateCreatorProductAction("prod-123", "Premium Analytics Tool v2");

// Duplicate with auto-generated name
await duplicateCreatorProductAction("prod-123"); // Creates "Original Name (Copy)"
```

### Bulk Operations

#### `bulkArchiveProductsAction(productIds: string[], reason?: string): Promise<{succeeded: number, failed: number}>`

Archives multiple products in a single operation.

**Example:**
```typescript
const productIds = ["prod-1", "prod-2", "prod-3"];
const result = await bulkArchiveProductsAction(productIds, "End of season");

console.log(`Archived ${result.succeeded} products, ${result.failed} failed`);
```

#### `bulkDeleteProductsAction(productIds: string[], reason?: string): Promise<{succeeded: number, failed: number}>`

Deletes multiple products with proper error handling.

**Example:**
```typescript
const productIds = ["prod-1", "prod-2"];
const result = await bulkDeleteProductsAction(productIds, "Product line discontinued");

console.log(`Deleted ${result.succeeded} products, ${result.failed} failed`);
```

### Statistics

#### `getCreatorProductStatsAction(): Promise<{total: number, active: number, archived: number, deleted: number}>`

Retrieves product statistics for dashboard display.

**Example:**
```typescript
const stats = await getCreatorProductStatsAction();
console.log(`Total: ${stats.total}, Active: ${stats.active}`);
```

## Stripe Integration

### Product Creation

The API creates products in Stripe with enhanced metadata:

```typescript
// Stripe product creation
const stripeProduct = await stripeAdmin.products.create({
  name: productData.name,
  description: productData.description,
  metadata: {
    creator_id: user.id,
    features: features.join(','),
    category: productData.category,
    tags: tags.join(','),
    ...customMetadata
  },
  images: productData.images,
  statement_descriptor: productData.statement_descriptor,
  unit_label: productData.unit_label,
  active: productData.active
}, {
  stripeAccount: creatorProfile.stripe_access_token
});
```

### Price Management

Advanced price creation with subscription support:

```typescript
const priceData = {
  product: stripeProductId,
  unit_amount: Math.round(price * 100),
  currency: currency,
  recurring: {
    interval: billing_interval,
    interval_count: billing_interval_count,
    trial_period_days: trial_period_days
  }
};

const stripePrice = await stripeAdmin.prices.create(priceData, {
  stripeAccount: creatorProfile.stripe_access_token
});
```

## Error Handling

### Common Errors

1. **Authentication Error**
   ```typescript
   // Error: "Not authenticated"
   // Solution: Ensure user is logged in
   ```

2. **Stripe Connection Error**
   ```typescript
   // Error: "Stripe account not connected"
   // Solution: Complete Stripe onboarding process
   ```

3. **Active Subscription Error**
   ```typescript
   // Error: "Cannot delete product with active subscriptions. Archive it instead."
   // Solution: Archive the product or wait for subscriptions to end
   ```

4. **Validation Errors**
   ```typescript
   // Error: Product name, price, and currency are required
   // Solution: Provide all required fields
   ```

### Error Response Format

```typescript
try {
  await createOrUpdateEnhancedProductAction(productData);
} catch (error) {
  console.error('Product operation failed:', error.message);
  // Handle specific error types
  if (error.message.includes('not authenticated')) {
    // Redirect to login
  } else if (error.message.includes('Stripe account')) {
    // Redirect to Stripe onboarding
  }
}
```

## Best Practices

### 1. Data Validation

Always validate product data before API calls:

```typescript
const validateProductData = (data: EnhancedProductData) => {
  if (!data.name?.trim()) throw new Error('Product name is required');
  if (!data.price || data.price <= 0) throw new Error('Valid price is required');
  if (!data.currency) throw new Error('Currency is required');
  if (!data.product_type) throw new Error('Product type is required');
};
```

### 2. Error Handling

Implement comprehensive error handling:

```typescript
try {
  await createOrUpdateEnhancedProductAction(productData);
  toast.success('Product saved successfully');
} catch (error) {
  console.error('Product save failed:', error);
  toast.error(`Failed to save product: ${error.message}`);
}
```

### 3. Bulk Operations

Use bulk operations for efficiency:

```typescript
// Instead of individual calls
for (const productId of selectedProducts) {
  await archiveCreatorProductAction(productId);
}

// Use bulk operation
const result = await bulkArchiveProductsAction(selectedProductIds, reason);
```

### 4. Metadata Management

Structure metadata consistently:

```typescript
const metadata = {
  category: 'Analytics Tools',
  priority: 'high',
  target_audience: 'enterprise',
  features: features.join(','),
  tags: tags.join(','),
  created_by: 'dashboard_v2'
};
```

### 5. Image Management

Validate and optimize images:

```typescript
const validateImages = (images: string[]) => {
  return images
    .filter(url => url.trim() !== '')
    .map(url => url.trim())
    .slice(0, 8); // Stripe limit
};
```

## Migration Guide

### From Legacy to Enhanced API

1. **Update Product Creation**
   ```typescript
   // Old way
   const productData = {
     name: 'Product',
     price: 29.99,
     image_url: 'image.jpg'
   };
   
   // New way
   const enhancedData: EnhancedProductData = {
     name: 'Product',
     price: 29.99,
     images: ['image.jpg'],
     currency: 'usd',
     product_type: 'one_time',
     active: true
   };
   ```

2. **Add Enhanced Features Gradually**
   ```typescript
   // Start simple
   const basicProduct = { /* basic fields */ };
   
   // Add features over time
   const enhancedProduct = {
     ...basicProduct,
     features: ['Feature 1', 'Feature 2'],
     category: 'Tools',
     metadata: { priority: 'high' }
   };
   ```

3. **Update UI Components**
   ```typescript
   // Replace CreatorProductManager with EnhancedProductManager
   import { EnhancedProductManager } from '@/features/creator/components/EnhancedProductManager';
   ```

## Rate Limits and Performance

### Stripe API Limits
- Product operations: 100 requests per second
- Bulk operations are more efficient than individual calls
- Use pagination for large product lists

### Best Practices
- Batch multiple updates when possible
- Cache product data on the frontend
- Use optimistic updates for better UX
- Implement proper loading states

## Support and Troubleshooting

### Common Issues

1. **Products not appearing in Stripe Dashboard**
   - Check connected account permissions
   - Verify stripe_access_token is valid
   - Ensure webhook endpoints are configured

2. **Price updates not working**
   - Prices are immutable in Stripe
   - Create new prices and archive old ones
   - Update subscription references

3. **Bulk operations timing out**
   - Reduce batch size
   - Implement retry logic
   - Use background jobs for large operations

### Debug Mode

Enable detailed logging:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Product data:', JSON.stringify(productData, null, 2));
  console.log('Stripe response:', stripeResponse);
}
```