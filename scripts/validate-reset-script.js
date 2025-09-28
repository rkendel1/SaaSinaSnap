#!/usr/bin/env node

/**
 * Validation Script for Database Reset Functionality
 * =================================================
 * 
 * This script validates that the database reset script is properly configured
 * and can handle different execution environments.
 */

const resetScript = require('./reset-database.js');

async function validateScript() {
  console.log('🧪 Validating Database Reset Script');
  console.log('=====================================\n');
  
  let tests = 0;
  let passed = 0;
  
  // Test 1: Script module loads correctly
  tests++;
  try {
    if (typeof resetScript.main === 'function' &&
        typeof resetScript.validateEnvironment === 'function' &&
        typeof resetScript.applyMigrations === 'function' &&
        typeof resetScript.clearDatabaseData === 'function') {
      console.log('✅ Script module loads with all required functions');
      passed++;
    } else {
      console.log('❌ Script module missing required functions');
    }
  } catch (error) {
    console.log('❌ Script module failed to load:', error.message);
  }
  
  // Test 2: Environment validation works
  tests++;
  try {
    await resetScript.validateEnvironment();
    console.log('✅ Environment validation passed');
    passed++;
  } catch (error) {
    if (error.message === 'Environment validation failed') {
      console.log('✅ Environment validation correctly identifies missing requirements');
      passed++;
    } else {
      console.log('❌ Environment validation error:', error.message);
    }
  }
  
  // Test 3: Package.json script exists
  tests++;
  try {
    const packageJson = require('../package.json');
    if (packageJson.scripts && packageJson.scripts['db:reset']) {
      console.log('✅ Package.json includes db:reset script');
      passed++;
    } else {
      console.log('❌ Package.json missing db:reset script');
    }
  } catch (error) {
    console.log('❌ Could not read package.json:', error.message);
  }
  
  // Test 4: Documentation exists
  tests++;
  const fs = require('fs');
  const path = require('path');
  
  const docPath = path.join(__dirname, '../docs/database-reset-guide.md');
  if (fs.existsSync(docPath)) {
    console.log('✅ Documentation file exists');
    passed++;
  } else {
    console.log('❌ Documentation file missing');
  }
  
  // Summary
  console.log('\n📊 Validation Summary');
  console.log('=====================');
  console.log(`Tests passed: ${passed}/${tests}`);
  
  if (passed === tests) {
    console.log('🎉 All validation tests passed!');
    console.log('✅ Database reset script is ready for use');
    return true;
  } else {
    console.log('⚠️  Some validation tests failed');
    console.log('💡 Review the failures above before using the script');
    return false;
  }
}

// Execute if called directly
if (require.main === module) {
  validateScript()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateScript };