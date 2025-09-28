# 🎭 E2E Test Flows Guide

This guide documents the updated end-to-end test flows that align with the current application structure and routing.

## Overview

The E2E tests have been updated to reflect the current application flow, including:

- ✅ **Updated Authentication Routes** - Uses `/login` and `/signup` instead of legacy routes
- ✅ **Streamlined Onboarding Flow** - Tests the actual 3-step creator onboarding
- ✅ **Protected Route Testing** - Validates authentication-protected pages
- ✅ **GitHub Variables Integration** - No longer depends on `env.local.txt`

## Current Application Routes

### Authentication Routes

| Route | Purpose | Test File |
|-------|---------|-----------|
| `/login` | User login page | `tests/e2e/auth/authentication.spec.ts` |
| `/signup` | User registration page | `tests/e2e/auth/authentication.spec.ts` |
| `/auth/callback` | OAuth callback handler | N/A (handled by Supabase) |

### Onboarding Routes

| Route | Purpose | Test File |
|-------|---------|-----------|
| `/creator/onboarding` | Creator onboarding flow | `tests/e2e/creator/onboarding.spec.ts` |
| `/platform-owner-onboarding` | Platform owner setup | `tests/e2e/platform-owner/dashboard.spec.ts` |

### Dashboard Routes

| Route | Purpose | Protection Level |
|-------|---------|------------------|
| `/creator/dashboard` | Creator main dashboard | Creator role required |
| `/creator/dashboard/setup-tasks` | Post-onboarding tasks | Creator role required |
| `/platform/dashboard` | Platform owner dashboard | Platform owner role required |

## Test Flows

### 1. Authentication Flow Tests

**File:** `tests/e2e/auth/authentication.spec.ts`

**Updated Flow:**
```typescript
// ✅ Updated route
await helpers.navigateTo('/login');

// ✅ Proper form validation
await expect(page.locator('input[type="email"]')).toBeVisible();
await expect(page.locator('input[type="password"]')).toBeVisible();

// ✅ Role-based redirect validation
await expect(page).toHaveURL(/\/(login|$)/);
```

**Test Scenarios:**
- Login page display and form validation
- Successful login with test credentials
- Invalid credentials error handling
- User registration flow
- Logout functionality

### 2. Creator Onboarding Flow Tests

**File:** `tests/e2e/creator/onboarding.spec.ts`

**Current 3-Step Flow:**
1. **Welcome Step** - Introduction and value propositions
2. **Brand Setup** - Logo upload and branding (optional)
3. **Stripe Connect** - Payment setup (optional)

**Test Scenarios:**
```typescript
// Step 1: Welcome Step
await helpers.waitForElement('h3:has-text("Welcome to Staryer")', 'welcome-step');
await onboardingPage.nextButton.click();

// Step 2: Brand Setup (Optional)
await helpers.waitForElement('[data-testid="brand-setup"]', 'brand-setup-step');
await onboardingPage.skipStep(); // or complete branding

// Step 3: Stripe Connect (Optional)
await helpers.waitForElement('button:has-text("Connect Stripe")', 'stripe-connect-step');
await onboardingPage.skipStep(); // or complete Stripe setup

// Completion
await expect(page.url()).toMatch(/dashboard|tasks/);
```

### 3. Platform Owner Tests

**File:** `tests/e2e/platform-owner/dashboard.spec.ts`

**Test Scenarios:**
- Platform settings configuration
- User management interface
- Analytics dashboard functionality
- Stripe configuration for platform

### 4. End User Tests

**File:** `tests/e2e/end-user/subscription-flow.spec.ts`

**Test Scenarios:**
- Product discovery and browsing
- Subscription plan selection
- Payment processing flow
- Account management

## Test Environment Configuration

### GitHub Variables Setup

The tests now use GitHub repository variables and secrets:

```bash
# Automatic environment setup
node scripts/setup-github-env.js
```

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `TEST_USER_EMAIL`, `TEST_CREATOR_EMAIL`, `TEST_PLATFORM_OWNER_EMAIL`

**Required Secrets:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- Test user passwords

### Test User Credentials

Default test users (configurable via GitHub variables):

