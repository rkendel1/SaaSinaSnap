import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🔧 Enhanced global setup started...');
  
  try {
    // Initialize test environment
    console.log('⚙️ Initializing test environment...');
    await execAsync('node scripts/setup-test-environment.js');
    
    // Initialize demo data if in demo mode
    if (process.env.DEMO_MODE === 'true') {
      console.log('🎭 Initializing demo data...');
      await execAsync('node scripts/initialize-demo-data.js');
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
      console.warn('Tests will run with mock data only');
    }

    // Initialize Supabase client for test setup if credentials are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Test connection
        const { data, error } = await supabase.from('creator_profiles').select('count').single();
        if (error) {
          console.warn('⚠️  Supabase connection test failed:', error.message);
        } else {
          console.log('✅ Supabase connection verified');
        }
      } catch (error) {
        console.warn('⚠️  Supabase setup error:', error);
      }
    }

    // Launch browser for setup validation
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:32100';
    
    // Try multiple times with exponential backoff
    let retries = 5;
    let delay = 2000;
    
    while (retries > 0) {
      try {
        await page.goto(baseUrl, { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        
        // Check if the page loaded successfully
        const title = await page.title();
        if (title) {
          console.log(`✅ Application is ready at ${baseUrl}`);
          break;
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Application not ready after multiple attempts: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        console.log(`⏳ Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    
    // Verify critical pages are accessible
    const criticalPaths = [
      '/',
      '/auth',
      '/dashboard',
      '/onboarding'
    ];
    
    console.log('🔍 Verifying critical pages...');
    for (const path of criticalPaths) {
      try {
        const response = await page.goto(`${baseUrl}${path}`, { timeout: 10000 });
        if (!response?.ok() && response?.status() !== 401) { // 401 is expected for protected routes
          console.warn(`⚠️ Warning: ${path} returned status ${response?.status()}`);
        } else {
          console.log(`✅ ${path} is accessible`);
        }
      } catch (error) {
        console.warn(`⚠️ Warning: Could not verify ${path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    await browser.close();

    // Create screenshot directories
    const fs = require('fs');
    const dirs = ['test-results/screenshots', 'playwright-report', 'demo-data'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Set up test users and authentication state if needed
    console.log('👤 Setting up test authentication...');
    await setupTestAuthentication();
    
    console.log('✅ Enhanced global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function setupTestAuthentication() {
  // Create test user sessions and authentication state
  // This would typically involve creating test users in the database
  // and setting up authentication tokens or cookies
  
  const testUsers = [
    {
      email: process.env.TEST_PLATFORM_OWNER_EMAIL || 'owner@staryer.com',
      role: 'platform_owner'
    },
    {
      email: process.env.TEST_CREATOR_EMAIL || 'creator@staryer.com',
      role: 'creator'
    },
    {
      email: process.env.TEST_USER_EMAIL || 'user@staryer.com',
      role: 'user'
    }
  ];
  
  console.log(`🔐 Test users prepared: ${testUsers.map(u => u.email).join(', ')}`);
  
  // In a real implementation, you would:
  // 1. Create these users in your test database
  // 2. Generate authentication tokens/sessions
  // 3. Store them for use in tests
}

export default globalSetup;