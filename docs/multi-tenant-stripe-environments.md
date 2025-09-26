# Multi-Tenant Stripe Environment Management

## Overview

The Staryer platform provides comprehensive multi-tenant Stripe environment management, allowing each tenant to configure products in a safe test environment and deploy them to production with one-click deployment. This ensures safe testing while maintaining complete tenant isolation.

## Key Features

### 🔒 **Complete Tenant Isolation**
- Each tenant has separate Stripe environments (test & production)
- Row-Level Security (RLS) ensures data isolation
- Audit logging tracks all environment operations

### 🧪 **Safe Testing Environment**
- Configure products in test mode without affecting live payments
- Test payment flows with Stripe test cards
- Validate integrations before production deployment

### 🚀 **One-Click Production Deployment**
- Deploy tested products to production instantly
- Maintain deployment history and rollback capabilities
- Bulk deployment support for multiple products

### 📊 **Environment Management**
- Switch between test and production environments
- Visual indicators for current environment
- Environment-specific connection status

## Architecture

### Database Schema

#### Core Tables

**`stripe_environment_configs`**
```sql
- tenant_id: uuid (FK to tenants)
- environment: 'test' | 'production'
- stripe_account_id: text
- stripe_access_token: text (encrypted)
- is_active: boolean
- sync_status: 'pending' | 'syncing' | 'synced' | 'failed'
```

**`product_environment_deployments`**
```sql
- tenant_id: uuid (FK to tenants)
- product_id: uuid (FK to creator_products)
- source_environment: 'test' | 'production'
- target_environment: 'test' | 'production'
- deployment_status: 'pending' | 'deploying' | 'completed' | 'failed'
- deployment_data: jsonb
```

**`environment_sync_logs`**
```sql
- tenant_id: uuid (FK to tenants)
- environment: 'test' | 'production'
- operation: text ('deployment', 'environment_switch', etc.)
- status: 'started' | 'completed' | 'failed'
- operation_data: jsonb
```

### Enhanced Platform Settings

**`platform_settings`** (updated)
```sql
-- Environment Management
- stripe_environment: 'test' | 'production' (current active)
- stripe_test_enabled: boolean
- stripe_production_enabled: boolean

-- Test Environment Credentials
- stripe_test_account_id: text
- stripe_test_access_token: text
- stripe_test_refresh_token: text

-- Production Environment Credentials  
- stripe_production_account_id: text
- stripe_production_access_token: text
- stripe_production_refresh_token: text
```

## API Reference

### Environment Management

#### Switch Environment
```typescript
POST /api/v1/environment
{
  "environment": "test" | "production"
}
```

#### Get Environment Status
```typescript
GET /api/v1/environment
// Returns current environment and connection status
```

### Product Deployment

#### Deploy Single Product with Scheduling
```typescript
POST /api/v1/products/deploy
{
  "action": "deploy", // or "schedule"
  "productId": "uuid",
  "scheduleFor": "2024-12-25T09:00:00Z", // for scheduled deployments
  "timezone": "America/New_York",
  "notificationSettings": {
    "email_notifications": true,
    "reminder_before_minutes": 30
  }
}
```

#### Validate Product Before Deployment
```typescript
POST /api/v1/products/deploy
{
  "action": "validate",
  "productId": "uuid"
}
```

#### Get Deployment Status with Progress
```typescript
POST /api/v1/products/deploy
{
  "action": "status",
  "deploymentId": "uuid"
}
```

#### Cancel Scheduled Deployment
```typescript
POST /api/v1/products/deploy
{
  "action": "cancel",
  "deploymentId": "uuid"
}
```

#### Bulk Deploy Products
```typescript
POST /api/v1/products/deploy
{
  "productIds": ["uuid1", "uuid2", ...]
}
```

#### Get Deployment History
```typescript
GET /api/v1/products/deploy?productId=uuid
```

## Usage Guide

### Initial Setup

1. **Run Setup Script**
   ```bash
   chmod +x scripts/copilot/setup-stripe-environments.sh
   ./scripts/copilot/setup-stripe-environments.sh
   ```

2. **Connect Stripe Environments**
   - Visit `/platform-owner-onboarding`
   - Connect test environment first (recommended)
   - Optionally connect production environment

### Product Development Workflow

#### 1. Create Products in Test Environment

```typescript
// Environment automatically set to 'test' for new products
const product = await createPlatformProductAction({
  name: "My Test Product",
  description: "Testing in safe environment",
  monthlyPrice: 29.99,
  active: true
});
```

#### 2. Test Payment Flows

Use Stripe test cards to validate:
- `4242424242424242` - Successful payments
- `4000000000000002` - Declined payments
- `4000000000009995` - Insufficient funds

