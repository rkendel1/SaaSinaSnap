import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Cleanup test data if needed
  // Note: In a real scenario, you might want to clean up test users, etc.
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;