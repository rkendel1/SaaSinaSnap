# Role-Based Access Control Model

## Overview

SaaSinaSnap uses a **single-tenant, role-driven architecture** to manage access control and navigation throughout the platform. This approach simplifies the system while maintaining clear separation between different user types.

## User Roles

The platform supports three primary user roles:

### 1. Platform Owner
- **Description**: The administrator who owns and operates the SaaSinaSnap platform
- **Access**: Full platform management capabilities
- **Routes**: `/dashboard/*`, `/platform-owner-onboarding`
- **Capabilities**:
  - Manage all creators and users
  - Configure platform settings
  - View platform-wide analytics
  - Manage Stripe environment settings (test/production)
  - Monitor creator health and performance

### 2. Creator
- **Description**: Business owners who use SaaSinaSnap to monetize their services
- **Access**: Their own business management tools
- **Routes**: `/creator/*`
- **Capabilities**:
  - Manage products and pricing
  - Create white-labeled sites
  - Generate embeds and scripts
  - View revenue analytics
  - Manage customer subscriptions
  - Configure business profile and branding

### 3. User/Customer
- **Description**: End users who subscribe to creator services
- **Access**: Account and subscription management
- **Routes**: `/account/*`
- **Capabilities**:
  - Manage subscription
  - View billing and usage
  - Update account preferences
  - Access purchased content

## Role Assignment

Roles are automatically assigned based on user actions:

- **Platform Owner**: Assigned when creating platform_settings record (first user)
- **Creator**: Assigned when creating a creator_profile
- **User/Customer**: Default role for authenticated users without creator profile

## Role Detection

The system uses the `EnhancedAuthService` to determine user roles:

```typescript
// Check for platform owner
const platformSettings = await getPlatformSettings(userId);
if (platformSettings) return 'platform_owner';

// Check for creator
const creatorProfile = await getCreatorProfile(userId);
if (creatorProfile) return 'creator';

// Default to user
return 'user';
```

## Navigation Filtering

Each layout and navigation component filters routes based on the current user's role:

- **Platform Layout**: Only accessible to platform_owner role
- **Creator Layout**: Only accessible to users with creator_profile
- **Role-Based Navigation Component**: Dynamically shows routes based on role

## Security Model

### Row-Level Security (RLS)

Instead of multi-tenant isolation, RLS policies are based on user roles and ownership:

- **Platform Settings**: Accessible only to the platform owner
- **Creator Profiles**: Users can only access their own profile
- **Products**: Creators can only manage their own products
- **Subscriptions**: Users can only view their own subscriptions

### Authentication Flow

1. User authenticates via Supabase
2. System checks for platform_settings.owner_id match → Platform Owner
3. If not, checks for creator_profile → Creator
4. Otherwise → User/Customer
5. Redirects to appropriate dashboard based on role

## Onboarding Flows

### Platform Owner Onboarding
Located at: `/platform-owner-onboarding`

Steps:
1. Welcome
2. Environment Variables Review
3. Stripe Connect Setup
4. Role Management Overview
5. Creator Onboarding Review
6. Completion

### Creator Onboarding
Located at: `/creator/onboarding`

Steps:
1. Welcome
2. Brand Setup (logo/website)
3. Stripe Connect
4. Completion

### User Onboarding
- No formal onboarding flow
- Users sign up and can immediately subscribe to creator products

## Migration from Multi-Tenant

The platform was previously designed with multi-tenant architecture but has been refactored to single-tenant, role-based:

### Removed Concepts
- ❌ `tenant_id` columns
- ❌ `tenants` table
- ❌ `getTenantIdFromHeaders()` function
- ❌ Tenant-based RLS policies

### Replaced With
- ✅ Role-based authentication
- ✅ User ownership RLS policies
- ✅ Direct user_id/creator_id relationships
- ✅ Role-specific routing and navigation

## Best Practices

### When Adding New Features

1. **Determine User Role**: Which role should access this feature?
2. **Add Route Protection**: Use appropriate layout (platform, creator, or none)
3. **Update Navigation**: Add to RoleBasedNavigation component if needed
4. **Set RLS Policies**: Create policies based on user ownership, not tenant_id
5. **Test All Roles**: Ensure feature is only accessible to intended roles

### Database Schema

When creating new tables:
- ✅ Use `user_id` or `creator_id` for ownership
- ✅ Add RLS policies based on auth.uid()
- ❌ Don't add `tenant_id` columns
- ❌ Don't reference tenants table

### Authentication Checks

```typescript
// ✅ Correct: Check user role
const user = await getAuthenticatedUser();
const creatorProfile = await getCreatorProfile(user.id);
if (!creatorProfile) redirect('/login');

// ❌ Incorrect: Check tenant_id
const tenantId = getTenantIdFromHeaders();
if (!tenantId) throw new Error('Tenant context not found');
```

## Troubleshooting

### User Can't Access Expected Routes

1. Check user's role via EnhancedAuthService
2. Verify layout protection matches user role
3. Check RLS policies on affected tables
4. Ensure onboarding is completed if required

### Role Assignment Issues

1. Platform Owner: Check `platform_settings.owner_id`
2. Creator: Check `creator_profiles` table for user
3. User: Default role, no special table needed

## Summary

The role-based model provides:
- **Simplicity**: Single tenant, clear role definitions
- **Security**: Role-based access control at layout and database levels
- **Scalability**: Easy to add new roles or modify permissions
- **Maintainability**: No complex tenant context management
