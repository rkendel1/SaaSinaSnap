#!/usr/bin/env node

/**
 * Validation script for testing setup
 * Checks that all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Staryer Test Environment Setup...\n');

const requiredFiles = [
  // Configuration files
  { path: 'playwright.config.ts', description: 'Playwright configuration' },
  { path: 'jest.config.js', description: 'Jest configuration' },
  { path: 'jest.setup.js', description: 'Jest setup file' },
  { path: 'env.local.txt', description: 'Environment template' },
  
  // GitHub Actions
  { path: '.github/workflows/test-and-build.yml', description: 'CI/CD pipeline' },
  
  // Test files
  { path: 'tests/e2e/utils/test-helpers.ts', description: 'Test utilities' },
  { path: 'tests/e2e/utils/page-objects.ts', description: 'Page object models' },
  { path: 'tests/e2e/fixtures/test-data.ts', description: 'Test fixtures' },
  { path: 'tests/e2e/global-setup.ts', description: 'Global test setup' },
  { path: 'tests/e2e/global-teardown.ts', description: 'Global test teardown' },
  
  // Test suites
  { path: 'tests/e2e/auth/authentication.spec.ts', description: 'Authentication tests' },
  { path: 'tests/e2e/platform-owner/dashboard.spec.ts', description: 'Platform owner tests' },
  { path: 'tests/e2e/creator/onboarding.spec.ts', description: 'Creator onboarding tests' },
  { path: 'tests/e2e/creator/product-management.spec.ts', description: 'Creator product tests' },
  { path: 'tests/e2e/end-user/subscription-flow.spec.ts', description: 'End user tests' },
  
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
  const requiredScripts = [
    'test',
    'test:e2e',
    'test:e2e:ui',
    'test:e2e:debug',
    'playwright:install'
  ];
  
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