import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { CreatorOnboardingPage } from '../utils/page-objects';

test.describe('Creator Onboarding Flow', () => {
  let helpers: TestHelpers;
  let onboardingPage: CreatorOnboardingPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    onboardingPage = new CreatorOnboardingPage(page);

    // Login as creator
    await helpers.loginAs('creator');
  });

  test('should complete the full creator onboarding process', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    await helpers.takeScreenshot('onboarding-start');

    // Step 1: Website URL
    await onboardingPage.completeStep({
      websiteUrl: 'https://example-creator.com',
      companyName: 'Test Creator Company'
    });

    // Step 2: Product Setup
    await onboardingPage.completeStep({
      productName: 'Test SaaS Product',
      productDescription: 'A test product for e2e testing',
      pricing: '29.99'
    });

    // Step 3: Stripe Connect
    await helpers.waitForElement('button:has-text("Connect Stripe")', 'stripe-connect');
    await helpers.takeScreenshot('stripe-connect-step');
    
    // Skip Stripe connection for now (would require actual Stripe account)
    await page.click('button:has-text("Skip"), button:has-text("Later")');
    await helpers.takeScreenshot('stripe-skipped');

    // Step 4: Branding Setup
    await onboardingPage.completeStep({
      brandColor: '#3B82F6',
      brandName: 'Test Brand'
    });

    // Step 5: White Label Configuration
    await onboardingPage.completeStep({
      heroTitle: 'Welcome to Test Creator',
      heroSubtitle: 'The best test product ever created',
      ctaText: 'Get Started Now'
    });

    // Step 6: Review and Deploy
    await helpers.waitForElement('.review-section, .summary', 'review-step');
    await helpers.takeScreenshot('review-step');

    await page.click('button:has-text("Deploy"), button:has-text("Complete")');
    await helpers.waitForPageLoad();

    // Verify completion
    await expect(page.locator('text=Congratulations, text=Success, text=Complete')).toBeVisible();
    await helpers.takeScreenshot('onboarding-complete');
  });

  test('should allow navigation between onboarding steps', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    
    // Complete first step
    await onboardingPage.completeStep({
      websiteUrl: 'https://test.com',
      companyName: 'Test Company'
    });

    // Go back to previous step
    await onboardingPage.prevButton.click();
    await helpers.takeScreenshot('navigation-back');

    // Verify we're back on step 1
    await expect(page.locator('input[name="websiteUrl"]')).toHaveValue('https://test.com');

    // Navigate forward again
    await onboardingPage.nextButton.click();
    await helpers.takeScreenshot('navigation-forward');
  });

  test('should validate required fields in onboarding steps', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    
    // Try to proceed without filling required fields
    await onboardingPage.nextButton.click();
    await helpers.takeScreenshot('validation-error');

    // Verify validation errors are shown
    await expect(page.locator('.error, .invalid, [aria-invalid="true"]')).toBeVisible();
  });

  test('should save progress and allow resuming onboarding', async ({ page }) => {
    await helpers.navigateTo('/creator/onboarding');
    
    // Fill first step
    await onboardingPage.completeStep({
      websiteUrl: 'https://resume-test.com',
      companyName: 'Resume Test Company'
    });

    // Navigate away and come back
    await helpers.navigateTo('/dashboard');
    await helpers.navigateTo('/creator/onboarding');

    // Verify progress was saved
    await expect(onboardingPage.progressBar).toBeVisible();
    await helpers.takeScreenshot('progress-resumed');
  });

  test.afterEach(async ({ page }) => {
    await helpers.takeScreenshot('creator-onboarding-test-completed');
  });
});