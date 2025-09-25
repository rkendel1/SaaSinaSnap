import type { CreatorProfile, CreatorProduct } from '../types';
import type { ExtractedBrandingData } from '@/features/creator-onboarding/types';
import { getBrandingStyles, type CreatorBranding } from '@/utils/branding-utils';
import { generateAutoGradient, type GradientConfig } from '@/utils/gradient-utils';
import { EmbedAssetConfig } from '../types/embed-assets'; // Import EmbedAssetConfig

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
  customization?: EmbedAssetConfig; // Changed to EmbedAssetConfig
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
    const branding = EnhancedEmbedGeneratorService.createEnhancedBranding(creator, customization);
    const brandingStyles = getBrandingStyles(branding);

    // Apply AI customization if provided
    const enhancedOptions = aiPrompt 
      ? await EnhancedEmbedGeneratorService.applyAICustomization(options, aiPrompt)
      : options;

    // Generate embed based on type
    let generatedEmbed;

    switch (embedType) {
      case 'product_card':
        generatedEmbed = EnhancedEmbedGeneratorService.generateProductCard(enhancedOptions, brandingStyles);
        break;
      case 'checkout_button':
        generatedEmbed = EnhancedEmbedGeneratorService.generateCheckoutButton(enhancedOptions, brandingStyles);
        break;
      case 'pricing_table':
        generatedEmbed = EnhancedEmbedGeneratorService.generatePricingTable(enhancedOptions, brandingStyles);
        break;
      case 'header':
        generatedEmbed = EnhancedEmbedGeneratorService.generateHeader(enhancedOptions, brandingStyles);
        break;
      case 'hero_section':
        generatedEmbed = EnhancedEmbedGeneratorService.generateHeroSection(enhancedOptions, brandingStyles);
        break;
      case 'product_description':
        generatedEmbed = EnhancedEmbedGeneratorService.generateProductDescription(enhancedOptions, brandingStyles);
        break;
      case 'testimonial_section':
        generatedEmbed = EnhancedEmbedGeneratorService.generateTestimonialSection(enhancedOptions, brandingStyles);
        break;
      case 'footer':
        generatedEmbed = EnhancedEmbedGeneratorService.generateFooter(enhancedOptions, brandingStyles);
        break;
      case 'custom':
        generatedEmbed = EnhancedEmbedGeneratorService.generateCustomEmbed(enhancedOptions, brandingStyles);
        break;
      default:
        throw new Error(`Unsupported embed type: ${embedType}`);
    }

    // Calculate brand alignment score
    const brandAlignment = EnhancedEmbedGeneratorService.calculateBrandAlignment(creator, generatedEmbed);
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
      brandGradient: creator.brand_gradient || EnhancedEmbedGeneratorService.generateAutoGradient(primaryColor),
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

    // Layout customization (now directly on customization object)
    if (promptLower.includes('compact') || promptLower.includes('small')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        width: '300px', padding: '16px'
      };
    } else if (promptLower.includes('large') || promptLower.includes('wide')) {
      enhancedOptions.customization = {
        ...enhancedOptions.customization,
        width: '600px', padding: '32px'
      };
    }

    return enhancedOptions;
  }

  /**
   * Generate product card embed
   */
  private static generateProductCard(
    options: EmbedGenerationOptions, 
    brandingStyles: any // Explicitly type as any for now
  ): GeneratedEmbed {
    const { creator, product, customization } = options;
    
    if (!product) {
      throw new Error('Product is required for product card embed');
    }

    const features = customization?.features || [
      'Full access to all features',
      '24/7 customer support',
      'Cancel anytime'
    ];

    const width = customization?.width || '320px'; // Use direct property
    const padding = customization?.padding || '24px'; // Use direct property
    const borderRadius = customization?.borderRadius || '12px'; // Use direct property

    const html = `
      <div class="product-card" style="
        width: ${width};
        max-width: 100%;
        border: 2px solid ${brandingStyles.brandColor};
        border-radius: ${borderRadius};
        background: #ffffff;
        padding: ${padding};
        font-family: ${customization?.fontFamily || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif'};
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
            ${EnhancedEmbedGeneratorService.formatPrice(product.price || 0, product.currency || 'USD')}
            <span style="font-size: 16px; color: #6b7280; font-weight: 400;">
              ${EnhancedEmbedGeneratorService.getPriceLabel(product.product_type)}
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

        <a href="${EnhancedEmbedGeneratorService.getPricingPageUrl(creator)}" 
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

    const embedCode = EnhancedEmbedGeneratorService.generateEmbedCode(creator.id, 'product_card', product.id);

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
          ...(customization?.width || customization?.padding || customization?.borderRadius ? ['custom-layout'] : [])
        ]
      }
    };
  }

  /**
   * Generate hero section embed
   */
  private static generateHeroSection(
    options: EmbedGenerationOptions, 
    brandingStyles: any // Explicitly type as any for now
  ): GeneratedEmbed {
    const { creator, customization } = options;
    
    const title = customization?.title || (creator.business_name ? `Welcome to ${creator.business_name}` : 'Welcome to SaaSinaSnap');
    const description = customization?.description || creator.business_description || 'SaaS in a Snap - Get your business running quickly and efficiently.';
    
    const voiceTone = customization?.voiceAndTone;
    const isPlayful = voiceTone?.tone === 'playful';
    const isProfessional = voiceTone?.tone === 'professional';

    const ctaText = customization?.ctaText || (isPlayful ? '🚀 Let\'s Go!' : isProfessional ? 'Get Started Today' : 'Start Your Journey');

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
        font-family: ${customization?.fontFamily || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif'};
        color: #1f2937';
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
            <a href="${EnhancedEmbedGeneratorService.getPricingPageUrl(creator)}" 
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
               ">
              ${ctaText}
            </a>
            
            <a href="${EnhancedEmbedGeneratorService.getHomeUrl(creator)}" 
               target="_blank"
               rel="noopener noreferrer"
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
               ">
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

    const embedCode = EnhancedEmbedGeneratorService.generateEmbedCode(creator.id, 'hero_section');

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
          ...(customization?.title || customization?.description || customization?.ctaText ? ['custom-content'] : [])
        ]
      }
    };
  }

  private static generateProductDescription(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { creator, product, customization } = options;
    
    if (!product) throw new Error('Product required for product description');

    const title = customization?.title || product.name;
    const description = customization?.description || product.description || 'Experience the best with our premium offering designed to meet all your needs.';
    const ctaText = customization?.ctaText || 'Learn More';

    const html = `
      <div style="
        max-width: ${customization?.width || '600px'};
        padding: ${customization?.padding || '32px'};
        background: ${customization?.backgroundColor || 'white'};
        border-radius: ${customization?.borderRadius || '12px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-family: ${customization?.fontFamily || 'sans-serif'};
        margin: ${customization?.margin || '16px auto'};
        color: ${customization?.textColor || '#1f2937'};
      ">
        <h2 style="
          color: ${brandingStyles.brandColor};
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 700;
        ">${title}</h2>
        
        <p style="
          color: ${customization?.textColor || '#6b7280'};
          line-height: 1.6;
          margin: 0 0 24px 0;
          font-size: 16px;
        ">${description}</p>
        
        <a href="${EnhancedEmbedGeneratorService.getPricingPageUrl(creator)}" 
           target="_blank"
           rel="noopener noreferrer"
           style="
             background: ${brandingStyles.brandColor};
             color: white;
             padding: 12px 24px;
             border-radius: 8px;
             text-decoration: none;
             font-weight: 600;
             display: inline-block;
             transition: all 0.2s ease;
           ">
          ${ctaText}
        </a>
      </div>
    `;
    
    return {
      html,
      css: '',
      embedCode: EnhancedEmbedGeneratorService.generateEmbedCode(creator.id, 'product_description', product.id),
      metadata: {
        type: 'product_description',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors', 
          'content-styling',
          ...(customization?.title ? ['custom-title'] : []),
          ...(customization?.description ? ['custom-description'] : []),
          ...(customization?.ctaText ? ['custom-cta-text'] : [])
        ]
      }
    };
  }

  private static generateTestimonialSection(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { creator, customization } = options;
    
    const testimonials = customization?.testimonials || [
      { text: "This platform has transformed how we do business. Highly recommended!", author: "Sarah Johnson", role: "CEO, TechCorp" },
      { text: "Amazing customer support and great value for money.", author: "Mike Chen", role: "Freelancer" },
      { text: "The best investment we've made for our company this year.", author: "Emma Davis", role: "Marketing Director" }
    ];

    const title = customization?.title || 'What Our Customers Say';
    const description = customization?.description || `Join thousands of satisfied customers who trust ${creator.business_name || 'our platform'}`;
    const ctaText = customization?.ctaText || 'Join Our Happy Customers';

    const html = `
      <section style="
        padding: 80px 24px;
        background: linear-gradient(135deg, #f9fafb, #ffffff);
        text-align: center;
        font-family: ${customization?.fontFamily || 'sans-serif'};
        color: ${customization?.textColor || '#1f2937'};
      ">
        <div style="max-width: ${customization?.width || '1200px'}; margin: 0 auto;">
          <h2 style="
            font-size: 36px;
            font-weight: 800;
            margin: 0 0 16px 0;
            color: ${customization?.textColor || '#1f2937'};
          ">${title}</h2>
          
          <p style="
            font-size: 18px;
            color: ${customization?.textColor || '#6b7280'};
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
            ${testimonials.map((testimonial: { rating?: number; text: string; author: string; role?: string }) => `
              <div style="
                background: white;
                padding: 32px;
                border-radius: ${customization?.borderRadius || '16px'};
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid ${customization?.borderColor || '#e5e7eb'};
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
          
          <a href="${EnhancedEmbedGeneratorService.getPricingPageUrl(creator)}" 
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

    const embedCode = EnhancedEmbedGeneratorService.generateEmbedCode(creator.id, 'testimonial_section');

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
          ...(customization?.testimonials ? ['custom-testimonials'] : [])
        ]
      }
    };
  }

  /**
   * Generate other embed types (simplified for brevity)
   */
  private static generateCheckoutButton(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { creator, product, customization } = options;
    
    if (!product) throw new Error('Product required for checkout button');

    const html = `
      <button onclick="window.open('${EnhancedEmbedGeneratorService.getPricingPageUrl(creator)}', '_blank')" style="
        background: ${brandingStyles.brandColor};
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        ${customization?.ctaText || `Buy ${product.name} - ${EnhancedEmbedGeneratorService.formatPrice(product.price || 0, product.currency || 'USD')}`}
      </button>
    `;

    return {
      html,
      css: '',
      embedCode: EnhancedEmbedGeneratorService.generateEmbedCode(creator.id, 'checkout_button', product.id),
      metadata: {
        type: 'checkout_button',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors', 
          'hover-effects',
          ...(customization?.ctaText ? ['custom-cta-text'] : [])
        ]
      }
    };
  }

  private static generatePricingTable(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    // Simplified pricing table implementation
    const { creator, customization } = options;
    
    const html = `
      <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 12px;">
        <h3 style="color: ${brandingStyles.brandColor}; margin-bottom: 24px;">${customization?.title || 'Choose Your Plan'}</h3>
        <a href="${EnhancedEmbedGeneratorService.getPricingPageUrl(creator)}" style="
          background: ${brandingStyles.brandColor};
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
        ">${customization?.ctaText || 'View All Plans'}</a>
      </div>
    `;

    return {
      html,
      css: '',
      embedCode: EnhancedEmbedGeneratorService.generateEmbedCode(creator.id, 'pricing_table'),
      metadata: {
        type: 'pricing_table',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          ...(customization?.title ? ['custom-title'] : []),
          ...(customization?.ctaText ? ['custom-cta-text'] : [])
        ]
      }
    };
  }

  private static generateFooter(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { creator, customization } = options;
    
    const html = `
      <footer style="
        background: #1f2937;
        color: white;
        padding: 40px 24px 24px;
        text-align: center;
      ">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h3 style="color: ${brandingStyles.brandColor}; margin-bottom: 16px;">${customization?.title || creator.business_name || 'Brand'}</h3>
          <p style="color: #9ca3af; margin-bottom: 24px;">© ${new Date().getFullYear()} All rights reserved.</p>
          <a href="${EnhancedEmbedGeneratorService.getPricingPageUrl(creator)}" style="
            color: ${brandingStyles.brandColor};
            text-decoration: none;
            font-weight: 600;
          ">${customization?.ctaText || 'Get Started Today'}</a>
        </div>
      </footer>
    `;

    return {
      html,
      css: '',
      embedCode: EnhancedEmbedGeneratorService.generateEmbedCode(creator.id, 'footer'),
      metadata: {
        type: 'footer',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors', 
          'dark-theme',
          ...(customization?.title ? ['custom-title'] : []),
          ...(customization?.ctaText ? ['custom-cta-text'] : [])
        ]
      }
    };
  }

  private static generateCustomEmbed(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { customization } = options;
    
    const html = customization?.customHtml || '<div>Custom embed content</div>';
    const css = customization?.customCss || '';
    const js = customization?.customJs || '';

    return {
      html,
      css,
      javascript: js,
      embedCode: '', // Custom embeds don't have a standard embedCode generated by this service
      metadata: {
        type: 'custom',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: ['custom-html', 'custom-css', 'custom-js']
      }
    };
  }

  private static generateHeader(options: EmbedGenerationOptions, brandingStyles: any): GeneratedEmbed {
    const { creator, customization } = options;
    const homeUrl = EnhancedEmbedGeneratorService.getHomeUrl(creator);
    const pricingUrl = EnhancedEmbedGeneratorService.getPricingPageUrl(creator);

    const html = `
      <header style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: ${customization?.padding || '1rem 1.5rem'};
        background-color: ${customization?.backgroundColor || '#ffffff'};
        border-bottom: 1px solid ${customization?.borderColor || '#e5e7eb'};
        font-family: ${customization?.fontFamily || 'sans-serif'};
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        color: ${customization?.textColor || '#1f2937'};
      ">
        <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: flex; align-items: center;">
          ${customization?.showLogo && creator.business_logo_url ? `
            <img src="${creator.business_logo_url}" 
                 alt="${creator.business_name || 'Business Logo'}" 
                 style="height: 2.5rem; width: auto; margin-right: 0.5rem;">
          ` : `
            <div style="font-size: 1.5rem; font-weight: 700; color: ${brandingStyles.brandColor};">
              ${creator.business_name || 'SaaSinaSnap'}
            </div>
          `}
        </a>
        
        <nav style="display: flex; align-items: center; gap: 1.5rem;">
          ${(customization?.navigationItems || [{label: 'Home', url: homeUrl}, {label: 'Pricing', url: pricingUrl}]).map((item: { label: string; url: string }) => `
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: ${customization?.textColor || '#4b5563'}; text-decoration: none; font-weight: 500; transition: color 0.2s ease-in-out;">
              ${item.label}
            </a>
          `).join('')}
          <a 
            href="${pricingUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: ${customization?.borderRadius || '0.5rem'};
              padding: 0.5rem 1rem;
              text-align: center;
              font-weight: 600;
              color: ${customization?.buttonTextColor || '#ffffff'};
              background: ${customization?.buttonColor || brandingStyles.brandColor};
              border: ${customization?.buttonStyle === 'outline' ? `2px solid ${brandingStyles.brandColor}` : 'none'};
              transition: all 0.2s ease-in-out;
              text-decoration: none;
              font-size: 0.875rem;
            "
          >
            ${customization?.ctaText || 'Get Started'}
          </a>
        </nav>
      </header>
    `;

    return {
      html,
      css: '',
      embedCode: EnhancedEmbedGeneratorService.generateEmbedCode(creator.id, 'header'),
      metadata: {
        type: 'header',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          'navigation',
          ...(customization?.showLogo ? ['custom-logo'] : []),
          ...(customization?.navigationItems ? ['custom-navigation'] : [])
        ]
      }
    };
  }

  /**
   * Helper methods
   */
  private static generateAutoGradient(primaryColor: string): GradientConfig {
    return {
      type: 'linear',
      colors: [primaryColor, `${primaryColor}80`],
      direction: 45
    };
  }

  private static formatPrice(price: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  }

  private static getPriceLabel(productType: string | null) {
    switch (productType) {
      case 'subscription': return '/month';
      case 'usage_based': return '/usage';
      default: return '';
    }
  }

  private static getPricingPageUrl(creator: CreatorProfile) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.page_slug}/pricing`;
  }

  private static getHomeUrl(creator: CreatorProfile) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.page_slug}`;
  }

  private static getAboutUrl(creator: CreatorProfile) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.page_slug}/about`;
  }

  private static generateEmbedCode(creatorId: string, embedType: EnhancedEmbedType, productId?: string) {
    const attributes = [
      `data-creator-id="${creatorId}"`,
      `data-embed-type="${embedType}"`,
      ...(productId ? [`data-product-id="${productId}"`] : [])
    ].join(' ');

    return `<script src="https://paylift.com/embed.js" ${attributes}></script>`;
  }

  private static calculateBrandAlignment(creator: CreatorProfile, embed: GeneratedEmbed) {
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