import type { CreatorProfile, CreatorProduct } from '../types';
import type { ExtractedBrandingData } from '@/features/creator-onboarding/types';
import { getBrandingStyles, type CreatorBranding } from '@/utils/branding-utils';

export type EnhancedEmbedType = 
  | 'product_card' 
  | 'checkout_button' 
  | 'pricing_table' 
  | 'header' 
  | 'hero_section' 
  | 'product_description' 
  | 'testimonial_section'
  | 'footer'
  | 'trial_embed'
  | 'custom';

export interface EmbedGenerationOptions {
  embedType: EnhancedEmbedType;
  creator: CreatorProfile;
  product?: CreatorProduct;
  customization?: {
    colors?: string[];
    fonts?: string[];
    primaryColor?: string; // Added
    fontFamily?: string; // Added
    voiceAndTone?: {
      tone: string;
      voice: string;
    };
    content?: {
      title?: string;
      description?: string;
      features?: string[];
      testimonials?: Array<{
        text: string;
        author: string;
        role?: string;
        rating?: number; // Added
      }>;
      ctaText?: string;
    };
    layout?: {
      width?: string;
      height?: string;
      padding?: string;
      borderRadius?: string;
    };
  };
  aiPrompt?: string; // For conversational AI customization
}

export interface GeneratedEmbed {
  html: string;
  css: string;
  javascript?: string;
  previewUrl?: string;
  embedCode: string;
  metadata: {
    type: EnhancedEmbedType;
    generatedAt: string;
    brandAlignment: number; // 0-1 score of how well it aligns with brand
    customizations: string[];
  };
}

export class EnhancedEmbedGeneratorService {
  /**
   * Generate an enhanced embed based on extracted branding data and AI customization
   */
  static async generateEmbed(options: EmbedGenerationOptions): Promise<GeneratedEmbed> {
    const { embedType, creator, product, customization, aiPrompt } = options;

    // Create branding object from creator profile and extracted data
    const branding = this.createEnhancedBranding(creator, customization);
    const brandingStyles = getBrandingStyles(branding);

    // Apply AI customization if provided
    const enhancedOptions = aiPrompt 
      ? await this.applyAICustomization(options, aiPrompt)
      : options;

    // Generate embed based on type
    let generatedEmbed: GeneratedEmbed;

    switch (embedType) {
      case 'product_card':
        generatedEmbed = this.generateProductCard(enhancedOptions, brandingStyles);
        break;
      case 'checkout_button':
        generatedEmbed = this.generateCheckoutButton(enhancedOptions, brandingStyles);
        break;
      case 'pricing_table':
        generatedEmbed = this.generatePricingTable(enhancedOptions, brandingStyles);
        break;
      case 'header':
        generatedEmbed = this.generateHeader(enhancedOptions, brandingStyles);
        break;
      case 'hero_section':
        generatedEmbed = this.generateHeroSection(enhancedOptions, brandingStyles);
        break;
      case 'product_description':
        generatedEmbed = this.generateProductDescription(enhancedOptions, brandingStyles);
        break;
      case 'testimonial_section':
        generatedEmbed = this.generateTestimonialSection(enhancedOptions, brandingStyles);
        break;
      case 'footer':
        generatedEmbed = this.generateFooter(enhancedOptions, brandingStyles);
        break;
      case 'custom':
        generatedEmbed = this.generateCustomEmbed(enhancedOptions, brandingStyles);
        break;
      default:
        throw new Error(`Unsupported embed type: ${embedType}`);
    }

    // Calculate brand alignment score
    const brandAlignment = this.calculateBrandAlignment(creator, generatedEmbed);
    generatedEmbed.metadata.brandAlignment = brandAlignment;

    return generatedEmbed;
  }

  /**
   * Create enhanced branding object combining creator profile and extracted data
   */
  private static createEnhancedBranding(
    creator: CreatorProfile, 
    customization?: EmbedGenerationOptions['customization']
  ): CreatorBranding {
    const extractedData = creator.extracted_branding_data;
    
    // Use extracted primary color as brand color if available, otherwise use creator's brand color
    const primaryColor = customization?.colors?.[0] 
      || extractedData?.primaryColors?.[0] 
      || creator.brand_color 
      || '#3b82f6';

    return {
      brandColor: primaryColor,
      brandGradient: creator.brand_gradient || this.generateAutoGradient(primaryColor),
      brandPattern: creator.brand_pattern || null,
    };
  }

