# Multi-Source Role Detection Implementation

## Overview

This implementation enhances the role detection system to use multiple sources and provides super-debug logging for troubleshooting role-related issues.

## Key Features

### 1. Multi-Source Role Detection

The system now checks **four sources** to determine user roles:

1. **Database (public.users table)** - Primary source for role information
2. **Metadata (auth.users user_metadata)** - Secondary source from authentication system
3. **Platform Settings (platform_settings table)** - Definitive proof of platform_owner role
4. **Creator Profile (creator_profiles table)** - Definitive proof of creator role

### Priority Order

The role detection follows this priority:

1. **Platform Settings existence** → User is `platform_owner`
2. **Creator Profile existence** → User is `creator`
3. **Database role field** → Use the explicit role from public.users
4. **Metadata role field** → Fallback to auth metadata
5. **Default** → `unauthenticated`

### 2. Super-Debug Logging

All role detection operations include comprehensive logging:

```typescript
[RoleDetection:SUPER-DEBUG] ============================================================
[RoleDetection:SUPER-DEBUG] Multi-Source Role Detection for User: <user-id>
[RoleDetection:SUPER-DEBUG] ============================================================
[RoleDetection:SUPER-DEBUG] SOURCE 1: Checking public.users table for role...
[RoleDetection:SUPER-DEBUG] DB Role found: { "role": "creator" }
[RoleDetection:SUPER-DEBUG] SOURCE 2: Checking auth.users user_metadata for role...
[RoleDetection:SUPER-DEBUG] Metadata role found: { "role": "creator" }
[RoleDetection:SUPER-DEBUG] SOURCE 3: Checking platform_settings table...
[RoleDetection:SUPER-DEBUG] No platform settings found for user
[RoleDetection:SUPER-DEBUG] SOURCE 4: Checking creator_profiles table...
[RoleDetection:SUPER-DEBUG] Creator profile found for user - User is creator
...
```

### 3. Atomic Role Setting

When roles are assigned, they are set **atomically** in both locations:

```typescript
// Sets role in both DB and metadata
await EnhancedAuthService.setUserRoleAtomic(userId, 'creator');
```

This ensures:
- Role is updated in `public.users` table
- Role is updated in `auth.users.user_metadata`
- Both operations are logged
- Inconsistencies are detected and logged

### 4. Enhanced Route Guards

Layout files now use the robust role detection:

**Platform Layout** (`src/app/(platform)/layout.tsx`):
```typescript
const userRole = await EnhancedAuthService.getCurrentUserRole();
if (userRole.type !== 'platform_owner') {
  // Redirect to appropriate dashboard
}
```

**Creator Layout** (`src/app/creator/(protected)/layout.tsx`):
```typescript
const userRole = await EnhancedAuthService.getCurrentUserRole();
if (userRole.type !== 'creator') {
  // Redirect to appropriate dashboard
}
```

## Implementation Details

### EnhancedAuthService Methods

#### `detectUserRole(userId: string)`
Private method that performs multi-source detection and returns detailed results including:
- Final role determination
- All source values (DB, metadata, platform_settings, creator_profile)
- Which checks were performed
- Consistency warnings

#### `getUserRoleAndRedirect()`
Main method for determining user role and appropriate redirect path. Uses `detectUserRole` internally and includes:
- Full role detection
- Onboarding status checking
- Redirect path determination

#### `setUserRoleAtomic(userId: string, role: string)`
Sets user role in both DB and metadata atomically:
1. Updates `public.users.role`
2. Updates `auth.users.user_metadata.role`
3. Logs success/failure for each operation
4. Returns overall success status

#### `getCurrentUserRole()`
Gets current user role without triggering redirects. Useful for:
- Authorization checks
- Conditional UI rendering
- API route protection

### Role Assignment Points

Roles are now set atomically at creation time:

**Platform Owner** - In `getOrCreatePlatformSettings()`:
```typescript
// Step 1: Create platform_settings
// Step 2: Update public.users role
// Step 3: Update auth.users user_metadata
```

**Creator** - In `createCreatorProfile()`:
```typescript
// Step 1: Create creator_profile
// Step 2: Update public.users role
// Step 3: Update auth.users user_metadata
```

## Consistency Checking

The system automatically detects and logs inconsistencies:

- **DB vs Metadata**: Warns if DB role doesn't match metadata role
- **DB vs Platform Settings**: Warns if has platform_settings but DB role is not platform_owner
- **DB vs Creator Profile**: Warns if has creator_profile but DB role is not creator

These warnings help identify issues where roles are set in one place but not another.

## Debugging Role Issues

To debug role detection issues:

1. **Check the logs** - Look for `[RoleDetection:SUPER-DEBUG]` messages
2. **Review all four sources** - The logs show values from all sources
3. **Check consistency warnings** - Look for mismatches between sources
4. **Verify atomic operations** - Ensure both DB and metadata were updated

Example log output for debugging:
```
[RoleDetection:SUPER-DEBUG] ============================================================
[RoleDetection:SUPER-DEBUG] Consistency Check
[RoleDetection:SUPER-DEBUG] ============================================================
[RoleDetection:SUPER-DEBUG] Role consistency across sources: {
  "dbVsMetadata": false,
  "dbVsPlatformSettings": true,
  "dbVsCreatorProfile": true
}
[RoleDetection:SUPER-DEBUG] WARNING: DB role and metadata role are inconsistent!
```

## Benefits

1. **Robustness** - Multiple sources ensure role is detected even if one source fails
2. **Consistency** - Atomic updates prevent role mismatches
3. **Debuggability** - Super-debug logging makes issues easy to diagnose
4. **Security** - Route guards use the most definitive role detection
5. **Maintainability** - Clear priority order and centralized logic

## Testing

Tests are located in:
- `src/features/account/controllers/__tests__/enhanced-auth-service.test.ts`

Integration tests should verify:
- Role detection across all sources
- Atomic role setting
- Route guard behavior
- Onboarding flow handling

## Migration Notes

Existing users should have their roles automatically detected from any of the four sources. No migration script is needed as the system is backward compatible.

If inconsistencies are found, the super-debug logs will identify them, and they can be fixed by:
1. Using the atomic role setting method
2. Or manually updating both sources to match
