/**
 * Utilities for generating complete color palettes for branding
 */

import { ExtractedBrandingData } from '@/features/creator-onboarding/types'; // Import ExtractedBrandingData

import { generateAutoGradient, generateComplementaryColors, type GradientConfig, hexToHsl, hslToHex,type PatternConfig } from './gradient-utils';

export interface ColorPalette {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: GradientConfig;
  pattern: PatternConfig;
}

/**
 * Generate a complete color palette from a primary color
 */
export function generatePaletteFromColor(primaryColor: string, paletteName: string): ColorPalette {
  const [h, s, l] = hexToHsl(primaryColor);
  
  // Generate complementary colors
  const secondaryHue = (h + 120) % 360;
  const accentHue = (h + 240) % 360;
  
  const secondary = hslToHex(secondaryHue, Math.max(20, s * 0.8), Math.min(80, l * 1.1));
  const accent = hslToHex(accentHue, Math.max(30, s * 0.9), Math.max(30, Math.min(70, l * 0.8)));
  
  // Generate gradient and pattern
  const gradient = generateAutoGradient(primaryColor, 'linear');
  const pattern: PatternConfig = { type: 'none', intensity: 0.1, angle: 0 };
  
  return {
    name: paletteName,
    description: `Professional palette based on ${primaryColor}`,
    primary: primaryColor,
    secondary,
    accent,
    gradient,
    pattern,
  };
}

/**
 * Predefined color palettes for common themes
 */
export const COLOR_PALETTE_PRESETS: ColorPalette[] = [
  {
    name: 'Sunset Orange',
    description: 'Warm and energetic palette for creative and lifestyle brands',
    primary: '#ea580c',
    secondary: '#f59e0b',
    accent: '#eab308',
    gradient: {
      type: 'linear',
      colors: ['#ea580c', '#f59e0b'],
      direction: 45,
    },
    pattern: { type: 'none', intensity: 0.1, angle: 0 },
  },
  {
    name: 'Ocean Blue',
    description: 'Professional blue palette perfect for tech and business',
    primary: '#2563eb',
    secondary: '#0ea5e9',
    accent: '#06b6d4',
    gradient: {
      type: 'linear',
      colors: ['#2563eb', '#0ea5e9'],
      direction: 45,
    },
    pattern: { type: 'none', intensity: 0.1, angle: 0 },
  },
  {
    name: 'Forest Green',
    description: 'Natural green palette ideal for sustainability and health',
    primary: '#16a34a',
    secondary: '#059669',
    accent: '#0d9488',
    gradient: {
      type: 'linear',
      colors: ['#16a34a', '#059669'],
      direction: 135,
    },
    pattern: { type: 'none', intensity: 0.1, angle: 0 },
  },
  {
    name: 'Royal Purple',
    description: 'Sophisticated purple palette for luxury and premium brands',
    primary: '#7c3aed',
    secondary: '#a855f7',
    accent: '#c084fc',
    gradient: {
      type: 'linear',
      colors: ['#7c3aed', '#a855f7'],
      direction: 90,
    },
    pattern: { type: 'none', intensity: 0.1, angle: 0 },
  },
  {
    name: 'Rose Gold',
    description: 'Elegant pink palette perfect for beauty and fashion',
    primary: '#e11d48',
    secondary: '#f43f5e',
    accent: '#fb7185',
    gradient: {
      type: 'linear',
      colors: ['#e11d48', '#f43f5e'],
      direction: 45,
    },
    pattern: { type: 'none', intensity: 0.1, angle: 0 },
  },
  {
    name: 'Midnight Dark',
    description: 'Modern dark palette for tech and gaming brands',
    primary: '#1e293b',
    secondary: '#334155',
    accent: '#64748b',
    gradient: {
      type: 'linear',
      colors: ['#1e293b', '#334155'],
      direction: 135,
    },
    pattern: { type: 'stripes', intensity: 0.05, angle: 45 },
  },
];

/**
 * Generate suggested palettes from extracted website colors
 */
export function generateSuggestedPalettes(extractedColors: string[]): ColorPalette[] {
  const palettes: ColorPalette[] = [];
  
  // Create palettes from extracted colors
  extractedColors.slice(0, 3).forEach((color, index) => {
    const palette = generatePaletteFromColor(color, `Website Color ${index + 1}`);
    palettes.push(palette);
  });
  
  // Add some preset palettes that might work well
  palettes.push(...COLOR_PALETTE_PRESETS.slice(0, 3));
  
  return palettes;
}

/**
 * Create a color palette from branding data
 */
export function createPaletteFromBranding(
  brandColor: string,
  gradient?: GradientConfig | null,
  pattern?: PatternConfig | null
): ColorPalette {
  const [h, s, l] = hexToHsl(brandColor);
  
  // Generate secondary and accent colors
  const secondary = hslToHex((h + 30) % 360, s, Math.min(80, l * 1.2));
  const accent = hslToHex((h + 60) % 360, Math.max(40, s * 0.9), Math.max(40, l * 0.9));
  
  return {
    name: 'Current Brand',
    description: 'Your current brand configuration',
    primary: brandColor,
    secondary,
    accent,
    gradient: gradient || generateAutoGradient(brandColor),
    pattern: pattern || { type: 'none', intensity: 0.1, angle: 0 },
  };
}

/**
 * Get the best ColorPalette from extracted branding data if confidence is high enough.
 */
export function getBestPaletteFromExtractedData(
  extractedData: ExtractedBrandingData,
  minConfidence: number = 0.6
): ColorPalette | null {
  if (extractedData.metadata.confidence < minConfidence) {
    return null;
  }

  const primaryColor = extractedData.primaryColors[0];
  if (!primaryColor) {
    return null;
  }

  // Try to use an extracted gradient if available, otherwise generate one
  let gradient: GradientConfig | undefined;
  if (extractedData.styleElements.gradients && extractedData.styleElements.gradients.length > 0) {
    // Take the first extracted gradient
    gradient = {
      type: extractedData.styleElements.gradients[0].type as 'linear' | 'radial',
      colors: extractedData.styleElements.gradients[0].colors,
      direction: extractedData.styleElements.gradients[0].direction,
    };
  } else {
    gradient = generateAutoGradient(primaryColor);
  }

  // Use a simple pattern if detected, otherwise none
  let pattern: PatternConfig = { type: 'none', intensity: 0.1, angle: 0 };
  if (extractedData.styleElements.patterns && extractedData.styleElements.patterns.length > 0) {
    // This is a simplified example, you might want more sophisticated logic
    // to pick the 'best' pattern or convert generic pattern types to PatternConfig
    pattern = { type: 'stripes', intensity: 0.05, angle: 45 }; // Default to a subtle stripe if any pattern is detected
  }

  return generatePaletteFromColor(primaryColor, 'Website Extracted');
}