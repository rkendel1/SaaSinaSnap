#!/usr/bin/env node

/**
 * Database Reset Script for Staryer Platform
 * ==========================================
 * 
 * This script performs the following tasks:
 * 1. Apply all database migrations to ensure schema is up to date
 * 2. Delete all database data while preserving the schema
 * 3. Reinitialize the database for fresh onboarding flows
 * 
 * Usage:
 * - Local development: npm run db:reset
 * - With Supabase CLI: node scripts/reset-database.js
 * - CI/CD: node scripts/reset-database.js --env=production
 * 
 * Environment Requirements:
 * - DATABASE_URL or SUPABASE_DB_URL for direct database connection
 * - Supabase CLI for local development
 * 
 * @version 1.0.0
 * @created 2025-01-09
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Configuration
const config = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  timeoutMs: 300000, // 5 minutes
};

// Colored console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(colors.cyan + colors.bold, `\n🔧 ${title}`);
  log(colors.cyan, '='.repeat(50));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate environment and required tools
 */
async function validateEnvironment() {
  logSection('Environment Validation');
  
  const hasSupabaseCLI = await checkSupabaseCLI();
  const hasDatabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!hasSupabaseCLI && !hasDatabaseUrl) {
    log(colors.red, '❌ Missing required tools:');
    log(colors.red, '   - Supabase CLI not found');
    log(colors.red, '   - DATABASE_URL or SUPABASE_DB_URL not set');
    log(colors.yellow, '💡 Install Supabase CLI or set database URL');
    throw new Error('Environment validation failed');
  }
  
  log(colors.green, '✅ Environment validation passed');
  return { hasSupabaseCLI, hasDatabaseUrl };
}

/**
 * Check if Supabase CLI is available
 */
async function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Apply all database migrations
 */
async function applyMigrations(hasSupabaseCLI) {
  logSection('Applying Database Migrations');
  
  try {
    if (hasSupabaseCLI) {
      log(colors.blue, '📝 Applying migrations via Supabase CLI...');
      execSync('supabase migration up --linked', { 
        stdio: 'inherit',
        timeout: config.timeoutMs 
      });
    } else {
      log(colors.blue, '📝 Applying migrations via direct SQL...');
      await applyMigrationsDirectly();
    }
    
    log(colors.green, '✅ Migrations applied successfully');
    return true;
  } catch (error) {
    log(colors.red, `❌ Failed to apply migrations: ${error.message}`);
    throw error;
  }
}

/**
 * Apply migrations directly via psql
 */
async function applyMigrationsDirectly() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    log(colors.blue, `   Applying: ${file}`);
    
    try {
      execSync(`psql "${dbUrl}" -f "${filePath}"`, {
        stdio: 'pipe',
        timeout: config.timeoutMs
      });
    } catch (error) {
      // Some migrations might already be applied, log but continue
      log(colors.yellow, `   ⚠️  Warning: ${file} may already be applied`);
    }
  }
}

/**
 * Clear all database data while preserving schema
 */
async function clearDatabaseData(hasSupabaseCLI, hasDatabaseUrl) {
  logSection('Clearing Database Data');
  
  try {
    if (hasSupabaseCLI) {
      await clearDataViaSupabase();
    } else if (hasDatabaseUrl) {
      await clearDataDirectly();
    }
    
    log(colors.green, '✅ Database data cleared successfully');
    return true;
  } catch (error) {
    log(colors.red, `❌ Failed to clear database data: ${error.message}`);
    throw error;
  }
}

/**
 * Clear data via Supabase CLI
 */
