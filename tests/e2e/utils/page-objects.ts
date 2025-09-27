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