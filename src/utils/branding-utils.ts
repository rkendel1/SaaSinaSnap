/**
 * Utilities for applying creator branding to white-labeled pages
 */

import { type GradientConfig, gradientToCss, type PatternConfig,patternToCss } from './gradient-utils';

export interface CreatorBranding {
  brandColor: string;
  brandGradient?: GradientConfig;
  brandPattern?: PatternConfig;
}

/**
 * Generate CSS styles for branded elements
 */
export function getBrandingStyles(branding: CreatorBranding) {
  const { brandColor, brandGradient, brandPattern } = branding;
  
  const gradientCss = brandGradient ? gradientToCss(brandGradient) : `linear-gradient(45deg, ${brandColor}, ${brandColor}80)`;
  const patternCss = brandPattern ? patternToCss(brandPattern, brandColor) : '';

  return {
    // Primary brand color
    brandColor,
    
    // Gradient background for hero sections, headers, etc.
    gradientBackground: {
      background: gradientCss,
      backgroundImage: patternCss || undefined,
      backgroundSize: brandPattern?.type === 'dots' ? '20px 20px' : undefined,
    },
    
    // Subtle gradient background for sections
    subtleGradientBackground: {
      background: `linear-gradient(135deg, ${brandColor}05, ${brandColor}15)`,
      backgroundImage: brandPattern ? patternToCss({ ...brandPattern, intensity: (brandPattern.intensity || 0.1) * 0.3 }, brandColor) : undefined,
      backgroundSize: brandPattern?.type === 'dots' ? '20px 20px' : undefined,
    },
    
    // Gradient text for headings
    gradientText: {
      background: gradientCss,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    },
    
    // Button styles
    primaryButton: {
      background: gradientCss,
      border: 'none',
      color: 'white',
    },
    
    // Accent elements
    accent: {
      backgroundColor: brandColor,
    },
    
    // Border styles
    brandBorder: {
      borderColor: brandColor,
    },
    
    // CSS custom properties for dynamic use
    cssVariables: {
      '--brand-color': brandColor,
      '--brand-gradient': gradientCss,
      '--brand-pattern': patternCss,
    } as React.CSSProperties,
  };
}

/**
 * Generate CSS classes for Tailwind-style branded elements
 */
export function getBrandingClasses(branding: CreatorBranding): Record<string, string> {
  const { brandColor } = branding;
  
  // Convert hex to RGB for opacity variations
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const rgb = hexToRgb(brandColor);
  
  return {
    // Background colors with opacity
    'bg-brand': `rgb(${rgb?.r || 0} ${rgb?.g || 0} ${rgb?.b || 0})`,
    'bg-brand-50': `rgb(${rgb?.r || 0} ${rgb?.g || 0} ${rgb?.b || 0} / 0.05)`,
    'bg-brand-100': `rgb(${rgb?.r || 0} ${rgb?.g || 0} ${rgb?.b || 0} / 0.1)`,
    'bg-brand-500': `rgb(${rgb?.r || 0} ${rgb?.g || 0} ${rgb?.b || 0} / 0.5)`,
    
    // Text colors
    'text-brand': brandColor,
    'text-brand-600': `rgb(${Math.max(0, (rgb?.r || 0) - 40)} ${Math.max(0, (rgb?.g || 0) - 40)} ${Math.max(0, (rgb?.b || 0) - 40)})`,
    
    // Border colors
    'border-brand': brandColor,
  };
}

/**
 * Create inline styles object for React components
 */
export function createBrandedInlineStyles(branding: CreatorBranding) {
  return getBrandingStyles(branding);
}

/**
 * Generate CSS custom properties for use in CSS files
 */
export function generateBrandingCSSCustomProperties(branding: CreatorBranding): string {
  const styles = getBrandingStyles(branding);
  
  return `
    :root {
      --brand-color: ${branding.brandColor};
      --brand-gradient: ${branding.brandGradient ? gradientToCss(branding.brandGradient) : `linear-gradient(45deg, ${branding.brandColor}, ${branding.brandColor}80)`};
      --brand-pattern: ${branding.brandPattern ? patternToCss(branding.brandPattern, branding.brandColor) : ''};
    }
  `;
}