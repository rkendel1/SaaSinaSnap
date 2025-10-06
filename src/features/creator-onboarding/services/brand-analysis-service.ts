import type { Stripe } from 'stripe';

import type { ExtractedBrandingData } from '../types';

import { URLExtractionService } from './url-extraction';

export interface StripeProductData {
  name: string;
  description: string;
  price?: number;
  interval?: 'month' | 'year';
  features: string[];
  metadata?: Record<string, string>;
}

export interface DesignTokens {
  colors: {
    primary: string[];
    secondary: string[];
    accent?: string[];
    background: string;
    text: string;
  };
  typography: {
    primary: string;
    secondary?: string;
    headings?: string;
    baseFontSize: string;
    scaleRatio: number;
  };
  spacing: {
    base: string;
    scale: number;
  };
  borderRadius: string;
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface PrePopulatedData {
  businessName: string;
  businessDescription: string;
  brandColors: {
    primary: string[];
    secondary: string[];
  };
  fonts: {
    primary?: string;
    secondary?: string;
    headings?: string;
  };
  products: Array<{
    name: string;
    description: string;
    price?: number;
  }>;
  pricingTiers: Array<{
    name: string;
    description: string;
    features: string[];
    price?: number;
  }>;
  socialProof: {
    testimonials: Array<{
      text: string;
      author?: string;
      role?: string;
      company?: string;
    }>;
    statistics: Array<{
      value: string;
      label: string;
    }>;
  };
}

export class BrandAnalysisService {
  /**
   * Analyze website and extract branding data
   */
  static async analyzeWebsite(url: string): Promise<ExtractedBrandingData> {
    return URLExtractionService.extractFromURL(url);
  }

  /**
   * Pre-populate data from extracted branding information and generate design tokens
   */
  static preparePrePopulatedData(extractedData: ExtractedBrandingData): PrePopulatedData & { designTokens: DesignTokens } {
    // Extract business name from company info or content
    const businessName = extractedData.companyInfo?.name || 
      extractedData.contentData?.headlines[0] || '';

    // Extract business description
    const businessDescription = extractedData.companyInfo?.description || 
      extractedData.contentData?.taglines[0] || '';

    // Extract brand colors
    const brandColors = {
      primary: extractedData.primaryColors || [],
      secondary: extractedData.secondaryColors || [],
    };

    // Extract fonts
    const fonts = extractedData.fonts || {};

    // Enhanced product extraction with pricing analysis
    const products = this.extractProductInformation(extractedData);

    // Enhanced pricing tier extraction with feature analysis
    const pricingTiers = this.extractPricingTiers(extractedData);

    // Generate design tokens from brand colors and fonts
    const designTokens = this.generateDesignTokens(extractedData);

    // Extract social proof
    const socialProof = {
      testimonials: extractedData.socialProof?.testimonials || [],
      statistics: extractedData.socialProof?.statistics || [],
    };

    return {
      businessName,
      businessDescription,
      brandColors,
      fonts,
      products,
      pricingTiers,
      socialProof,
      designTokens,
    };
  }

  /**
   * Create a preview of what will be pre-populated
   */
  static generatePrePopulationPreview(data: PrePopulatedData): Array<{
    category: string;
    items: Array<{ label: string; value: string }>;
  }> {
    return [
      {
        category: 'Business Information',
        items: [
          { label: 'Name', value: data.businessName },
          { label: 'Description', value: data.businessDescription },
        ],
      },
      {
        category: 'Brand Design',
        items: [
          { 
            label: 'Primary Colors', 
            value: data.brandColors.primary.join(', ') 
          },
          { 
            label: 'Fonts', 
            value: [
              data.fonts.primary,
              data.fonts.secondary,
            ].filter(Boolean).join(', ')
          },
        ],
      },
      {
        category: 'Products & Pricing',
        items: [
          { 
            label: 'Products Found', 
            value: `${data.products.length} products identified` 
          },
          { 
            label: 'Pricing Tiers', 
            value: `${data.pricingTiers.length} tiers identified` 
          },
        ],
      },
      {
        category: 'Social Proof',
        items: [
          { 
            label: 'Testimonials', 
            value: `${data.socialProof.testimonials.length} testimonials found` 
          },
          { 
            label: 'Statistics', 
            value: `${data.socialProof.statistics.length} key metrics found` 
          },
        ],
      },
    ];
  }

