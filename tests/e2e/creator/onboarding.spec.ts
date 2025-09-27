import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { StreamlinedOnboardingPage } from '../utils/page-objects';

test.describe('Streamlined Creator Onboarding Flow', () => {
  let helpers: TestHelpers;
  let onboardingPage: StreamlinedOnboardingPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    onboardingPage = new StreamlinedOnboardingPage(page);

    // Login as creator
    await helpers.loginAs('creator');
  });

  test('should complete the streamlined creator onboarding process', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    await helpers.takeScreenshot('streamlined-onboarding-start');

    // Step 1: Welcome Step (Required)
    await helpers.waitForElement('h3:has-text("Welcome to Staryer")', 'welcome-step');
    await helpers.takeScreenshot('welcome-step');
    
    // Welcome step should show creator name and value propositions
    await expect(page.locator('text=Welcome to Staryer')).toBeVisible();
    await expect(page.locator('text=White-Label Pages, text=Stripe Integration, text=Analytics Dashboard')).toBeVisible();
    
    await onboardingPage.nextButton.click();
    await helpers.waitForPageLoad();

    // Step 2: Brand Setup (Optional)
    await helpers.waitForElement('[data-testid="brand-setup"], .brand-setup', 'brand-setup-step');
    await helpers.takeScreenshot('brand-setup-step');
    
    // Test uploading a logo
    await onboardingPage.completeBrandSetup({
      option: 'upload',
      logoFile: 'test-logo.png' // Mock file
    });

    // Step 3: Stripe Connect (Optional)
    await helpers.waitForElement('[data-testid="stripe-connect"], button:has-text("Connect Stripe")', 'stripe-connect-step');
    await helpers.takeScreenshot('stripe-connect-step');
    
    // Skip Stripe connection for testing
    await onboardingPage.skipStep();
    await helpers.takeScreenshot('stripe-skipped');

    // Complete onboarding
    await helpers.waitForElement('button:has-text("Complete"), button:has-text("Finish")', 'complete-button');
    await page.click('button:has-text("Complete"), button:has-text("Finish")');
    await helpers.waitForPageLoad();

    // Verify completion and success animation
    await expect(page.locator('.success-animation, text=Success, text=Complete')).toBeVisible();
    await helpers.takeScreenshot('streamlined-onboarding-complete');

    // Verify redirect to dashboard or post-onboarding tasks
    await helpers.waitForPageLoad();
    await expect(page.url()).toMatch(/dashboard|tasks/);
    await helpers.takeScreenshot('post-onboarding-redirect');
  });

  test('should allow navigation between streamlined onboarding steps', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    
    // Start from welcome step
    await helpers.waitForElement('h3:has-text("Welcome to Staryer")', 'welcome-step');
    await onboardingPage.nextButton.click();
    await helpers.waitForPageLoad();

    // Now on brand setup step
    await helpers.waitForElement('[data-testid="brand-setup"], .brand-setup', 'brand-setup-step');
    await helpers.takeScreenshot('navigation-brand-step');

    // Go back to welcome step
    await onboardingPage.prevButton.click();
    await helpers.waitForPageLoad();
    await helpers.takeScreenshot('navigation-back-to-welcome');

    // Verify we're back on welcome step
    await expect(page.locator('h3:has-text("Welcome to Staryer")')).toBeVisible();

    // Navigate forward again
    await onboardingPage.nextButton.click();
    await helpers.waitForPageLoad();
    await helpers.takeScreenshot('navigation-forward-to-brand');
  });

  test('should handle optional steps correctly', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    
    // Complete welcome step
    await helpers.waitForElement('h3:has-text("Welcome to Staryer")', 'welcome-step');
    await onboardingPage.nextButton.click();
    await helpers.waitForPageLoad();

    // Skip brand setup (optional)
    await helpers.waitForElement('[data-testid="brand-setup"], .brand-setup', 'brand-setup-step');
    await onboardingPage.skipStep();
    await helpers.takeScreenshot('brand-setup-skipped');

    // Skip Stripe Connect (optional)
    await helpers.waitForElement('[data-testid="stripe-connect"], button:has-text("Connect Stripe")', 'stripe-connect-step');
    await onboardingPage.skipStep();
    await helpers.takeScreenshot('stripe-connect-skipped');

    // Should complete onboarding successfully
    await helpers.waitForElement('button:has-text("Complete"), button:has-text("Finish")', 'complete-button');
    await page.click('button:has-text("Complete"), button:has-text("Finish")');
    
    // Verify completion
    await expect(page.locator('.success-animation, text=Success, text=Complete')).toBeVisible();
    await helpers.takeScreenshot('minimal-onboarding-complete');
  });

  test('should save progress and allow resuming streamlined onboarding', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    
    // Complete welcome step
    await helpers.waitForElement('h3:has-text("Welcome to Staryer")', 'welcome-step');
    await onboardingPage.nextButton.click();
    await helpers.waitForPageLoad();

    // Partially complete brand setup
    await helpers.waitForElement('[data-testid="brand-setup"], .brand-setup', 'brand-setup-step');
    await onboardingPage.completeBrandSetup({
      option: 'url',
      websiteUrl: 'https://resume-test.com'
    });

    // Navigate away and come back
    await helpers.navigateTo('/dashboard');
    await helpers.navigateTo('/creator/onboarding');

    // Verify progress was saved - should be on Stripe Connect step
    await helpers.waitForElement('[data-testid="stripe-connect"], button:has-text("Connect Stripe")', 'stripe-connect-step-resumed');
    await helpers.takeScreenshot('progress-resumed-stripe-step');

    // Verify progress indicator shows we're on step 3
    await expect(page.locator('text=Step 3, text=Payment Setup')).toBeVisible();
  });

  test('should trigger background processes after onboarding completion', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    
    // Complete minimal onboarding (welcome step only)
    await helpers.waitForElement('h3:has-text("Welcome to Staryer")', 'welcome-step');
    await onboardingPage.nextButton.click();
    
    // Skip optional steps
    await onboardingPage.skipStep(); // Brand setup
    await onboardingPage.skipStep(); // Stripe Connect
    
    // Complete onboarding
    await page.click('button:has-text("Complete"), button:has-text("Finish")');
    await helpers.waitForPageLoad();

    // Verify redirection to post-onboarding tasks/dashboard
    await helpers.waitForPageLoad();
    await expect(page.url()).toMatch(/dashboard|tasks/);
    
    // Verify that deferred tasks are visible
    await expect(page.locator('text=Product Setup, text=Storefront Customization, text=White-Label Page')).toBeVisible();
    await helpers.takeScreenshot('post-onboarding-tasks-visible');
  });

  test('should validate white-label page auto-generation', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    
    // Complete onboarding with brand setup
    await onboardingPage.nextButton.click(); // Welcome step
    
    // Complete brand setup
    await onboardingPage.completeBrandSetup({
      option: 'upload',
      logoFile: 'test-brand-logo.png'
    });
    
    await onboardingPage.skipStep(); // Skip Stripe Connect
    
    // Complete onboarding
    await page.click('button:has-text("Complete"), button:has-text("Finish")');
    await helpers.waitForPageLoad();

    // Wait for background processing
    await page.waitForTimeout(3000);
    
    // Navigate to the generated white-label page
    await helpers.navigateTo('/creator/preview-page');
    
    // Verify auto-generated elements are present
    await expect(page.locator('.white-label-page, [data-testid="generated-page"]')).toBeVisible();
    await helpers.takeScreenshot('auto-generated-white-label-page');
  });

  test.afterEach(async ({ page }) => {
    await helpers.takeScreenshot('streamlined-onboarding-test-completed');
  });
});