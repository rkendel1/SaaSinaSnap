#!/usr/bin/env node

/**
 * Database Setup Validation Script
 * Validates the SQL setup script structure and content
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Staryer database setup script...\n');

const sqlFilePath = path.join(__dirname, '../supabase/setup-staryer-database.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ SQL setup file not found:', sqlFilePath);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Basic structure validation
const validationChecks = [
  {
    name: 'File size check',
    test: () => sqlContent.length > 40000,
    message: 'Script should be comprehensive (>40KB)'
  },
  {
    name: 'Required tables check',
    test: () => {
      const requiredTables = [
        'users', 'tenants', 'creator_profiles', 'subscription_tiers', 
        'usage_events', 'audit_logs', 'creator_products', 'api_keys'
      ];
      return requiredTables.every(table => 
        sqlContent.includes(`CREATE TABLE ${table}`)
      );
    },
    message: 'All core tables should be defined'
  },
  {
    name: 'RLS policies check',
    test: () => {
      return sqlContent.includes('ENABLE ROW LEVEL SECURITY') &&
             sqlContent.includes('CREATE POLICY');
    },
    message: 'Row-Level Security should be enabled with policies'
  },
  {
    name: 'Multi-tenant support check',
    test: () => {
      return sqlContent.includes('tenant_id') &&
             sqlContent.includes('set_current_tenant') &&
             sqlContent.includes('get_current_tenant');
    },
    message: 'Multi-tenant architecture should be implemented'
  },
  {
    name: 'Test data check',
    test: () => {
      return sqlContent.includes('INSERT INTO') &&
             sqlContent.includes('test data') ||
             sqlContent.includes('demo data');
    },
    message: 'Test/demo data should be included'
  },
  {
    name: 'Indexes check',
    test: () => {
      return sqlContent.includes('CREATE INDEX');
    },
    message: 'Performance indexes should be created'
  },
  {
    name: 'Functions check',
    test: () => {
      return sqlContent.includes('CREATE OR REPLACE FUNCTION') &&
             sqlContent.includes('add_audit_log');
    },
    message: 'Utility functions should be defined'
  },
  {
    name: 'Documentation check',
    test: () => {
      return sqlContent.includes('EXECUTION INSTRUCTIONS') &&
             sqlContent.includes('CI/CD') &&
             sqlContent.includes('FEATURES COVERED');
    },
    message: 'Comprehensive documentation should be included'
  }
];

// Run validation checks
let passed = 0;
let failed = 0;

validationChecks.forEach(check => {
  try {
    if (check.test()) {
      console.log(`✅ ${check.name}: PASSED`);
      passed++;
    } else {
      console.log(`❌ ${check.name}: FAILED - ${check.message}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name}: ERROR - ${error.message}`);
    failed++;
  }
});

// Summary statistics
const tableCount = (sqlContent.match(/CREATE TABLE/g) || []).length;
const policyCount = (sqlContent.match(/CREATE POLICY/g) || []).length;
const indexCount = (sqlContent.match(/CREATE INDEX/g) || []).length;
const insertCount = (sqlContent.match(/INSERT INTO/g) || []).length;

console.log('\n📊 Script Statistics:');
console.log(`   Tables Created: ${tableCount}`);
console.log(`   RLS Policies: ${policyCount}`);
console.log(`   Indexes: ${indexCount}`);
console.log(`   Data Inserts: ${insertCount}`);
console.log(`   File Size: ${Math.round(sqlContent.length / 1024)}KB`);

console.log('\n📋 Validation Summary:');
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All validation checks passed! Database setup script is ready for use.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some validation checks failed. Please review and fix issues.');
  process.exit(1);
}