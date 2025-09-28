import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display login page', async ({ page }) => {
    await helpers.navigateTo('/login');
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    await helpers.takeScreenshot('login-page-loaded');
  });

  test('should handle login with valid credentials', async ({ page }) => {
    await helpers.loginAs('creator');
    
    // Verify successful login
    await expect(page).toHaveURL(/dashboard/);
    await helpers.takeScreenshot('login-successful');
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await helpers.navigateTo('/login');
    
    // Try invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await helpers.takeScreenshot('invalid-login-attempt');
    
    // Check for error message
    await expect(page.locator('.error, .alert-error, [role="alert"]')).toBeVisible();
    await helpers.takeScreenshot('login-error-displayed');
  });

  test('should display registration page', async ({ page }) => {
    await helpers.navigateTo('/signup');
    
    // Check registration form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    await helpers.takeScreenshot('signup-page-loaded');
  });

  test('should handle user registration', async ({ page }) => {
    await helpers.navigateTo('/signup');
    
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Fill registration form
    await helpers.fillForm({
      email: testEmail,
      password: 'testpassword123',
      confirmPassword: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    });

    await page.click('button[type="submit"]');
    await helpers.takeScreenshot('registration-submitted');
    
    // Check for success message or email verification
    await expect(page.locator('text=verify, text=check your email, text=success')).toBeVisible();
    await helpers.takeScreenshot('registration-success');
  });

  test('should handle logout', async ({ page }) => {
    await helpers.loginAs('creator');
    await helpers.logout();
    
    // Verify redirect to home or login
    await expect(page).toHaveURL(/\/(login|$)/);
    await helpers.takeScreenshot('logout-completed');
  });

  test.afterEach(async ({ page }) => {
    await helpers.takeScreenshot('auth-test-completed');
  });
});