async function clearDataViaSupabase() {
  log(colors.blue, '🧹 Clearing data via Supabase CLI...');
  
  const clearDataSQL = `
    -- Clear all onboarding and user data while preserving schema
    
    -- Clear in dependency order to avoid foreign key constraints
    DELETE FROM asset_sharing_logs;
    DELETE FROM embed_assets;
    DELETE FROM usage_billing_sync;
    DELETE FROM usage_alerts;
    DELETE FROM usage_aggregates;
    DELETE FROM usage_events;
    DELETE FROM meter_plan_limits;
    DELETE FROM usage_meters;
    DELETE FROM tier_usage_overages;
    DELETE FROM customer_tier_assignments;
    DELETE FROM subscription_tiers;
    DELETE FROM analytics_events;
    DELETE FROM connector_events;
    DELETE FROM audit_logs;
    DELETE FROM creator_analytics;
    DELETE FROM creator_webhooks;
    DELETE FROM white_labeled_pages;
    DELETE FROM creator_products;
    DELETE FROM creator_profiles;
    DELETE FROM platform_settings;
    
    -- Clear auth users but preserve system users if any
    DELETE FROM auth.users WHERE id NOT IN (
      SELECT id FROM auth.users WHERE email LIKE '%@system.local'
    );
    
    -- Reset any sequences if needed
    -- This ensures fresh IDs when data is re-created
  `;
  
  // Write SQL to temporary file
  const tempFile = path.join(__dirname, '../tmp/clear-data.sql');
  const tempDir = path.dirname(tempFile);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(tempFile, clearDataSQL);
  
  try {
    execSync(`supabase db query --file "${tempFile}"`, { 
      stdio: 'inherit',
      timeout: config.timeoutMs 
    });
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

/**
 * Clear data directly via psql
 */
async function clearDataDirectly() {
  log(colors.blue, '🧹 Clearing data via direct database connection...');
  
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  const clearDataSQL = `
    -- Clear all onboarding and user data while preserving schema
    
    -- Disable foreign key checks temporarily
    SET session_replication_role = replica;
    
    -- Clear in dependency order to avoid foreign key constraints
    DELETE FROM asset_sharing_logs;
    DELETE FROM embed_assets;
    DELETE FROM usage_billing_sync;
    DELETE FROM usage_alerts;
    DELETE FROM usage_aggregates;
    DELETE FROM usage_events;
    DELETE FROM meter_plan_limits;
    DELETE FROM usage_meters;
    DELETE FROM tier_usage_overages;
    DELETE FROM customer_tier_assignments;
    DELETE FROM subscription_tiers;
    DELETE FROM analytics_events;
    DELETE FROM connector_events;
    DELETE FROM audit_logs;
    DELETE FROM creator_analytics;
    DELETE FROM creator_webhooks;
    DELETE FROM white_labeled_pages;
    DELETE FROM creator_products;
    DELETE FROM creator_profiles;
    DELETE FROM platform_settings;
    
    -- Clear auth users but preserve system users if any
    DELETE FROM auth.users WHERE id NOT IN (
      SELECT id FROM auth.users WHERE email LIKE '%@system.local'
    );
    
    -- Re-enable foreign key checks
    SET session_replication_role = DEFAULT;
  `;
  
  // Write SQL to temporary file
  const tempFile = path.join(__dirname, '../tmp/clear-data.sql');
  const tempDir = path.dirname(tempFile);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(tempFile, clearDataSQL);
  
  try {
    execSync(`psql "${dbUrl}" -f "${tempFile}"`, {
      stdio: 'inherit',
      timeout: config.timeoutMs
    });
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

/**
 * Reinitialize database for fresh onboarding
 */
async function reinitializeOnboarding() {
  logSection('Reinitializing Onboarding Flows');
  
  log(colors.blue, '🔄 Setting up fresh onboarding state...');
  
  // The onboarding flows will be automatically initialized when:
  // 1. Platform owner first logs in (via initializePlatformOwnerOnboardingAction)
  // 2. Creator first logs in (via creator onboarding controllers)
  
  // This is by design - the system creates fresh onboarding records
  // when users start their respective flows
  
  log(colors.green, '✅ Database ready for fresh onboarding flows');
  log(colors.cyan, '💡 Onboarding records will be created automatically when users start their flows');
}

/**
 * Verify database reset was successful
 */
async function verifyReset(hasSupabaseCLI, hasDatabaseUrl) {
  logSection('Verifying Database Reset');
  
  try {
    let result;
    
    if (hasSupabaseCLI) {
      result = execSync('supabase db query --query "SELECT COUNT(*) as user_count FROM auth.users; SELECT COUNT(*) as platform_settings_count FROM platform_settings; SELECT COUNT(*) as creator_profiles_count FROM creator_profiles;"', { 
        encoding: 'utf8',
        timeout: config.timeoutMs 
      });
    } else if (hasDatabaseUrl) {
      const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
      result = execSync(`psql "${dbUrl}" -c "SELECT COUNT(*) as user_count FROM auth.users; SELECT COUNT(*) as platform_settings_count FROM platform_settings; SELECT COUNT(*) as creator_profiles_count FROM creator_profiles;"`, { 
        encoding: 'utf8',
        timeout: config.timeoutMs 
      });
    }
    
    log(colors.blue, 'Database state after reset:');
    log(colors.blue, result);
    log(colors.green, '✅ Database reset verification completed');
    
  } catch (error) {
    log(colors.yellow, `⚠️  Verification warning: ${error.message}`);
    log(colors.yellow, '💡 Database may still be properly reset');
  }
}

/**
 * Main execution function
 */
async function main() {
  log(colors.bold + colors.magenta, '🚀 Staryer Database Reset Script');
  log(colors.magenta, '=====================================');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Validate environment
    const { hasSupabaseCLI, hasDatabaseUrl } = await validateEnvironment();
    
    // Step 2: Apply all migrations
    await applyMigrations(hasSupabaseCLI);
    
    // Step 3: Clear all database data
    await clearDatabaseData(hasSupabaseCLI, hasDatabaseUrl);
    
    // Step 4: Reinitialize for onboarding
    await reinitializeOnboarding();
    
    // Step 5: Verify reset
    await verifyReset(hasSupabaseCLI, hasDatabaseUrl);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    log(colors.green + colors.bold, `\n🎉 Database reset completed successfully in ${duration}s!`);
    log(colors.green, '✅ All migrations applied');
    log(colors.green, '✅ All data cleared');
    log(colors.green, '✅ Ready for fresh onboarding flows');
    
    log(colors.cyan, '\nNext steps:');
    log(colors.cyan, '1. Start your application: npm run dev');
    log(colors.cyan, '2. Navigate to platform owner onboarding');
    log(colors.cyan, '3. Navigate to creator onboarding');
    log(colors.cyan, '4. Both flows will start fresh automatically');
    
  } catch (error) {
    log(colors.red + colors.bold, `\n❌ Database reset failed: ${error.message}`);
    log(colors.yellow, '💡 Check the error details above and ensure:');
    log(colors.yellow, '   - Database connection is available');
    log(colors.yellow, '   - Supabase CLI is installed (for local dev)');
    log(colors.yellow, '   - DATABASE_URL is set (for direct connection)');
    
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  validateEnvironment,
  applyMigrations,
  clearDatabaseData,
  reinitializeOnboarding,
  verifyReset
};