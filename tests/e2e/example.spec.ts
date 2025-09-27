import { test, expect } from '@playwright/test';

test.describe('Staryer Test Environment Validation', () => {
  test('should validate the test environment is properly configured', async ({ page }) => {
    // This is a basic validation test to ensure Playwright is working
    
    // Visit a simple page to test navigation
    await page.goto('https://httpbin.org/html');
    
    // Take a screenshot to verify screenshot functionality
    await page.screenshot({ path: 'test-results/validation-screenshot.png' });
    
    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Herman Melville');
    
    // Test basic interactions
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    console.log('✅ Basic Playwright functionality validated');
  });

  test('should demonstrate test helpers and utilities', async ({ page }) => {
    // This test demonstrates that our test utilities can be imported and used
    const TestHelpers = require('./utils/test-helpers').TestHelpers;
    
    // Simple validation that our helper class can be instantiated
    const helpers = new TestHelpers(page);
    
    // Test screenshot functionality
    await page.goto('https://httpbin.org/json');
    await helpers.takeScreenshot('json-api-test');
    
    // Verify JSON response is displayed
    await expect(page.locator('pre')).toBeVisible();
    
    console.log('✅ Test helpers and utilities validated');
  });

  test('should validate test data fixtures', async ({ page }) => {
    // Import test data to ensure it's properly structured
    const testData = require('./fixtures/test-data');
    
    // Validate that test data is properly structured
    expect(testData.testUsers).toBeDefined();
    expect(testData.testProducts).toBeDefined();
    expect(testData.testPlans).toBeDefined();
    expect(testData.selectors).toBeDefined();
    
    // Validate specific test user data
    expect(testData.testUsers.creator).toHaveProperty('email');
    expect(testData.testUsers.creator).toHaveProperty('role', 'creator');
    
    // Validate product data
    expect(testData.testProducts.saasProduct).toHaveProperty('name');
    expect(testData.testProducts.saasProduct).toHaveProperty('type', 'subscription');
    
    console.log('✅ Test data fixtures validated');
  });
});