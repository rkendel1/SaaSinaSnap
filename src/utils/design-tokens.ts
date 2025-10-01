/**
 * Design Token utilities for dual-mode embed experience
 * Generates CSS custom properties from creator profile for preview mode
 */

import { CreatorProfile } from '@/features/creator/types';
import { ExtractedBrandingData } from '@/features/creator-onboarding/types';

export interface DesignTokens {
  '--brand-color': string;
  '--font-family': string;
  '--font-family-heading'?: string;
  '--border-radius'?: string;
  '--spacing'?: string;
  '--shadow'?: string;
  '--text-color'?: string;
  '--background-color'?: string;
  '--secondary-color'?: string;
}

/**
 * Extract design tokens from creator profile for preview mode
 * These tokens simulate how the embed will look on the creator's site
 */
export function extractDesignTokens(profile: CreatorProfile): DesignTokens {
  const extractedData = profile.extracted_branding_data as ExtractedBrandingData | null;
  
  const tokens: DesignTokens = {
    '--brand-color': profile.brand_color || '#ea580c',
    '--font-family': 'inherit', // Default to inherit
  };

  // Extract from branding data if available
  if (extractedData) {
    // Primary font
    if (extractedData.fonts?.primary) {
      tokens['--font-family'] = extractedData.fonts.primary;
    }
    
    // Heading font
    if (extractedData.fonts?.headings) {
      tokens['--font-family-heading'] = extractedData.fonts.headings;
    }

    // Design tokens
    if (extractedData.designTokens) {
      if (extractedData.designTokens.borderRadius) {
        tokens['--border-radius'] = extractedData.designTokens.borderRadius;
      }
      if (extractedData.designTokens.spacing) {
        tokens['--spacing'] = extractedData.designTokens.spacing;
      }
      if (extractedData.designTokens.shadows && extractedData.designTokens.shadows.length > 0) {
        tokens['--shadow'] = extractedData.designTokens.shadows[0];
      }
    }

    // Colors
    if (extractedData.primaryColors && extractedData.primaryColors.length > 0) {
      tokens['--brand-color'] = extractedData.primaryColors[0];
      tokens['--text-color'] = extractedData.primaryColors[0];
    }
    
    if (extractedData.secondaryColors && extractedData.secondaryColors.length > 0) {
      tokens['--secondary-color'] = extractedData.secondaryColors[0];
    }
  }

  return tokens;
}

/**
 * Convert design tokens to CSS custom properties string
 */
export function tokensToCSS(tokens: DesignTokens): string {
  return Object.entries(tokens)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');
}

/**
 * Create inline style object from design tokens for React components
 */
export function tokensToInlineStyle(tokens: DesignTokens): React.CSSProperties {
  return tokens as React.CSSProperties;
}

/**
 * Generate preview wrapper with design tokens applied
 * This simulates how the embed will look on the creator's site
 */
export function generatePreviewWrapper(embedHTML: string, tokens: DesignTokens): string {
  const tokenCSS = tokensToCSS(tokens);
  
  return `
    <div class="saasinasnap-preview-wrapper" style="${tokenCSS}">
      ${embedHTML}
    </div>
  `;
}
