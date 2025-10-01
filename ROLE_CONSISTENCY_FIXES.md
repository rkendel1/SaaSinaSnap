# Role Detection and Consistency Fixes

## Summary
This document describes the changes made to unify role detection, ensure DB/metadata consistency, remove legacy tenant logic, and fix navigation menu logic.

## Problem Statement
- Unify role detection and redirects for all dashboard and platform setup pages
- Ensure DB/metadata role consistency for platform owner
- Remove legacy tenant logic
- Fix hamburger menu logic on landing page so users see Platform Dashboard instead of only Creator Dashboard

## Changes Made

### 1. Removed Legacy Tenant Logic

#### TypeScript Interfaces (`src/features/creator/types/index.ts`)
- Removed `tenant_id` field from `CreatorProfile` interface
- Removed `tenant_id` field from `CreatorProduct` interface
- Fixed duplicate field definitions in `CreatorProduct` interface

**Rationale:** Database migration `20250130000000_remove_multi_tenant_support.sql` already removed tenant support from the database schema. The TypeScript interfaces were out of sync and still referenced tenant_id, which could cause runtime errors.

#### Usage Tracking Service (`src/features/usage-tracking/services/usage-tracking-service-simple.ts`)
Removed broken tenant logic from multiple methods:
- `trackUsage()` - Removed `tenant_id` from insert
- `getUsageSummary()` - Removed `tenant_id` filters
- `getUsageAnalytics()` - Removed `getTenantIdFromHeaders()` call and `tenant_id` filters
- `updateAggregatesAsync()` - Removed `getTenantIdFromHeaders()` call and `tenant_id` usage
- `checkLimitsAsync()` - Removed `getTenantIdFromHeaders()` call and `tenant_id` usage

**Rationale:** The `getTenantIdFromHeaders()` function doesn't exist, causing these methods to crash. After removing tenant support from the database, these methods need to filter by `creator_id` only.

### 2. Fixed Navigation Menu for Platform Discovery

#### Account Menu (`src/components/account-menu.tsx`)
Changed menu structure to show:
- "Platform Dashboard" link for ALL authenticated users (first item)
- "Creator Dashboard" link for ALL authenticated users (second item)
- "Account Settings" link
- "Log Out" action

**Previous Behavior:**
- Platform owners saw both dashboards
- Regular users only saw Creator Dashboard

**New Behavior:**
- All users see both dashboard links
- Platform Dashboard is shown first to promote platform discovery
- Users can explore the platform owner features even if they're not yet platform owners

**Rationale:** The problem statement requested that users should see "Platform Dashboard" for discovery purposes. This change allows all authenticated users to learn about platform owner features and potentially upgrade.

### 3. Ensured DB/Metadata Role Consistency for Platform Owner

#### Platform Settings Controller (`src/features/platform-owner-onboarding/controllers/get-platform-settings.ts`)
Added metadata update when creating platform owner:

```typescript
// Set the user's role to 'platform_owner' ONLY upon initial creation of platform settings.
// Use atomic update to ensure consistency between DB and metadata
await supabaseAdmin
  .from('users')
  .update({ role: 'platform_owner' })
  .eq('id', ownerId);

// Also update metadata for consistency
await supabaseAdmin.auth.admin.updateUserById(ownerId, {
  user_metadata: { role: 'platform_owner' },
});
```

**Note:** The newer `platform-settings.ts` already uses `ensureDbUser()` which provides atomic updates. This fix ensures the older `get-platform-settings.ts` also maintains consistency.

**Rationale:** EnhancedAuthService checks both `public.users.role` and `auth.users.user_metadata.role` for role detection. Both must be kept in sync to avoid inconsistent behavior and redirect loops.

## Architecture Overview

### Role Detection Flow (EnhancedAuthService)
1. **Single Source Detection**: Checks only user_metadata.role for role determination
2. **Simple Logic**: Validates role is one of: platform_owner, creator, subscriber, or defaults to unauthenticated

### Role Assignment Strategy
1. **ensureDbUser()** - Sets role in both DB and user_metadata atomically
2. **get-platform-settings.ts** - Updates both DB and metadata when creating platform settings
3. **createCreatorProfile()** - Updates both DB and metadata when creating creator profile

### Layout Guards
- `(platform)/layout.tsx` - Uses EnhancedAuthService to verify platform_owner role from user_metadata
- `creator/(protected)/layout.tsx` - Uses EnhancedAuthService to verify creator role from user_metadata

## Testing Recommendations

### 1. Test Role Detection
- Create a new user and verify they start as unauthenticated
- Complete platform owner onboarding and verify both DB and metadata are updated
- Check that EnhancedAuthService detects the correct role

### 2. Test Navigation Menu
- Login as platform owner - should see both dashboards
- Login as creator - should see both dashboards (Platform first, Creator second)
- Verify "Platform Dashboard" link works and provides discovery experience

### 3. Test Usage Tracking
- Create usage meters for a creator
- Track usage events and verify they're stored correctly
- Check usage analytics and summaries work without tenant_id

### 4. Test Redirects
- Access `/dashboard` as non-platform-owner → should redirect to appropriate dashboard
- Access `/creator/dashboard` as non-creator → should redirect to appropriate dashboard
- Access onboarding pages with completed onboarding → should redirect to dashboards

## Files Modified

1. `src/features/creator/types/index.ts` - Removed tenant_id, fixed duplicates
2. `src/features/usage-tracking/services/usage-tracking-service-simple.ts` - Removed tenant logic
3. `src/components/account-menu.tsx` - Updated menu structure for platform discovery
4. `src/features/platform-owner-onboarding/controllers/get-platform-settings.ts` - Added metadata update

## Impact

### Breaking Changes
None - these changes fix broken functionality and align code with database schema.

### Benefits
1. **No more tenant-related crashes** - Removed undefined function calls
2. **Consistent role detection** - DB and metadata stay in sync
3. **Better platform discovery** - Users can explore platform owner features
4. **Simplified architecture** - Removed unnecessary multi-tenant complexity

## Future Improvements

1. **Consolidate platform settings files** - Merge `get-platform-settings.ts` and `platform-settings.ts`
2. **Standardize on ensureDbUser** - Use everywhere for atomic role updates
3. **Add role transition logic** - Allow users to become platform owners without manual DB updates
4. **Improve onboarding flow** - Add explicit "Become Platform Owner" workflow
