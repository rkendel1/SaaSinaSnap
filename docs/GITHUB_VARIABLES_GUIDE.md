# 🔧 GitHub Variables and Secrets Setup Guide

This guide explains how to configure GitHub variables and secrets for the E2E testing and deployment pipeline.

## Overview

The testing and deployment workflows have been updated to use GitHub repository variables and secrets instead of the `env.local.txt` file. This provides better security and allows for different configurations across environments.

## Required Configuration

### 1. GitHub Repository Variables

Navigate to your repository: **Settings > Secrets and Variables > Actions > Variables**

Configure the following **Variables** (public settings):

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://oekgesfduljxtnyxltck.supabase.co` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `NEXT_PUBLIC_STRIPE_CLIENT_ID` | Stripe Connect client ID | `ca_...` |
| `NEXT_PUBLIC_SITE_URL` | Application base URL | `http://localhost:32100` |
| `TEST_USER_EMAIL` | Test user email | `test@staryer.com` |
| `TEST_CREATOR_EMAIL` | Test creator email | `creator@staryer.com` |
| `TEST_PLATFORM_OWNER_EMAIL` | Test platform owner email | `owner@staryer.com` |

### 2. GitHub Repository Secrets

Navigate to your repository: **Settings > Secrets and Variables > Actions > Secrets**

Configure the following **Secrets** (private settings):

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ Yes |
| `DATABASE_URL` | Database connection string | ✅ Yes |
| `SUPABASE_DB_URL` | Supabase database URL | ✅ Yes |
| `TEST_USER_PASSWORD` | Test user password | ⚠️ Optional |
| `TEST_CREATOR_PASSWORD` | Test creator password | ⚠️ Optional |
| `TEST_PLATFORM_OWNER_PASSWORD` | Test platform owner password | ⚠️ Optional |

## Environment Setup Script

The new `scripts/setup-github-env.js` script automatically:

1. Reads GitHub variables and secrets from the environment
2. Creates a `.env.local` file with proper configuration
3. Provides fallback values for missing variables
4. Validates the configuration

### Usage

```bash
# Run the environment setup script
node scripts/setup-github-env.js
```

### Features

- 🔧 **Automatic Configuration** - Creates `.env.local` from GitHub variables
- 🔒 **Security First** - Separates public variables from private secrets
- 🚨 **Validation** - Reports missing required variables
- 🔄 **Fallback Support** - Uses sensible defaults when variables are missing
- 🌍 **Environment Detection** - Works in both CI/CD and local development

## Workflow Integration

Both workflows have been updated:

### Test and Build Workflow (`test-and-build.yml`)

```yaml
- name: 🔧 Setup test environment
  run: |
    echo "Setting up environment from GitHub variables..."
    node scripts/setup-github-env.js
  env:
    # GitHub variables and secrets are passed to the script
    GITHUB_VARS_NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    # ... more variables
```

### Comprehensive Test Platform Workflow (`comprehensive-test-platform.yml`)

Similar setup with additional test-specific configurations and database initialization.

## Migration from env.local.txt

### For Repository Owners

1. Copy all values from your `env.local.txt` to GitHub variables/secrets
2. Test the workflows to ensure they work correctly
3. Optionally keep `env.local.txt` for local development reference

### For Contributors

1. The workflows will now automatically configure the environment
2. For local development, you can still use `env.local.txt` or run the setup script
3. No manual environment configuration needed for CI/CD

## Local Development

### Option 1: Use GitHub Environment Setup

```bash
# If you have GitHub CLI configured
node scripts/setup-github-env.js
```

### Option 2: Use Traditional Method

```bash
# Copy template and configure manually
cp env.local.txt .env.local
# Edit .env.local with your values
```

## Troubleshooting

### Missing Variables Warning

If you see warnings about missing variables:

```
⚠️ Missing required environment variables:
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
```

1. Add the missing variables to GitHub repository settings
2. Re-run the workflow

### Fallback Values

The script uses fallback values for missing variables:

- Test credentials default to `test@staryer.com` / `test-password-123`
- URLs default to `http://localhost:32100`
- API keys default to placeholder values

### Validation Errors

If validation fails:

1. Check that all required secrets are configured in GitHub
2. Verify that variable names match exactly (case-sensitive)
3. Ensure secrets don't contain extra whitespace

## Security Best Practices

1. **Never commit real API keys** to the repository
2. **Use GitHub secrets** for sensitive data (passwords, API keys)
3. **Use GitHub variables** for non-sensitive configuration (URLs, emails)
4. **Rotate keys regularly** and update them in GitHub settings
5. **Limit repository access** to trusted contributors

## Testing the Setup

To verify your configuration:

```bash
# Run the validation script
node scripts/validate-test-setup.js

# Check environment generation
node scripts/setup-github-env.js

# Run E2E tests locally
npm run test:e2e
```

## Support

If you encounter issues:

1. **Check the workflow logs** in GitHub Actions
2. **Verify variable names** match exactly
3. **Ensure all required secrets** are configured
4. **Test locally** with the setup script

---

**Last Updated:** January 2025  
**Version:** 2.0.0  
**Migration:** Updated from env.local.txt to GitHub variables