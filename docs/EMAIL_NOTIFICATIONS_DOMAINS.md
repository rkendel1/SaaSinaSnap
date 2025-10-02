# Email Service, Notifications, and Custom Domains Implementation

This document describes the implementation of seamless email service integration, in-app notifications, and custom domain management for the SaaSinaSnap platform.

## 1. Email Service Integration

### Overview
The platform uses Resend for transactional emails and marketing campaigns, with support for creator-branded email templates.

### Features Implemented

#### Email Templates
All email templates are built using React Email components and support creator branding:

1. **Welcome Email** (`creator-welcome-email.tsx`)
   - Sent when a customer subscribes to a creator's product
   - Includes creator logo and brand colors
   - Call-to-action button for account access

2. **Payment Failed Email** (`creator-payment-failed-email.tsx`)
   - Notifies customers of failed payment attempts
   - Includes next retry date
   - Link to update payment method

3. **Password Reset Email** (`creator-password-reset-email.tsx`)
   - Secure password reset with time-limited token
   - Branded with creator information
   - Clear instructions for users

4. **Subscription Renewal Email** (`creator-subscription-renewal-email.tsx`)
   - Confirms successful subscription renewal
   - Shows amount charged and renewal date
   - Link to manage subscription

5. **Feature Update Email** (`creator-feature-update-email.tsx`)
   - Announces new features to subscribers
   - Highlights feature benefits
   - Call-to-action to try the new feature

### Email Service API

```typescript
// Send a branded email
await sendCreatorBrandedEmail({
  type: 'welcome' | 'payment_failed' | 'password_reset' | 'subscription_renewal' | 'feature_update',
  creatorId: string,
  customerEmail: string,
  customerName: string,
  data: {
    // Type-specific data
    productName?: string,
    resetUrl?: string,
    amount?: string,
    renewalDate?: string,
    featureTitle?: string,
    featureDescription?: string,
  }
});
```

### Drip Campaign System

The platform includes a complete marketing drip campaign system:

#### Features
- Create email sequences with custom delays
- Automatic email sending based on schedule
- Subscriber management and tracking
- Campaign analytics and monitoring

#### API

```typescript
// Create a drip campaign
const campaign = await createDripCampaign(creatorId, 'Welcome Series', [
  {
    delayDays: 0,
    emailType: 'welcome',
    subject: 'Welcome!',
    content: { ... }
  },
  {
    delayDays: 3,
    emailType: 'feature_update',
    subject: 'Check out these features',
    content: { ... }
  }
]);

// Subscribe a customer
await subscribeToDripCampaign(campaignId, customerEmail, customerName);

// Process campaigns (should be called by cron job)
await processDripCampaigns();
```

#### Database Schema

```sql
-- Drip campaigns table
CREATE TABLE drip_campaigns (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  creator_id UUID REFERENCES creator_profiles(id),
  email_sequence JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Campaign subscribers
CREATE TABLE drip_campaign_subscribers (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES drip_campaigns(id),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  subscribed_at TIMESTAMPTZ,
  current_step INTEGER,
  last_email_sent_at TIMESTAMPTZ,
  unsubscribed BOOLEAN
);
```

## 2. In-App Notifications

### Overview
Real-time notification system for keeping users informed of important events within the platform.

### Features Implemented

#### Notification Types
- **success**: Positive confirmations (e.g., product created, subscription renewed)
- **info**: Informational updates (e.g., new features, updates)
- **warning**: Important notices requiring attention (e.g., payment issues)
- **error**: Critical errors requiring immediate action

#### Notification Service API

```typescript
// Create a notification
await createNotification({
  userId: string,
  creatorId?: string,
  type: 'success' | 'info' | 'warning' | 'error',
  title: string,
  message: string,
  link?: string
});

// Get user notifications
const notifications = await getUserNotifications(userId, limit, offset);

// Mark as read
await markNotificationAsRead(notificationId);
await markAllNotificationsAsRead(userId);

// Delete notification
await deleteNotification(notificationId);

// Get unread count
const count = await getUnreadNotificationCount(userId);
```

#### Helper Functions

```typescript
// Notify specific events
await notifySubscriptionRenewal(userId, creatorId, productName, amount);
await notifyFeatureUpdate(userId, creatorId, featureTitle, description);
await notifyPaymentFailure(userId, creatorId, productName);
```

