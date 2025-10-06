import type { ExtractedBrandingData } from '../types';

/**
 * Advanced URL Extraction Service
 * Enhanced version with better design token extraction, voice/tone analysis,
 * and support for multiple types of content analysis
 */

interface AdvancedParsedCSS {
  colors: Set<string>;
  fonts: Set<string>;
  gradients: Array<{ type: 'linear' | 'radial'; colors: string[]; direction?: number }>;
  borderRadius: Set<string>;
  shadows: Set<string>;
  spacing: Set<string>;
  typography: {
    sizes: Set<string>;
    weights: Set<string>;
    lineHeights: Set<string>;
    letterSpacing: Set<string>;
  };
  animations: Set<string>;
  zIndexes: Set<string>;
}

interface VoiceAndTone {
  tone: 'professional' | 'casual' | 'playful' | 'serious' | 'friendly' | 'authoritative';
  voice: 'formal' | 'informal' | 'conversational' | 'technical' | 'creative';
  confidence: number; // 0-1 scale
  keyPhrases: string[];
  writingStyle: {
    sentenceLength: 'short' | 'medium' | 'long';
    complexity: 'simple' | 'moderate' | 'complex';
    emotionalTone: string[];
  };
}

interface AdvancedExtractedData extends ExtractedBrandingData {
  voiceAndTone?: VoiceAndTone;
  layoutPatterns: {
    gridSystems: string[];
    spacingPatterns: string[];
    componentPatterns: string[];
  };
  interactionPatterns: {
    hoverEffects: string[];
    transitions: string[];
    animations: string[];
  };
}

export class AdvancedURLExtractionService {
  // Enhanced regex patterns
  private static readonly COLOR_REGEX = /(?:^|\s)(#(?:[0-9a-f]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\))(?:\s|$)/gi;
  private static readonly FONT_REGEX = /font-family\s*:\s*([^;]+)/gi;
  private static readonly FONT_SIZE_REGEX = /font-size\s*:\s*([^;]+)/gi;
  private static readonly FONT_WEIGHT_REGEX = /font-weight\s*:\s*([^;]+)/gi;
  private static readonly LINE_HEIGHT_REGEX = /line-height\s*:\s*([^;]+)/gi;
  private static readonly LETTER_SPACING_REGEX = /letter-spacing\s*:\s*([^;]+)/gi;
  private static readonly GRADIENT_REGEX = /(linear-gradient|radial-gradient)\s*\([^)]+\)/gi;
  private static readonly SHADOW_REGEX = /box-shadow\s*:\s*([^;]+)/gi;
  private static readonly BORDER_RADIUS_REGEX = /border-radius\s*:\s*([^;]+)/gi;
  private static readonly SPACING_REGEX = /(?:margin|padding)\s*:\s*([^;]+)/gi;
  private static readonly ANIMATION_REGEX = /(?:animation|transition)\s*:\s*([^;]+)/gi;
  private static readonly Z_INDEX_REGEX = /z-index\s*:\s*([^;]+)/gi;

  // Voice and tone analysis patterns
  private static readonly TONE_INDICATORS = {
    professional: /\b(?:leverage|optimize|solution|enterprise|strategic|innovative|robust|scalable)\b/gi,
    casual: /\b(?:hey|cool|awesome|super|totally|basically|kinda|gonna|wanna)\b/gi,
    playful: /\b(?:fun|exciting|amazing|wow|yay|fantastic|incredible|magical)\b/gi,
    serious: /\b(?:critical|important|essential|significant|imperative|vital|crucial)\b/gi,
    friendly: /\b(?:welcome|help|support|community|together|enjoy|love|care)\b/gi,
    authoritative: /\b(?:must|should|will|ensure|guarantee|proven|expert|leader)\b/gi
  };

