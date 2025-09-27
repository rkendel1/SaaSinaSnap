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
 * Template-specific branding utilities
 */
export type TemplateTheme = 'classic' | 'modern' | 'minimal' | 'corporate';

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

  // Determine backgroundSize for main gradient
  const mainBackgroundSize = brandPattern?.type === 'dots' ? '20px 20px' : 'auto'; // Explicitly 'auto' instead of undefined

  // --- Subtle Gradient Background ---
  const subtleGradientBase = `linear-gradient(135deg, ${brandColor}05, ${brandColor}15)`;
  const subtlePatternImage = brandPattern 
    ? patternToCss({ ...brandPattern, intensity: (brandPattern.intensity || 0.1) * 0.3 }, brandColor) 
    : '';

  let finalSubtleBackgroundImage = subtleGradientBase;
  if (subtlePatternImage) {
    finalSubtleBackgroundImage = `${subtlePatternImage}, ${subtleGradientBase}`;
  }

  // Determine backgroundSize for subtle gradient
  const subtleBackgroundSize = brandPattern?.type === 'dots' ? '20px 20px' : 'auto'; // Explicitly 'auto' instead of undefined

  return {
    // Primary brand color
    brandColor,
    
    // Gradient background for hero sections, headers, etc.
    gradientBackground: {
      backgroundImage: finalMainBackgroundImage,
      backgroundSize: mainBackgroundSize, // Use explicit value
      backgroundColor: brandColor, // Explicit base color
    },
    
    // Subtle gradient background for sections
    subtleGradientBackground: {
      backgroundImage: finalSubtleBackgroundImage,
      backgroundSize: subtleBackgroundSize, // Use explicit value
      backgroundColor: brandColor, // Explicit base color
    },
    
    // Gradient text for headings
    gradientText: {
      backgroundImage: finalMainBackgroundImage, // Use backgroundImage instead of background
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    },
    
    // Button styles
    primaryButton: {
      backgroundImage: finalMainBackgroundImage, // Use backgroundImage instead of background
      border: 'none',
      color: 'white',
    },
    
    // Outline button styles
    outlineButton: {
      backgroundColor: 'transparent',
      border: `2px solid ${brandColor}`,
      color: brandColor,
    },
    
    // Soft gradient background for cards/sections
    softGradientBackground: {
      backgroundImage: finalSubtleBackgroundImage,
      backgroundSize: subtleBackgroundSize,
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

/**
 * Template-specific branding utilities
 */
export function getTemplateSpecificStyles(branding: CreatorBranding, theme: TemplateTheme) {
  const baseStyles = getBrandingStyles(branding);
  
  switch (theme) {
    case 'modern':
      return {
        ...baseStyles,
        // Modern templates use more bold gradients and animations
        heroGradient: {
          ...baseStyles.gradientBackground,
          backgroundImage: `linear-gradient(135deg, ${branding.brandColor}, ${branding.brandColor}CC, ${branding.brandColor}80)`,
        },
        cardStyle: {
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
        },
        animationStyle: {
          transition: 'all 0.3s ease',
          transform: 'translateY(0)',
        },
        hoverStyle: {
          transform: 'translateY(-5px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        }
      };
      
    case 'minimal':
      return {
        ...baseStyles,
        // Minimal templates use subtle colors and clean lines
        subtleAccent: {
          backgroundColor: `${branding.brandColor}10`,
          borderLeft: `3px solid ${branding.brandColor}`,
        },
        cleanButton: {
          backgroundColor: 'transparent',
          border: `2px solid ${branding.brandColor}`,
          color: branding.brandColor,
          borderRadius: '4px',
        },
        minimalistCard: {
          backgroundColor: 'white',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
          padding: '2rem',
        }
      };
      
    case 'corporate':
      return {
        ...baseStyles,
        // Corporate templates use professional styling
        professionalHeader: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        corporateButton: {
          backgroundColor: branding.brandColor,
          color: 'white',
          borderRadius: '6px',
          fontWeight: '600',
          padding: '0.75rem 2rem',
        },
        enterpriseCard: {
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }
      };
      
    case 'classic':
    default:
      return {
        ...baseStyles,
        // Classic templates use traditional styling
        classicHeader: {
          backgroundColor: branding.brandColor,
          color: 'white',
        },
        traditionalButton: {
          backgroundColor: branding.brandColor,
          color: 'white',
          borderRadius: '4px',
          border: 'none',
          padding: '0.75rem 1.5rem',
        },
        businessCard: {
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '6px',
          padding: '1.5rem',
        }
      };
  }
}

/**
 * Get template-specific soft gradient background styles
 */
export function getTemplateSoftGradientBackground(branding: CreatorBranding, theme: TemplateTheme) {
  const baseStyles = getBrandingStyles(branding);
  
  switch (theme) {
    case 'modern':
      return {
        backgroundImage: `linear-gradient(135deg, ${branding.brandColor}08, ${branding.brandColor}18, ${branding.brandColor}08)`,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      };
    case 'minimal':
      return {
        backgroundColor: `${branding.brandColor}03`,
      };
    case 'corporate':
      return {
        backgroundColor: '#f9fafb',
        backgroundImage: `linear-gradient(135deg, ${branding.brandColor}05, transparent)`,
      };
    case 'classic':
    default:
      return baseStyles.subtleGradientBackground;
  }
}