```javascript
const testUsers = {
  'platform-owner': {
    email: 'owner@staryer.com',
    password: 'owner-password-123'
  },
  'creator': {
    email: 'creator@staryer.com',
    password: 'creator-password-123'
  },
  'user': {
    email: 'test@staryer.com',
    password: 'test-password-123'
  }
};
```

## Page Objects and Helpers

### TestHelpers Class

**Updated Methods:**
```typescript
class TestHelpers {
  // ✅ Updated to use /login route
  async loginAs(role: 'platform-owner' | 'creator' | 'user') {
    await this.page.goto('/login');
    // ... login logic
  }

  // ✅ Enhanced navigation with proper waiting
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  // ✅ Improved screenshot naming
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}`;
    await this.page.screenshot({ 
      path: `test-results/screenshots/${filename}.png`,
      fullPage: true 
    });
  }
}
```

### Page Objects

**StreamlinedOnboardingPage:**
```typescript
class StreamlinedOnboardingPage extends BasePage {
  readonly nextButton: Locator;
  readonly skipButton: Locator;
  
  async completeBrandSetup(options: BrandSetupOptions) {
    // Brand setup logic
  }
  
  async skipStep() {
    await this.skipButton.click();
    await this.helpers.waitForPageLoad();
  }
}
```

## Running E2E Tests

### Local Development

```bash
# Setup environment
node scripts/setup-github-env.js

# Install Playwright browsers (if needed)
npm run playwright:install

# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- tests/e2e/auth/

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed
```

### CI/CD Pipeline

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

**Workflow Features:**
- Multi-browser testing (Chromium, Firefox)
- Test artifacts and screenshots
- Failed test video recording
- Parallel test execution

## Test Data Management

### Database Setup

Tests use the comprehensive database setup script:

```bash
# Initialize test database
node scripts/setup-database.js --ci --verbose
```

**Features:**
- Complete schema with 16 tables
- Row-level security policies
- Realistic test data for all user roles
- Automatic setup verification

### Mock Data

For tests that don't require real data:
- User profiles and authentication states
- Product and subscription data
- Analytics and usage metrics

## Best Practices

### 1. Test Organization

```
tests/e2e/
├── auth/                 # Authentication tests
├── creator/              # Creator-specific tests
├── platform-owner/      # Platform owner tests
├── end-user/            # End user tests
├── utils/               # Shared utilities
└── fixtures/            # Test data
```

### 2. Test Naming

```typescript
test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    // Test implementation
  });
});
```

### 3. Screenshot Strategy

- Take screenshots at key points in the flow
- Use descriptive names: `login-page-loaded`, `onboarding-step-2`
- Include timestamps to avoid conflicts

### 4. Error Handling

```typescript
try {
  await helpers.loginAs('creator');
  await helpers.navigateTo('/creator/onboarding');
} catch (error) {
  await helpers.takeScreenshot('test-error-state');
  throw error;
}
```

## Troubleshooting

### Common Issues

1. **Route Not Found (404)**
   - Verify route exists in `src/app/`
   - Check for typos in test navigation
   - Ensure server is running

2. **Authentication Failures**
   - Verify test user credentials in GitHub secrets
   - Check Supabase configuration
   - Ensure user exists in test database

3. **Timeout Issues**
   - Increase timeout values for slow operations
   - Add proper waiting for page loads
   - Use `waitForLoadState('networkidle')`

4. **Environment Variables**
   - Run `node scripts/validate-test-setup.js`
   - Check GitHub repository settings
   - Verify variable names match exactly

### Debug Commands

```bash
# Validate test setup
node scripts/validate-test-setup.js

# Check environment configuration
node scripts/setup-github-env.js

# Run single test with debug
npm run test:e2e:debug -- tests/e2e/auth/authentication.spec.ts

# Generate test report
npm run test:e2e:report
```

## Future Enhancements

- [ ] **Visual Regression Testing** - Compare screenshots across runs
- [ ] **Performance Testing** - Measure page load times
- [ ] **Mobile Testing** - Add mobile viewport tests
- [ ] **API Testing** - Integration with API endpoint tests
- [ ] **Accessibility Testing** - WCAG compliance validation

---

**Last Updated:** January 2025  
**Version:** 2.0.0  
**Compatibility:** Playwright 1.55+, Node.js 18+