  /**
   * Extract comprehensive branding data from a URL with advanced analysis
   */
  static async extractFromURL(url: string): Promise<AdvancedExtractedData> {
    try {
      const validatedUrl = this.validateAndNormalizeURL(url);
      
      // Fetch webpage content
      const response = await fetch(validatedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PayLift-BrandExtractor/2.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse HTML for advanced branding information
      const brandingData = await this.parseHTMLForAdvancedBranding(html, validatedUrl);
      
      return brandingData;
    } catch (error) {
      console.error('Advanced URL extraction failed:', error);
      throw new Error(`Failed to extract branding data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and normalize URL with enhanced checks
   */
  private static validateAndNormalizeURL(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      
      const urlObj = new URL(url);
      
      // Enhanced validation
      if (!urlObj.hostname || urlObj.hostname === '127.0.0.1' || urlObj.hostname.includes('127.0.0.1')) {
        throw new Error('Invalid or local URL not allowed');
      }

      // Check for suspicious domains
      const suspiciousDomains = ['test.', 'staging.', 'dev.', '127.0.0.1'];
      if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
        console.warn('Potentially suspicious domain detected:', urlObj.hostname);
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse HTML content for comprehensive branding information
   */
  private static async parseHTMLForAdvancedBranding(html: string, sourceUrl: string): Promise<AdvancedExtractedData> {
    // Extract all style content
    const styleContent = this.extractAllStyleContent(html);
    
    // Parse CSS with advanced token extraction
    const parsedCSS = this.parseAdvancedCSS(styleContent);
    
    // Extract meta information
    const metaColors = this.extractMetaColors(html);
    const metaInfo = this.extractMetaInformation(html);
    
    // Analyze text content for voice and tone
    const textContent = this.extractTextContent(html);
    const voiceAndTone = this.analyzeVoiceAndTone(textContent);
    
    // Analyze layout patterns
    const layoutPatterns = this.analyzeLayoutPatterns(html, styleContent);
    
    // Analyze interaction patterns
    const interactionPatterns = this.analyzeInteractionPatterns(styleContent);
    
    // Process extracted data
    const colorArray = Array.from(parsedCSS.colors);
    const allColors = [...new Set([...colorArray, ...metaColors])];
    const primaryColors = this.extractPrimaryColors(allColors);
    const secondaryColors = this.extractSecondaryColors(allColors, primaryColors);
    
    const allFonts = Array.from(parsedCSS.fonts);
    const fonts = this.processAdvancedFonts(allFonts, parsedCSS.typography);
    
    const enhancedBrandingData: AdvancedExtractedData = {
      primaryColors,
      secondaryColors,
      fonts,
      designTokens: {
        borderRadius: Array.from(parsedCSS.borderRadius).join(', ') || undefined,
        shadows: Array.from(parsedCSS.shadows) || undefined,
        spacing: Array.from(parsedCSS.spacing).join(', ') || undefined,
      },
      styleElements: {
        gradients: parsedCSS.gradients,
        patterns: this.detectPatterns(styleContent),
      },
      voiceAndTone,
      layoutPatterns,
      interactionPatterns,
      metadata: {
        extractedAt: new Date().toISOString(),
        sourceUrl,
        confidence: this.calculateAdvancedConfidenceScore(parsedCSS, allColors, allFonts, voiceAndTone),
        elementsFound: this.getAdvancedAnalyzedElements(html, styleContent),
      },
    };

    return enhancedBrandingData;
  }

  /**
   * Extract all style content including external stylesheets (where accessible)
   */
  private static extractAllStyleContent(html: string): string {
    const styles: string[] = [];
    
    // Extract style tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    while ((match = styleRegex.exec(html)) !== null) {
      styles.push(match[1]);
    }

    // Extract inline styles
    const inlineStyleRegex = /style\s*=\s*["']([^"']*?)["']/gi;
    while ((match = inlineStyleRegex.exec(html)) !== null) {
      styles.push(match[1]);
    }

    // Extract CSS custom properties (CSS variables)
    const cssVarRegex = /--[\w-]+\s*:\s*[^;]+/gi;
    const allContent = styles.join('\n');
    while ((match = cssVarRegex.exec(allContent)) !== null) {
      styles.push(match[0]);
    }

    return styles.join('\n');
  }

  /**
   * Parse CSS with advanced design token extraction
   */
  private static parseAdvancedCSS(css: string): AdvancedParsedCSS {
    const colors = new Set<string>();
    const fonts = new Set<string>();
    const gradients: Array<{ type: 'linear' | 'radial'; colors: string[]; direction?: number }> = [];
    const borderRadius = new Set<string>();
    const shadows = new Set<string>();
    const spacing = new Set<string>();
    const typography = {
      sizes: new Set<string>(),
      weights: new Set<string>(),
      lineHeights: new Set<string>(),
      letterSpacing: new Set<string>(),
    };
    const animations = new Set<string>();
    const zIndexes = new Set<string>();

    let match;

    // Extract colors
    while ((match = this.COLOR_REGEX.exec(css)) !== null) {
      colors.add(match[1].trim());
    }

    // Extract fonts
    while ((match = this.FONT_REGEX.exec(css)) !== null) {
      const fontFamily = match[1].trim().replace(/['"]/g, '');
      fonts.add(fontFamily);
    }

    // Extract typography tokens
    while ((match = this.FONT_SIZE_REGEX.exec(css)) !== null) {
      typography.sizes.add(match[1].trim());
    }

    while ((match = this.FONT_WEIGHT_REGEX.exec(css)) !== null) {
      typography.weights.add(match[1].trim());
    }

    while ((match = this.LINE_HEIGHT_REGEX.exec(css)) !== null) {
      typography.lineHeights.add(match[1].trim());
    }

    while ((match = this.LETTER_SPACING_REGEX.exec(css)) !== null) {
      typography.letterSpacing.add(match[1].trim());
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

    // Extract spacing
    while ((match = this.SPACING_REGEX.exec(css)) !== null) {
      spacing.add(match[1].trim());
    }

    // Extract animations and transitions
    while ((match = this.ANIMATION_REGEX.exec(css)) !== null) {
      animations.add(match[1].trim());
    }

    // Extract z-indexes
    while ((match = this.Z_INDEX_REGEX.exec(css)) !== null) {
      zIndexes.add(match[1].trim());
    }

    return { colors, fonts, gradients, borderRadius, shadows, spacing, typography, animations, zIndexes };
  }

  /**
   * Extract text content for voice and tone analysis
   */
  private static extractTextContent(html: string): string {
    // Remove script and style tags
    let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Extract text from common content areas
    const contentRegex = /<(?:h[1-6]|p|div|span|a|li|td|th)[^>]*>([\s\S]*?)<\/(?:h[1-6]|p|div|span|a|li|td|th)>/gi;
    const textMatches: string[] = [];
    let match;
    
    while ((match = contentRegex.exec(cleanHtml)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      if (text.length > 10) { // Only include meaningful text
        textMatches.push(text);
      }
    }
    
    return textMatches.join(' ').substring(0, 5000); // Limit to 5000 chars for analysis
  }

  /**
   * Analyze voice and tone from text content
   */
  private static analyzeVoiceAndTone(text: string): VoiceAndTone {
    const toneScores = {
      professional: 0,
      casual: 0,
      playful: 0,
      serious: 0,
      friendly: 0,
      authoritative: 0
    };

    // Analyze tone indicators
    Object.entries(this.TONE_INDICATORS).forEach(([tone, regex]) => {
      const matches = text.match(regex);
      toneScores[tone as keyof typeof toneScores] = matches ? matches.length : 0;
    });

    // Determine primary tone
    const primaryTone = Object.entries(toneScores).reduce((a, b) => 
      toneScores[a[0] as keyof typeof toneScores] > toneScores[b[0] as keyof typeof toneScores] ? a : b
    )[0] as keyof typeof toneScores;

    // Analyze sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    const sentenceLength = avgSentenceLength < 50 ? 'short' : avgSentenceLength < 100 ? 'medium' : 'long';
    
    // Detect emotional tone keywords
    const emotionalKeywords = text.match(/\b(?:excited|happy|sad|angry|frustrated|delighted|concerned|optimistic|confident)\b/gi) || [];
    
    // Extract key phrases (simple approach)
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = words.reduce((freq: Record<string, number>, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {});
    
    const keyPhrases = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Determine voice based on formality
    const formalIndicators = text.match(/\b(?:therefore|furthermore|consequently|nevertheless|however|subsequently)\b/gi) || [];
    const informalIndicators = text.match(/\b(?:yeah|ok|gonna|wanna|kinda|sorta)\b/gi) || [];
    
    let voice: VoiceAndTone['voice'] = 'conversational';
    if (formalIndicators.length > informalIndicators.length) {
      voice = 'formal';
    } else if (informalIndicators.length > 0) {
      voice = 'informal';
    }

    const totalToneMatches = Object.values(toneScores).reduce((sum, score) => sum + score, 0);
    const confidence = Math.min(totalToneMatches / 10, 1); // Normalize confidence

    return {
      tone: primaryTone,
      voice,
      confidence,
      keyPhrases,
      writingStyle: {
        sentenceLength,
        complexity: avgSentenceLength > 80 ? 'complex' : avgSentenceLength > 40 ? 'moderate' : 'simple',
        emotionalTone: emotionalKeywords
      }
    };
  }

  /**
   * Analyze layout patterns from HTML structure
   */
  private static analyzeLayoutPatterns(html: string, css: string): AdvancedExtractedData['layoutPatterns'] {
    const gridSystems: string[] = [];
    const spacingPatterns: string[] = [];
    const componentPatterns: string[] = [];

    // Detect CSS Grid
    if (css.includes('display: grid') || css.includes('display:grid')) {
      gridSystems.push('CSS Grid');
    }

    // Detect Flexbox
    if (css.includes('display: flex') || css.includes('display:flex')) {
      gridSystems.push('Flexbox');
    }

    // Detect Bootstrap-like classes
    if (html.includes('class="container') || html.includes('class="row') || html.includes('class="col-')) {
      gridSystems.push('Bootstrap Grid');
    }

    // Detect spacing patterns
    const spacingMatches = css.match(/(?:margin|padding):\s*([^;]+)/gi) || [];
    const commonSpacing = this.findCommonPatterns(spacingMatches.map(m => m.split(':')[1].trim()));
    spacingPatterns.push(...commonSpacing);

    // Detect common component patterns
    if (html.includes('class="card') || html.includes('class="panel')) {
      componentPatterns.push('Card Components');
    }
    if (html.includes('class="nav') || html.includes('<nav')) {
      componentPatterns.push('Navigation Components');
    }
    if (html.includes('class="btn') || html.includes('class="button')) {
      componentPatterns.push('Button Components');
    }

    return {
      gridSystems: [...new Set(gridSystems)],
      spacingPatterns: [...new Set(spacingPatterns)],
      componentPatterns: [...new Set(componentPatterns)]
    };
  }

  /**
   * Analyze interaction patterns from CSS
   */
  private static analyzeInteractionPatterns(css: string): AdvancedExtractedData['interactionPatterns'] {
    const hoverEffects: string[] = [];
    const transitions: string[] = [];
    const animations: string[] = [];

    // Detect hover effects
    if (css.includes(':hover')) {
      hoverEffects.push('Hover State Changes');
    }

    // Detect transitions
    const transitionMatches = css.match(/transition:\s*([^;]+)/gi) || [];
    transitions.push(...transitionMatches.map(t => t.split(':')[1].trim()));

    // Detect animations
    const animationMatches = css.match(/animation:\s*([^;]+)/gi) || [];
    animations.push(...animationMatches.map(a => a.split(':')[1].trim()));

    // Detect transform effects
    if (css.includes('transform:')) {
      hoverEffects.push('Transform Effects');
    }

    return {
      hoverEffects: [...new Set(hoverEffects)],
      transitions: [...new Set(transitions)],
      animations: [...new Set(animations)]
    };
  }

  /**
   * Helper methods (keeping existing ones and adding new ones)
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

  private static extractMetaInformation(html: string): Record<string, string> {
    const metaInfo: Record<string, string> = {};
    
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      metaInfo.title = titleMatch[1].trim();
    }

    const descriptionMatch = html.match(/<meta[^>]+name\s*=\s*["']description["'][^>]+content\s*=\s*["']([^"']+)["'][^>]*>/i);
    if (descriptionMatch) {
      metaInfo.description = descriptionMatch[1].trim();
    }

    return metaInfo;
  }

  private static extractPrimaryColors(colors: string[], maxCount: number = 5): string[] {
    const filteredColors = colors.filter(color => 
      !color.match(/rgba?\(\s*0\s*,\s*0\s*,\s*0/) && 
      !color.match(/rgba?\(\s*255\s*,\s*255\s*,\s*255/) && 
      !color.match(/#f{3,6}$/i) && 
      !color.match(/#0{3,6}$/i) &&
      !color.match(/transparent/i)
    );
    
    return filteredColors.slice(0, maxCount);
  }

  private static extractSecondaryColors(allColors: string[], primaryColors: string[], maxCount: number = 8): string[] {
    const secondaryColors = allColors.filter(color => !primaryColors.includes(color));
    return secondaryColors.slice(0, maxCount);
  }

  private static processAdvancedFonts(fonts: string[], typography: AdvancedParsedCSS['typography']): ExtractedBrandingData['fonts'] {
    if (fonts.length === 0) return {};
    
    const cleanedFonts = fonts.map(font => font.split(',')[0].trim().replace(/['"]/g, ''));
    const uniqueFonts = [...new Set(cleanedFonts)];
    
    return {
      primary: uniqueFonts[0] || undefined,
      secondary: uniqueFonts[1] || undefined,
      headings: uniqueFonts[0] || undefined,
    };
  }

  private static extractColorsFromGradient(gradient: string): string[] {
    const colors: string[] = [];
    let match;
    
    this.COLOR_REGEX.lastIndex = 0;
    while ((match = this.COLOR_REGEX.exec(gradient)) !== null) {
      colors.push(match[1].trim());
    }
    
    return colors;
  }

  private static extractGradientDirection(gradient: string): number | undefined {
    const degMatch = gradient.match(/(\d+)deg/);
    return degMatch ? parseInt(degMatch[1]) : undefined;
  }

  private static detectPatterns(css: string): Array<{ type: string; description: string }> {
    const patterns: Array<{ type: string; description: string }> = [];
    
    if (css.includes('repeating-linear-gradient')) {
      patterns.push({ type: 'stripe', description: 'Repeating linear gradient patterns' });
    }
    
    if (css.includes('radial-gradient')) {
      patterns.push({ type: 'radial', description: 'Radial gradient patterns' });
    }
    
    if (css.includes('background-image') && css.includes('url(')) {
      patterns.push({ type: 'image', description: 'Background image patterns' });
    }
    
    return patterns;
  }

  private static findCommonPatterns(items: string[]): string[] {
    const frequency = items.reduce((freq: Record<string, number>, item) => {
      freq[item] = (freq[item] || 0) + 1;
      return freq;
    }, {});

    return Object.entries(frequency)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([item]) => item);
  }

  private static calculateAdvancedConfidenceScore(
    parsedCSS: AdvancedParsedCSS, 
    colors: string[], 
    fonts: string[],
    voiceAndTone?: VoiceAndTone
  ): number {
    let score = 0;
    
    // Color analysis (30%)
    if (colors.length > 0) score += 0.1;
    if (colors.length > 3) score += 0.1;
    if (colors.length > 6) score += 0.1;
    
    // Typography analysis (25%)
    if (fonts.length > 0) score += 0.1;
    if (parsedCSS.typography.sizes.size > 0) score += 0.05;
    if (parsedCSS.typography.weights.size > 0) score += 0.05;
    if (parsedCSS.typography.lineHeights.size > 0) score += 0.05;
    
    // Design tokens (25%)
    if (parsedCSS.gradients.length > 0) score += 0.08;
    if (parsedCSS.shadows.size > 0) score += 0.08;
    if (parsedCSS.borderRadius.size > 0) score += 0.05;
    if (parsedCSS.spacing.size > 0) score += 0.04;
    
    // Voice and tone analysis (20%)
    if (voiceAndTone) {
      score += voiceAndTone.confidence * 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  private static getAdvancedAnalyzedElements(html: string, css: string): string[] {
    const elements = [];
    
    if (html.includes('<style')) elements.push('embedded-styles');
    if (html.includes('style=')) elements.push('inline-styles');
    if (html.includes('theme-color')) elements.push('meta-theme-color');
    if (css.includes('--')) elements.push('css-custom-properties');
    if (css.includes('@media')) elements.push('responsive-styles');
    if (css.includes('keyframes')) elements.push('animations');
    if (html.includes('class=')) elements.push('css-classes');
    if (html.includes('<link') && html.includes('stylesheet')) elements.push('external-stylesheets');
    
    return elements;
  }
}