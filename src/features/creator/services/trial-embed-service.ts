import { EmbedAsset, EmbedAssetConfig } from '../types/embed-assets';
import { getCreatorTrialConfig, TrialConfiguration } from '../controllers/trial-management';

export interface TrialEmbedData {
  isExpired: boolean;
  daysRemaining: number;
  trialStartDate: Date;
  trialEndDate: Date;
  expiredConfig?: {
    title: string;
    description: string;
    buttonText: string;
    subscriptionUrl: string;
  };
}

export class TrialEmbedService {
  /**
   * Check if a trial embed has expired
   */
  static isTrialExpired(embedConfig: EmbedAssetConfig): boolean {
    if (!embedConfig.trialEndDate) {
      return false;
    }
    
    const endDate = new Date(embedConfig.trialEndDate);
    const now = new Date();
    return now > endDate;
  }

  /**
   * Calculate days remaining in trial
   */
  static getDaysRemaining(embedConfig: EmbedAssetConfig): number {
    if (!embedConfig.trialEndDate) {
      return 0;
    }
    
    const endDate = new Date(embedConfig.trialEndDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Initialize a trial embed with start and end dates
   */
  static initializeTrial(
    embedConfig: EmbedAssetConfig,
    trialConfig: TrialConfiguration
  ): EmbedAssetConfig {
    const now = new Date();
    const endDate = new Date(now.getTime() + trialConfig.duration_days * 24 * 60 * 60 * 1000);
    
    return {
      ...embedConfig,
      trialDurationDays: trialConfig.duration_days,
      trialStartDate: now.toISOString(),
      trialEndDate: endDate.toISOString(),
    };
  }

  /**
   * Get trial embed data including expiration status
   */
  static getTrialEmbedData(embedConfig: EmbedAssetConfig): TrialEmbedData {
    const isExpired = this.isTrialExpired(embedConfig);
    const daysRemaining = this.getDaysRemaining(embedConfig);
    
    return {
      isExpired,
      daysRemaining,
      trialStartDate: new Date(embedConfig.trialStartDate || Date.now()),
      trialEndDate: new Date(embedConfig.trialEndDate || Date.now()),
      expiredConfig: embedConfig.expiredCallToAction,
    };
  }

  /**
   * Create default expired call-to-action configuration
   */
  static createDefaultExpiredConfig(
    creatorId: string, 
    productId?: string
  ): EmbedAssetConfig['expiredCallToAction'] {
    const subscriptionUrl = productId 
      ? `/c/${creatorId}/pricing?product=${productId}`
      : `/c/${creatorId}/pricing`;
      
    return {
      title: 'Trial Expired - Subscribe Now!',
      description: 'Your free trial has ended. Subscribe now to continue enjoying all the features.',
      buttonText: 'Subscribe Now',
      subscriptionUrl,
    };
  }

  /**
   * Generate embed code for trial embeds with expiration handling
   */
  static generateTrialEmbedCode(
    creatorId: string,
    embedId: string,
    embedConfig: EmbedAssetConfig
  ): string {
    return `<script
  data-creator-id="${creatorId}"
  data-embed-type="trial_embed"
  data-embed-id="${embedId}"
  data-trial-duration="${embedConfig.trialDurationDays || 7}"
  data-trial-end="${embedConfig.trialEndDate || ''}"
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/static/embed.js">
</script>`;
  }
}