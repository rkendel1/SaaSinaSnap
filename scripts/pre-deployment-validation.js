#!/usr/bin/env node

/**
 * Pre-Deployment Validation Script
 * Runs comprehensive checks before allowing deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Pre-Deployment Validation Started\n');

let validationsPassed = 0;
let validationsFailed = 0;
const results = [];

/**
 * Run a validation step
 */
async function runValidation(name, command, options = {}) {
  console.log(`🔍 ${name}...`);
  
  try {
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      timeout: options.timeout || 300000 // 5 minutes default
    });
    const duration = Date.now() - startTime;
    
    validationsPassed++;
    results.push({
      name,
      status: 'PASSED',
      duration,
      output: options.silent ? output : null
    });
    
    console.log(`✅ ${name} - PASSED (${Math.round(duration/1000)}s)\n`);
    return { success: true, output };
  } catch (error) {
    validationsFailed++;
    results.push({
      name,
      status: 'FAILED',
      error: error.message,
      output: error.stdout || error.output
    });
    
    console.log(`❌ ${name} - FAILED`);
    if (!options.silent && error.stdout) {
      console.log(`Output: ${error.stdout.slice(-500)}`); // Last 500 chars
    }
    console.log(`Error: ${error.message}\n`);
    return { success: false, error };
  }
}

/**
 * Check if critical files exist
 */
function checkCriticalFiles() {
  console.log('📁 Checking critical files...');
  
  const criticalFiles = [
    '.github/workflows/test-and-build.yml',
    '.github/workflows/comprehensive-test-platform.yml',
    'scripts/setup-github-env.js',
    'scripts/validate-test-setup.js',
    'playwright.config.ts',
    'package.json'
  ];
  
  const missing = criticalFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length > 0) {
    validationsFailed++;
    results.push({
      name: 'Critical Files Check',
      status: 'FAILED',
      error: `Missing files: ${missing.join(', ')}`
    });
    console.log(`❌ Critical Files Check - FAILED`);
    console.log(`Missing files: ${missing.join(', ')}\n`);
    return false;
  }
  
  validationsPassed++;
  results.push({
    name: 'Critical Files Check',
    status: 'PASSED'
  });
  console.log(`✅ Critical Files Check - PASSED\n`);
  return true;
}

/**
 * Generate validation report
 */
function generateReport() {
  const reportPath = path.join(process.cwd(), 'pre-deployment-report.md');
  
  let report = '# 🚀 Pre-Deployment Validation Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Environment:** ${process.env.NODE_ENV || 'development'}\n`;
  report += `**Branch:** ${process.env.GITHUB_REF_NAME || 'unknown'}\n`;
  report += `**Commit:** ${process.env.GITHUB_SHA?.substring(0, 8) || 'unknown'}\n\n`;
  
  report += '## Summary\n\n';
  report += `- ✅ **Passed:** ${validationsPassed}\n`;
  report += `- ❌ **Failed:** ${validationsFailed}\n`;
  report += `- 📊 **Total:** ${validationsPassed + validationsFailed}\n\n`;
  
  if (validationsFailed === 0) {
    report += '🎉 **All validations passed! Ready for deployment.**\n\n';
  } else {
    report += '⚠️ **Some validations failed. Deployment blocked.**\n\n';
  }
  
  report += '## Detailed Results\n\n';
  
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    report += `### ${icon} ${result.name}\n\n`;
    report += `**Status:** ${result.status}\n`;
    
    if (result.duration) {
      report += `**Duration:** ${Math.round(result.duration/1000)}s\n`;
    }
    
    if (result.error) {
      report += `**Error:** ${result.error}\n`;
    }
    
    if (result.output && result.output.length < 1000) {
      report += `**Output:**\n\`\`\`\n${result.output}\n\`\`\`\n`;
    }
    
    report += '\n';
  });
  
  fs.writeFileSync(reportPath, report);
  console.log(`📋 Report saved to: ${reportPath}`);
  
  return reportPath;
}

/**
 * Main validation function
 */
async function main() {
  const startTime = Date.now();
  
  try {
    // 1. Check critical files
    checkCriticalFiles();
    
    // 2. Setup environment
    await runValidation(
      'Environment Setup',
      'node scripts/setup-github-env.js',
      { silent: true, timeout: 60000 }
    );
    
    // 3. Validate test setup
    await runValidation(
      'Test Setup Validation',
      'node scripts/validate-test-setup.js',
      { silent: true, timeout: 60000 }
    );
    
    // 4. Lint code
    await runValidation(
      'Code Linting',
      'npm run lint',
      { timeout: 120000 }
    );
    
    // 5. Build application
    await runValidation(
      'Application Build',
      'npm run build',
      { timeout: 300000 }
    );
    
    // 6. Run unit tests (if they exist)
    if (fs.existsSync('jest.config.js')) {
      await runValidation(
        'Unit Tests',
        'npm run test',
        { timeout: 180000 }
      );
    }
    
    // 7. Install Playwright browsers (if not in CI)
    if (!process.env.CI) {
      await runValidation(
        'Playwright Browser Installation',
        'npm run playwright:install',
        { timeout: 300000 }
      );
    }
    
    // 8. Run critical E2E tests
    const e2eTimeout = process.env.CI ? 600000 : 300000; // 10 min CI, 5 min local
    
    if (process.env.SKIP_E2E !== 'true') {
      await runValidation(
        'Authentication E2E Tests',
        'npx playwright test tests/e2e/auth/ --reporter=line',
        { timeout: e2eTimeout }
      );
      
      // Only run full E2E suite if auth tests pass
      if (results[results.length - 1].status === 'PASSED') {
        await runValidation(
          'Creator Onboarding E2E Tests',
          'npx playwright test tests/e2e/creator/onboarding.spec.ts --reporter=line',
          { timeout: e2eTimeout }
        );
      }
    } else {
      console.log('⏭️ Skipping E2E tests (SKIP_E2E=true)\n');
    }
    
  } catch (error) {
    console.error('❌ Validation pipeline failed:', error);
    validationsFailed++;
  }
  
  const totalTime = Date.now() - startTime;
  
  // Generate report
  const reportPath = generateReport();
  
  // Final summary
  console.log('='.repeat(60));
  console.log('🚀 PRE-DEPLOYMENT VALIDATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Results: ${validationsPassed} passed, ${validationsFailed} failed`);
  console.log(`⏱️  Total time: ${Math.round(totalTime/1000)}s`);
  console.log(`📋 Report: ${reportPath}`);
  
  if (validationsFailed === 0) {
    console.log('\n🎉 All validations passed! Deployment is ready to proceed.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some validations failed. Please fix issues before deployment.');
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n⚠️  Validation interrupted by user');
  generateReport();
  process.exit(130);
});

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runValidation, generateReport };