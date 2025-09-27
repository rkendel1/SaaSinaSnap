import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

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

  // Create screenshot directories
  const fs = require('fs');
  const dirs = ['test-results/screenshots', 'playwright-report'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log('✅ Global setup completed');
}

export default globalSetup;