# 🧪 Staryer Testing Guide

## Overview

This guide covers the comprehensive testing environment for the Staryer platform, including unit tests, end-to-end tests, and the CI/CD pipeline.

## Test Environment Setup

### Prerequisites

1. **Node.js 18+** - Required for running tests
2. **Environment Variables** - Copy `env.local.txt` to `.env.local` and configure
3. **Dependencies** - Install with `npm ci`

### Quick Start

```bash
# Install dependencies
npm ci

# Install Playwright browsers (for E2E tests)
npm run playwright:install

# Run all tests
npm run test:all

# Run specific test types
npm run test          # Unit tests only
npm run test:e2e      # E2E tests only
```

## Environment Configuration

### Test Environment Variables

Copy `env.local.txt` to `.env.local` and update with your test credentials:

```bash
# Required for E2E tests
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Test user credentials
TEST_USER_EMAIL=test@staryer.com
TEST_USER_PASSWORD=test-password-123
TEST_CREATOR_EMAIL=creator@staryer.com
TEST_CREATOR_PASSWORD=creator-password-123
TEST_PLATFORM_OWNER_EMAIL=owner@staryer.com
TEST_PLATFORM_OWNER_PASSWORD=owner-password-123

# Playwright configuration
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SCREENSHOTS=true
PLAYWRIGHT_VIDEO=retain-on-failure
```

### Supabase Test Setup

For full E2E testing with database interactions:

1. **Create Test Database** - Set up a separate Supabase project for testing
2. **Test Users** - Create test users for each role (Platform Owner, Creator, End User)
3. **Test Data** - Populate with minimal test data

## Database Setup for Testing

### Automated Database Initialization

The testing pipeline now includes automated database setup using the comprehensive Staryer database script:

**Script:** `scripts/setup-database.js`

**Features:**
- 🗄️ **Complete Schema** - 16 tables with proper relationships
- 🔐 **Row-Level Security** - 29 RLS policies for role-based isolation
- 📊 **Test Data** - Realistic data for all user roles and scenarios
- 🔍 **Validation** - Automatic setup verification and health checks
- 🔄 **Fallback Support** - Mock data when database unavailable

### Database Setup Methods

The script tries multiple setup methods in order of preference:

1. **Supabase CLI** (Local development)
   ```bash
   supabase db reset --linked
   psql "$DATABASE_URL" < supabase/setup-staryer-database.sql
   ```

2. **Direct PostgreSQL** (CI/CD preferred)
   ```bash
   psql "$DATABASE_URL" < supabase/setup-staryer-database.sql
   ```

3. **Supabase JS Client** (Fallback)
   - Executes SQL statements via Supabase client
   - Used when direct DB access unavailable

### Environment Variables Required

For database setup to work in CI/CD:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:[pass]@[host]:[port]/postgres
# Optional alternatives:
SUPABASE_DB_URL=your_alternative_db_url
```

### Manual Database Setup

To manually set up the database for local testing:

```bash
# Using the setup script
node scripts/setup-database.js --verbose

# Or directly via Supabase dashboard
# 1. Copy supabase/setup-staryer-database.sql
# 2. Paste in Supabase SQL Editor
# 3. Click "Run"
```

### Troubleshooting Database Setup

**Common Issues:**

1. **Missing Environment Variables**
   - Check that all required variables are set
   - Use `--verbose` flag for debugging information

2. **Connection Failures**
   - Verify database URL format
   - Check network connectivity in CI environment
   - Ensure service role key has sufficient permissions

3. **Setup Verification Failures**
   - Check Supabase project status
   - Verify RLS policies aren't blocking access
   - Review database logs in Supabase dashboard

**Debug Commands:**
```bash
# Validate database script
node scripts/validate-database-setup.js

# Setup with verbose logging
node scripts/setup-database.js --verbose --ci

# Check environment in CI
env | grep -E "(SUPABASE|DATABASE)" | head -10
```

## Test Structure

### Unit Tests (`src/**/__tests__/`)

Located alongside source code in `__tests__` directories:

```
src/
├── utils/__tests__/
│   └── slug-utils.test.ts
├── features/creator/actions/__tests__/
│   ├── product-actions.test.ts
│   └── embed-functionality.test.ts
└── features/creator-onboarding/__tests__/
    └── creator-environment-management.test.ts
```

**Running Unit Tests:**
```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### E2E Tests (`tests/e2e/`)

Organized by user roles and features:

```
tests/e2e/
├── auth/
│   └── authentication.spec.ts
├── platform-owner/
│   └── dashboard.spec.ts
├── creator/
│   ├── onboarding.spec.ts
│   └── product-management.spec.ts
├── end-user/
│   └── subscription-flow.spec.ts
└── utils/
    ├── test-helpers.ts
    └── page-objects.ts
```

**Running E2E Tests:**
```bash
npm run test:e2e          # All E2E tests
npm run test:e2e:ui       # With UI mode
npm run test:e2e:debug    # Debug mode
npm run test:e2e:headed   # In headed browser
```

## Test Roles & Scenarios

### Platform Owner Tests

**File:** `tests/e2e/platform-owner/dashboard.spec.ts`

**Scenarios:**
- Dashboard overview and metrics
- Revenue tracking and analytics
- Creator management
- Platform settings and configuration

**Key Features Tested:**
- role-based dashboard
- Revenue analytics
- User management
- System configuration

### Creator Tests

