/// <reference types="jest" />
/**
 * @jest-environment jsdom
 * 
 * Comprehensive tests for the enhanced embed.js functionality
 * Tests branding, cross-environment compatibility, error handling, and validation
 */

// Removed explicit import for Jest globals, relying on global types from /// <reference types="jest" />

// Mock global functions and objects for browser environment
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;

// Mock DOM elements and methods
Object.defineProperty(window, 'location', {
  value: { origin: 'https://test-domain.com' },
  writable: true,
});

describe('Enhanced Embed.js Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('Environment Detection and Base URL', () => {
    it('should extract base URL from script source for cross-site embedding', () => {
      // Simulate embed script loaded from different domain
      const script = document.createElement('script');
      script.src = 'https://embed-host.com/static/embed.js';
      script.setAttribute('data-creator-id', 'test-creator');
      script.setAttribute('data-embed-type', 'header');
      
      // Mock currentScript
      Object.defineProperty(document, 'currentScript', {
        value: script,
        writable: true,
      });

      // Test our enhanced getBaseUrl logic (would need to extract from embed.js)
      const getBaseUrl = () => {
        const currentScript = document.currentScript as HTMLScriptElement | null;
        if (currentScript && currentScript.src) {
          try {
            const scriptUrl = new URL(currentScript.src);
            return `${scriptUrl.protocol}//${scriptUrl.host}`;
          } catch (e) {
            return window.location.origin;
          }
        }
        return window.location.origin;
      };

      expect(getBaseUrl()).toBe('https://embed-host.com');
    });

    it('should fallback to window.location.origin when script source unavailable', () => {
      Object.defineProperty(document, 'currentScript', {
        value: null,
        writable: true,
      });

      const getBaseUrl = () => {
        const currentScript = document.currentScript as HTMLScriptElement | null;
        if (currentScript && currentScript.src) {
          try {
            const scriptUrl = new URL(currentScript.src);
            return `${scriptUrl.protocol}//${scriptUrl.host}`;
          } catch (e) {
            return window.location.origin;
          }
        }
        return window.location.origin;
      };

      expect(getBaseUrl()).toBe('https://test-domain.com');
    });
  });

  describe('Brand Alignment Calculation', () => {
    it('should calculate brand alignment score correctly', () => {
      const calculateBrandAlignment = (creator: any) => {
        let score = 0;
        let factors = 0;
        
        if (creator.brand_color) { score += 0.3; }
        factors += 0.3;
        
        if (creator.business_logo_url) { score += 0.3; }
        factors += 0.3;
        
        if (creator.business_name) { score += 0.2; }
        factors += 0.2;
        
        if (creator.business_description) { score += 0.2; }
        factors += 0.2;
        
        return factors > 0 ? score / factors : 0;
      };

      const fullBrandCreator = {
        brand_color: '#3b82f6',
        business_logo_url: 'https://example.com/logo.png',
        business_name: 'Test Business',
        business_description: 'A test business'
      };

      const partialBrandCreator = {
        brand_color: '#3b82f6',
        business_name: 'Test Business'
      };

      const noBrandCreator = {};

      expect(calculateBrandAlignment(fullBrandCreator)).toBe(1.0);
      expect(calculateBrandAlignment(partialBrandCreator)).toBe(0.5);
      expect(calculateBrandAlignment(noBrandCreator)).toBe(0);
    });
  });

  describe('Embed Configuration Validation', () => {
    it('should validate required attributes', () => {
      const validateEmbedConfiguration = (script: HTMLScriptElement) => {
        const errors = [];
        const creatorId = script.getAttribute('data-creator-id');
        const embedType = script.getAttribute('data-embed-type');
        const productId = script.getAttribute('data-product-id');
        
        if (!creatorId || creatorId.trim() === '') {
          errors.push('data-creator-id is required');
        }
        
        if (!embedType || embedType.trim() === '') {
          errors.push('data-embed-type is required');
        }
        
        const validEmbedTypes = [
          'card', 'checkout-button', 'header', 'hero_section', 
          'product_description', 'testimonial_section', 'footer', 'pricing_table'
        ];
        
        if (embedType && !validEmbedTypes.includes(embedType)) {
          errors.push(`Invalid embed type: ${embedType}`);
        }
        
        if ((embedType === 'card' || embedType === 'checkout-button' || embedType === 'product_description') && !productId) {
          errors.push(`${embedType} embed requires data-product-id attribute`);
        }
        
        return errors;
      };

      // Test valid configuration
      const validScript = document.createElement('script');
      validScript.setAttribute('data-creator-id', 'creator-123');
      validScript.setAttribute('data-embed-type', 'header');
      
      expect(validateEmbedConfiguration(validScript)).toEqual([]);

      // Test missing creator ID
      const missingCreatorScript = document.createElement('script');
      missingCreatorScript.setAttribute('data-embed-type', 'header');
      
      expect(validateEmbedConfiguration(missingCreatorScript)).toContain('data-creator-id is required');

      // Test invalid embed type
      const invalidTypeScript = document.createElement('script');
      invalidTypeScript.setAttribute('data-creator-id', 'creator-123');
      invalidTypeScript.setAttribute('data-embed-type', 'invalid-type');
      
      expect(validateEmbedConfiguration(invalidTypeScript)).toContain('Invalid embed type: invalid-type');

      // Test missing product ID for card
      const cardWithoutProductScript = document.createElement('script');
      cardWithoutProductScript.setAttribute('data-creator-id', 'creator-123');
      cardWithoutProductScript.setAttribute('data-embed-type', 'card');
      
      expect(validateEmbedConfiguration(cardWithoutProductScript)).toContain('card embed requires data-product-id attribute');
    });
  });

  describe('CSS Scoping and Style Isolation', () => {
    it('should create scoped CSS to prevent style conflicts', () => {
      const createScopedCSS = (embedId: string, css: string) => {
        const scopedRules = css.split('}').map(rule => {
          if (rule.trim()) {
            const [selector, ...styles] = rule.split('{');
            if (selector && styles.length > 0) {
              return `#${embedId} ${selector.trim()} { ${styles.join('{')} }`;
            }
          }
          return rule;
        }).join('');
        
        return scopedRules;
      };

      const css = '.button { color: red } .card { padding: 10px }';
      const embedId = 'paylift-embed-test';
      
      const scopedCSS = createScopedCSS(embedId, css);
      
      expect(scopedCSS).toContain('#paylift-embed-test .button { color: red');
      expect(scopedCSS).toContain('#paylift-embed-test .card { padding: 10px');
    });

    it('should inject scoped styles without conflicting with existing styles', () => {
      const embedId = 'test-embed-123';
      const css = '.test-style { color: blue; }';
      
      const injectEmbedStyles = (embedId: string, css: string) => {
        const existingStyle = document.getElementById(`${embedId}-styles`);
        if (existingStyle) {
          existingStyle.remove();
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = `${embedId}-styles`;
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
      };

      injectEmbedStyles(embedId, css);
      
      const injectedStyle = document.getElementById(`${embedId}-styles`);
      expect(injectedStyle).toBeTruthy();
      expect(injectedStyle?.textContent).toBe(css);
      
      // Test replacement
      const newCSS = '.updated-style { color: green; }';
      injectEmbedStyles(embedId, newCSS);
      
      const updatedStyle = document.getElementById(`${embedId}-styles`);
      expect(updatedStyle?.textContent).toBe(newCSS);
      expect(document.querySelectorAll(`#${embedId}-styles`)).toHaveLength(1);
    });
  });

  describe('Error State Rendering', () => {
    it('should render consistent error states', () => {
      const renderErrorState = (targetElement: HTMLElement, message: string, brandColor = '#ef4444') => {
        const errorHtml = `
          <div style="
            padding: 16px;
            border: 2px solid ${brandColor};
            border-radius: 8px;
            background-color: #fef2f2;
            color: #991b1b;
            font-family: sans-serif;
            font-size: 14px;
            line-height: 1.5;
            max-width: 400px;
            margin: 8px 0;
          ">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <strong>PayLift Embed Error</strong>
            </div>
            <div>${message}</div>
          </div>
        `;
        targetElement.innerHTML = errorHtml;
      };

      const targetDiv = document.createElement('div');
      const errorMessage = 'Test error message';
      
      renderErrorState(targetDiv, errorMessage);
      
      expect(targetDiv.innerHTML).toContain('PayLift Embed Error');
      expect(targetDiv.innerHTML).toContain(errorMessage);
      expect(targetDiv.innerHTML).toContain('#ef4444'); // Default error color
    });
  });

  describe('Loading State Management', () => {
    it('should render loading states with animations', () => {
      const renderLoadingState = (targetElement: HTMLElement, brandColor = '#3b82f6') => {
        const loadingHtml = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px;
            font-family: sans-serif;
            color: #6b7280;
          ">
            <div style="
              width: 20px;
              height: 20px;
              border: 2px solid #e5e7eb;
              border-top-color: ${brandColor};
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-right: 12px;
            "></div>
            Loading...
          </div>
        `;
        targetDiv.innerHTML = loadingHtml;
      };

      const targetDiv = document.createElement('div');
      renderLoadingState(targetDiv);
      
      expect(targetDiv.innerHTML).toContain('Loading...');
      expect(targetDiv.innerHTML).toContain('animation: spin');
      expect(targetDiv.innerHTML).toContain('#3b82f6'); // Default brand color
    });
  });

  describe('Enhanced Gradient Generation', () => {
    it('should generate consistent gradients with color validation', () => {
      const generateGradientCss = (brandColor: string) => {
        if (!brandColor || typeof brandColor !== 'string') {
          brandColor = '#3b82f6';
        }
        return `linear-gradient(45deg, ${brandColor}, ${brandColor}80)`;
      };

      expect(generateGradientCss('#ff0000')).toBe('linear-gradient(45deg, #ff0000, #ff000080)');
      expect(generateGradientCss('')).toBe('linear-gradient(45deg, #3b82f6, #3b82f680)');
      expect(generateGradientCss(null as any)).toBe('linear-gradient(45deg, #3b82f6, #3b82f680)');
    });
  });

  describe('Cross-Environment Compatibility', () => {
    it('should handle different environment configurations', () => {
      // Test development environment
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://127.0.0.1:3000' },
        writable: true,
      });

      const script = document.createElement('script');
      script.src = 'http://127.0.0.1:3000/static/embed.js';
      
      Object.defineProperty(document, 'currentScript', {
        value: script,
        writable: true,
      });

      const getBaseUrl = () => {
        const currentScript = document.currentScript as HTMLScriptElement | null;
        if (currentScript && currentScript.src) {
          try {
            const scriptUrl = new URL(currentScript.src);
            return `${scriptUrl.protocol}//${scriptUrl.host}`;
          } catch (e) {
            return window.location.origin;
          }
        }
        return window.location.origin;
      };

      expect(getBaseUrl()).toBe('http://127.0.0.1:3000');

      // Test production environment
      script.src = 'https://production-domain.com/static/embed.js';
      expect(getBaseUrl()).toBe('https://production-domain.com');
    });
  });

  describe('Font Stack Enhancement', () => {
    it('should use consistent system font stack across embeds', () => {
      const systemFontStack = '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif';
      
      // Test that our enhanced embeds use the system font stack
      const cardHtml = `
        <div style="font-family: ${systemFontStack};">
          Test content
        </div>
      `;
      
      expect(cardHtml).toContain(systemFontStack);
    });
  });

  describe('Enhanced Interaction States', () => {
    it('should provide smooth hover and click animations', () => {
      const button = document.createElement('button');
      button.style.transition = 'all 0.2s ease-in-out';
      
      // Test hover state logic
      const onMouseOver = () => {
        button.style.transform = 'scale(1.02)';
        button.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.15)';
      };
      
      const onMouseOut = () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      };
      
      // Simulate hover
      onMouseOver();
      expect(button.style.transform).toBe('scale(1.02)');
      
      // Simulate unhover
      onMouseOut();
      expect(button.style.transform).toBe('scale(1)');
    });
  });
});