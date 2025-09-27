#!/usr/bin/env node

/**
 * Test Environment Setup Script
 * Initializes the test environment for different modes and platforms
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up test environment...\n');

/**
 * Setup test database and mock data
 */
async function setupTestDatabase() {
  console.log('📊 Setting up test database...');
  
  // Create test data directory if it doesn't exist
  const testDataDir = path.join(process.cwd(), 'test-data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  // Create mock data files
  const mockUsers = {
    platformOwner: {
      id: 'platform-owner-test-id',
      email: 'owner@staryer.com',
      role: 'platform_owner',
      created_at: new Date().toISOString()
    },
    creator: {
      id: 'creator-test-id',
      email: 'creator@staryer.com',
      role: 'creator',
      created_at: new Date().toISOString(),
      onboarding_completed: true
    },
    endUser: {
      id: 'user-test-id',
      email: 'user@staryer.com',
      role: 'user',
      created_at: new Date().toISOString()
    }
  };

  const mockProducts = [
    {
      id: 'product-1',
      name: 'Premium SaaS Plan',
      creator_id: 'creator-test-id',
      price: 2999,
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 'product-2',
      name: 'Starter Package',
      creator_id: 'creator-test-id',
      price: 999,
      status: 'draft',
      created_at: new Date().toISOString()
    }
  ];

  const mockSubscriptions = [
    {
      id: 'sub-1',
      user_id: 'user-test-id',
      product_id: 'product-1',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Write mock data files
  fs.writeFileSync(
    path.join(testDataDir, 'users.json'),
    JSON.stringify(mockUsers, null, 2)
  );
  
  fs.writeFileSync(
    path.join(testDataDir, 'products.json'),
    JSON.stringify(mockProducts, null, 2)
  );
  
  fs.writeFileSync(
    path.join(testDataDir, 'subscriptions.json'),
    JSON.stringify(mockSubscriptions, null, 2)
  );

  console.log('✅ Test database setup complete');
}

/**
 * Setup test configuration
 */
function setupTestConfig() {
  console.log('⚙️ Setting up test configuration...');
  
  // Ensure .env.local exists with test configuration
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Add test-specific environment variables
  const testVars = [
    'TEST_MODE=true',
    'NEXT_PUBLIC_TEST_MODE=true',
    'TEST_USER_EMAIL=test@staryer.com',
    'TEST_USER_PASSWORD=test-password-123',
    'TEST_CREATOR_EMAIL=creator@staryer.com',
    'TEST_CREATOR_PASSWORD=creator-password-123',
    'TEST_PLATFORM_OWNER_EMAIL=owner@staryer.com',
    'TEST_PLATFORM_OWNER_PASSWORD=owner-password-123',
    'PLAYWRIGHT_HEADLESS=true',
    'PLAYWRIGHT_SCREENSHOTS=true',
    'PLAYWRIGHT_VIDEO=retain-on-failure',
    'TEST_TIMEOUT=30000'
  ];
  
  testVars.forEach(varLine => {
    const [key] = varLine.split('=');
    if (!envContent.includes(key)) {
      envContent += `\n${varLine}`;
    }
  });
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Test configuration updated');
}

/**
 * Validate test environment
 */
function validateTestEnvironment() {
  console.log('🔍 Validating test environment...');
  
  const requiredFiles = [
    'playwright.config.ts',
    'jest.config.js',
    'tests/e2e/auth',
    'tests/e2e/platform-owner',
    'tests/e2e/creator',
    'tests/e2e/end-user'
  ];
  
  let allValid = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    if (!exists) allValid = false;
  });
  
  if (!allValid) {
    console.error('❌ Test environment validation failed');
    process.exit(1);
  }
  
  console.log('✅ Test environment validation passed');
}

/**
 * Clean up old test artifacts
 */
function cleanupTestArtifacts() {
  console.log('🧹 Cleaning up old test artifacts...');
  
  const artifactDirs = [
    'test-results',
    'playwright-report',
    'coverage'
  ];
  
  artifactDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🗑️ Removed ${dir}`);
    }
  });
  
  console.log('✅ Cleanup complete');
}

/**
 * Main setup function
 */
async function main() {
  try {
    cleanupTestArtifacts();
    setupTestConfig();
    await setupTestDatabase();
    validateTestEnvironment();
    
    console.log('\n✅ Test environment setup completed successfully!');
    console.log('🚀 Ready to run tests\n');
    
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  setupTestDatabase,
  setupTestConfig,
  validateTestEnvironment,
  cleanupTestArtifacts
};