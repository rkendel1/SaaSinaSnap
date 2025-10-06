import type { ExtractedBrandingData } from '../types';

import type { DesignTokens, PrePopulatedData } from './brand-analysis-service';
import { BrandAnalysisService } from './brand-analysis-service';
import { StripeTestAccountService } from './stripe-test-account-service';
import type { WhiteLabelPageConfig } from './white-label-page-generator';
import { WhiteLabelPageGenerator } from './white-label-page-generator';

export interface OnboardingConfig {
  websiteUrl: string;
  businessEmail: string;
  country: string;
  stripeSecretKey: string;
  baseUrl: string;
}

export interface OnboardingResult {
  businessData: {
    name: string;
    description: string;
    brandColors: string[];
    products: Array<{
      name: string;
      price: number;
      interval?: string;
    }>;
  };
  stripeAccount: {
    accountId: string;
    publicKey: string;
    secretKey: string;
    onboardingUrl: string;
  };
  pages: {
    pricing: string;
    checkout: string;
    account: string;
    subscription: string;
  };
  designTokens: {
    colors: Record<string, string>;
    typography: Record<string, string>;
    spacing: Record<string, string | number>;
  };
}

export class OnboardingOrchestrator {
  private stripeService: StripeTestAccountService;

  constructor(stripeSecretKey: string) {
    this.stripeService = new StripeTestAccountService(stripeSecretKey);
  }

  /**
   * Execute the complete onboarding flow
   */
  async executeOnboarding(config: OnboardingConfig): Promise<OnboardingResult> {
    try {
      // Step 1: Extract and analyze website data
      const extractedData = await this.extractSiteData(config.websiteUrl);
      
      // Step 2: Pre-populate data and generate design tokens
      const prepopulated = await this.prepareBusinessData(extractedData);
      const { designTokens, ...businessData } = prepopulated;
      
      // Step 3: Set up Stripe test account
      const stripeAccount = await this.setupStripeAccount({
        accountName: businessData.businessName,
        email: config.businessEmail,
        country: config.country,
        products: businessData.products,
      });
      
      // Step 4: Generate white-label pages
      const pages = await this.generateWhiteLabelPages({
        businessData,
        designTokens,
        stripeIntegration: stripeAccount,
        baseUrl: config.baseUrl,
      });

      // Step 5: Get onboarding URL for completing Stripe setup
      const onboardingUrl = await this.stripeService.getOnboardingLink(
        stripeAccount.accountId,
        `${config.baseUrl}/onboarding/stripe/complete`
      );

      return {
        businessData: {
          name: businessData.businessName,
          description: businessData.businessDescription,
          brandColors: businessData.brandColors.primary,
          products: businessData.products.map(p => ({
            name: p.name,
            price: p.price || 0,
            // interval will be determined during Stripe setup
            interval: undefined,
          })),
        },
        stripeAccount: {
          accountId: stripeAccount.accountId,
          publicKey: stripeAccount.publicKey,
          secretKey: stripeAccount.secretKey,
          onboardingUrl,
        },
        pages: {
          pricing: pages.pricing.path,
          checkout: pages.checkout.path,
          account: pages.account.path,
          subscription: pages.subscription.path,
        },
        designTokens: {
          colors: {
            primary: designTokens.colors.primary[0],
            secondary: designTokens.colors.secondary[0],
            background: designTokens.colors.background,
            text: designTokens.colors.text,
          },
          typography: {
            primary: designTokens.typography.primary,
            secondary: designTokens.typography.secondary || '',
            baseFontSize: designTokens.typography.baseFontSize,
          },
          spacing: {
            base: designTokens.spacing.base,
            scale: designTokens.spacing.scale,
          },
        },
      };
    } catch (error) {
      console.error('Onboarding flow failed:', error);
      throw new Error('Failed to complete onboarding process');
    }
  }

  /**
   * Extract and validate website data
   */
  private async extractSiteData(url: string): Promise<ExtractedBrandingData> {
    const extractedData = await BrandAnalysisService.analyzeWebsite(url);
    const validation = BrandAnalysisService.validateExtractedData(extractedData);
    
    if (!validation.isValid) {
      throw new Error(
        `Failed to extract required data: ${validation.missingFields.join(', ')}`
      );
    }
    
    return extractedData;
  }

  /**
   * Prepare business data and design tokens
   */
  private async prepareBusinessData(extractedData: ExtractedBrandingData) {
    return BrandAnalysisService.preparePrePopulatedData(extractedData);
  }

  /**
   * Set up Stripe test account with products
   */
  private async setupStripeAccount(config: {
    accountName: string;
    email: string;
    country: string;
    products: Array<{
      name: string;
      description: string;
      price?: number;
      interval?: string;
    }>;
  }) {
    const stripeAccount = await this.stripeService.createTestAccount({
      accountName: config.accountName,
      email: config.email,
      country: config.country,
      products: config.products.map(p => ({
        name: p.name,
        description: p.description,
        price: p.price,
        interval: p.interval as 'month' | 'year' | undefined,
        features: [],
      })),
    });

    const validation = await this.stripeService.validateConnection(
      stripeAccount.accountId
    );

    if (!validation.isValid) {
      console.warn('Stripe account requires additional setup:', validation.details);
    }

    return stripeAccount;
  }

  /**
   * Generate white-label pages
   */
  private async generateWhiteLabelPages(config: WhiteLabelPageConfig) {
    const pages = await WhiteLabelPageGenerator.generatePages(config);
    const validation = await WhiteLabelPageGenerator.validatePages(pages);
    
    if (!validation.isValid) {
      throw new Error(
        `Failed to generate pages: ${validation.errors
          .map(e => `${e.page}: ${e.error}`)
          .join(', ')}`
      );
    }
    
    return pages;
  }
}