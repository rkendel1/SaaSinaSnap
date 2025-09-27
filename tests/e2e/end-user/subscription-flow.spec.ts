import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { SubscriptionPage } from '../utils/page-objects';

test.describe('End User Subscription Flow', () => {
  let helpers: TestHelpers;
  let subscriptionPage: SubscriptionPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    subscriptionPage = new SubscriptionPage(page);
  });

  test('should display pricing plans for a creator', async ({ page }) => {
    // Navigate to a creator's pricing page
    await helpers.navigateTo('/creator/test-creator/pricing');
    await helpers.takeScreenshot('pricing-page-loaded');

    // Check pricing plans are visible
    await helpers.waitForElement('.pricing-plan, .plan-card', 'pricing-plans');
    
    // Verify essential elements
    await expect(page.locator('.plan-name, .plan-title')).toBeVisible();
    await expect(page.locator('.plan-price, .price')).toBeVisible();
    await expect(page.locator('.plan-features, .features')).toBeVisible();
    await expect(page.locator('button:has-text("Subscribe"), button:has-text("Get Started")')).toBeVisible();

    await helpers.takeScreenshot('pricing-plans-complete');
  });

  test('should handle user registration and subscription', async ({ page }) => {
    await helpers.navigateTo('/creator/test-creator/pricing');
    
    // Select a plan
    await subscriptionPage.selectPlan('Pro Plan');
    
    // Click subscribe button
    await subscriptionPage.checkoutButton.click();
    await helpers.waitForPageLoad();
    await helpers.takeScreenshot('subscription-started');

    // Check if redirected to registration (if not logged in)
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/sign-up') || currentUrl.includes('/register')) {
      await helpers.takeScreenshot('registration-required');
      
      // Fill registration form
      await helpers.fillForm({
        email: 'testuser@example.com',
        password: 'testpassword123',
        confirmPassword: 'testpassword123',
        firstName: 'Test',
        lastName: 'User'
      });

      await page.click('button[type="submit"]');
      await helpers.waitForPageLoad();
      await helpers.takeScreenshot('registration-completed');
    }

    // Should now be on checkout/payment page
    await helpers.waitForElement('.payment-form, .checkout-form', 'payment-form');
    await helpers.takeScreenshot('payment-page-loaded');
  });

  test('should display subscription management for existing user', async ({ page }) => {
    // Login as existing user
    await helpers.loginAs('user');
    
    // Navigate to subscription management
    await helpers.navigateTo('/dashboard/subscription');
    await helpers.takeScreenshot('subscription-dashboard');

    // Check subscription details
    await expect(page.locator('.current-plan, .subscription-status')).toBeVisible();
    await expect(page.locator('.billing-info, .payment-method')).toBeVisible();
    await expect(page.locator('.usage-metrics, .usage-stats')).toBeVisible();

    // Check management options
    await expect(page.locator('button:has-text("Upgrade"), button:has-text("Change Plan")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel"), button:has-text("Downgrade")')).toBeVisible();

    await helpers.takeScreenshot('subscription-management-complete');
  });

  test('should show usage tracking and limits', async ({ page }) => {
    await helpers.loginAs('user');
    await helpers.navigateTo('/dashboard/usage');
    await helpers.takeScreenshot('usage-dashboard');

    // Check usage metrics
    await helpers.waitForElement('.usage-chart, .usage-metrics', 'usage-visible');
    
    // Verify usage information
    await expect(page.locator('.current-usage, .usage-amount')).toBeVisible();
    await expect(page.locator('.usage-limit, .plan-limit')).toBeVisible();
    await expect(page.locator('.billing-period, .period-info')).toBeVisible();

    // Check for upgrade options if near limit
    if (await page.locator('.upgrade-prompt, .limit-warning').isVisible()) {
      await helpers.takeScreenshot('usage-limit-warning');
      await expect(page.locator('button:has-text("Upgrade")')).toBeVisible();
    }

    await helpers.takeScreenshot('usage-tracking-complete');
  });

  test('should handle plan upgrades', async ({ page }) => {
    await helpers.loginAs('user');
    await helpers.navigateTo('/dashboard/subscription');
    
    // Click upgrade button
    await page.click('button:has-text("Upgrade"), button:has-text("Change Plan")');
    await helpers.waitForPageLoad();
    await helpers.takeScreenshot('upgrade-options');

    // Select new plan
    await subscriptionPage.selectPlan('Premium Plan');
    
    // Proceed with upgrade
    await page.click('button:has-text("Upgrade Now")');
    await helpers.waitForPageLoad();
    await helpers.takeScreenshot('upgrade-confirmation');

    // Verify upgrade confirmation
    await expect(page.locator('text=upgraded, text=success, text=confirmed')).toBeVisible();
    await helpers.takeScreenshot('upgrade-completed');
  });

  test('should handle subscription cancellation', async ({ page }) => {
    await helpers.loginAs('user');
    await helpers.navigateTo('/dashboard/subscription');
    
    // Click cancel button
    await page.click('button:has-text("Cancel"), text=Cancel Subscription');
    await helpers.takeScreenshot('cancellation-started');

    // Handle cancellation confirmation
    await expect(page.locator('.cancellation-warning, .cancel-confirmation')).toBeVisible();
    
    // Confirm cancellation
    await page.click('button:has-text("Confirm"), button:has-text("Yes, Cancel")');
    await helpers.waitForPageLoad();
    await helpers.takeScreenshot('cancellation-confirmed');

    // Verify cancellation status
    await expect(page.locator('text=cancelled, text=will expire, text=active until')).toBeVisible();
    await helpers.takeScreenshot('cancellation-completed');
  });

  test.afterEach(async ({ page }) => {
    await helpers.takeScreenshot('subscription-test-completed');
  });
});