#### Database Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  creator_id UUID REFERENCES creator_profiles(id),
  type VARCHAR(50) CHECK (type IN ('success', 'info', 'warning', 'error')),
  title VARCHAR(255),
  message TEXT,
  link VARCHAR(500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### UI Components

**NotificationsList Component** (`NotificationsList.tsx`)
- Displays notifications with icons based on type
- Real-time updates when notifications are marked as read
- Delete functionality
- Link to related content
- Shows unread count
- "Mark all as read" action

**Notifications Page** (`/creator/dashboard/notifications`)
- Server-side rendered page
- Fetches notifications from database
- Integrates NotificationsList component

### Real-Time Notifications

The system is designed to work with Supabase Realtime for live updates:

```typescript
// Subscribe to notification changes
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle new notification
    handleNewNotification(payload.new);
  })
  .subscribe();
```

## 3. Custom Domains for Creator Pages

### Overview
Allows creators to use their own domains (e.g., shop.yourdomain.com) for their storefronts, providing a fully branded experience.

### Features Implemented

#### Domain Management API

```typescript
// Add a custom domain
const result = await addCustomDomain(creatorId, 'shop.yourdomain.com');
// Returns: { success, domainId, verificationToken, error? }

// Verify domain
const verification = await verifyCustomDomain(domainId);
// Returns: { success, verified, error? }

// Get creator domains
const domains = await getCreatorCustomDomains(creatorId);

// Delete domain
await deleteCustomDomain(domainId);

// Get DNS instructions
const instructions = await getDNSInstructions(domain, token, platformDomain);
```

#### Domain Statuses
- **pending**: Domain added, awaiting DNS configuration
- **verified**: DNS records confirmed, domain is active
- **failed**: Verification failed, DNS records need correction

#### DNS Configuration

For each domain, creators need to add:

1. **TXT Record** (for verification)
   - Name: domain name
   - Value: `saasinasnap-verification={token}`

2. **CNAME Record** (to point to platform)
   - Name: subdomain (or @ for root)
   - Value: platform domain (e.g., saasinasnap.com)

#### Database Schema

```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id),
  domain VARCHAR(255) UNIQUE,
  status VARCHAR(20) CHECK (status IN ('pending', 'verified', 'failed')),
  verification_token VARCHAR(255),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### UI Components

**CustomDomainManager Component** (`CustomDomainManager.tsx`)
- Add new domains with validation
- Display domain status (pending/verified/failed)
- Verify domains manually
- Delete domains
- Show DNS configuration instructions
- Status badges and real-time updates

**CustomDomainGuide Component** (`CustomDomainGuide.tsx`)
- Step-by-step setup instructions
- Custom URL slug management
- Current storefront URL display
- Benefits of custom domains
- Contextual help and tooltips
- Integration with CustomDomainManager

### Domain Verification Process

1. Creator adds domain via UI
2. System generates unique verification token
3. DNS instructions displayed to creator
4. Creator configures DNS at their registrar
5. Creator clicks "Verify" button
6. System checks DNS records (TXT + CNAME)
7. If verified, domain status updated to "verified"
8. Domain becomes active for routing

### Security Considerations

- Domain uniqueness enforced at database level
- RLS policies ensure creators only see their own domains
- Verification tokens are randomly generated
- DNS propagation can take up to 48 hours
- Failed verifications can be retried

## Configuration

### Environment Variables

```env
# Required for email service
RESEND_API_KEY=your_resend_api_key

# Required for notifications and domains
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Platform configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Database Migrations

Run the following migrations:

```bash
# Add notifications and drip campaigns
supabase migration up 20250131000000_add_notifications_and_drip_campaigns.sql

# Add custom domains
supabase migration up 20250131000001_add_custom_domains.sql
```

## Usage Examples

### Sending an Email

```typescript
import { sendCreatorBrandedEmail } from '@/features/creator/controllers/email-service';

// Send welcome email
await sendCreatorBrandedEmail({
  type: 'welcome',
  creatorId: 'creator-123',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  data: {
    productName: 'Premium Plan',
  }
});
```

### Creating a Notification

```typescript
import { notifySubscriptionRenewal } from '@/features/creator/services/notification-service';

// Notify about subscription renewal
await notifySubscriptionRenewal(
  'user-123',
  'creator-456',
  'Premium Plan',
  '$29.99'
);
```

### Adding a Custom Domain

```typescript
import { addCustomDomain } from '@/features/creator/services/custom-domain-service';

// Add domain
const result = await addCustomDomain('creator-123', 'shop.example.com');

if (result.success) {
  console.log('Domain added:', result.domainId);
  console.log('Verification token:', result.verificationToken);
}
```

## Best Practices

### Email Service
1. Always include creator branding (logo, colors)
2. Test emails before sending to customers
3. Monitor delivery rates and failures
4. Use drip campaigns for onboarding and engagement
5. Respect unsubscribe requests

### Notifications
1. Keep messages concise and actionable
2. Include links to relevant pages
3. Don't overwhelm users with too many notifications
4. Use appropriate notification types
5. Allow users to manage notification preferences

### Custom Domains
1. Provide clear DNS setup instructions
2. Support both subdomains and root domains
3. Monitor verification status
4. Handle DNS propagation delays gracefully
5. Offer support for domain configuration

## Testing

### Email Templates
```bash
# Run email development server
npm run email:dev

# Build email templates
npm run email:build
```

### Notifications
- Test notification creation and display
- Verify RLS policies prevent unauthorized access
- Test mark as read/unread functionality
- Check real-time updates with Supabase Realtime

### Custom Domains
- Test domain validation (format checking)
- Verify DNS record generation
- Test domain verification process
- Check domain status updates
- Test domain deletion

## Future Enhancements

1. **Email Service**
   - A/B testing for email campaigns
   - Email analytics and open rates
   - Template customization interface
   - Scheduled email sending

2. **Notifications**
   - Push notifications (browser/mobile)
   - Email digest for notifications
   - Notification preferences per category
   - Real-time badge updates

3. **Custom Domains**
   - Automatic SSL certificate provisioning
   - Wildcard domain support
   - DNS provider integrations
   - Automatic DNS configuration via APIs

## Support

For issues or questions:
- Check the database logs for errors
- Verify environment variables are set correctly
- Review Supabase RLS policies
- Check Resend dashboard for email delivery status
- Ensure DNS records are correctly configured

## Migration Guide

If upgrading from a previous version:

1. Run database migrations
2. Update environment variables
3. Restart the application
4. Test email sending
5. Verify notification system
6. Test domain management

## Conclusion

This implementation provides a complete solution for:
- Professional, branded email communications
- Real-time user notifications
- Custom domain management for creator pages

All features are built with scalability, security, and user experience in mind.
