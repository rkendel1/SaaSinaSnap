# Routing Structure

## Overview

The application uses a clear, separated routing structure with distinct paths for platform owners, creators, and their respective onboarding flows.

## Route Groups

### Platform Owner Routes

#### Protected Routes: `/(platform)/`
- **Layout**: `/src/app/(platform)/layout.tsx`
- **Purpose**: Routes accessible only to authenticated platform owners who have completed onboarding
- **Access Control**:
  - Checks authentication via `EnhancedAuthService`
  - Verifies user has `platform_owner` role
  - Redirects to onboarding if not completed
  - Redirects to appropriate dashboard for other roles
- **Examples**:
  - `/dashboard` - Platform owner dashboard
  - `/dashboard/revenue` - Revenue dashboard
  - `/dashboard/analytics` - Analytics dashboard

#### Onboarding Routes: `/platform-owner-onboarding/`
- **Layout**: `/src/app/platform-owner-onboarding/layout.tsx`
- **Purpose**: Onboarding flow for new platform owners
- **Access Control**:
  - Checks authentication via `EnhancedAuthService`
  - Verifies user has `platform_owner` role
  - Redirects to dashboard if onboarding already completed
  - Allows access during onboarding process
- **Examples**:
  - `/platform-owner-onboarding` - Platform setup wizard

### Creator Routes

#### Protected Routes: `/creator/(protected)/`
- **Layout**: `/src/app/creator/(protected)/layout.tsx`
- **Purpose**: Routes accessible only to authenticated creators who have completed onboarding
- **Access Control**:
  - Checks authentication via `EnhancedAuthService`
  - Verifies user has `creator` role
  - Redirects to onboarding if not completed
  - Redirects to appropriate dashboard for other roles
- **Examples**:
  - `/creator/dashboard` - Creator dashboard
  - `/creator/products-and-tiers` - Product management
  - `/creator/embeds-and-scripts` - Embed management
  - `/creator/white-label-sites` - White label site management

#### Onboarding Routes: `/creator/onboarding/`
- **Layout**: `/src/app/creator/onboarding/layout.tsx`
- **Purpose**: Onboarding flow for new creators
- **Access Control**:
  - Checks authentication via `EnhancedAuthService`
  - Verifies user has `creator` role
  - Redirects to dashboard if onboarding already completed
  - Allows access during onboarding process
- **Examples**:
  - `/creator/onboarding` - Creator setup wizard
  - `/creator/onboarding/stripe-connect` - Stripe connection

## Authentication Flow

### New User Login
1. User authenticates via `/login` or magic link
2. Auth callback determines user role via `EnhancedAuthService.getUserRoleAndRedirect()`
3. User is redirected to appropriate path:
   - **Platform Owner (not onboarded)**: → `/platform-owner-onboarding`
   - **Platform Owner (onboarded)**: → `/dashboard`
   - **Creator (not onboarded)**: → `/creator/onboarding`
   - **Creator (onboarded)**: → `/creator/dashboard`
   - **Subscriber**: → `/` (home)
   - **No role**: → `/pricing`

### Layout Protection

Each layout uses `EnhancedAuthService.getCurrentUserRole()` to:
1. Verify user authentication
2. Check user role matches expected role for the route group
3. Check onboarding completion status (for protected routes)
4. Redirect appropriately if checks fail

## Benefits of This Structure

### Clear Separation
- Onboarding routes are completely separate from protected routes
- No circular dependency or redirect loops
- Each route group has a single, clear purpose

### Consistent Pattern
- Both platform and creator follow the same pattern
- Onboarding layouts allow access during setup
- Protected layouts require completed onboarding

### Simplified Logic
- Each layout has a single responsibility
- Role checks are centralized in `EnhancedAuthService`
- Redirect logic is straightforward and predictable

### Error Prevention
- Prevents `AuthSessionMissingError` from circular redirects
- Clear entry points for each user role
- Onboarding can proceed without hitting protected layout checks

## Troubleshooting

### User stuck in redirect loop
- Check if onboarding route is accidentally inside protected group
- Verify `onboardingCompleted` status in user metadata
- Check layout hierarchy and redirect paths

### User can't access onboarding
- Ensure onboarding layout only checks auth and role, not onboarding completion
- Verify redirect path in auth callback
- Check user metadata has correct role assigned

### Wrong dashboard after login
- Verify role assignment in database and user metadata
- Check `EnhancedAuthService.getUserRoleAndRedirect()` logic
- Ensure role is set during signup/first login