**Files:**
- `tests/e2e/creator/onboarding.spec.ts` - Streamlined 3-step onboarding flow
- `tests/e2e/creator/post-onboarding-tasks.spec.ts` - Deferred task management
- `tests/e2e/creator/product-management.spec.ts` - Product setup and management

**Scenarios:**
- Streamlined onboarding flow (3 steps: Welcome, Brand Setup, Stripe Connect)
- Optional step handling and navigation
- Post-onboarding task management
- Background process validation (white-label page auto-generation)
- Product setup and management
- Stripe Connect integration
- Branding and customization

**Key Features Tested:**
- Simplified 3-step onboarding process
- Optional brand setup and payment configuration
- Progress persistence across sessions
- Deferred task prioritization and completion
- Auto-generated white-label pages
- Payment processor integration
- Brand customization workflows

### End User Tests

**File:** `tests/e2e/end-user/subscription-flow.spec.ts`

**Scenarios:**
- Subscription plan selection
- Payment processing
- Usage tracking and limits
- Plan upgrades and cancellations

**Key Features Tested:**
- Pricing page display
- Subscription management
- Usage monitoring
- Billing operations

### Authentication Tests

**File:** `tests/e2e/auth/authentication.spec.ts`

**Scenarios:**
- User registration
- Login/logout flows
- Password reset
- Session management

## Screenshot & Video Capture

All E2E tests automatically capture:

- **Screenshots** - At key test steps and on failures
- **Videos** - On test failures (configurable)
- **Traces** - For debugging failed tests

**Artifacts Location:**
- Screenshots: `test-results/screenshots/`
- Videos: `test-results/videos/`
- HTML Reports: `playwright-report/`

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/test-and-build.yml`

**Triggers:**
- Push to main/develop branches
- Pull requests to main
- Manual dispatch (workflow_dispatch)

**Manual Execution:**
1. Go to GitHub Actions tab
2. Select "Staryer - Build & Test Pipeline"
3. Click "Run workflow"
4. Choose test suite and environment

**Test Suite Options:**
- `all` - Run all tests
- `unit` - Unit tests only
- `e2e` - All E2E tests
- `streamlined-onboarding` - Streamlined onboarding flow tests
- `post-onboarding-tasks` - Post-onboarding task management tests
- `platform-owner` - Platform owner tests only
- `creator` - All creator tests
- `end-user` - End user tests only

### Pipeline Stages

1. **Setup & Validation** - Environment setup and dependency installation
2. **Database Initialization** - Automated database setup with test data
3. **Lint & Build** - Code linting and application build
4. **Unit Tests** - Jest-based unit tests with coverage
5. **E2E Tests** - Playwright tests across all roles (parallel execution)
6. **Test Report** - Consolidated test results and artifacts
7. **Cleanup** - Pipeline cleanup and status reporting

### Artifacts Generated

- **Build Artifacts** - Compiled Next.js application
- **Database Setup Logs** - Database initialization status and verification
- **Coverage Reports** - Unit test coverage data
- **E2E Results** - Test results and failure details
- **Screenshots** - Visual test artifacts
- **HTML Reports** - Comprehensive test reports

## Troubleshooting

### Common Issues

**Environment Variables Missing:**
```bash
# Check required variables are set
grep -E "(SUPABASE|STRIPE|TEST_)" .env.local
```

**Playwright Browser Issues:**
```bash
# Reinstall browsers
npx playwright install --with-deps
```

**Test Database Connection:**
```bash
# Test Supabase connection
npm run test -- --testNamePattern="should connect to Supabase"
```

**Port Conflicts:**
```bash
# Kill processes on test port
lsof -ti:32100 | xargs kill -9
```

### Debug Mode

**Unit Tests:**
```bash
# Debug specific test
npm run test -- --testNamePattern="specific test name" --verbose
```

**E2E Tests:**
```bash
# Debug mode with browser
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/creator/onboarding.spec.ts --debug
```

### Test Data Cleanup

Tests automatically clean up test data, but manual cleanup:

```bash
# Clear test results
rm -rf test-results/ playwright-report/ coverage/

# Reset test database (if using dedicated test DB)
# Run your database reset script here
```

## Best Practices

### Writing Tests

1. **Descriptive Names** - Use clear, descriptive test names
2. **Screenshot Documentation** - Capture key states with `takeScreenshot()`
3. **Wait Strategies** - Use proper waits instead of hard sleeps
4. **Data Isolation** - Each test should be independent
5. **Error Handling** - Handle and capture meaningful error states

### Test Maintenance

1. **Regular Updates** - Update tests when UI changes
2. **Flake Reduction** - Use stable selectors and waits
3. **Performance** - Optimize test execution time
4. **Documentation** - Keep test documentation current

### CI/CD Best Practices

1. **Parallel Execution** - Tests run in parallel by role
2. **Artifact Management** - Automatic cleanup of old artifacts
3. **Failure Analysis** - Screenshots and videos for debugging
4. **Notification** - Failed builds trigger notifications

## Support

For testing issues or questions:

1. Check the troubleshooting section above
2. Review test logs and screenshots in artifacts
3. Run tests locally with debug mode
4. Check GitHub Issues for similar problems

## Next Steps

1. **Expand Coverage** - Add more edge cases and scenarios
2. **Performance Tests** - Add load and performance testing
3. **API Tests** - Add dedicated API endpoint testing
4. **Security Tests** - Add security-focused test scenarios