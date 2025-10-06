export interface EmbedValidationResult {
  isValid: boolean;
  errors: EmbedValidationError[];
  warnings: EmbedValidationWarning[];
  suggestions: string[];
}

export interface EmbedValidationError {
  type: 'html' | 'css' | 'javascript' | 'security' | 'accessibility';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location?: string;
  fix?: string;
}

export interface EmbedValidationWarning {
  type: 'performance' | 'compatibility' | 'best-practice' | 'accessibility';
  message: string;
  suggestion: string;
}

export class EmbedValidatorService {
  /**
   * Validate embed HTML, CSS, and JavaScript
   */
  static validateEmbed(html: string, css?: string, javascript?: string): EmbedValidationResult {
    const errors: EmbedValidationError[] = [];
    const warnings: EmbedValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate HTML
    const htmlErrors = this.validateHTML(html);
    errors.push(...htmlErrors);

    // Validate CSS if provided
    if (css) {
      const cssErrors = this.validateCSS(css);
      errors.push(...cssErrors);
    }

    // Validate JavaScript if provided
    if (javascript) {
      const jsErrors = this.validateJavaScript(javascript);
      errors.push(...jsErrors);
    }

    // Security checks
    const securityErrors = this.checkSecurity(html, css, javascript);
    errors.push(...securityErrors);

    // Accessibility checks
    const accessibilityWarnings = this.checkAccessibility(html);
    warnings.push(...accessibilityWarnings);

    // Performance checks
    const performanceWarnings = this.checkPerformance(html, css);
    warnings.push(...performanceWarnings);

    // Generate suggestions based on findings
    if (errors.length > 0) {
      suggestions.push('Fix critical errors before deploying to production');
    }
    if (warnings.length > 0) {
      suggestions.push('Consider addressing warnings to improve embed quality');
    }
    if (errors.length === 0 && warnings.length === 0) {
      suggestions.push('Embed looks good! Test it in different environments');
    }

    return {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate HTML structure and syntax
   */
  private static validateHTML(html: string): EmbedValidationError[] {
    const errors: EmbedValidationError[] = [];

    // Check for empty HTML
    if (!html || html.trim().length === 0) {
      errors.push({
        type: 'html',
        message: 'HTML content is empty',
        severity: 'critical',
        fix: 'Generate valid HTML content for the embed',
      });
      return errors;
    }

    // Check for unclosed tags
    const openTags = html.match(/<(\w+)[^>]*>/g) || [];
    const closeTags = html.match(/<\/(\w+)>/g) || [];
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];

    const openTagNames = openTags
      .map(tag => tag.match(/<(\w+)/)?.[1])
      .filter(tag => tag && !selfClosingTags.includes(tag.toLowerCase()));
    
    const closeTagNames = closeTags.map(tag => tag.match(/<\/(\w+)>/)?.[1]);

    openTagNames.forEach(tag => {
      if (tag && !closeTagNames.includes(tag)) {
        errors.push({
          type: 'html',
          message: `Unclosed HTML tag: <${tag}>`,
          severity: 'high',
          location: tag,
          fix: `Add closing tag </${tag}>`,
        });
      }
    });

    // Check for dangerous inline event handlers
    const dangerousHandlers = html.match(/on\w+\s*=\s*["'][^"']*["']/gi);
    if (dangerousHandlers && dangerousHandlers.length > 0) {
      errors.push({
        type: 'security',
        message: 'Inline event handlers detected (potential XSS risk)',
        severity: 'medium',
        fix: 'Use addEventListener in JavaScript instead of inline handlers',
      });
    }

    // Check for script tags (should use javascript parameter instead)
    if (html.includes('<script')) {
      errors.push({
        type: 'html',
        message: 'Script tags found in HTML',
        severity: 'medium',
        fix: 'Move JavaScript to the javascript parameter',
      });
    }

    // Check for style tags (should use css parameter instead)
    if (html.includes('<style')) {
      errors.push({
        type: 'html',
        message: 'Style tags found in HTML',
        severity: 'low',
        fix: 'Move CSS to the css parameter',
      });
    }

    return errors;
  }

  /**
   * Validate CSS syntax and best practices
   */
  private static validateCSS(css: string): EmbedValidationError[] {
    const errors: EmbedValidationError[] = [];

    // Check for empty CSS
    if (!css || css.trim().length === 0) {
      return errors; // Empty CSS is okay
    }

    // Check for unclosed braces
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push({
        type: 'css',
        message: 'Unbalanced CSS braces',
        severity: 'high',
        fix: 'Ensure all CSS rules have matching opening and closing braces',
      });
    }

    // Check for !important overuse
    const importantCount = (css.match(/!important/gi) || []).length;
    if (importantCount > 5) {
      errors.push({
        type: 'css',
        message: `Excessive use of !important (${importantCount} instances)`,
        severity: 'low',
        fix: 'Reduce !important usage for better CSS maintainability',
      });
    }

    // Check for invalid color values
    const invalidColors = css.match(/:\s*#[0-9a-f]{0,2}(?![0-9a-f])/gi);
    if (invalidColors && invalidColors.length > 0) {
      errors.push({
        type: 'css',
        message: 'Invalid color values detected',
        severity: 'medium',
        fix: 'Use valid hex colors (#RGB or #RRGGBB)',
      });
    }

    return errors;
  }

  /**
   * Validate JavaScript syntax and security
   */
  private static validateJavaScript(javascript: string): EmbedValidationError[] {
    const errors: EmbedValidationError[] = [];

    // Check for empty JavaScript
    if (!javascript || javascript.trim().length === 0) {
      return errors; // Empty JS is okay
    }

    // Check for eval() usage (security risk)
    if (javascript.includes('eval(')) {
      errors.push({
        type: 'security',
        message: 'eval() detected (security risk)',
        severity: 'critical',
        fix: 'Remove eval() and use safer alternatives',
      });
    }

    // Check for document.write (bad practice)
    if (javascript.includes('document.write')) {
      errors.push({
        type: 'javascript',
        message: 'document.write() detected (bad practice)',
        severity: 'medium',
        fix: 'Use DOM manipulation methods instead',
      });
    }

    // Check for unbalanced parentheses
    const openParens = (javascript.match(/\(/g) || []).length;
    const closeParens = (javascript.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      errors.push({
        type: 'javascript',
        message: 'Unbalanced parentheses in JavaScript',
        severity: 'high',
        fix: 'Ensure all parentheses are properly closed',
      });
    }

    // Check for unbalanced braces
    const openBraces = (javascript.match(/{/g) || []).length;
    const closeBraces = (javascript.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push({
        type: 'javascript',
        message: 'Unbalanced braces in JavaScript',
        severity: 'high',
        fix: 'Ensure all code blocks are properly closed',
      });
    }

    return errors;
  }

  /**
   * Check for security issues
   */
  private static checkSecurity(html: string, css?: string, javascript?: string): EmbedValidationError[] {
    const errors: EmbedValidationError[] = [];

    // Check for potential XSS vectors in HTML
    const xssPatterns = [
      /javascript:/gi,
      /data:text\/html/gi,
      /<iframe[^>]*srcdoc/gi,
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(html)) {
        errors.push({
          type: 'security',
          message: 'Potential XSS vector detected',
          severity: 'critical',
          fix: 'Remove potentially dangerous code patterns',
        });
      }
    });

    // Check for external resource loading without HTTPS
    const httpResources = html.match(/src\s*=\s*["']http:\/\/[^"']+["']/gi);
    if (httpResources && httpResources.length > 0) {
      errors.push({
        type: 'security',
        message: 'Non-HTTPS resources detected',
        severity: 'medium',
        fix: 'Use HTTPS for all external resources',
      });
    }

    return errors;
  }

  /**
   * Check accessibility
   */
  private static checkAccessibility(html: string): EmbedValidationWarning[] {
    const warnings: EmbedValidationWarning[] = [];

    // Check for images without alt text
    const imagesWithoutAlt = html.match(/<img(?![^>]*alt=)[^>]*>/gi);
    if (imagesWithoutAlt && imagesWithoutAlt.length > 0) {
      warnings.push({
        type: 'accessibility',
        message: 'Images without alt text detected',
        suggestion: 'Add alt attributes to all images for better accessibility',
      });
    }

    // Check for buttons without accessible text
    const buttonsWithoutText = html.match(/<button[^>]*>\s*<\/button>/gi);
    if (buttonsWithoutText && buttonsWithoutText.length > 0) {
      warnings.push({
        type: 'accessibility',
        message: 'Empty buttons detected',
        suggestion: 'Add descriptive text or aria-label to buttons',
      });
    }

    // Check for links without text
    const linksWithoutText = html.match(/<a[^>]*>\s*<\/a>/gi);
    if (linksWithoutText && linksWithoutText.length > 0) {
      warnings.push({
        type: 'accessibility',
        message: 'Empty links detected',
        suggestion: 'Add descriptive text to all links',
      });
    }

    return warnings;
  }

  /**
   * Check performance
   */
  private static checkPerformance(html: string, css?: string): EmbedValidationWarning[] {
    const warnings: EmbedValidationWarning[] = [];

    // Check for large inline styles
    if (css && css.length > 5000) {
      warnings.push({
        type: 'performance',
        message: 'Large CSS detected (>5KB)',
        suggestion: 'Consider optimizing CSS or splitting into smaller chunks',
      });
    }

    // Check for excessive DOM elements
    const elementCount = (html.match(/<\w+/g) || []).length;
    if (elementCount > 100) {
      warnings.push({
        type: 'performance',
        message: `High DOM element count (${elementCount})`,
        suggestion: 'Simplify HTML structure for better performance',
      });
    }

    // Check for inline base64 images
    const base64Images = html.match(/data:image\/[^;]+;base64,/gi);
    if (base64Images && base64Images.length > 3) {
      warnings.push({
        type: 'performance',
        message: 'Multiple base64 images detected',
        suggestion: 'Use external image URLs for better performance',
      });
    }

    return warnings;
  }

  /**
   * Sanitize HTML to remove dangerous content
   */
  static sanitizeHTML(html: string): string {
    // Remove script tags
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove inline event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data:text/html
    sanitized = sanitized.replace(/data:text\/html/gi, '');
    
    return sanitized;
  }

  /**
   * Get validation summary for display
   */
  static getValidationSummary(result: EmbedValidationResult): string {
    const criticalErrors = result.errors.filter(e => e.severity === 'critical').length;
    const highErrors = result.errors.filter(e => e.severity === 'high').length;
    const mediumErrors = result.errors.filter(e => e.severity === 'medium').length;
    const lowErrors = result.errors.filter(e => e.severity === 'low').length;

    if (result.isValid) {
      return `✅ Embed is valid with ${result.warnings.length} warning(s)`;
    }

    const parts = [];
    if (criticalErrors > 0) parts.push(`${criticalErrors} critical`);
    if (highErrors > 0) parts.push(`${highErrors} high`);
    if (mediumErrors > 0) parts.push(`${mediumErrors} medium`);
    if (lowErrors > 0) parts.push(`${lowErrors} low`);

    return `❌ Embed has ${parts.join(', ')} severity error(s)`;
  }
}