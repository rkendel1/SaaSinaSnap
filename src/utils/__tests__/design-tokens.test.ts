import { CreatorProfile } from '@/features/creator/types';
import { ExtractedBrandingData } from '@/features/creator-onboarding/types';
import { extractDesignTokens, tokensToCSS, tokensToInlineStyle } from '@/utils/design-tokens';

describe('Design Token Utilities', () => {
  const mockProfile: CreatorProfile = {
    id: 'test-creator-id',
    business_name: 'Test Business',
    business_description: 'Test Description',
    business_website: 'https://test.com',
    business_logo_url: null,
    stripe_account_id: null,
    stripe_account_enabled: false,
    onboarding_completed: true,
    onboarding_step: 5,
    brand_color: '#ea580c',
    brand_gradient: null,
    brand_pattern: null,
    custom_domain: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    branding_extracted_at: null,
    branding_extraction_error: null,
    branding_extraction_status: null,
    extracted_branding_data: null,
  };

  describe('extractDesignTokens', () => {
    it('should extract basic tokens from profile with no branding data', () => {
      const tokens = extractDesignTokens(mockProfile);
      
      expect(tokens['--brand-color']).toBe('#ea580c');
      expect(tokens['--font-family']).toBe('inherit');
    });

    it('should extract tokens from extracted branding data', () => {
      const extractedData: ExtractedBrandingData = {
        primaryColors: ['#3498db', '#2ecc71'],
        secondaryColors: ['#e74c3c'],
        fonts: {
          primary: 'Inter, sans-serif',
          headings: 'Poppins, sans-serif',
        },
        designTokens: {
          borderRadius: '8px',
          spacing: '1.5rem',
          shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
        },
        styleElements: {},
        metadata: {
          extractedAt: '2024-01-01',
          sourceUrl: 'https://test.com',
          confidence: 0.9,
          elementsFound: ['header', 'nav', 'main'],
        },
      };

      const profileWithData: CreatorProfile = {
        ...mockProfile,
        extracted_branding_data: extractedData,
      };

      const tokens = extractDesignTokens(profileWithData);
      
      expect(tokens['--brand-color']).toBe('#3498db');
      expect(tokens['--font-family']).toBe('Inter, sans-serif');
      expect(tokens['--font-family-heading']).toBe('Poppins, sans-serif');
      expect(tokens['--border-radius']).toBe('8px');
      expect(tokens['--spacing']).toBe('1.5rem');
      expect(tokens['--shadow']).toBe('0 2px 4px rgba(0,0,0,0.1)');
      expect(tokens['--secondary-color']).toBe('#e74c3c');
    });

    it('should use profile brand_color when no primary colors extracted', () => {
      const extractedData: ExtractedBrandingData = {
        primaryColors: [],
        secondaryColors: [],
        fonts: {},
        designTokens: {},
        styleElements: {},
        metadata: {
          extractedAt: '2024-01-01',
          sourceUrl: 'https://test.com',
          confidence: 0.9,
          elementsFound: [],
        },
      };

      const profileWithData: CreatorProfile = {
        ...mockProfile,
        extracted_branding_data: extractedData,
      };

      const tokens = extractDesignTokens(profileWithData);
      
      expect(tokens['--brand-color']).toBe('#ea580c');
    });
  });

  describe('tokensToCSS', () => {
    it('should convert tokens to CSS string', () => {
      const tokens = {
        '--brand-color': '#ea580c',
        '--font-family': 'Inter, sans-serif',
        '--border-radius': '8px',
      };

      const css = tokensToCSS(tokens);
      
      expect(css).toContain('--brand-color: #ea580c;');
      expect(css).toContain('--font-family: Inter, sans-serif;');
      expect(css).toContain('--border-radius: 8px;');
    });
  });

  describe('tokensToInlineStyle', () => {
    it('should convert tokens to inline style object', () => {
      const tokens = {
        '--brand-color': '#ea580c',
        '--font-family': 'Inter, sans-serif',
      };

      const style = tokensToInlineStyle(tokens);
      
      expect(style['--brand-color']).toBe('#ea580c');
      expect(style['--font-family']).toBe('Inter, sans-serif');
    });
  });
});
