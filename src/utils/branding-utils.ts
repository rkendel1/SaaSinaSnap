/**
 * Utilities for applying creator branding to white-labeled pages
 */

import { type GradientConfig, gradientToCss, type PatternConfig,patternToCss } from './gradient-utils';

export interface CreatorBranding {
  brandColor: string;
  brandGradient?: GradientConfig | null; // Allow null
  brandPattern?: PatternConfig | null;   // Allow null
}

/**
 * Generate CSS styles for branded elements
 */
export function getBrandingStyles(branding: CreatorBranding) {
  const { brandColor, brandGradient, brandPattern } = branding;
  
  // --- Main Gradient Background ---
  const mainGradientImage = brandGradient ? gradientToCss(brandGradient) : `linear-gradient(45deg, ${brandColor}, ${brandColor}80)`;
  const mainPatternImage = brandPattern ? patternToCss(brandPattern, brandColor) : '';

  let finalMainBackgroundImage = mainGradientImage;
  if (mainPatternImage) {
    finalMainBackgroundImage = `${mainPatternImage}, ${mainGradientImage}`;
  }

  // --- Subtle Gradient Background ---
  const subtleGradientBase = `linear-gradient(135deg, ${brandColor}05, ${brandColor}15)`;
  const subtlePatternImage = brandPattern 
    ? patternToCss({ ...brandPattern, intensity: (brandPattern.intensity || 0.1) * 0.3 }, brandColor) 
    : '';

  let finalSubtleBackgroundImage = subtleGradientBase;
  if (subtlePatternImage) {
    finalSubtleBackgroundImage = `${subtlePatternImage}, ${subtleGradientBase}`;
  }

  return {
    // Primary brand color
    brandColor,
    
    // Gradient background for hero sections, headers, etc.
    gradientBackground: {
      backgroundImage: finalMainBackgroundImage,
      backgroundSize: brandPattern?.type === 'dots' ? '20px 20px' : undefined,
      backgroundColor: brandColor, // Explicit base color
    },
    
    // Subtle gradient background for sections
    subtleGradientBackground: {
      backgroundImage: finalSubtleBackgroundImage,
      backgroundSize: brandPattern?.type === 'dots' ? '20px 20px' : undefined,
      backgroundColor: brandColor, // Explicit base color
    },
    
    // Gradient text for headings
    gradientText: {
      background: finalMainBackgroundImage, // This is fine as it's only setting background-image for text-fill
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    },
    
    // Button styles
    primaryButton: {
      background: finalMainBackgroundImage, // This is fine as it's only setting background-image
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
      '--brand-gradient': finalMainBackgroundImage,
      '--brand-pattern': mainPatternImage,
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
      --brand-gradient: ${styles.gradientBackground.backgroundImage};
      --brand-pattern: ${styles.subtleGradientBackground.backgroundImage}; /* This might need adjustment if pattern is separate */
    }
  `;
}