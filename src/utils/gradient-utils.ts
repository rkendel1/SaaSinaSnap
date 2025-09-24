/**
 * Utilities for generating gradients and patterns for creator branding
 */

export interface GradientConfig {
  type: 'linear' | 'radial';
  colors: string[];
  direction?: number; // angle in degrees for linear gradients
}

export interface PatternConfig {
  type: 'stripes' | 'dots' | 'none';
  intensity?: number; // 0-1, opacity of the pattern
  angle?: number; // angle in degrees for stripes
}

/**
 * Convert hex color to HSL
 */
export function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate complementary colors for gradients
 */
export function generateComplementaryColors(baseColor: string, count: number = 2): string[] {
  const [h, s, l] = hexToHsl(baseColor);
  const colors = [baseColor];

  for (let i = 1; i < count; i++) {
    const hueShift = (360 / count) * i;
    const newHue = (h + hueShift) % 360;
    const lightnessFactor = 0.8 + (0.4 * Math.sin((i * Math.PI) / count));
    const newLightness = Math.max(10, Math.min(90, l * lightnessFactor));
    
    colors.push(hslToHex(newHue, s, newLightness));
  }

  return colors;
}

/**
 * Generate a gradient based on primary color
 */
export function generateAutoGradient(primaryColor: string, type: 'linear' | 'radial' = 'linear'): GradientConfig {
  const colors = generateComplementaryColors(primaryColor, 2);
  
  return {
    type,
    colors,
    direction: type === 'linear' ? 45 : undefined,
  };
}

/**
 * Convert gradient config to CSS gradient string
 */
export function gradientToCss(gradient: GradientConfig): string {
  if (gradient.type === 'linear') {
    const direction = gradient.direction || 45;
    return `linear-gradient(${direction}deg, ${gradient.colors.join(', ')})`;
  } else {
    return `radial-gradient(circle, ${gradient.colors.join(', ')})`;
  }
}

/**
 * Generate CSS for background patterns
 */
export function patternToCss(pattern: PatternConfig, baseColor: string): string {
  if (pattern.type === 'none') {
    return '';
  }

  const intensity = pattern.intensity || 0.1;
  const angle = pattern.angle || 0;
  
  // Create a semi-transparent version of the base color
  const [r, g, b] = hexToHsl(baseColor);
  const patternColor = `hsla(${r}, ${g}%, ${b}%, ${intensity})`;

  if (pattern.type === 'stripes') {
    return `repeating-linear-gradient(${angle}deg, transparent, transparent 10px, ${patternColor} 10px, ${patternColor} 20px)`;
  } else if (pattern.type === 'dots') {
    return `radial-gradient(circle at 25% 25%, ${patternColor} 2px, transparent 2px), radial-gradient(circle at 75% 75%, ${patternColor} 2px, transparent 2px)`;
  }

  return '';
}

/**
 * Preset gradient configurations
 */
export const GRADIENT_PRESETS: Record<string, Omit<GradientConfig, 'colors'>> = {
  sunrise: { type: 'linear', direction: 45 },
  sunset: { type: 'linear', direction: 225 },
  ocean: { type: 'linear', direction: 180 },
  forest: { type: 'linear', direction: 90 },
  radial: { type: 'radial' },
};

/**
 * Preset pattern configurations
 */
export const PATTERN_PRESETS: PatternConfig[] = [
  { type: 'none', intensity: 0 },
  { type: 'stripes', intensity: 0.05, angle: 45 },
  { type: 'stripes', intensity: 0.1, angle: 0 },
  { type: 'stripes', intensity: 0.1, angle: 90 },
  { type: 'dots', intensity: 0.05 },
  { type: 'dots', intensity: 0.1 },
];