import { Page, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}`;
    await this.page.screenshot({ 
      path: `test-results/screenshots/${filename}.png`,
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${filename}.png`);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Login as a test user
   */
  async loginAs(role: 'platform-owner' | 'creator' | 'user', credentials?: { email: string; password: string }) {
    const defaultCredentials = {
      'platform-owner': {
        email: process.env.TEST_PLATFORM_OWNER_EMAIL || 'owner@staryer.com',
        password: process.env.TEST_PLATFORM_OWNER_PASSWORD || 'owner-password-123'
      },
      'creator': {
        email: process.env.TEST_CREATOR_EMAIL || 'creator@staryer.com',
        password: process.env.TEST_CREATOR_PASSWORD || 'creator-password-123'
      },
      'user': {
        email: process.env.TEST_USER_EMAIL || 'test@staryer.com',
        password: process.env.TEST_USER_PASSWORD || 'test-password-123'
      }
    };

    const creds = credentials || defaultCredentials[role];
    
    await this.page.goto('/auth/sign-in');
    await this.waitForPageLoad();
    await this.takeScreenshot(`login-${role}-start`);

    // Fill login form
    await this.page.fill('input[type="email"]', creds.email);
    await this.page.fill('input[type="password"]', creds.password);
    await this.takeScreenshot(`login-${role}-filled`);

    // Submit form
    await this.page.click('button[type="submit"]');
    await this.waitForPageLoad();
    await this.takeScreenshot(`login-${role}-complete`);

    // Verify login succeeded
    await expect(this.page.locator('[data-testid="user-menu"], .user-avatar, .dashboard')).toBeVisible({ timeout: 10000 });
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"], .user-avatar');
    await this.page.click('text=Sign out, text=Logout');
    await this.waitForPageLoad();
    await this.takeScreenshot('logout-complete');
  }

  /**
   * Navigate to a specific section
   */
  async navigateTo(section: string) {
    await this.page.goto(section);
    await this.waitForPageLoad();
    await this.takeScreenshot(`navigate-${section.replace(/\//g, '-')}`);
  }

  /**
   * Fill a form with data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[name="${field}"], #${field}, input[placeholder*="${field}"]`, value);
    }
    await this.takeScreenshot('form-filled');
  }

  /**
   * Wait for element to be visible and take screenshot
   */
  async waitForElement(selector: string, name: string) {
    await expect(this.page.locator(selector)).toBeVisible({ timeout: 10000 });
    await this.takeScreenshot(`element-visible-${name}`);
  }

  /**
   * Create Supabase client for direct database operations
   */
  getSupabaseClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured for testing');
    }
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(testUserId?: string) {
    if (!testUserId) return;
    
    try {
      const supabase = this.getSupabaseClient();
      
      // Clean up test user's data
      await supabase.from('creator_profiles').delete().eq('user_id', testUserId);
      await supabase.from('subscriptions').delete().eq('user_id', testUserId);
      
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error);
    }
  }
}