#### 3. Deploy to Production

##### One-Button Go Live
Experience the delightful one-button deployment process:

```typescript
// Instant deployment with validation
const deployment = await deployProductToProductionAction(productId);

// The system automatically:
// - Validates the product and environment
// - Provides real-time progress updates
// - Creates Stripe products and prices
// - Updates local database records
// - Shows celebration when complete! 🎉
```

##### Scheduled Go Live
Schedule deployments for optimal timing:

```typescript
// Schedule a deployment
const scheduledDeployment = await scheduleProductDeploymentAction(
  productId,
  '2024-12-25T09:00:00Z', // Christmas morning launch!
  'America/New_York',
  {
    email_notifications: true,
    reminder_before_minutes: 30
  }
);

// Check scheduled deployments
const scheduled = await getScheduledDeploymentsAction();
```

##### Enhanced UI Components
```tsx
// One-button go-live with validation and progress
<ProductDeploymentManager 
  productId={productId}
  productName="My Awesome Product"
  isTestProduct={true}
  hasProductionVersion={false}
  onDeploymentComplete={() => celebrate()}
/>

// Scheduled deployments dashboard
<ScheduledDeploymentsManager 
  onDeploymentUpdate={refreshData}
/>
```

### Environment Switching

```typescript
// Switch environments via UI component
<EnvironmentSwitcher
  currentEnvironment="test"
  testEnabled={true}
  productionEnabled={true}
  onEnvironmentChange={(env) => console.log(`Switched to ${env}`)}
/>

// Or programmatically
await switchStripeEnvironmentAction('production');
```

## Component Integration

### Environment Switcher

```typescript
import { EnvironmentSwitcher } from '@/features/platform-owner-onboarding/components/EnvironmentSwitcher';

<EnvironmentSwitcher
  currentEnvironment={currentEnv}
  testEnabled={settings.stripe_test_enabled}
  productionEnabled={settings.stripe_production_enabled}
  onEnvironmentChange={handleEnvironmentChange}
/>
```

### Product Deployment Manager

```typescript
import { ProductDeploymentManager } from '@/features/platform-owner-onboarding/components/ProductDeploymentManager';

<ProductDeploymentManager
  productId={product.id}
  productName={product.name}
  isTestProduct={currentEnvironment === 'test'}
  hasProductionVersion={!!product.stripe_production_product_id}
  lastDeployedAt={product.last_deployed_to_production}
  onDeploymentComplete={() => refreshProducts()}
/>
```

## Security Considerations

### Credential Management

- **Encryption**: All Stripe credentials encrypted at rest
- **Access Control**: Environment-specific access controls
- **Audit Trail**: Complete audit log of all operations

### Tenant Isolation

- **RLS Policies**: Database-level tenant isolation
- **API Wrappers**: Automatic tenant context injection
- **Environment Separation**: Test/production isolation per tenant

### Best Practices

1. **Always Test First**: Create and validate products in test environment
2. **Gradual Rollout**: Deploy individual products before bulk operations
3. **Monitor Deployments**: Check deployment status and error logs
4. **Backup Strategy**: Keep deployment history for rollback capability

## Quick Start Guide

### For Platform Owners

1. **Set Up Environments**
   - Navigate to Platform Dashboard
   - Click "Environment Setup" to configure test and production Stripe accounts
   - Use the Environment Switcher to toggle between modes

2. **Monitor Environment Status**
   - Dashboard shows current active environment
   - Green indicators for connected environments
   - Gray indicators for unconnected environments

3. **Manage Creator Products**
   - View all creator products with environment badges
   - Monitor deployment status from test to production
   - Switch environments as needed for platform operations

### For Creators

1. **Connect Your Stripe Account**
   - Complete the enhanced onboarding flow
   - Learn about test vs production environments
   - Your account will be set up for both environments

2. **Create and Test Products**
   - Start in test mode (default)
   - Create subscription tiers and products safely
   - Use Stripe test cards for validation
   - Test cards: `4242424242424242` (success), `4000000000000002` (declined)

3. **Deploy to Production**
   - Use one-click deployment buttons on test products
   - Products will be created in your production Stripe account
   - Monitor deployment status in your dashboard

4. **Monitor Environment Status**
   - Dashboard shows current environment mode
   - Environment badges on all products
   - Educational tooltips explain test vs production

## Troubleshooting Common Issues

### Common Issues

#### 1. Environment Connection Failed

**Symptoms**: Cannot connect test or production environment

**Solutions**:
- Verify Stripe API keys in environment variables
- Check webhook endpoints are configured
- Ensure Stripe Connect is enabled for your account

#### 2. Deployment Fails