  /**
   * Extract detailed product information including pricing patterns
   */
  private static extractProductInformation(data: ExtractedBrandingData): Array<StripeProductData> {
    const products: StripeProductData[] = [];
    
    // Analyze value propositions for product information
    const valueProps = data.contentData?.valuePropositions || [];
    const sections = data.contentData?.sections || [];
    
    // Find pricing patterns (e.g., $X/month, $X/year)
    const pricingPattern = /\$(\d+(?:\.\d{2})?)\s*(?:\/|\s+per\s+)(month|year)/i;
    
    // Combine value propositions and relevant sections
    [...valueProps, ...sections]
      .filter(item => {
        const content = typeof item === 'string' ? item : item.content;
        return content.includes('$') || /price|plan|subscription|package/i.test(content);
      })
      .forEach(item => {
        const content = typeof item === 'string' ? item : item.content;
        const name = typeof item === 'string' ? 
          content.split('.')[0].trim() : 
          item.name;
        
        const priceMatch = content.match(pricingPattern);
        const features = content
          .split(/[.•\n]/)
          .map(f => f.trim())
          .filter(f => f && !f.includes('$'));
        
        products.push({
          name,
          description: content.split('.')[0],
          price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
          interval: priceMatch ? priceMatch[2].toLowerCase() as 'month' | 'year' : undefined,
          features,
        });
      });
    
    return products;
  }

  /**
   * Extract pricing tiers with enhanced feature analysis
   */
  private static extractPricingTiers(data: ExtractedBrandingData): Array<{
    name: string;
    description: string;
    features: string[];
    price?: number;
    interval?: 'month' | 'year';
  }> {
    const pricingPattern = /\$(\d+(?:\.\d{2})?)\s*(?:\/|\s+per\s+)(month|year)/i;
    
    return (data.contentData?.sections || [])
      .filter(section => 
        section.type === 'features' || 
        section.type === 'benefits' || 
        /pricing|plans|tiers/i.test(section.name)
      )
      .map(section => {
        const priceMatch = section.content.match(pricingPattern);
        
        return {
          name: section.name,
          description: section.content.split('.')[0],
          features: section.content
            .split(/[.•\n]/)
            .map(f => f.trim())
            .filter(f => f && !f.includes('$')),
          price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
          interval: priceMatch ? priceMatch[2].toLowerCase() as 'month' | 'year' : undefined,
        };
      });
  }

  /**
   * Generate comprehensive design tokens from extracted branding
   */
  private static generateDesignTokens(data: ExtractedBrandingData): DesignTokens {
    const primaryColor = data.primaryColors?.[0] || '#000000';
    const secondaryColors = data.secondaryColors || [];
    
    return {
      colors: {
        primary: data.primaryColors || [primaryColor],
        secondary: secondaryColors,
        accent: this.generateAccentColors(primaryColor),
        background: this.getLightestColor(data.primaryColors || [primaryColor]),
        text: this.getDarkestColor(data.primaryColors || [primaryColor]),
      },
      typography: {
        primary: data.fonts?.primary || 'Inter',
        secondary: data.fonts?.secondary,
        headings: data.fonts?.headings || data.fonts?.primary,
        baseFontSize: '16px',
        scaleRatio: 1.25,
      },
      spacing: {
        base: '1rem',
        scale: 1.5,
      },
      borderRadius: '0.5rem',
      shadows: {
        small: '0 1px 3px rgba(0,0,0,0.12)',
        medium: '0 4px 6px rgba(0,0,0,0.12)',
        large: '0 10px 20px rgba(0,0,0,0.12)',
      },
    };
  }

  /**
   * Generate accent colors from primary color
   */
  private static generateAccentColors(baseColor: string): string[] {
    // Implementation would adjust hue/saturation of base color
    return [baseColor];
  }

  /**
   * Get the lightest color from a set for backgrounds
   */
  private static getLightestColor(colors: string[]): string {
    return colors[0] || '#ffffff';
  }

  /**
   * Get the darkest color from a set for text
   */
  private static getDarkestColor(colors: string[]): string {
    return colors[0] || '#000000';
  }

  /**
   * Check if the extracted data is high quality enough for pre-population
   */
  static validateExtractedData(data: ExtractedBrandingData): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

    // Check company info
    if (!data.companyInfo?.name) missingFields.push('Company Name');
    if (!data.companyInfo?.description) missingFields.push('Company Description');

    // Check brand design
    if (!data.primaryColors?.length) missingFields.push('Brand Colors');
    if (!data.fonts?.primary) missingFields.push('Typography');

    // Check content
    if (!data.contentData?.headlines?.length) missingFields.push('Headlines');
    if (!data.contentData?.valuePropositions?.length) missingFields.push('Value Propositions');

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }
}