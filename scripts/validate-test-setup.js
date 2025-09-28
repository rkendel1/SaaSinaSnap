#!/usr/bin/env node

/**
 * Enhanced validation script for comprehensive testing setup
 * Checks that all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Staryer Comprehensive Test Platform Setup...\n');

const requiredFiles = [
  // Configuration files
  { path: 'playwright.config.ts', description: 'Playwright configuration' },
  { path: 'jest.config.js', description: 'Jest configuration' },
  { path: 'jest.setup.js', description: 'Jest setup file' },
  { path: 'env.local.txt', description: 'Environment template' },
  
  // GitHub Actions
  { path: '.github/workflows/test-and-build.yml', description: 'Original CI/CD pipeline' },
  { path: '.github/workflows/comprehensive-test-platform.yml', description: 'Comprehensive test platform workflow' },
  
  // Test files
  { path: 'tests/e2e/utils/test-helpers.ts', description: 'Test utilities' },
  { path: 'tests/e2e/utils/page-objects.ts', description: 'Page object models' },
  
  // Enhanced scripts
  { path: 'scripts/setup-test-environment.js', description: 'Test environment setup script' },
  { path: 'scripts/demo-environment-setup.js', description: 'Demo environment setup script' },
  { path: 'scripts/initialize-demo-data.js', description: 'Demo data initialization script' },
  { path: 'scripts/analyze-regressions.js', description: 'Regression analysis script' },
  { path: 'tests/e2e/fixtures/test-data.ts', description: 'Test fixtures' },
  { path: 'tests/e2e/global-setup.ts', description: 'Global test setup' },
  { path: 'tests/e2e/global-teardown.ts', description: 'Global test teardown' },
  
  // Test directories (these should exist)
  { path: 'tests/e2e/auth', description: 'Authentication test directory' },
  { path: 'tests/e2e/platform-owner', description: 'Platform owner test directory' },
  { path: 'tests/e2e/creator', description: 'Creator test directory' },
  { path: 'tests/e2e/end-user', description: 'End user test directory' },
  
  // Documentation
  { path: 'docs/TESTING_GUIDE.md', description: 'Testing documentation' },
  { path: 'docs/BUILD_PIPELINE.md', description: 'Pipeline documentation' },
];

const requiredDependencies = [
  '@playwright/test',
  'jest',
  'jest-environment-jsdom',
  '@testing-library/jest-dom',
  '@testing-library/react'
];

const requiredScripts = [
  'test',
  'test:e2e',
  'test:e2e:ui',
  'test:e2e:debug',
  'test:all',
  'playwright:install'
];

const comprehensiveTestModes = [
  'e2e-testing',
  'test-latest-build', 
  'instant-demo',
  'fallback-demo'
];

let allValid = true;

// Check files
console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file.description}: ${file.path}`);
  if (!exists) allValid = false;
});

console.log('\n📦 Checking package.json configuration...');

// Check package.json
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check scripts
  console.log('📝 Required scripts:');
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${script}`);
    if (!exists) allValid = false;
  });
  
  // Check dependencies
  console.log('\n📦 Required dependencies:');
  requiredDependencies.forEach(dep => {
    const exists = (packageJson.dependencies && packageJson.dependencies[dep]) ||
                   (packageJson.devDependencies && packageJson.devDependencies[dep]);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${dep}`);
    if (!exists) allValid = false;
  });
  
} else {
  console.log('❌ package.json not found');
  allValid = false;
}

// Check comprehensive test platform workflow
console.log('\n🚀 Checking comprehensive test platform workflow...');
const workflowPath = '.github/workflows/comprehensive-test-platform.yml';
if (fs.existsSync(workflowPath)) {
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  
  console.log('🎯 Checking test modes:');
  comprehensiveTestModes.forEach(mode => {
    const exists = workflowContent.includes(mode);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${mode}`);
    if (!exists) allValid = false;
  });
  
  // Check for required jobs
  const requiredJobs = [
    'setup:',
    'lint-and-build:',
    'comprehensive-e2e-tests:',
    'demo-environment:',
    'regression-analysis:',
    'fallback-management:',
    'comprehensive-report:'
  ];
  
  console.log('\n🔧 Checking workflow jobs:');
  requiredJobs.forEach(job => {
    const exists = workflowContent.includes(job);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${job.replace(':', '')}`);
    if (!exists) allValid = false;
  });
  
} else {
  console.log('❌ Comprehensive test platform workflow not found');
  allValid = false;
}

// Check scripts executability
console.log('\n🔧 Checking script executability...');
const executableScripts = [
  'scripts/setup-test-environment.js',
  'scripts/demo-environment-setup.js',
  'scripts/initialize-demo-data.js',
  'scripts/analyze-regressions.js',
  'scripts/setup-github-env.js'
];

executableScripts.forEach(script => {
  if (fs.existsSync(script)) {
    try {
      fs.accessSync(script, fs.constants.R_OK);
      console.log(`✅ ${script} is readable`);
    } catch (err) {
      console.log(`❌ ${script} is not readable`);
      allValid = false;
    }
  }
});

// Check .gitignore
console.log('\n🚫 Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const requiredIgnores = [
    '/test-results',
    '/playwright-report',
    '/demo-data',
    '/coverage',
    '/.env.local'
  ];
  
  requiredIgnores.forEach(ignore => {
    const exists = gitignore.includes(ignore);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${ignore}`);
    if (!exists) allValid = false;
  });
} else {
  console.log('❌ .gitignore not found');
  allValid = false;
}

// Environment validation
console.log('\n🌍 Environment validation...');

// Use GitHub environment setup if in CI, otherwise check for env.local.txt
if (process.env.CI || process.env.GITHUB_ACTIONS) {
  console.log('🔧 CI/CD environment detected - using GitHub variables');
  try {
    const { generateEnvFile, validateEnvironment } = require('./setup-github-env');
    const { envPath, missingRequired } = generateEnvFile();
    console.log(`✅ Environment file generated: ${path.basename(envPath)}`);
    
    const isValid = validateEnvironment(missingRequired);
    if (!isValid) {
      console.log('⚠️  Some environment variables are using fallback values');
    }
  } catch (error) {
    console.log('❌ Failed to setup GitHub environment:', error.message);
    allValid = false;
  }
} else {
  // Local development - check for env.local.txt
  const envTemplatePath = 'env.local.txt';
  if (fs.existsSync(envTemplatePath)) {
    const envTemplate = fs.readFileSync(envTemplatePath, 'utf8');
    console.log('✅ Environment template found: env.local.txt');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'TEST_USER_EMAIL',
    'TEST_CREATOR_EMAIL',
    'TEST_PLATFORM_OWNER_EMAIL',
    'PLAYWRIGHT_HEADLESS',
    'PLAYWRIGHT_SCREENSHOTS'
  ];
  
  console.log('📋 Required environment variables in template:');
  requiredEnvVars.forEach(envVar => {
    const exists = envTemplate.includes(envVar);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${envVar}`);
    if (!exists) allValid = false;
  });
  } else {
    console.log('❌ env.local.txt template not found');
    console.log('💡 For local development, copy env.local.txt to .env.local');
    // Don't fail validation in local development without template
  }
}

// Platform support validation
console.log('\n💻 Platform support validation...');
const supportedPlatforms = ['local', 'codespaces', 'vercel'];
const demoSetupScript = 'scripts/demo-environment-setup.js';

if (fs.existsSync(demoSetupScript)) {
  const demoScript = fs.readFileSync(demoSetupScript, 'utf8');
  
  console.log('🌐 Supported demo platforms:');
  supportedPlatforms.forEach(platform => {
    const exists = demoScript.includes(`'${platform}'`) || demoScript.includes(`${platform.charAt(0).toUpperCase() + platform.slice(1)}Demo`);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${platform}`);
    if (!exists) allValid = false;
  });
}

// Final validation summary
console.log('\n📊 Validation Summary');
console.log('===================');

if (allValid) {
  console.log('✅ All validations passed!');
  console.log('🚀 Comprehensive test platform is ready to use');
  console.log('\n🎯 Available test modes:');
  comprehensiveTestModes.forEach(mode => {
    console.log(`   - ${mode}`);
  });
  console.log('\n💻 Supported platforms:');
  supportedPlatforms.forEach(platform => {
    console.log(`   - ${platform}`);
  });
  console.log('\n📖 Next steps:');
  console.log('   1. Copy env.local.txt to .env.local and configure');
  console.log('   2. Run: npm run test:all (for local testing)');
  console.log('   3. Use GitHub Actions for comprehensive testing');
  console.log('   4. Check COMPREHENSIVE_TEST_PLATFORM_GUIDE.md for detailed usage');
} else {
  console.log('❌ Validation failed!');
  console.log('Please fix the issues above before using the test platform.');
  process.exit(1);
}

console.log('\n🔗 Documentation:');
console.log('   - COMPREHENSIVE_TEST_PLATFORM_GUIDE.md - Complete usage guide');
console.log('   - DEMO_GUIDE.md - Demo environment guide');
console.log('   - docs/TESTING_GUIDE.md - Original testing guide');

module.exports = { allValid };

// Check .gitignore
console.log('\n🚫 Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const requiredIgnores = [
    '/test-results',
    '/playwright-report',
    '/coverage'
  ];
  
  requiredIgnores.forEach(ignore => {
    const exists = gitignore.includes(ignore);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${ignore}`);
    if (!exists) allValid = false;
  });
} else {
  console.log('❌ .gitignore not found');
  allValid = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('🎉 All validations passed! Testing environment is ready.');
  console.log('\n🚀 Next steps:');
  console.log('1. Copy env.local.txt to .env.local and configure');
  console.log('2. Run: npm run playwright:install');
  console.log('3. Run: npm run test:e2e');
  console.log('4. Check GitHub Actions workflow in .github/workflows/');
  process.exit(0);
} else {
  console.log('❌ Some validations failed. Please check the setup.');
  process.exit(1);
}