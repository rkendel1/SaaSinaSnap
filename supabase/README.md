# Staryer Platform - Database Setup

This directory contains the complete database setup for the Staryer platform, including schema creation and comprehensive test data.

## 📁 Files Overview

- **`setup-staryer-database.sql`** - Complete database setup script with test data
- **`README.md`** - This documentation file
- **`migrations/`** - Individual migration files (for reference)

## 🚀 Quick Setup

### Option 1: Supabase Dashboard (Recommended for Demo)

1. Create a new Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** in your dashboard
3. Copy the entire contents of `setup-staryer-database.sql`
4. Paste and click **"Run"**
5. ✅ Done! Your database is ready with test data

### Option 2: Supabase CLI (For Development)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the setup script
supabase db reset
psql "your-database-url" < supabase/setup-staryer-database.sql
```

### Option 3: Direct PostgreSQL Connection

```bash
# Using psql with connection string
psql "postgresql://postgres:[password]@[host]:[port]/postgres" < setup-staryer-database.sql

# Or using individual parameters
psql -h your-host -p 5432 -U postgres -d postgres -f setup-staryer-database.sql
```

## 🎯 What Gets Created

### Database Schema (16 Tables)
- **Authentication**: `users`, `customers`
- **Multi-Tenant**: `tenants` with RLS policies
- **Creator Management**: `creator_profiles`, `creator_products`
- **Subscriptions**: `subscription_tiers`, `customer_tier_assignments`
- **Usage Tracking**: `usage_meters`, `usage_events`, `usage_aggregates`
- **Audit & Security**: `audit_logs`, `api_keys`
- **Branding**: `white_labeled_pages`
- **Stripe Integration**: `products`, `prices`, `subscriptions`

### Test Data Included
- ✅ **1 Demo Tenant** (Multi-tenant platform)
- ✅ **1 Platform Owner** (Full admin access)
- ✅ **2 Creators** with complete profiles and branding
- ✅ **2 End Users** with active subscriptions
- ✅ **4 Products** (2 per creator) 
- ✅ **4 Subscription Tiers** with different features
- ✅ **2 Active Subscriptions** 
- ✅ **4 Usage Meters** for tracking API calls, downloads, etc.
- ✅ **9000+ Usage Events** (30 days of realistic data)
- ✅ **4 White-labeled Pages** for creator branding
- ✅ **10+ Audit Log Entries** for compliance tracking
- ✅ **3 API Keys** for integrations

### Security & Performance Features
- 🔐 **Row-Level Security (RLS)** on all tables
- 🏢 **Multi-tenant isolation** with tenant context
- 📊 **Optimized indexes** for performance
- 🔍 **Comprehensive audit logging**
- 🔑 **API key management** system

## 👥 Test User Accounts

After setup, you can test with these demo accounts:

### Platform Owner
- **Email**: `owner@staryer.com`
- **Role**: `platform_owner`
- **Access**: Full platform administration

### Creator 1 - TechGuru Solutions
- **Email**: `creator1@staryer.com` 
- **Business**: TechGuru Solutions
- **Products**: Developer API Pro, Code Analysis Tool
- **Focus**: B2B developer tools and APIs

### Creator 2 - Creative Studio Pro
- **Email**: `creator2@staryer.com`
- **Business**: Creative Studio Pro  
- **Products**: Premium Templates, Design Asset Library
- **Focus**: Design resources for creatives

### End Users
- **User 1**: `user1@example.com` (Subscribed to TechGuru Pro)
- **User 2**: `user2@example.com` (Subscribed to Creative Designer)

## 🔧 Development & Testing

### Running Validation
```bash
# Validate the database setup
node scripts/validate-database-setup.js
```

### Connecting Your App
```javascript
// Example: Setting tenant context in your application
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Set tenant context for multi-tenant operations
await supabase.rpc('set_current_tenant', { 
  tenant_uuid: '00000000-0000-0000-0000-000000000001' 
})
```

### CI/CD Integration

#### GitHub Actions Example
```yaml
- name: Setup Supabase Database
  run: |
    echo "🗄️ Initializing database for CI/CD..."
    node scripts/setup-database.js --ci --verbose
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Features in CI/CD:**
- ✅ Automatic fallback to mock data if database unavailable
- ✅ Comprehensive validation and error reporting
- ✅ Integration with existing test environment setup
- ✅ Detailed logging for debugging

#### Docker/Local Development
```bash
# Start local Supabase
supabase start

# Run setup script (recommended)
node scripts/setup-database.js --verbose

# Or manual reset
supabase db reset --local
```

## 📈 Usage Analytics Test Data

The script includes realistic usage patterns:

- **API Requests**: 200-400 calls/day per user
- **Template Downloads**: 1-5 downloads/day  
- **Data Processing**: Varied MB amounts
- **Peak Hours**: Business hours (9 AM - 7 PM)
- **Geographic Distribution**: Simulated global usage

## 🔍 Monitoring & Maintenance

### Important Queries
```sql


-- Monitor usage trends
SELECT DATE(event_timestamp), COUNT(*) as events 
FROM usage_events 
WHERE event_timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(event_timestamp);

-- Audit trail summary
SELECT action, COUNT(*) FROM audit_logs GROUP BY action;
```

### Performance Optimization
- All tables have appropriate indexes
- Usage aggregates table for pre-computed metrics
- RLS policies optimized for tenant isolation
- Connection pooling recommended for production

## 🚨 Production Considerations

### Before Going Live:
1. **Remove or modify test data** as needed
2. **Configure proper backup strategy**
3. **Set up monitoring and alerting**
4. **Review and adjust RLS policies** for your use case
5. **Configure Stripe webhooks** for live data sync
6. **Set up proper user authentication flow**
7. **Enable additional security measures** (2FA, etc.)

### Security Checklist:
- [ ] Enable SSL/TLS for all connections
- [ ] Configure proper user roles and permissions
- [ ] Set up API rate limiting
- [ ] Enable audit logging in production
- [ ] Configure backup and disaster recovery
- [ ] Review all RLS policies for data isolation

## 🆘 Troubleshooting

### Common Issues:

**Connection Errors**
```bash
# Check if Supabase is running
supabase status

# Verify connection string
echo $DATABASE_URL
```

**Permission Errors**
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Missing Data**
```sql
-- Verify tenant context
SELECT get_current_tenant();

-- Check data counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'creators', COUNT(*) FROM creator_profiles
UNION ALL  
SELECT 'subscriptions', COUNT(*) FROM customer_tier_assignments;
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-tenant Applications](https://supabase.com/docs/guides/auth/multi-tenancy)
- [Stripe Integration](https://stripe.com/docs/connect)
- [Database CI/CD Integration](../docs/DATABASE_INTEGRATION.md) - Complete integration guide

## 🤝 Contributing

When making changes to the database schema:

1. Update migration files in `migrations/`
2. Update the main setup script
3. Run validation: `node scripts/validate-database-setup.js`
4. Test with fresh database instance
5. Update documentation

---

**Need help?** Check our [troubleshooting guide](#-troubleshooting) or create an issue in the repository.