import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { DashboardPage } from '../utils/page-objects';

test.describe('Platform Owner Dashboard', () => {
  let helpers: TestHelpers;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    dashboardPage = new DashboardPage(page);

    // Login as platform owner
    await helpers.loginAs('platform-owner');
    await helpers.navigateTo('/dashboard');
  });

  test('should display platform owner dashboard with key metrics', async ({ page }) => {
    await helpers.takeScreenshot('platform-dashboard-loaded');

    // Check for key dashboard elements
    await expect(page.locator('h1, .page-title')).toContainText(/dashboard|overview/i);
    
    // Check for key metrics cards
    await helpers.waitForElement('.metric-card, .stats-card', 'metrics-visible');
    
    // Verify navigation elements
    await expect(dashboardPage.navigation).toBeVisible();
    
    // Check for expected sections
    const expectedSections = ['Revenue', 'Analytics', 'Creators', 'Products', 'Settings'];
    for (const section of expectedSections) {
      await expect(page.locator(`nav, .navigation`).locator(`text=${section}`)).toBeVisible();
    }

    await helpers.takeScreenshot('platform-dashboard-complete');
  });

  test('should navigate to revenue dashboard', async ({ page }) => {
    await dashboardPage.navigateToSection('Revenue');
    
    // Check revenue dashboard loaded
    await expect(page.locator('h1, .page-title')).toContainText(/revenue/i);
    await helpers.waitForElement('.revenue-chart, .chart-container', 'revenue-chart');
    
    // Check for key revenue metrics
    await expect(page.locator('.total-revenue, .mrr, .arr')).toBeVisible();
    
    await helpers.takeScreenshot('revenue-dashboard-complete');
  });

  test('should navigate to creator management', async ({ page }) => {
    await dashboardPage.navigateToSection('Creators');
    
    // Check creator management loaded
    await expect(page.locator('h1, .page-title')).toContainText(/creators|users/i);
    await helpers.waitForElement('.creator-list, .user-table', 'creator-list');
    
    // Check for creator management features
    await expect(page.locator('button:has-text("Add Creator"), button:has-text("Invite")')).toBeVisible();
    
    await helpers.takeScreenshot('creator-management-complete');
  });

  test('should navigate to platform analytics', async ({ page }) => {
    await dashboardPage.navigateToSection('Analytics');
    
    // Check analytics dashboard loaded
    await expect(page.locator('h1, .page-title')).toContainText(/analytics/i);
    await helpers.waitForElement('.analytics-chart, .metrics-grid', 'analytics-visible');
    
    // Check for key analytics sections
    const analyticsSection = ['Usage', 'Conversion', 'Churn', 'Growth'];
    for (const section of analyticsSection) {
      await expect(page.locator(`text=${section}`)).toBeVisible();
    }
    
    await helpers.takeScreenshot('analytics-dashboard-complete');
  });

  test('should access platform settings', async ({ page }) => {
    await dashboardPage.navigateToSection('Settings');
    
    // Check settings page loaded
    await expect(page.locator('h1, .page-title')).toContainText(/settings/i);
    
    // Check for key settings sections
    const settingsSection = ['Platform Configuration', 'Billing Settings', 'API Keys', 'Webhooks'];
    for (const section of settingsSection) {
      await expect(page.locator(`text=${section}`)).toBeVisible();
    }
    
    await helpers.takeScreenshot('platform-settings-complete');
  });

  test.afterEach(async ({ page }) => {
    await helpers.takeScreenshot('test-completed');
  });
});