  /**
   * Apply AI customization based on conversational prompt
   */
  private static async applyAICustomization(
    options: EmbedGenerationOptions, 
    prompt: string
  ): Promise<EmbedGenerationOptions> {
    // This is a simplified AI customization - in a real implementation,
    // you would integrate with an AI service like OpenAI GPT or similar
    
    const enhancedOptions = { ...options };
    
    // Parse prompt for common customization requests
    const promptLower = prompt.toLowerCase();
    
    // Color customization
    if (promptLower.includes('blue') || promptLower.includes('navy')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        colors: ['#1e40af', '#3b82f6', '#60a5fa']
      };
    } else if (promptLower.includes('red') || promptLower.includes('crimson')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        colors: ['#dc2626', '#ef4444', '#f87171']
      };
    } else if (promptLower.includes('green') || promptLower.includes('emerald')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        colors: ['#059669', '#10b981', '#34d399']
      };
    }

    // Voice and tone customization
    if (promptLower.includes('professional') || promptLower.includes('business')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        voiceAndTone: { tone: 'professional', voice: 'formal' }
      };
    } else if (promptLower.includes('friendly') || promptLower.includes('casual')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        voiceAndTone: { tone: 'friendly', voice: 'conversational' }
      };
    } else if (promptLower.includes('playful') || promptLower.includes('fun')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        voiceAndTone: { tone: 'playful', voice: 'informal' }
      };
    }

    // Layout customization
    if (promptLower.includes('compact') || promptLower.includes('small')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        layout: { width: '300px', padding: '16px' }
      };
    } else if (promptLower.includes('large') || promptLower.includes('wide')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        layout: { width: '600px', padding: '32px' }
      };
    }

    return enhancedOptions;
  }

  /**
   * Generate product card embed
   */
  private static generateProductCard(
    options: EmbedGenerationOptions, 
    brandingStyles: any
  ): GeneratedEmbed {
    const { creator, product, customization } = options;
    
    if (!product) {
      throw new Error('Product is required for product card embed');
    }

    const features = customization?.content?.features || [
      'Full access to all features',
      '24/7 customer support',
      'Cancel anytime'
    ];

    const layout = customization?.layout || {};
    const width = layout.width || '400px';
    const padding = layout.padding || '24px';
    const borderRadius = layout.borderRadius || '12px';

    const html = `
      <div class="product-card" style="
        width: ${width};
        max-width: 100%;
        border: 2px solid ${brandingStyles.brandColor};
        border-radius: ${borderRadius};
        background: #ffffff;
        padding: ${padding};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        margin: 16px;
      ">
        <div class="product-header" style="text-align: center; margin-bottom: 20px;">
          <h3 style="
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
          ">${product.name}</h3>
          <div style="
            font-size: 32px;
            font-weight: 800;
            color: ${brandingStyles.brandColor};
            margin-bottom: 4px;
          ">
            ${this.formatPrice(product.price || 0, product.currency || 'USD')}
            <span style="font-size: 16px; color: #6b7280; font-weight: 400;">
              ${this.getPriceLabel(product.product_type)}
            </span>
          </div>
        </div>

        <ul style="
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
        ">
          ${features.map(feature => `
            <li style="
              display: flex;
              align-items: center;
              margin-bottom: 12px;
              font-size: 14px;
              color: #4b5563;
            ">
              <svg style="
                width: 20px;
                height: 20px;
                margin-right: 12px;
                fill: ${brandingStyles.brandColor};
                flex-shrink: 0;
              " viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              ${feature}
            </li>
          `).join('')}
        </ul>

        <a href="${this.getPricingPageUrl(creator)}" 
           target="_blank" 
           rel="noopener noreferrer"
           style="
             display: inline-flex;
             width: 100%;
             align-items: center;
             justify-content: center;
             padding: 12px 24px;
             background: ${brandingStyles.brandColor};
             color: white;
             text-decoration: none;
             border-radius: 8px;
             font-weight: 600;
             font-size: 16px;
             transition: all 0.2s ease;
             border: none;
             cursor: pointer;
           "
           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)';"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
          Get Started
        </a>
      </div>
    `;

    const css = `
      .product-card {
        transition: all 0.3s ease;
      }
      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
      }
    `;

    const embedCode = this.generateEmbedCode(creator.id, 'product_card', product.id);

    return {
      html,
      css,
      embedCode,
      metadata: {
        type: 'product_card',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          'typography',
          'spacing',
          ...(customization?.colors ? ['custom-colors'] : []),
          ...(customization?.layout ? ['custom-layout'] : [])
        ]
      }
    };
  }

  /**
   * Generate hero section embed
   */
  private static generateHeroSection(
    options: EmbedGenerationOptions, 
    brandingStyles: any
  ): GeneratedEmbed {
    const { creator, customization } = options;
    
    const title = customization?.content?.title || `Welcome to ${creator.business_name || 'Our Platform'}`;
    const description = customization?.content?.description || creator.business_description || 'SaaS in a Snap - Get your business running quickly and efficiently.';
    
    const voiceTone = customization?.voiceAndTone;
    const isPlayful = voiceTone?.tone === 'playful';
    const isProfessional = voiceTone?.tone === 'professional';

    const ctaText = customization?.content?.ctaText || (isPlayful ? '🚀 Let\'s Go!' : isProfessional ? 'Get Started Today' : 'Start Your Journey');

    const html = `
      <section class="hero-section" style="
        background: linear-gradient(135deg, ${brandingStyles.brandColor}15, ${brandingStyles.brandColor}05);
        padding: 80px 24px;
        text-align: center;
        min-height: 500px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1f2937;
      ">
        <div style="max-width: 800px; position: relative; z-index: 2;">
          <h1 style="
            font-size: clamp(32px, 5vw, 56px);
            font-weight: 800;
            margin: 0 0 24px 0;
            line-height: 1.2;
            background: linear-gradient(45deg, ${brandingStyles.brandColor}, ${brandingStyles.brandColor}80);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
          ">${title}</h1>
          
          <p style="
            font-size: clamp(18px, 2.5vw, 24px);
            color: #4b5563;
            margin: 0 0 40px 0;
            line-height: 1.6;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          ">${description}</p>
          
          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="${this.getPricingPageUrl(creator)}" 
               style="
                 display: inline-flex;
                 align-items: center;
                 padding: 16px 32px;
                 background: ${brandingStyles.brandColor};
                 color: white;
                 text-decoration: none;
                 border-radius: 50px;
                 font-weight: 600;
                 font-size: 18px;
                 transition: all 0.3s ease;
                 box-shadow: 0 4px 15px ${brandingStyles.brandColor}40;
               "
               onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px ${brandingStyles.brandColor}60';"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px ${brandingStyles.brandColor}40';">
              ${ctaText}
            </a>
            
            <a href="${this.getAboutUrl(creator)}" 
               style="
                 display: inline-flex;
                 align-items: center;
                 padding: 16px 32px;
                 background: transparent;
                 color: ${brandingStyles.brandColor};
                 text-decoration: none;
                 border: 2px solid ${brandingStyles.brandColor};
                 border-radius: 50px;
                 font-weight: 600;
                 font-size: 18px;
                 transition: all 0.3s ease;
               "
               onmouseover="this.style.background='${brandingStyles.brandColor}'; this.style.color='white';"
               onmouseout="this.style.background='transparent'; this.style.color='${brandingStyles.brandColor}';">
              Learn More
            </a>
          </div>
        </div>
        
        <!-- Decorative elements -->
        <div style="
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, ${brandingStyles.brandColor}08 1px, transparent 1px);
          background-size: 50px 50px;
          animation: float 20s ease-in-out infinite;
          z-index: 1;
        "></div>
      </section>
    `;

    const css = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
      
      .hero-section {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      @media (max-width: 768px) {
        .hero-section {
          padding: 60px 16px;
          min-height: 400px;
        }
      }
    `;

    const embedCode = this.generateEmbedCode(creator.id, 'hero_section');

    return {
      html,
      css,
      embedCode,
      metadata: {
        type: 'hero_section',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          'responsive-design',
          'animations',
          ...(customization?.voiceAndTone ? ['voice-tone-adaptation'] : []),
          ...(customization?.content ? ['custom-content'] : [])
        ]
      }
    };
  }

  /**
   * Generate header embed
   */
  private static generateHeader(
    options: EmbedGenerationOptions, 
    brandingStyles: any
  ): GeneratedEmbed {
    const { creator } = options;
    
    const html = `
      <header style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid #e5e7eb;
        position: sticky;
        top: 0;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="display: flex; align-items: center;">
          ${creator.business_logo_url ? `
            <img src="${creator.business_logo_url}" 
                 alt="${creator.business_name || 'Logo'}" 
                 style="height: 40px; width: auto; margin-right: 12px;">
          ` : ''}
          <h1 style="
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: ${brandingStyles.brandColor};
          ">${creator.business_name || 'Brand'}</h1>
        </div>
        
        <nav style="display: flex; align-items: center; gap: 24px;">
          <a href="${this.getHomeUrl(creator)}" 
             style="
               color: #4b5563;
               text-decoration: none;
               font-weight: 500;
               transition: color 0.2s ease;
             "
             onmouseover="this.style.color='${brandingStyles.brandColor}'"
             onmouseout="this.style.color='#4b5563'">
            Home
          </a>
          <a href="${this.getPricingPageUrl(creator)}" 
             style="
               color: #4b5563;
               text-decoration: none;
               font-weight: 500;
               transition: color 0.2s ease;
             "
             onmouseover="this.style.color='${brandingStyles.brandColor}'"
             onmouseout="this.style.color='#4b5563'">
            Pricing
          </a>
          <a href="${this.getPricingPageUrl(creator)}" 
             style="
               background: ${brandingStyles.brandColor};
               color: white;
               padding: 10px 20px;
               border-radius: 6px;
               text-decoration: none;
               font-weight: 600;
               font-size: 14px;
               transition: all 0.2s ease;
             "
             onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            Get Started
          </a>
        </nav>
      </header>
    `;

    const css = `
      @media (max-width: 768px) {
        header nav {
          gap: 16px !important;
        }
        header nav a {
          font-size: 14px;
        }
      }
    `;

    const embedCode = this.generateEmbedCode(creator.id, 'header');

    return {
      html,
      css,
      embedCode,
      metadata: {
        type: 'header',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          'sticky-navigation',
          'responsive-design',
          'backdrop-blur'
        ]
      }
    };
  }

  /**
   * Generate testimonial section embed
   */
  private static generateTestimonialSection(
    options: EmbedGenerationOptions, 
    brandingStyles: any
  ): GeneratedEmbed {
    const { creator, customization } = options;
    
    const testimonials = customization?.content?.testimonials || [
      {
        text: "This platform has transformed how we do business. Highly recommended!",
        author: "Sarah Johnson",
        role: "CEO, TechCorp"
      },
      {
        text: "Amazing customer support and great value for money.",
        author: "Mike Chen",
        role: "Freelancer"
      },
      {
        text: "The best investment we've made for our company this year.",
        author: "Emma Davis",
        role: "Marketing Director"
      }
    ];

    const title = customization?.content?.title || 'What Our Customers Say';
    const description = customization?.content?.description || `Join thousands of satisfied customers who trust ${creator.business_name || 'our platform'}`;
    const ctaText = customization?.content?.ctaText || 'Join Our Happy Customers';

    const html = `
      <section style="
        padding: 80px 24px;
        background: linear-gradient(135deg, #f9fafb, #ffffff);
        text-align: center;
      ">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h2 style="
            font-size: 36px;
            font-weight: 800;
            margin: 0 0 16px 0;
            color: #1f2937;
          ">What Our Customers Say</h2>
          
          <p style="
            font-size: 18px;
            color: #6b7280;
            margin: 0 0 48px 0;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          ">${description}</p>
          
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 32px;
            margin-bottom: 48px;
          ">
            ${testimonials.map(testimonial => `
              <div style="
                background: white;
                padding: 32px;
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e5e7eb;
                transition: all 0.3s ease;
              "
              onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 25px rgba(0,0,0,0.1)'"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.05)'">
                <div style="
                  display: flex;
                  justify-content: center;
                  margin-bottom: 16px;
                ">
                  ${Array(testimonial.rating || 5).fill(0).map(() => `
                    <svg style="width: 20px; height: 20px; fill: #fbbf24; margin: 0 2px;" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  `).join('')}
                </div>
                
                <blockquote style="
                  font-size: 16px;
                  line-height: 1.6;
                  color: #374151;
                  margin: 0 0 24px 0;
                  font-style: italic;
                ">"${testimonial.text}"</blockquote>
                
                <div>
                  <div style="
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                  ">${testimonial.author}</div>
                  <div style="
                    font-size: 14px;
                    color: ${brandingStyles.brandColor};
                  ">${testimonial.role}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <a href="${this.getPricingPageUrl(creator)}" 
             style="
               display: inline-flex;
               align-items: center;
               padding: 16px 32px;
               background: ${brandingStyles.brandColor};
               color: white;
               text-decoration: none;
               border-radius: 8px;
               font-weight: 600;
               font-size: 18px;
               transition: all 0.3s ease;
             "
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            ${ctaText}
          </a>
        </div>
      </section>
    `;

    const css = `
      @media (max-width: 768px) {
        section {
          padding: 60px 16px !important;
        }
        section > div > div {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    const embedCode = this.generateEmbedCode(creator.id, 'testimonial_section');

    return {
      html,
      css,
      embedCode,
      metadata: {
        type: 'testimonial_section',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          'responsive-grid',
          'hover-effects',
          'star-ratings',
          ...(customization?.content?.testimonials ? ['custom-testimonials'] : [])
        ]
      }
    };
  }

  /**
   * Generate other embed types (simplified for brevity)
   */
  private static generateCheckoutButton(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { creator, product } = options;
    
    if (!product) throw new Error('Product required for checkout button');

    const html = `
      <button onclick="window.open('${this.getPricingPageUrl(creator)}', '_blank')" style="
        background: ${brandingStyles.brandColor};
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        Buy ${product.name} - ${this.formatPrice(product.price || 0, product.currency || 'USD')}
      </button>
    `;

    return {
      html,
      css: '',
      embedCode: this.generateEmbedCode(creator.id, 'checkout_button', product.id),
      metadata: {
        type: 'checkout_button',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: ['brand-colors', 'hover-effects']
      }
    };
  }

  private static generatePricingTable(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    // Simplified pricing table implementation
    const { creator } = options;
    
    const html = `
      <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 12px;">
        <h3 style="color: ${brandingStyles.brandColor}; margin-bottom: 24px;">Choose Your Plan</h3>
        <a href="${this.getPricingPageUrl(creator)}" style="
          background: ${brandingStyles.brandColor};
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
        ">View All Plans</a>
      </div>
    `;

    return {
      html,
      css: '',
      embedCode: this.generateEmbedCode(creator.id, 'pricing_table'),
      metadata: {
        type: 'pricing_table',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: ['brand-colors']
      }
    };
  }

  private static generateProductDescription(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { creator, product } = options;
    
    if (!product) throw new Error('Product required for product description');

    const html = `
      <div style="max-width: 600px; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: ${brandingStyles.brandColor}; margin-bottom: 16px;">${product.name}</h2>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">${product.description || 'Experience the best with our premium offering.'}</p>
        <a href="${this.getPricingPageUrl(creator)}" style="
          background: ${brandingStyles.brandColor};
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
        ">Learn More</a>
      </div>
    `;

    return {
      html,
      css: '',
      embedCode: this.generateEmbedCode(creator.id, 'product_description', product.id),
      metadata: {
        type: 'product_description',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: ['brand-colors', 'content-styling']
      }
    };
  }

  private static generateFooter(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { creator } = options;
    
    const html = `
      <footer style="
        background: #1f2937;
        color: white;
        padding: 40px 24px 24px;
        text-align: center;
      ">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h3 style="color: ${brandingStyles.brandColor}; margin-bottom: 16px;">${creator.business_name || 'Brand'}</h3>
          <p style="color: #9ca3af; margin-bottom: 24px;">© ${new Date().getFullYear()} All rights reserved.</p>
          <a href="${this.getPricingPageUrl(creator)}" style="
            color: ${brandingStyles.brandColor};
            text-decoration: none;
            font-weight: 600;
          ">Get Started Today</a>
        </div>
      </footer>
    `;

    return {
      html,
      css: '',
      embedCode: this.generateEmbedCode(creator.id, 'footer'),
      metadata: {
        type: 'footer',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: ['brand-colors', 'dark-theme']
      }
    };
  }

  private static generateCustomEmbed(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { customization } = options;
    
    const html = customization?.content?.description || '<div>Custom embed content</div>';

    return {
      html,
      css: '',
      embedCode: '',
      metadata: {
        type: 'custom',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: ['custom-html']
      }
    };
  }

  /**
   * Helper methods
   */
  private static generateAutoGradient(primaryColor: string) {
    return {
      type: 'linear' as const,
      colors: [primaryColor, `${primaryColor}80`],
      direction: 45
    };
  }

  private static formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  }

  private static getPriceLabel(productType: string | null): string {
    switch (productType) {
      case 'subscription': return '/month';
      case 'usage_based': return '/usage';
      default: return '';
    }
  }

  private static getPricingPageUrl(creator: CreatorProfile): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.custom_domain || creator.id}/pricing`;
  }

  private static getHomeUrl(creator: CreatorProfile): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.custom_domain || creator.id}`;
  }

  private static getAboutUrl(creator: CreatorProfile): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.custom_domain || creator.id}/about`;
  }

  private static generateEmbedCode(creatorId: string, embedType: string, productId?: string): string {
    const attributes = [
      `data-creator-id="${creatorId}"`,
      `data-embed-type="${embedType}"`,
      ...(productId ? [`data-product-id="${productId}"`] : [])
    ].join(' ');

    return `<script src="https://paylift.com/embed.js" ${attributes}></script>`;
  }

  private static calculateBrandAlignment(creator: CreatorProfile, embed: GeneratedEmbed): number {
    let score = 0.5; // base score

    // Check if embed uses creator's brand color
    if (embed.html.includes(creator.brand_color || '#3b82f6')) {
      score += 0.3;
    }

    // Check if embed includes creator's business name
    if (creator.business_name && embed.html.includes(creator.business_name)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }
}