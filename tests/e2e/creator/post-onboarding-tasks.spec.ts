import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { PostOnboardingTasksPage } from '../utils/page-objects';

test.describe('Post-Onboarding Tasks', () => {
  let helpers: TestHelpers;
  let tasksPage: PostOnboardingTasksPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    tasksPage = new PostOnboardingTasksPage(page);

    // Login as creator who has completed onboarding
    await helpers.loginAs('creator');
  });

  test('should display deferred tasks after streamlined onboarding', async ({ page }) => {
    await helpers.navigateTo('/creator/tasks');
    await helpers.takeScreenshot('post-onboarding-tasks-page');

    // Verify high priority deferred tasks are visible
    await expect(page.locator('text=Product Setup')).toBeVisible();
    await expect(page.locator('text=Storefront Customization')).toBeVisible();
    await expect(page.locator('text=White-Label Page Configuration')).toBeVisible();
    
    // Verify task priorities are displayed
    await expect(page.locator('.priority-high, [data-priority="high"]')).toBeVisible();
    await helpers.takeScreenshot('deferred-tasks-visible');
  });

  test('should allow completion of product setup task', async ({ page }) => {
    await helpers.navigateTo('/creator/tasks');
    
    // Click on Product Setup task
    await page.click('text=Product Setup, [data-task="product-setup"]');
    await helpers.waitForPageLoad();
    await helpers.takeScreenshot('product-setup-task-opened');

    // Should navigate to product creation
    await expect(page.url()).toMatch(/products|setup/);
    
    // Complete product setup
    await tasksPage.completeProductSetup({
      productName: 'SaaS Product',
      productDescription: 'A comprehensive SaaS solution',
      pricing: '49.99',
      billingType: 'monthly'
    });

    await helpers.takeScreenshot('product-setup-completed');
  });

  test('should validate white-label page auto-generation progress', async ({ page }) => {
    await helpers.navigateTo('/creator/tasks');
    
    // Check for white-label page generation status
    const whiteLabelTask = page.locator('[data-task="white-label-page"], text=White-Label Page');
    await expect(whiteLabelTask).toBeVisible();
    
    // Should show generation progress or completion status
    await expect(page.locator('.task-status, [data-status]')).toBeVisible();
    await helpers.takeScreenshot('white-label-generation-status');

    // Click to view generated page
    await whiteLabelTask.click();
    await helpers.waitForPageLoad();
    
    // Should show preview of generated page
    await expect(page.locator('.page-preview, [data-testid="page-preview"]')).toBeVisible();
    await helpers.takeScreenshot('white-label-page-preview');
  });

  test('should track task completion progress', async ({ page }) => {
    await helpers.navigateTo('/creator/tasks');
    
    // Verify progress tracking
    await expect(page.locator('.progress-indicator, [data-testid="progress"]')).toBeVisible();
    
    // Complete a simple task
    await page.click('[data-task="simple-task"]:first, .task-item:first button:has-text("Complete")');
    await helpers.waitForPageLoad();
    
    // Verify progress updated
    await helpers.takeScreenshot('task-completion-progress');
    
    // Verify completed task is marked as done
    await expect(page.locator('.task-completed, [data-status="completed"]')).toBeVisible();
  });

  test('should handle task prioritization and scheduling', async ({ page }) => {
    await helpers.navigateTo('/creator/tasks');
    
    // Verify high priority tasks are shown first
    const highPriorityTasks = page.locator('[data-priority="high"], .priority-high');
    await expect(highPriorityTasks.first()).toBeVisible();
    
    // Verify time estimates are shown
    await expect(page.locator('text=10-15 minutes, text=5-10 minutes')).toBeVisible();
    
    // Test task scheduling
    await page.click('[data-task="product-setup"] button:has-text("Schedule"), .schedule-task:first');
    await helpers.takeScreenshot('task-scheduling');
    
    // Should show scheduling options
    await expect(page.locator('.schedule-options, [data-testid="schedule"]')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await helpers.takeScreenshot('post-onboarding-tasks-test-completed');
  });
});