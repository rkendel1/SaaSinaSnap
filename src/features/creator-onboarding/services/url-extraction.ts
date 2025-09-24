import type { ExtractedBrandingData } from '../types';

/**
 * URL Extraction Service
 * Extracts design tokens, colors, fonts, and branding information from a given URL
 */

interface ParsedCSS {
  colors: Set<string>;
  fonts: Set<string>;
  gradients: Array<{ type: 'linear' | 'radial'; colors: string[]; direction?: number }>;
  borderRadius: Set<string>;
  shadows: Set<string>;
}

export class URLExtractionService {
  private static readonly COLOR_REGEX = /(?:^|\s)(#(?:[0-9a-f]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\))(?:\s|$)/gi;
  private static readonly FONT_REGEX = /font-family\s*:\s*([^;]+)/gi;
  private static readonly GRADIENT_REGEX = /(linear-gradient|radial-gradient)\s*\([^)]+\)/gi;
  private static readonly SHADOW_REGEX = /box-shadow\s*:\s*([^;]+)/gi;
  private static readonly BORDER_RADIUS_REGEX = /border-radius\s*:\s*([^;]+)/gi;

  /**
   * Extract branding data from a URL
   */
  static async extractFromURL(url: string): Promise<ExtractedBrandingData> {
    try {
      // Validate URL
      const validatedUrl = this.validateAndNormalizeURL(url);
      
      // Fetch the webpage
      const response = await fetch(validatedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PayLift-BrandExtractor/1.0)',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse the HTML and extract branding information
      const brandingData = await this.parseHTMLForBranding(html, validatedUrl);
      
      return brandingData;
    } catch (error) {
      console.error('URL extraction failed:', error);
      throw new Error(`Failed to extract branding data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and normalize URL
   */
  private static validateAndNormalizeURL(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      
      const urlObj = new URL(url);
      
      // Basic validation
      if (!urlObj.hostname || urlObj.hostname === 'localhost') {
        throw new Error('Invalid or local URL not allowed');
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse HTML content for branding information
   */
  private static async parseHTMLForBranding(html: string, sourceUrl: string): Promise<ExtractedBrandingData> {
    // Extract inline CSS and style tags
    const styleContent = this.extractStyleContent(html);
    
    // Parse CSS for design tokens
    const parsedCSS = this.parseCSS(styleContent);
    
    // Extract meta colors (theme-color, etc.)
    const metaColors = this.extractMetaColors(html);
    
    // Combine and process the extracted data
    const colorArray = Array.from(parsedCSS.colors);
    const allColors = [...new Set([...colorArray, ...metaColors])];
    const primaryColors = this.extractPrimaryColors(allColors);
    const secondaryColors = this.extractSecondaryColors(allColors, primaryColors);
    
    const allFonts = Array.from(parsedCSS.fonts);
    const fonts = this.processFonts(allFonts);
    
    const extractedBrandingData: ExtractedBrandingData = {
      primaryColors,
      secondaryColors,
      fonts,
      designTokens: {
        borderRadius: Array.from(parsedCSS.borderRadius).join(', ') || undefined,
        shadows: Array.from(parsedCSS.shadows) || undefined,
        spacing: undefined, // Could be enhanced to extract common spacing values
      },
      styleElements: {
        gradients: parsedCSS.gradients,
        patterns: [], // Could be enhanced to detect pattern usage
      },
      metadata: {
        extractedAt: new Date().toISOString(),
        sourceUrl,
        confidence: this.calculateConfidenceScore(parsedCSS, allColors, allFonts),
        elementsFound: this.getAnalyzedElements(html),
      },
    };

    return extractedBrandingData;
  }

  /**
   * Extract CSS content from HTML
   */
  private static extractStyleContent(html: string): string {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styles: string[] = [];
    let match;

    while ((match = styleRegex.exec(html)) !== null) {
      styles.push(match[1]);
    }

    // Also extract inline styles
    const inlineStyleRegex = /style\s*=\s*["']([^"']*?)["']/gi;
    while ((match = inlineStyleRegex.exec(html)) !== null) {
      styles.push(match[1]);
    }

    return styles.join('\n');
  }

  /**
   * Parse CSS content for design tokens
   */
  private static parseCSS(css: string): ParsedCSS {
    const colors = new Set<string>();
    const fonts = new Set<string>();
    const gradients: Array<{ type: 'linear' | 'radial'; colors: string[]; direction?: number }> = [];
    const borderRadius = new Set<string>();
    const shadows = new Set<string>();

    // Extract colors
    let match;
    while ((match = this.COLOR_REGEX.exec(css)) !== null) {
      colors.add(match[1].trim());
    }

    // Extract fonts
    while ((match = this.FONT_REGEX.exec(css)) !== null) {
      const fontFamily = match[1].trim().replace(/['"]/g, '');
      fonts.add(fontFamily);
    }

    // Extract gradients
    while ((match = this.GRADIENT_REGEX.exec(css)) !== null) {
      const gradientText = match[0];
      const isLinear = gradientText.startsWith('linear-gradient');
      const gradientColors = this.extractColorsFromGradient(gradientText);
      
      if (gradientColors.length > 0) {
        gradients.push({
          type: isLinear ? 'linear' : 'radial',
          colors: gradientColors,
          direction: isLinear ? this.extractGradientDirection(gradientText) : undefined,
        });
      }
    }

    // Extract shadows
    while ((match = this.SHADOW_REGEX.exec(css)) !== null) {
      shadows.add(match[1].trim());
    }

    // Extract border radius
    while ((match = this.BORDER_RADIUS_REGEX.exec(css)) !== null) {
      borderRadius.add(match[1].trim());
    }

    return { colors, fonts, gradients, borderRadius, shadows };
  }

  /**
   * Extract meta theme colors
   */
  private static extractMetaColors(html: string): string[] {
    const colors: string[] = [];
    const metaRegex = /<meta[^>]+name\s*=\s*["']theme-color["'][^>]+content\s*=\s*["']([^"']+)["'][^>]*>/gi;
    
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      colors.push(match[1].trim());
    }

    return colors;
  }

  /**
   * Extract primary colors (most frequently used)
   */
  private static extractPrimaryColors(colors: string[], maxCount: number = 3): string[] {
    // Simple implementation - in a real scenario, you'd want to analyze frequency and importance
    const filteredColors = colors.filter(color => 
      !color.match(/rgba?\(\s*0\s*,\s*0\s*,\s*0/) && // Skip black variations
      !color.match(/rgba?\(\s*255\s*,\s*255\s*,\s*255/) && // Skip white variations
      !color.match(/#f{3,6}$/i) && // Skip pure white hex
      !color.match(/#0{3,6}$/i) // Skip pure black hex
    );
    
    return filteredColors.slice(0, maxCount);
  }

  /**
   * Extract secondary colors
   */
  private static extractSecondaryColors(allColors: string[], primaryColors: string[], maxCount: number = 5): string[] {
    const secondaryColors = allColors.filter(color => !primaryColors.includes(color));
    return secondaryColors.slice(0, maxCount);
  }

  /**
   * Process and clean font families
   */
  private static processFonts(fonts: string[]): { primary?: string; secondary?: string; headings?: string } {
    if (fonts.length === 0) return {};
    
    // Simple logic to assign fonts - could be enhanced
    const cleanedFonts = fonts.map(font => font.split(',')[0].trim());
    
    return {
      primary: cleanedFonts[0] || undefined,
      secondary: cleanedFonts[1] || undefined,
      headings: cleanedFonts[0] || undefined, // Often same as primary
    };
  }

  /**
   * Extract colors from gradient string
   */
  private static extractColorsFromGradient(gradient: string): string[] {
    const colors: string[] = [];
    let match;
    
    // Reset regex state
    this.COLOR_REGEX.lastIndex = 0;
    
    while ((match = this.COLOR_REGEX.exec(gradient)) !== null) {
      colors.push(match[1].trim());
    }
    
    return colors;
  }

  /**
   * Extract gradient direction
   */
  private static extractGradientDirection(gradient: string): number | undefined {
    const degMatch = gradient.match(/(\d+)deg/);
    return degMatch ? parseInt(degMatch[1]) : undefined;
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private static calculateConfidenceScore(parsedCSS: ParsedCSS, colors: string[], fonts: string[]): number {
    let score = 0;
    
    // More colors found = higher confidence
    if (colors.length > 0) score += 0.3;
    if (colors.length > 3) score += 0.2;
    
    // Fonts found = higher confidence
    if (fonts.length > 0) score += 0.2;
    
    // Design tokens found = higher confidence
    if (parsedCSS.gradients.length > 0) score += 0.1;
    if (parsedCSS.shadows.size > 0) score += 0.1;
    if (parsedCSS.borderRadius.size > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Get list of analyzed HTML elements
   */
  private static getAnalyzedElements(html: string): string[] {
    const elements = [];
    
    if (html.includes('<style')) elements.push('style-tags');
    if (html.includes('style=')) elements.push('inline-styles');
    if (html.includes('theme-color')) elements.push('meta-theme-color');
    
    return elements;
  }
}