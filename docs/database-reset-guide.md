# Database Reset Guide

This guide explains how to use the database reset script to clear all data and reinitialize the onboarding flows for the Staryer platform.

## Overview

The database reset script (`scripts/reset-database.js`) performs the following tasks:

1. **Apply All Database Migrations**: Ensures the database schema is up to date
2. **Delete All Database Data**: Clears all user data while preserving the database schema
3. **Reinitialize Onboarding**: Resets both platform owner and creator onboarding flows to their initial state

## Prerequisites

### Local Development
- Node.js installed
- Supabase CLI installed (`npm install -g supabase`)
- Local Supabase project set up

### Production/CI/CD
- Database connection string available
- PostgreSQL client (`psql`) installed
- Environment variables properly configured

## Environment Variables

The script requires one of the following database connection methods:

```env
# Option 1: Direct database URL (for production/CI/CD)
DATABASE_URL=postgresql://user:password@host:port/database

# Option 2: Supabase database URL
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Option 3: Local Supabase (no additional env vars needed if linked)
```

## Usage

### Quick Start (Recommended)

```bash
# Using npm script (recommended)
npm run db:reset
```

### Direct Script Execution

```bash
# Local development with Supabase CLI
node scripts/reset-database.js

# Production/CI/CD with database URL
DATABASE_URL="your-db-url" node scripts/reset-database.js
```

### Advanced Usage

```bash
# With custom environment
NODE_ENV=development node scripts/reset-database.js

# With verbose logging
DEBUG=true node scripts/reset-database.js
```

## What the Script Does

### 1. Environment Validation
- Checks for Supabase CLI availability
- Validates database connection string
- Ensures required tools are present

### 2. Migration Application
- Applies all pending migrations in order
- Uses Supabase CLI if available, otherwise direct SQL execution
- Ensures database schema is current

### 3. Data Clearing
The script clears data from the following tables in dependency order:

**User Data Tables:**
- `asset_sharing_logs`
- `embed_assets`
- `usage_billing_sync`
- `usage_alerts`
- `usage_aggregates`
- `usage_events`
- `meter_plan_limits`
- `usage_meters`

**Subscription & Billing:**
- `tier_usage_overages`
- `customer_tier_assignments`
- `subscription_tiers`

**Analytics & Logging:**
- `analytics_events`
- `connector_events`
- `audit_logs`

**Creator Data:**
- `creator_analytics`
- `creator_webhooks`
- `white_labeled_pages`
- `creator_products`
- `creator_profiles`

**Platform Settings:**
- `platform_settings`

**Authentication:**
- `auth.users` (except system users)

### 4. Onboarding Reinitialization
- Clears all onboarding state
- Platform owner onboarding will start fresh on next login
- Creator onboarding will start fresh on next login

## Expected Output

```
🚀 Staryer Database Reset Script
=====================================

🔧 Environment Validation
==================================================
✅ Environment validation passed

🔧 Applying Database Migrations
==================================================
📝 Applying migrations via Supabase CLI...
✅ Migrations applied successfully

🔧 Clearing Database Data
==================================================
🧹 Clearing data via Supabase CLI...
✅ Database data cleared successfully

🔧 Reinitializing Onboarding Flows
==================================================
🔄 Setting up fresh onboarding state...
✅ Database ready for fresh onboarding flows
💡 Onboarding records will be created automatically when users start their flows

🔧 Verifying Database Reset
==================================================
Database state after reset:
 user_count | platform_settings_count | creator_profiles_count 
-----------+--------------------------+-----------------------
         0 |                        0 |                      0
✅ Database reset verification completed

🎉 Database reset completed successfully in 15s!
✅ All migrations applied
✅ All data cleared
✅ Ready for fresh onboarding flows

Next steps:
1. Start your application: npm run dev
2. Navigate to platform owner onboarding
3. Navigate to creator onboarding
4. Both flows will start fresh automatically
```

## After Running the Script

### 1. Start Your Application
```bash
npm run dev
```

### 2. Test Platform Owner Onboarding
- Navigate to the platform owner onboarding page
- The system will automatically create a fresh `platform_settings` record
- Complete the onboarding flow from step 1

### 3. Test Creator Onboarding
- Navigate to the creator onboarding page
- The system will automatically create a fresh `creator_profiles` record
- Complete the creator onboarding flow from step 1

## Troubleshooting

### Common Issues

#### "Supabase CLI not found"
```bash
# Install Supabase CLI
npm install -g supabase

# Or use direct database connection
DATABASE_URL="your-db-url" npm run db:reset
```

#### "Database connection failed"
- Verify your database URL is correct
- Check network connectivity
- Ensure database is running

#### "Permission denied"
- Ensure your database user has sufficient privileges
- Check authentication credentials

#### "Migration failed"
- Some migrations may already be applied (this is normal)
- Check for syntax errors in migration files
- Verify database schema compatibility

### Debug Mode

For detailed debugging information:

```bash
DEBUG=true npm run db:reset
```

## Safety Considerations

⚠️ **Important**: This script will **permanently delete all user data**. Use with caution:

- **Development**: Safe to use frequently
- **Staging**: Use carefully, inform team members
- **Production**: Only use during planned maintenance windows

### Data Backup

Before running in production, consider creating a backup:

```bash
# Create backup
pg_dump "your-database-url" > backup.sql

# Run reset script
npm run db:reset

# Restore if needed (NOT RECOMMENDED after reset)
psql "your-database-url" < backup.sql
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Reset Database
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to reset'
        required: true
        default: 'staging'

jobs:
  reset-db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run db:reset
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker Example

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "db:reset"]
```

## Related Scripts

- `scripts/setup-database.js` - Initial database setup with demo data
- `scripts/validate-database-setup.js` - Validate database configuration
- Migration scripts in `supabase/migrations/`

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the script logs for specific error messages
3. Verify your environment configuration
4. Consult the team or documentation for assistance