import { Page, Locator } from '@playwright/test';
import { TestHelpers } from './test-helpers';

export class BasePage {
  protected helpers: TestHelpers;

  constructor(protected page: Page) {
    this.helpers = new TestHelpers(page);
  }

  async takeScreenshot(name: string) {
    await this.helpers.takeScreenshot(name);
  }
}

export class DashboardPage extends BasePage {
  readonly header: Locator;
  readonly navigation: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.locator('header, .header');
    this.navigation = page.locator('nav, .navigation, .sidebar');
    this.mainContent = page.locator('main, .main-content');
  }

  async navigateToSection(section: string) {
    await this.navigation.locator(`text=${section}`).click();
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot(`dashboard-${section.toLowerCase()}`);
  }
}

export class StreamlinedOnboardingPage extends BasePage {
  readonly progressBar: Locator;
  readonly currentStep: Locator;
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);
    this.progressBar = page.locator('.progress-bar, [data-testid="progress"]');
    this.currentStep = page.locator('.step-content, .current-step');
    this.nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Get Started")');
    this.prevButton = page.locator('button:has-text("Back"), button:has-text("Previous")');
    this.skipButton = page.locator('button:has-text("Skip"), button:has-text("Later")');
  }

  async completeBrandSetup(options: {
    option: 'upload' | 'url' | 'skip';
    logoFile?: string;
    logoUrl?: string;
    websiteUrl?: string;
  }) {
    if (options.option === 'skip') {
      await this.skipStep();
      return;
    }

    // Select brand setup option
    if (options.option === 'upload') {
      await this.page.click('[data-testid="upload-option"], input[value="upload"]');
      
      if (options.logoFile) {
        // Mock file upload - in real test would use setInputFiles
        await this.page.locator('input[type="file"]').setInputFiles([]);
        // Simulate successful upload
        await this.takeScreenshot('logo-upload-completed');
      }
    } else if (options.option === 'url') {
      await this.page.click('[data-testid="url-option"], input[value="url"]');
      
      if (options.websiteUrl) {
        await this.page.fill('input[name="websiteUrl"], input[placeholder*="website"]', options.websiteUrl);
      }
      
      if (options.logoUrl) {
        await this.page.fill('input[name="logoUrl"], input[placeholder*="logo"]', options.logoUrl);
      }
    }

    await this.takeScreenshot('brand-setup-completed');
    await this.nextButton.click();
    await this.helpers.waitForPageLoad();
  }

  async skipStep() {
    await this.skipButton.click();
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot('step-skipped');
  }

  async goToStep(stepNumber: number) {
    await this.page.click(`[data-step="${stepNumber}"], .step-${stepNumber}`);
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot(`streamlined-step-${stepNumber}`);
  }
}

export class CreatorOnboardingPage extends BasePage {
  readonly progressBar: Locator;
  readonly currentStep: Locator;
  readonly nextButton: Locator;
  readonly prevButton: Locator;

  constructor(page: Page) {
    super(page);
    this.progressBar = page.locator('.progress-bar, [data-testid="progress"]');
    this.currentStep = page.locator('.step-content, .current-step');
    this.nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    this.prevButton = page.locator('button:has-text("Back"), button:has-text("Previous")');
  }

  async completeStep(stepData: Record<string, string>) {
    await this.helpers.fillForm(stepData);
    await this.takeScreenshot('step-filled');
    await this.nextButton.click();
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot('step-completed');
  }

  async goToStep(stepNumber: number) {
    await this.page.click(`[data-step="${stepNumber}"], .step-${stepNumber}`);
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot(`step-${stepNumber}`);
  }
}

export class PostOnboardingTasksPage extends BasePage {
  readonly taskList: Locator;
  readonly progressIndicator: Locator;
  readonly highPriorityTasks: Locator;

  constructor(page: Page) {
    super(page);
    this.taskList = page.locator('.task-list, [data-testid="tasks"]');
    this.progressIndicator = page.locator('.progress-indicator, [data-testid="progress"]');
    this.highPriorityTasks = page.locator('[data-priority="high"], .priority-high');
  }

  async completeProductSetup(productData: {
    productName: string;
    productDescription: string;
    pricing: string;
    billingType: string;
  }) {
    // Fill product form
    await this.page.fill('[name="productName"], [placeholder*="product name"]', productData.productName);
    await this.page.fill('[name="productDescription"], [placeholder*="description"]', productData.productDescription);
    await this.page.fill('[name="pricing"], [placeholder*="price"]', productData.pricing);
    
    if (productData.billingType) {
      await this.page.selectOption('[name="billingType"], select', productData.billingType);
    }

    await this.takeScreenshot('product-form-filled');
    await this.page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot('product-setup-saved');
  }

  async markTaskComplete(taskId: string) {
    await this.page.click(`[data-task="${taskId}"] button:has-text("Complete"), [data-task="${taskId}"] .complete-button`);
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot(`task-${taskId}-completed`);
  }
}

export class ProductManagementPage extends BasePage {
  readonly productList: Locator;
  readonly addProductButton: Locator;
  readonly productForm: Locator;

  constructor(page: Page) {
    super(page);
    this.productList = page.locator('.product-list, [data-testid="products"]');
    this.addProductButton = page.locator('button:has-text("Add Product"), button:has-text("Create Product")');
    this.productForm = page.locator('.product-form, form');
  }

  async createProduct(productData: {
    name: string;
    description: string;
    price: string;
    type: string;
  }) {
    await this.addProductButton.click();
    await this.takeScreenshot('product-form-opened');

    await this.page.fill('[name="name"]', productData.name);
    await this.page.fill('[name="description"]', productData.description);
    await this.page.fill('[name="price"]', productData.price);
    
    if (productData.type) {
      await this.page.selectOption('[name="type"]', productData.type);
    }

    await this.takeScreenshot('product-form-filled');
    await this.page.click('button[type="submit"]');
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot('product-created');
  }
}

export class SubscriptionPage extends BasePage {
  readonly planSelector: Locator;
  readonly checkoutButton: Locator;
  readonly paymentForm: Locator;

  constructor(page: Page) {
    super(page);
    this.planSelector = page.locator('.plan-selector, .pricing-plans');
    this.checkoutButton = page.locator('button:has-text("Subscribe"), button:has-text("Get Started")');
    this.paymentForm = page.locator('.payment-form, form');
  }

  async selectPlan(planName: string) {
    await this.page.click(`text=${planName}`);
    await this.takeScreenshot(`plan-selected-${planName.toLowerCase()}`);
  }

  async completePurchase(paymentData: {
    cardNumber: string;
    expiry: string;
    cvc: string;
    name: string;
  }) {
    await this.checkoutButton.click();
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot('checkout-opened');

    // Fill payment form (this would be Stripe elements in real scenario)
    await this.page.fill('[data-testid="card-number"]', paymentData.cardNumber);
    await this.page.fill('[data-testid="card-expiry"]', paymentData.expiry);
    await this.page.fill('[data-testid="card-cvc"]', paymentData.cvc);
    await this.page.fill('[data-testid="cardholder-name"]', paymentData.name);

    await this.takeScreenshot('payment-filled');
    await this.page.click('button[type="submit"]');
    await this.helpers.waitForPageLoad();
    await this.takeScreenshot('payment-completed');
  }
}