import Stripe from 'stripe';

import type { StripeProductData } from './brand-analysis-service';

export interface StripeTestAccountConfig {
  accountName: string;
  email: string;
  country: string;
  products: StripeProductData[];
}

export interface StripeTestAccountResult {
  accountId: string;
  publicKey: string;
  secretKey: string;
  products: Array<{
    stripeId: string;
    priceId: string;
    originalData: StripeProductData;
  }>;
}

export class StripeTestAccountService {
  private stripe: Stripe;

  constructor(stripeSecretKey: string) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create and configure a test account with extracted product data
   */
  async createTestAccount(config: StripeTestAccountConfig): Promise<StripeTestAccountResult> {
    try {
      // Create test account
      const account = await this.stripe.accounts.create({
        type: 'standard',
        country: config.country,
        email: config.email,
        business_type: 'company',
        company: {
          name: config.accountName,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Create test products and prices
      const productResults = await Promise.all(
        config.products.map(async (product) => {
          const stripeProduct = await this.stripe.products.create({
            name: product.name,
            description: product.description,
            metadata: {
              features: JSON.stringify(product.features),
              ...product.metadata,
            },
          }, {
            stripeAccount: account.id,
          });

          const price = await this.stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: product.price ? product.price * 100 : 0, // Convert to cents
            currency: 'usd',
            recurring: product.interval ? {
              interval: product.interval,
            } : undefined,
          }, {
            stripeAccount: account.id,
          });

          return {
            stripeId: stripeProduct.id,
            priceId: price.id,
            originalData: product,
          };
        })
      );

      // Get account keys
      const keys = await this.stripe.accounts.listExternalAccounts(
        account.id,
        { object: 'card', limit: 1 }
      );

      return {
        accountId: account.id,
        publicKey: `pk_test_${keys.data[0]?.id}`,
        secretKey: `sk_test_${keys.data[0]?.id}`,
        products: productResults,
      };
    } catch (error) {
      console.error('Error creating test account:', error);
      throw new Error('Failed to create Stripe test account');
    }
  }

  /**
   * Validate a Stripe account connection
   */
  async validateConnection(accountId: string): Promise<{
    isValid: boolean;
    details: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
    };
  }> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      
      return {
        isValid: account.charges_enabled && account.payouts_enabled && account.details_submitted,
        details: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        },
      };
    } catch (error) {
      console.error('Error validating account:', error);
      return {
        isValid: false,
        details: {
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
        },
      };
    }
  }

  /**
   * Get onboarding link for completing account setup
   */
  async getOnboardingLink(accountId: string, returnUrl: string): Promise<string> {
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }
}