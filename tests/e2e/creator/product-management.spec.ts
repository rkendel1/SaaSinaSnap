import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { ProductManagementPage } from '../utils/page-objects';

test.describe('Creator Product Management', () => {
  let helpers: TestHelpers;
  let productPage: ProductManagementPage;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    productPage = new ProductManagementPage(page);

    await helpers.loginAs('creator');
    await helpers.navigateTo('/creator/products');
  });

  test('should display product management dashboard', async ({ page }) => {
    await helpers.takeScreenshot('product-dashboard');

    // Check key elements
    await expect(page.locator('h1, .page-title')).toContainText(/products/i);
    await helpers.waitForElement('.product-list, .products-grid', 'product-list');
    
    // Check for add product button
    await expect(productPage.addProductButton).toBeVisible();

    await helpers.takeScreenshot('product-dashboard-loaded');
  });

  test('should create a new product', async ({ page }) => {
    const productData = {
      name: 'Test API Service',
      description: 'A comprehensive API service for testing',
      price: '49.99',
      type: 'subscription'
    };

    await productPage.createProduct(productData);

    // Verify product was created
    await expect(page.locator(`text=${productData.name}`)).toBeVisible();
    await helpers.takeScreenshot('product-created-verification');
  });

  test('should edit existing product', async ({ page }) => {
    // First create a product
    await productPage.createProduct({
      name: 'Edit Test Product',
      description: 'Product to be edited',
      price: '19.99',
      type: 'one-time'
    });

    // Find and edit the product
    await page.click('.edit-product, button:has-text("Edit")');
    await helpers.takeScreenshot('product-edit-form');

    // Update product details
    await page.fill('[name="name"]', 'Updated Product Name');
    await page.fill('[name="price"]', '29.99');
    
    await page.click('button[type="submit"]');
    await helpers.waitForPageLoad();
    await helpers.takeScreenshot('product-updated');

    // Verify changes
    await expect(page.locator('text=Updated Product Name')).toBeVisible();
  });

  test('should configure product pricing tiers', async ({ page }) => {
    await helpers.navigateTo('/creator/products/pricing');
    await helpers.takeScreenshot('pricing-configuration');

    // Check pricing tier options
    await expect(page.locator('.pricing-tiers, .tier-configuration')).toBeVisible();
    
    // Add a new tier
    await page.click('button:has-text("Add Tier")');
    await helpers.takeScreenshot('new-tier-form');

    await helpers.fillForm({
      tierName: 'Premium Tier',
      tierPrice: '99.99',
      tierFeatures: 'Advanced features included'
    });

    await page.click('button[type="submit"]');
    await helpers.takeScreenshot('tier-created');
  });

  test.afterEach(async ({ page }) => {
    await helpers.takeScreenshot('product-management-test-completed');
  });
});