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
   * Extract comprehensive data from a URL
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
      
      // Parse the HTML and extract comprehensive information
      const brandingData = await this.parseHTMLForBranding(html, validatedUrl);
      const contentData = this.extractContent(html);
      const voiceAndTone = this.analyzeVoiceTone(html);
      const companyInfo = this.extractCompanyInfo(html);
      const socialProof = this.extractSocialProof(html);
      
      return {
        ...brandingData,
        contentData,
        voiceAndTone,
        companyInfo,
        socialProof,
      };
    } catch (error) {
      console.error('URL extraction failed:', error);
      throw new Error(`Failed to extract data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract content from HTML
   */
  private static extractContent(html: string): ExtractedBrandingData['contentData'] {
    const sections: Array<{ name: string; content: string; type: 'hero' | 'features' | 'benefits' | 'about' | 'other' }> = [];
    
    // Extract sections
    const sectionRegex = /<(?:div|section)[^>]*(?:hero|features|benefits|about)[^>]*>[\s\S]*?<\/(?:div|section)>/gi;
    let match;
    
    while ((match = sectionRegex.exec(html)) !== null) {
      const section = match[0];
      const typeMatch = section.match(/(?:hero|features|benefits|about)/i);
      const type = (typeMatch ? typeMatch[0].toLowerCase() : 'other') as 'hero' | 'features' | 'benefits' | 'about' | 'other';
      
      // Extract section name from heading
      const nameMatch = section.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
      const name = nameMatch ? this.cleanHTML(nameMatch[1]).trim() : type.charAt(0).toUpperCase() + type.slice(1);
      
      // Extract section content
      const content = this.cleanHTML(section).trim();
      
      if (content.length > 20) {
        sections.push({ name, content, type });
      }
    }
    
    return {
      headlines: this.extractHeadlines(html),
      taglines: this.extractTaglines(html),
      valuePropositions: this.extractValuePropositions(html),
      sections
    };
  }

  /**
   * Analyze voice and tone from HTML
   */
  private static analyzeVoiceTone(html: string): ExtractedBrandingData['voiceAndTone'] {
    // Basic sentiment analysis based on positive/negative word patterns
    const text = this.cleanHTML(html).toLowerCase();
    const positiveWords = ['great', 'best', 'amazing', 'excellent', 'innovative', 'leading'];
    const negativeWords = ['problem', 'challenge', 'difficult', 'complex'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      const matches = text.match(new RegExp(word, 'g'));
      if (matches) positiveCount += matches.length;
    });
    
    negativeWords.forEach(word => {
      const matches = text.match(new RegExp(word, 'g'));
      if (matches) negativeCount += matches.length;
    });
    
    // Extract key phrases (important statements)
    const keyPhrases = this.extractKeyPhrases(html);
    
    // Determine tone based on content patterns
    const hasTechnicalTerms = /\b(api|sdk|framework|integration|protocol)\b/i.test(text);
    const hasConversationalMarkers = /\b(we|our|you|your)\b/i.test(text);
    const hasFormalLanguage = /\b(pursuant|hereby|furthermore|moreover)\b/i.test(text);
    
    return {
      tone: hasTechnicalTerms ? 'technical' : 
            hasFormalLanguage ? 'formal' : 
            hasConversationalMarkers ? 'friendly' : 'professional',
      style: hasConversationalMarkers ? 'conversational' : 'informative',
      sentiment: positiveCount > negativeCount ? 'positive' : 
                positiveCount < negativeCount ? 'negative' : 'neutral',
      keyPhrases,
      confidence: 0.7 // Could be enhanced with more sophisticated analysis
    };
  }

  /**
   * Extract key phrases from HTML
   */
  private static extractKeyPhrases(html: string): string[] {
    const phrases: string[] = [];
    
    // Look for emphasized text and important statements
    const patterns = [
      /<(?:strong|b|em)[^>]*>([^<]{10,})<\/(?:strong|b|em)>/gi,
      /<h[1-3][^>]*>([^<]{10,})<\/h[1-3]>/gi,
      /<p[^>]*class=["'][^"']*(?:lead|important|key)[^"']*["'][^>]*>([^<]+)<\/p>/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = this.cleanHTML(match[1]).trim();
        if (text && text.length > 10 && !text.includes('lorem ipsum')) {
          phrases.push(text);
        }
      }
    });
    
    return [...new Set(phrases)].slice(0, 10); // Return up to 10 unique phrases
  }

  /**
   * Extract company information from HTML
   */
  private static extractCompanyInfo(html: string): ExtractedBrandingData['companyInfo'] {
    // Implement company information extraction logic
    return {
      name: this.extractCompanyName(html),
      description: this.extractCompanyDescription(html),
      services: this.extractCompanyServices(html),
    };
  }
  /**
   * Extract social proof elements from HTML
   */
  private static extractSocialProof(html: string): ExtractedBrandingData['socialProof'] {
    return {
      testimonials: this.extractTestimonials(html),
      clientLogos: this.extractClientLogos(html),
      statistics: this.extractStatistics(html),
      awards: this.extractAwards(html),
      certifications: this.extractCertifications(html)
    };
  }

  /**
   * Extract testimonials from HTML
   */
  private static extractTestimonials(html: string): Array<{ text: string; author?: string; role?: string; company?: string }> {
    const testimonials: Array<{ text: string; author?: string; role?: string; company?: string }> = [];
    
    // Look for testimonial patterns
    const testimonialRegex = /<(?:div|blockquote)[^>]*(?:testimonial|review|quote)[^>]*>[\s\S]*?<\/(?:div|blockquote)>/gi;
    let match;
    
    while ((match = testimonialRegex.exec(html)) !== null) {
      const block = match[0];
      
      // Extract quote text
      const textMatch = block.match(/<(?:p|div)[^>]*>(.*?)<\/(?:p|div)>/i);
      if (!textMatch) continue;
      
      const text = this.cleanHTML(textMatch[1]).trim();
      if (!text || text.length < 20) continue;
      
      // Extract author info
      const authorMatch = block.match(/<(?:cite|span|p)[^>]*(?:author|name)[^>]*>(.*?)<\/(?:cite|span|p)>/i);
      const roleMatch = block.match(/<(?:span|p)[^>]*(?:role|title|position)[^>]*>(.*?)<\/(?:span|p)>/i);
      const companyMatch = block.match(/<(?:span|p)[^>]*(?:company|organization)[^>]*>(.*?)<\/(?:span|p)>/i);
      
      testimonials.push({
        text,
        author: authorMatch ? this.cleanHTML(authorMatch[1]).trim() : undefined,
        role: roleMatch ? this.cleanHTML(roleMatch[1]).trim() : undefined,
        company: companyMatch ? this.cleanHTML(companyMatch[1]).trim() : undefined
      });
    }
    
    return testimonials;
  }

  /**
   * Extract client logos from HTML
   */
  private static extractClientLogos(html: string): string[] {
    const logos: string[] = [];
    
    // Look for logo sections and images
    const patterns = [
      /<(?:div|section)[^>]*(?:clients|partners|logos)[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
      /<img[^>]+(?:client|partner|logo)[^>]+src=["']([^"']+)["']/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        if (match[1]) {
          logos.push(match[1]);
        }
      }
    });
    
    return [...new Set(logos)];
  }

  /**
   * Extract statistics from HTML
   */
  private static extractStatistics(html: string): Array<{ value: string; label: string }> {
    const stats: Array<{ value: string; label: string }> = [];
    
    // Look for statistic patterns
    const statRegex = /<(?:div|span)[^>]*(?:stat|metric|number)[^>]*>[\s\S]*?<\/(?:div|span)>/gi;
    let match;
    
    while ((match = statRegex.exec(html)) !== null) {
      const block = match[0];
      
      // Look for number/value and label
      const valueMatch = block.match(/>([0-9,]+(?:\.[0-9]+)?(?:K|M|B)?|[$€£¥]?[0-9,]+(?:\.[0-9]+)?(?:K|M|B)?)<\//i);
      const labelMatch = block.match(/<(?:p|span|div)[^>]*(?:label|description)[^>]*>(.*?)<\/(?:p|span|div)>/i);
      
      if (valueMatch && labelMatch) {
        stats.push({
          value: valueMatch[1],
          label: this.cleanHTML(labelMatch[1]).trim()
        });
      }
    }
    
    return stats;
  }

  /**
   * Extract awards from HTML
   */
  private static extractAwards(html: string): string[] {
    const awards: string[] = [];
    
    // Look for award mentions
    const patterns = [
      /<(?:div|section)[^>]*awards[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
      /<(?:div|span|p)[^>]*>([^<]*award[^<]*)<\/(?:div|span|p)>/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = this.cleanHTML(match[1]).trim();
        if (text && text.length > 5 && text.toLowerCase().includes('award')) {
          awards.push(text);
        }
      }
    });
    
    return [...new Set(awards)];
  }

  /**
   * Extract certifications from HTML
   */
  private static extractCertifications(html: string): string[] {
    const certifications: string[] = [];
    
    // Look for certification mentions
    const patterns = [
      /<(?:div|section)[^>]*certifications[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
      /<(?:div|span|p)[^>]*>([^<]*certified[^<]*)<\/(?:div|span|p)>/gi,
      /<(?:div|span|p)[^>]*>([^<]*certification[^<]*)<\/(?:div|span|p)>/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = this.cleanHTML(match[1]).trim();
        if (text && text.length > 5 && 
            (text.toLowerCase().includes('certif') || text.toLowerCase().includes('iso'))) {
          certifications.push(text);
        }
      }
    });
    
    return [...new Set(certifications)];
  }
  // Placeholder methods for extracting specific content
  private static extractHeadlines(html: string): string[] {
    const headlines: string[] = [];
    
    // Extract h1 and h2 elements
    const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    
    let match;
    while ((match = h1Regex.exec(html)) !== null) {
      const text = this.cleanHTML(match[1]).trim();
      if (text && text.length > 5) headlines.push(text);
    }
    
    while ((match = h2Regex.exec(html)) !== null) {
      const text = this.cleanHTML(match[1]).trim();
      if (text && text.length > 5) headlines.push(text);
    }
    
    // Extract hero section text
    const heroRegex = /<(?:div|section)[^>]*(?:hero|banner|header)[^>]*>[\s\S]*?<\/(?:div|section)>/gi;
    while ((match = heroRegex.exec(html)) !== null) {
      const heroSection = match[0];
      const textMatch = heroSection.match(/>([^<]{10,})</g);
      if (textMatch) {
        textMatch.forEach(t => {
          const text = this.cleanHTML(t.slice(1, -1)).trim();
          if (text && text.length > 10) headlines.push(text);
        });
      }
    }
    
    return [...new Set(headlines)]; // Remove duplicates
  }

  private static extractTaglines(html: string): string[] {
    const taglines: string[] = [];
    
    // Look for common tagline patterns
    const patterns = [
      /<(?:p|div|span)[^>]*(?:tagline|subtitle|subheading)[^>]*>(.*?)<\/(?:p|div|span)>/gi,
      /<h[2-4][^>]*>([^<]{10,})<\/h[2-4]>/gi,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = this.cleanHTML(match[1]).trim();
        if (text && text.length > 10 && !text.includes('lorem ipsum')) {
          taglines.push(text);
        }
      }
    });
    
    return [...new Set(taglines)];
  }

  private static extractValuePropositions(html: string): string[] {
    const valueProps: string[] = [];
    
    // Look for common value proposition patterns
    const patterns = [
      /<(?:div|section)[^>]*(?:features|benefits|why-us|value)[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
      /<li[^>]*>([^<]{15,})<\/li>/gi,
      /<(?:div|p)[^>]*>([^<]*(?:benefit|feature|advantage|solution)[^<]*)<\/(?:div|p)>/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = this.cleanHTML(match[1]).trim();
        if (text && text.length > 15 && !text.includes('lorem ipsum')) {
          valueProps.push(text);
        }
      }
    });
    
    return [...new Set(valueProps)];
  }

  private static extractCompanyName(html: string): string {
    // Try multiple methods to find company name
    const patterns = [
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<|]+)(?:\s*[|]|<)/i,
      /<h1[^>]*>([^<]{2,50})<\/h1>/i,
      /<a[^>]+class=["'][^"']*logo[^"']*["'][^>]*>([^<]+)<\/a>/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const name = this.cleanHTML(match[1]).trim();
        if (name && name.length > 1) return name;
      }
    }
    
    return '';
  }

  private static extractCompanyDescription(html: string): string {
    // Try multiple methods to find company description
    const patterns = [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<(?:div|section|p)[^>]*(?:about|company-desc|description)[^>]*>([^<]{20,})<\/(?:div|section|p)>/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const desc = this.cleanHTML(match[1]).trim();
        if (desc && desc.length > 20) return desc;
      }
    }
    
    return '';
  }

  private static extractCompanyServices(html: string): string[] {
    const services: string[] = [];
    
    // Look for service sections and lists
    const patterns = [
      /<(?:div|section)[^>]*(?:services|products|solutions)[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
      /<h[2-4][^>]*>([^<]*(?:Service|Product|Solution)[^<]*)<\/h[2-4]>/gi,
      /<li[^>]*>([^<]{10,})<\/li>/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = this.cleanHTML(match[1]).trim();
        if (text && text.length > 10 && !text.includes('lorem ipsum')) {
          services.push(text);
        }
      }
    });
    
    return [...new Set(services)];
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
      if (!urlObj.hostname || urlObj.hostname === '127.0.0.1') {
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
    
    // Extract content data
    const contentData = this.extractContent(html);
    const voiceAndTone = this.analyzeVoiceTone(html);
    const companyInfo = this.extractCompanyInfo(html);
    const socialProof = this.extractSocialProof(html);
    
    const extractedBrandingData: ExtractedBrandingData = {
      primaryColors,
      secondaryColors,
      fonts,
      designTokens: {
        borderRadius: Array.from(parsedCSS.borderRadius).join(', ') || undefined,
        shadows: Array.from(parsedCSS.shadows) || undefined,
        spacing: undefined,
      },
      styleElements: {
        gradients: parsedCSS.gradients,
        patterns: [],
      },
      contentData,
      voiceAndTone,
      companyInfo,
      socialProof,
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
   * Clean HTML content by removing extra spaces and HTML entities
   */
  private static cleanHTML(text: string): string {
    return text
      .replace(/<[^>]+>/g, ' ') // Remove any nested HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
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