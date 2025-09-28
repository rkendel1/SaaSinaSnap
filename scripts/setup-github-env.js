#!/usr/bin/env node

/**
 * GitHub Environment Variable Setup Script
 * Creates .env.local from GitHub Actions environment variables or fallback values
 */

const fs = require('fs');
const path = require('path');

console.log('🌍 Setting up environment from GitHub variables...\n');

/**
 * Environment variable configuration
 * Maps environment variable names to their sources and fallback values
 */
const envConfig = {
  // Supabase Configuration
  'NEXT_PUBLIC_SUPABASE_URL': {
    sources: ['GITHUB_VARS_NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
    fallback: 'https://oekgesfduljxtnyxltck.supabase.co',
    required: true
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    sources: ['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    fallback: 'your_supabase_anon_key_here',
    required: true,
    secret: true
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    sources: ['SUPABASE_SERVICE_ROLE_KEY'],
    fallback: 'your_supabase_service_role_key_here',
    required: true,
    secret: true
  },
  
  // Stripe Configuration
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': {
    sources: ['GITHUB_VARS_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    fallback: 'pk_test_your_stripe_publishable_key_here',
    required: true
  },
  'STRIPE_SECRET_KEY': {
    sources: ['STRIPE_SECRET_KEY'],
    fallback: 'sk_test_your_stripe_secret_key_here',
    required: true,
    secret: true
  },
  'NEXT_PUBLIC_STRIPE_CLIENT_ID': {
    sources: ['GITHUB_VARS_NEXT_PUBLIC_STRIPE_CLIENT_ID', 'NEXT_PUBLIC_STRIPE_CLIENT_ID'],
    fallback: 'ca_your_stripe_connect_client_id_here',
    required: true
  },
  
  // Application Configuration
  'NEXT_PUBLIC_SITE_URL': {
    sources: ['GITHUB_VARS_NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SITE_URL'],
    fallback: 'http://localhost:32100',
    required: false
  },
  'PORT': {
    sources: ['PORT'],
    fallback: '32100',
    required: false
  },
  
  // Test Configuration
  'TEST_USER_EMAIL': {
    sources: ['GITHUB_VARS_TEST_USER_EMAIL', 'TEST_USER_EMAIL'],
    fallback: 'test@staryer.com',
    required: false
  },
  'TEST_USER_PASSWORD': {
    sources: ['TEST_USER_PASSWORD'],
    fallback: 'test-password-123',
    required: false,
    secret: true
  },
  'TEST_CREATOR_EMAIL': {
    sources: ['GITHUB_VARS_TEST_CREATOR_EMAIL', 'TEST_CREATOR_EMAIL'],
    fallback: 'creator@staryer.com',
    required: false
  },
  'TEST_CREATOR_PASSWORD': {
    sources: ['TEST_CREATOR_PASSWORD'],
    fallback: 'creator-password-123',
    required: false,
    secret: true
  },
  'TEST_PLATFORM_OWNER_EMAIL': {
    sources: ['GITHUB_VARS_TEST_PLATFORM_OWNER_EMAIL', 'TEST_PLATFORM_OWNER_EMAIL'],
    fallback: 'owner@staryer.com',
    required: false
  },
  'TEST_PLATFORM_OWNER_PASSWORD': {
    sources: ['TEST_PLATFORM_OWNER_PASSWORD'],
    fallback: 'owner-password-123',
    required: false,
    secret: true
  },
  
  // Playwright Configuration
  'PLAYWRIGHT_HEADLESS': {
    sources: ['PLAYWRIGHT_HEADLESS'],
    fallback: 'true',
    required: false
  },
  'PLAYWRIGHT_SCREENSHOTS': {
    sources: ['PLAYWRIGHT_SCREENSHOTS'],
    fallback: 'true',
    required: false
  },
  'PLAYWRIGHT_VIDEO': {
    sources: ['PLAYWRIGHT_VIDEO'],
    fallback: 'retain-on-failure',
    required: false
  },
  'TEST_TIMEOUT': {
    sources: ['TEST_TIMEOUT'],
    fallback: '30000',
    required: false
  }
};

/**
 * Get environment variable value from various sources
 */
function getEnvValue(config, varName) {
  for (const source of config.sources) {
    const value = process.env[source];
    if (value && value !== 'undefined' && value !== '') {
      return value;
    }
  }
  return config.fallback;
}

/**
 * Generate .env.local file
 */
function generateEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '# Environment variables generated from GitHub Actions\n';
  envContent += `# Generated at: ${new Date().toISOString()}\n\n`;
  
  const missingRequired = [];
  
  for (const [varName, config] of Object.entries(envConfig)) {
    const value = getEnvValue(config, varName);
    
    // Check if required variable is missing or has placeholder value
    if (config.required && (value === config.fallback && config.fallback.includes('your_'))) {
      missingRequired.push(varName);
    }
    
    // Add comment for variable groups
    if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
      envContent += '# Supabase Configuration\n';
    } else if (varName === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') {
      envContent += '\n# Stripe Configuration\n';
    } else if (varName === 'NEXT_PUBLIC_SITE_URL') {
      envContent += '\n# Application Configuration\n';
    } else if (varName === 'TEST_USER_EMAIL') {
      envContent += '\n# Test Configuration\n';
    } else if (varName === 'PLAYWRIGHT_HEADLESS') {
      envContent += '\n# Playwright Configuration\n';
    }
    
    envContent += `${varName}=${value}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  
  return { envPath, missingRequired };
}

/**
 * Validate environment setup
 */
function validateEnvironment(missingRequired) {
  console.log('🔍 Environment Validation Results:');
  console.log('=====================================\n');
  
  if (missingRequired.length === 0) {
    console.log('✅ All required environment variables are configured');
  } else {
    console.log('⚠️  Missing required environment variables:');
    missingRequired.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📝 These variables should be configured in GitHub repository settings:');
    console.log('   Repository Settings > Secrets and Variables > Actions');
  }
  
  console.log('\n🎯 Testing Configuration:');
  console.log(`   Base URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:32100'}`);
  console.log(`   Headless: ${process.env.PLAYWRIGHT_HEADLESS || 'true'}`);
  console.log(`   Screenshots: ${process.env.PLAYWRIGHT_SCREENSHOTS || 'true'}`);
  console.log(`   Video: ${process.env.PLAYWRIGHT_VIDEO || 'retain-on-failure'}`);
  
  return missingRequired.length === 0;
}

/**
 * Main execution
 */
function main() {
  try {
    const { envPath, missingRequired } = generateEnvFile();
    
    console.log(`✅ Environment file created: ${envPath}`);
    console.log(`📝 Variables configured: ${Object.keys(envConfig).length}`);
    
    const isValid = validateEnvironment(missingRequired);
    
    if (isValid) {
      console.log('\n🎉 Environment setup completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Environment setup completed with warnings.');
      console.log('Tests may not work properly without required variables.');
      process.exit(0); // Don't fail the build, just warn
    }
  } catch (error) {
    console.error('❌ Environment setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateEnvFile,
  validateEnvironment,
  envConfig
};