**Symptoms**: Product deployment status shows 'failed'

**Solutions**:
- Check deployment error message in history
- Verify production environment is properly connected
- Ensure product data is valid for production

#### 3. Environment Switch Not Working

**Symptoms**: UI shows wrong environment or switching fails

**Solutions**:
- Clear browser cache and reload
- Check tenant context in browser dev tools
- Verify user has proper permissions

### Debug Mode

Enable detailed logging:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Environment operation:', operationData);
  console.log('Stripe response:', stripeResponse);
}
```

## Enhanced Creator Experience

### Creator Onboarding Enhancements

The updated creator onboarding now includes comprehensive education about SaaSinaSnap's environment management:

#### Stripe Connection Education
- **Smart Environment Management**: Automatic test/production environment setup
- **Usage Tracking**: Built-in tier management and usage monitoring
- **One-Click Deployment**: Seamless promotion from test to production
- **Smart Billing**: Automatic upgrades, overages, and tier recommendations

#### Visual Environment Indicators
Creators see clear visual indicators throughout their dashboard:
- 🧪 **Test Mode**: Blue badges and test tube icons
- ⚡ **Production Mode**: Green badges and lightning bolt icons

### Enhanced Creator Dashboard

#### Environment Status Display
```tsx
// Shows current environment with educational context
<div className="environment-status">
  <TestTube className="h-5 w-5 text-blue-600" />
  <div>
    <h4>Current Environment: Test Mode</h4>
    <p>Products created in test mode use Stripe test payments - safe for development</p>
  </div>
</div>
```

#### Product Environment Badges
Each product displays its environment status:
- **Test products**: Blue badge with test tube icon
- **Production products**: Green badge with lightning bolt icon
- **Deployment status**: Shows if test product has been deployed to production

#### One-Click Deployment Integration
```tsx
<ProductDeploymentManager
  productId={product.id}
  productName={product.name}
  isTestProduct={true}
  hasProductionVersion={!!product.stripe_production_product_id}
  onDeploymentComplete={() => refreshProducts()}
/>
```

### Platform Owner Dashboard Enhancements

The platform owner dashboard now includes:

#### Environment Switcher Integration
- Top-right environment switcher for quick mode changes
- Real-time environment status display
- Connection status for both test and production environments

#### Environment Status Cards
```tsx
// Visual indicators for current environment state
<div className="environment-card">
  <div className="status-indicator">
    Test: {testEnabled ? 'Connected' : 'Not Connected'}
  </div>
  <div className="status-indicator">  
    Production: {productionEnabled ? 'Connected' : 'Not Connected'}
  </div>
</div>
```

#### Environment Management Link
Direct access to environment configuration through the dashboard grid.

## Migration Guide

### From Legacy Single Environment

1. **Backup Data**: Export existing products and settings
2. **Run Migration**: Apply database schema updates
3. **Update Components**: Replace old product managers with environment-aware versions
4. **Test Deployment**: Verify environment switching works correctly

### Environment Variables Update

**Add to .env.local:**
```env
# Production Stripe Credentials (optional)
STRIPE_PRODUCTION_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PRODUCTION_PUBLISHABLE_KEY=pk_live_...

# Webhook Endpoints (if different per environment)
STRIPE_TEST_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRODUCTION_WEBHOOK_SECRET=whsec_...
```

## Advanced Features

### Webhook Management

Environment-specific webhooks are automatically configured:

```typescript
// Webhooks are set per environment
const testWebhook = await stripe.webhookEndpoints.create({
  url: `${baseUrl}/api/webhooks/stripe?env=test`,
  enabled_events: ['payment_intent.succeeded', 'customer.subscription.updated']
});
```

### Custom Deployment Strategies

```typescript
// Implement custom deployment logic
class CustomDeploymentStrategy {
  async deploy(product: Product, targetEnv: Environment) {
    // Custom validation
    await this.validateProduct(product);
    
    // Custom transformation
    const transformedData = await this.transformForEnvironment(product, targetEnv);
    
    // Deploy with custom options
    return await this.deployWithOptions(transformedData, targetEnv);
  }
}
```

### Analytics Integration

Track environment operations:

```typescript
// PostHog events include environment context
posthog.capture('product_deployed', {
  productId,
  sourceEnvironment: 'test',
  targetEnvironment: 'production',
  deploymentTime: Date.now(),
  tenantId
});
```

## Support

- **Documentation**: Check this guide and inline code comments
- **GitHub Issues**: Report bugs and feature requests
- **Community**: Join discussions in GitHub Discussions
- **Enterprise Support**: Contact for dedicated support options

---

*This documentation is automatically updated with each release. Last updated: December 2024*