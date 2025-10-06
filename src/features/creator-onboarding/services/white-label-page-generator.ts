import type { DesignTokens, PrePopulatedData } from './brand-analysis-service';
import type { StripeTestAccountResult } from './stripe-test-account-service';

export interface WhiteLabelPageConfig {
  businessData: PrePopulatedData;
  designTokens: DesignTokens;
  stripeIntegration: StripeTestAccountResult;
  baseUrl: string;
}

export interface GeneratedPages {
  pricing: {
    path: string;
    title: string;
  };
  checkout: {
    path: string;
    title: string;
  };
  account: {
    path: string;
    title: string;
  };
  subscription: {
    path: string;
    title: string;
  };
}

export class WhiteLabelPageGenerator {
  /**
   * Generate all required white-label pages
   */
  static async generatePages(config: WhiteLabelPageConfig): Promise<GeneratedPages> {
    const pages: GeneratedPages = {
      pricing: await this.generatePricingPage(config),
      checkout: await this.generateCheckoutFlow(config),
      account: await this.generateAccountPortal(config),
      subscription: await this.generateSubscriptionManagement(config),
    };

    return pages;
  }

  /**
   * Generate pricing page with Stripe products
   */
  private static async generatePricingPage(config: WhiteLabelPageConfig): Promise<{
    path: string;
    title: string;
  }> {
    const { businessData, designTokens, stripeIntegration } = config;
    
    // Map Stripe products to pricing tiers
    const pricingTiers = stripeIntegration.products.map(product => ({
      id: product.stripeId,
      priceId: product.priceId,
      name: product.originalData.name,
      description: product.originalData.description,
      features: product.originalData.features,
      price: product.originalData.price,
      interval: product.originalData.interval,
    }));

    // Generate page at /c/[slug]/pricing
    const pagePath = `${config.baseUrl}/pricing`;
    
    return {
      path: pagePath,
      title: `${businessData.businessName} - Pricing Plans`,
    };
  }

  /**
   * Generate checkout flow pages
   */
  private static async generateCheckoutFlow(config: WhiteLabelPageConfig): Promise<{
    path: string;
    title: string;
  }> {
    const { businessData, stripeIntegration } = config;

    // Set up Stripe checkout configuration
    const checkoutConfig = {
      publishableKey: stripeIntegration.publicKey,
      accountId: stripeIntegration.accountId,
      products: stripeIntegration.products,
    };

    // Generate checkout pages at /c/[slug]/checkout/[priceId]
    const pagePath = `${config.baseUrl}/checkout`;
    
    return {
      path: pagePath,
      title: `${businessData.businessName} - Secure Checkout`,
    };
  }

  /**
   * Generate account management portal
   */
  private static async generateAccountPortal(config: WhiteLabelPageConfig): Promise<{
    path: string;
    title: string;
  }> {
    const { businessData } = config;

    // Generate account portal at /c/[slug]/account
    const pagePath = `${config.baseUrl}/account`;
    
    return {
      path: pagePath,
      title: `${businessData.businessName} - Account Management`,
    };
  }

  /**
   * Generate subscription management pages
   */
  private static async generateSubscriptionManagement(config: WhiteLabelPageConfig): Promise<{
    path: string;
    title: string;
  }> {
    const { businessData } = config;

    // Generate subscription management at /c/[slug]/subscription
    const pagePath = `${config.baseUrl}/subscription`;
    
    return {
      path: pagePath,
      title: `${businessData.businessName} - Subscription Management`,
    };
  }

  /**
   * Validate all generated pages
   */
  static async validatePages(pages: GeneratedPages): Promise<{
    isValid: boolean;
    errors: Array<{
      page: keyof GeneratedPages;
      error: string;
    }>;
  }> {
    const errors: Array<{
      page: keyof GeneratedPages;
      error: string;
    }> = [];

    // Validate each page exists and is properly configured
    for (const [key, page] of Object.entries(pages)) {
      if (!page.path || !page.title) {
        errors.push({
          page: key as keyof GeneratedPages,
          error: 'Missing required page configuration',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}