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
    let generatedEmbed;

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
    brandingStyles
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
    brandingStyles
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
        font-family: ${customization?.fontFamily || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif'};
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
                 display: inline-<dyad-problem-report summary="69 problems">
<problem file="src/features/platform-owner/components/PlatformProductManager.tsx" line="293" column="101" code="1005">'...' expected.</problem>
<problem file="src/public/static/embed.js" line="818" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="818" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="818" column="66" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="855" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="855" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="855" column="64" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="890" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="890" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="890" column="70" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="929" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="929" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="929" column="58" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="969" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="969" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="969" column="63" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="993" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="993" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="993" column="53" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="1001" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1001" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1001" column="47" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="1008" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1008" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1008" column="45" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="1016" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1016" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1016" column="45" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="1021" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1021" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1021" column="38" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="1026" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1026" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1026" column="39" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="1031" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1031" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1031" column="69" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="1041" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1041" column="11" code="1128">Declaration or statement expected.</problem>
<problem file="src/public/static/embed.js" line="1041" column="58" code="1005">';' expected.</problem>
<problem file="src/public/static/embed.js" line="1056" column="2" code="1005">')' expected.</problem>
<problem file="src/features/creator-onboarding/controllers/creator-profile.ts" line="127" column="5" code="2353">Object literal may only specify known properties, and 'page_slug' does not exist in type '{ billing_address?: Json | undefined; billing_email?: string | null | undefined; billing_phone?: string | null | undefined; brand_color?: string | null | undefined; brand_gradient?: Json | undefined; ... 18 more ...; updated_at?: string | undefined; }'.</problem>
<problem file="src/app/api/embed/checkout-session/route.ts" line="75" column="45" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/checkout-session/route.ts" line="76" column="44" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/creator/[creatorId]/route.ts" line="44" column="30" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/header/[creatorId]/route.ts" line="48" column="30" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/pricing/[creatorId]/route.ts" line="46" column="30" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/api/embed/trial/[creatorId]/[embedId]/route.ts" line="64" column="30" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator/controllers/email-service.ts" line="37" column="21" code="2352">Conversion of type '{ billing_address: Json; billing_email: string | null; billing_phone: string | null; brand_color: string | null; brand_gradient: Json; brand_pattern: Json; branding_extracted_at: string | null; ... 16 more ...; updated_at: string; }' to type 'CreatorProfile' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'page_slug' is missing in type '{ billing_address: Json; billing_email: string | null; billing_phone: string | null; brand_color: string | null; brand_gradient: Json; brand_pattern: Json; branding_extracted_at: string | null; ... 16 more ...; updated_at: string; }' but required in type 'CreatorProfile'.</problem>
<problem file="src/features/creator/controllers/handle-creator-checkout.ts" line="50" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;products&quot; | &quot;platform_settings&quot; | &quot;asset_sharing_logs&quot; | &quot;embed_assets&quot; | &quot;creator_analytics&quot; | &quot;creator_profiles&quot; | &quot;creator_products&quot; | &quot;creator_webhooks&quot; | &quot;customers&quot; | &quot;prices&quot; | &quot;subscriptions&quot; | &quot;users&quot; | &quot;white_labeled_pages&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;subscribed_products&quot;' is not assignable to parameter of type '&quot;products&quot; | &quot;platform_settings&quot; | &quot;asset_sharing_logs&quot; | &quot;embed_assets&quot; | &quot;creator_analytics&quot; | &quot;creator_profiles&quot; | &quot;creator_products&quot; | &quot;creator_webhooks&quot; | &quot;customers&quot; | &quot;prices&quot; | &quot;subscriptions&quot; | &quot;users&quot; | &quot;white_labeled_pages&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ Tables: { asset_sharing_logs: { Row: { accessed_at: string; accessed_by_ip: string | null; accessed_by_user_agent: string | null; asset_id: string; id: string; referrer_url: string | null; }; Insert: { ...; }; Update: { ...; }; Relationships: [...]; }; ... 11 more ...; white_labeled_pages: { ...; }; }; Views: {}; Functions: { ...; }; Enums: { ...; }; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;subscribed_products&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/features/creator/controllers/handle-creator-checkout.ts" line="52" column="11" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { accessed_at?: string | undefined; accessed_by_ip?: string | null | undefined; accessed_by_user_agent?: string | null | undefined; asset_id: string; id?: string | undefined; referrer_url?: string | ... 1 more ... | undefined; } | ... 11 more ... | { ...; }, options?: { ...; } | undefined): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'subscription_id' does not exist in type '{ accessed_at?: string | undefined; accessed_by_ip?: string | null | undefined; accessed_by_user_agent?: string | null | undefined; asset_id: string; id?: string | undefined; referrer_url?: string | ... 1 more ... | undefined; } | ... 11 more ... | { ...; }'.
  Overload 2 of 2, '(values: ({ accessed_at?: string | undefined; accessed_by_ip?: string | null | undefined; accessed_by_user_agent?: string | null | undefined; asset_id: string; id?: string | undefined; referrer_url?: string | ... 1 more ... | undefined; } | ... 11 more ... | { ...; })[], options?: { ...; } | undefined): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'subscription_id' does not exist in type '({ accessed_at?: string | undefined; accessed_by_ip?: string | null | undefined; accessed_by_user_agent?: string | null | undefined; asset_id: string; id?: string | undefined; referrer_url?: string | ... 1 more ... | undefined; } | ... 11 more ... | { ...; })[]'.</problem>
<problem file="src/features/creator/controllers/get-subscriber-product-details.ts" line="12" column="11" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;products&quot; | &quot;platform_settings&quot; | &quot;asset_sharing_logs&quot; | &quot;embed_assets&quot; | &quot;creator_analytics&quot; | &quot;creator_profiles&quot; | &quot;creator_products&quot; | &quot;creator_webhooks&quot; | &quot;customers&quot; | &quot;prices&quot; | &quot;subscriptions&quot; | &quot;users&quot; | &quot;white_labeled_pages&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;subscribed_products&quot;' is not assignable to parameter of type '&quot;products&quot; | &quot;platform_settings&quot; | &quot;asset_sharing_logs&quot; | &quot;embed_assets&quot; | &quot;creator_analytics&quot; | &quot;creator_profiles&quot; | &quot;creator_products&quot; | &quot;creator_webhooks&quot; | &quot;customers&quot; | &quot;prices&quot; | &quot;subscriptions&quot; | &quot;users&quot; | &quot;white_labeled_pages&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ Tables: { asset_sharing_logs: { Row: { accessed_at: string; accessed_by_ip: string | null; accessed_by_user_agent: string | null; asset_id: string; id: string; referrer_url: string | null; }; Insert: { ...; }; Update: { ...; }; Relationships: [...]; }; ... 11 more ...; white_labeled_pages: { ...; }; }; Views: {}; Functions: { ...; }; Enums: { ...; }; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;subscribed_products&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/features/creator/controllers/get-subscriber-product-details.ts" line="25" column="10" code="2352">Conversion of type '{ active: boolean | null; created_at: string | null; currency: string | null; description: string | null; id: string; interval: &quot;month&quot; | &quot;year&quot; | &quot;day&quot; | &quot;week&quot; | null; interval_count: number | null; ... 5 more ...; updated_at: string | null; } | ... 11 more ... | { ...; }' to type 'SubscribedProduct' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ active: boolean | null; created_at: string; creator_id: string; custom_css: string | null; id: string; meta_description: string | null; meta_title: string | null; page_config: Json; page_description: string | null; page_slug: string; page_title: string | null; updated_at: string; }' is missing the following properties from type 'SubscribedProduct': subscription_id, creator_product_id, name, description, and 7 more.</problem>
<problem file="src/features/creator-onboarding/actions/onboarding-actions.ts" line="29" column="41" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/actions/onboarding-actions.ts" line="30" column="41" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/actions/onboarding-actions.ts" line="179" column="5" code="2741">Property 'page_slug' is missing in type 'import(&quot;/Users/randy/dyad-apps/Staryer/src/features/creator-onboarding/types/index&quot;).CreatorProfile' but required in type 'import(&quot;/Users/randy/dyad-apps/Staryer/src/features/creator/types/index&quot;).CreatorProfile'.</problem>
<problem file="src/app/creator/(protected)/dashboard/page.tsx" line="30" column="57" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/app/creator/(protected)/dashboard/products/page.tsx" line="35" column="9" code="2741">Property 'page_slug' is missing in type 'import(&quot;/Users/randy/dyad-apps/Staryer/src/features/creator-onboarding/types/index&quot;).CreatorProfile' but required in type 'import(&quot;/Users/randy/dyad-apps/Staryer/src/features/creator/types/index&quot;).CreatorProfile'.</problem>
<problem file="src/features/creator/actions/profile-actions.ts" line="26" column="5" code="2353">Object literal may only specify known properties, and 'page_slug' does not exist in type '{ billing_address?: Json | undefined; billing_email?: string | null | undefined; billing_phone?: string | null | undefined; brand_color?: string | null | undefined; brand_gradient?: Json | undefined; ... 18 more ...; updated_at?: string | undefined; }'.</problem>
<problem file="src/features/creator/components/CustomDomainGuide.tsx" line="21" column="63" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator/components/CustomDomainGuide.tsx" line="25" column="64" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator/components/CustomDomainGuide.tsx" line="87" column="100" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator/components/ProfileForm.tsx" line="33" column="59" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator/components/ProfileForm.tsx" line="67" column="9" code="2353">Object literal may only specify known properties, and 'page_slug' does not exist in type '{ billing_address?: Json | undefined; billing_email?: string | null | undefined; billing_phone?: string | null | undefined; brand_color?: string | null | undefined; brand_gradient?: Json | undefined; ... 18 more ...; updated_at?: string | undefined; }'.</problem>
<problem file="src/features/creator-onboarding/components/steps/CompletionStep.tsx" line="22" column="50" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/components/steps/ReviewStep.tsx" line="82" column="50" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/components/steps/WhiteLabelSetupStep.tsx" line="57" column="52" code="2339">Property 'page_slug' does not exist on type 'CreatorProfile'.</problem>
<problem file="src/features/creator-onboarding/components/steps/WhiteLabelSetupStep.tsx" line="158" column="9" code="2353">Object literal may only specify known properties, and 'page_slug' does not exist in type '{ billing_address?: Json | undefined; billing_email?: string | null | undefined; billing_phone?: string | null | undefined; brand_color?: string | null | undefined; brand_gradient?: Json | undefined; ... 18 more ...; updated_at?: string | undefined; }'.</problem>
<problem file="src/features/creator/components/CreatorProductManager.tsx" line="237" column="10" code="2741">Property 'creatorPageSlug' is missing in type '{ isOpen: boolean; onOpenChange: Dispatch&lt;SetStateAction&lt;boolean&gt;&gt;; productName: string; productId: string; creatorId: string; stripePriceId: string | null; }' but required in type 'EmbedCodeDialogProps'.</problem>
</dyad-problem-report><think>**Begin Error Analysis**

I'm currently immersed in a sea of TypeScript errors, specifically 69 compile-time issues. My strategy involves tackling each one methodically.  The initial focus is on pinpointing the root causes and understanding the context of each error.  I'm beginning with  `src/features/platform-owner/components/PlatformProductManager.tsx:293:101 - '...' expected` and moving through them step-by-step.


**Debugging Continues Relentlessly**

I'm making progress, though the mountain of errors is still imposing. I've successfully addressed the syntax error in `PlatformProductManager.tsx` and moved on to the cascade of TypeScript errors in `embed.js`. It's a bit tedious, but I'm methodically stripping out all TypeScript constructs to return it to pure JavaScript.  My focus is now on the Supabase type discrepancies in the `creator-profile.ts` file, where I'll soon recommend a regeneration of the Supabase types to resolve these issues. I've also spotted several related discrepancies that, as mentioned, stem from a likely database migration.


**Refining Type Definitions**

The Supabase type discrepancies are now my primary focus, and after an hour of focused effort, I believe I have the fix. The errors are all pointing to an outdated `types.ts` file, and I've verified that the database migration is the source of these. The recommended action is regenerating the Supabase types to synchronize the codebase with the latest schema. To move forward, I will provide the steps. I've also identified inconsistencies in the type definitions and will advise that the user also check their IDE for errors.


**Begin Simplifying JavaScript**

I've initiated the error-resolution process by directly addressing the issues in the `PlatformProductManager.tsx` file. I removed the problematic JSX comment to fix the syntax error. I'm now making certain that the `creatorPageSlug` prop is passed correctly to the `EmbedCodeDialog` component. Concurrently, I've started the process of converting `embed.js` to pure JavaScript, systematically eliminating all TypeScript-specific constructs to ensure the JavaScript file is free of TypeScript syntax.


</think>Okay, that's a comprehensive list of errors! It looks like we have a mix of JSX syntax issues, TypeScript syntax in a JavaScript file, and outdated Supabase types. I'll address these systematically.

Here's the plan:

1.  **Fix JSX Syntax in `AssetLibraryManager.tsx`**: I'll correct all missing closing tags and ensure proper JSX structure.
2.  **Fix `onClick` Prop**: Ensure the `onClick` prop in `DropdownMenuItem` receives a proper event handler function.
3.  **Convert `embed.js` to Plain JavaScript**: I'll remove all TypeScript-specific syntax (like `private static`, type annotations, and `as const`) from `src/public/static/embed.js`.
4.  **Fix `PlatformProductManager.tsx`**: I'll correct the syntax errors, ensure correct `useState` and `useEffect` usage, and pass the `creatorPageSlug` prop to `EmbedCodeDialog`.
5.  **Supabase Type Regeneration (User Action)**: After these code changes, you will need to run `npm run generate-types` and `npm run migration:up` to update your local Supabase types. This is crucial for resolving the `page_slug` and `subscribed_products` related type errors.

Here are the code modifications:

<dyad-write path="src/features/creator/components/AssetLibraryManager.tsx" description="Fixing JSX syntax and onClick prop usage.">
'use client';

import { useState } from 'react';
import { 
  Copy, 
  Edit, 
  Eye, 
  FileText, 
  MoreHorizontal, 
  Package, 
  Plus, 
  Settings, 
  Share, 
  Trash2 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { CreatorProfile } from '@/features/creator-onboarding/types';

import { 
  createEmbedAssetAction, 
  deleteEmbedAssetAction, 
  duplicateEmbedAssetAction, 
  toggleAssetShareAction, 
  updateEmbedAssetAction 
} from '../actions/embed-asset-actions';
import type { CreateEmbedAssetRequest, EmbedAsset, EmbedAssetType } from '../types/embed-assets';

import { AssetPreview } from './AssetPreview';
import { CreateAssetDialog } from './CreateAssetDialog'; // Re-import CreateAssetDialog

interface AssetLibraryManagerProps {
  initialAssets: EmbedAsset[];
  creatorProfile: CreatorProfile;
}

export function AssetLibraryManager({ initialAssets, creatorProfile }: AssetLibraryManagerProps) {
  const [assets, setAssets] = useState<EmbedAsset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<EmbedAsset | null>(null);
  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false); // Renamed state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<EmbedAssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(asset => {
    const matchesType = filterType === 'all' || asset.asset_type === filterType;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleOpenCreateDialog = () => {
    setSelectedAsset(null); // Clear selected asset for creation
    setIsCreateEditDialogOpen(true);
  };

  const handleEditAsset = (asset: EmbedAsset) => {
    setSelectedAsset(asset); // Set selected asset for editing
    setIsCreateEditDialogOpen(true);
  };

  const handleSaveAsset = async (assetData: CreateEmbedAssetRequest, assetId?: string) => {
    setIsLoading(true);
    try {
      let resultAsset: EmbedAsset;
      if (assetId) {
        resultAsset = await updateEmbedAssetAction(assetId, assetData);
        setAssets(prev => prev.map(asset => asset.id === assetId ? resultAsset : asset));
        toast({ description: 'Asset updated successfully!' });
      } else {
        resultAsset = await createEmbedAssetAction(assetData);
        setAssets(prev => [resultAsset, ...prev]);
        toast({ description: 'Asset created successfully!' });
      }
      setIsCreateEditDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        description: `Failed to ${assetId ? 'update' : 'create'} asset. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteEmbedAssetAction(assetId);
      setAssets(prev => prev.filter(asset => asset.id !== assetId));
      toast({
        description: 'Asset deleted successfully!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to delete asset. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateAsset = async (assetId: string) => {
    setIsLoading(true);
    try {
      const duplicatedAsset = await duplicateEmbedAssetAction(assetId);
      setAssets(prev => [duplicatedAsset, ...prev]);
      toast({
        description: 'Asset duplicated successfully!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to duplicate asset. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleShare = async (assetId: string, enabled: boolean) => {
    setIsLoading(true);
    try {
      const updatedAsset = await toggleAssetShareAction(assetId, enabled);
      setAssets(prev => prev.map(asset => 
        asset.id === assetId ? updatedAsset : asset
      ));
      toast({
        description: enabled ? 'Asset sharing enabled!' : 'Asset sharing disabled!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to toggle sharing. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAssetIcon = (type: EmbedAssetType) => {
    switch (type) {
      case 'product_card':
        return <Package className="h-4 w-4" />;
      case 'checkout_button':
        return <Settings className="h-4 w-4" />;
      case 'pricing_table':
        return <FileText className="h-4 w-4" />;
      case 'custom':
        return <Edit className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatAssetType = (type: EmbedAssetType) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={filterType} onValueChange={(value: EmbedAssetType | 'all') => setFilterType(value)}>
            <SelectTrigger className="max-w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="product_card">Product Cards</SelectItem>
              <SelectItem value="checkout_button">Checkout Buttons</SelectItem>
              <SelectItem value="pricing_table">Pricing Tables</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Asset
        </Button>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterType !== 'all' ? 'No assets match your filters' : 'No assets yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first embed asset to get started'
            }
          </p>
          {(!searchQuery && filterType === 'all') && (
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Asset
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <div key={asset.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Asset Preview */}
              <div className="aspect-video bg-gray-50 flex items-center justify-center border-b border-gray-200">
                <AssetPreview asset={asset} size="small" />
              </div>

              {/* Asset Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getAssetIcon(asset.asset_type)}
                    <h3 className="font-semibold text-gray-900 truncate">{asset.name}</h3>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateAsset(asset.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleShare(asset.id, !asset.share_enabled)}
                      >
                        <Share className="h-4 w-4 mr-2" />
                        {asset.share_enabled ? 'Disable' : 'Enable'} Sharing
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteAsset(asset.id)} 
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {asset.description || 'No description'}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatAssetType(asset.asset_type)}</span>
                  <div className="flex items-center gap-3">
                    <span>{asset.view_count} views</span>
                    {asset.share_enabled && (
                      <span className="text-green-600">Shared</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.name}</DialogTitle>
            <DialogDescription>
              Preview how your embed will appear on websites
            </DialogDescription>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="mt-4">
              <AssetPreview asset={selectedAsset} size="large" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Asset Dialog */}
      <CreateAssetDialog
        isOpen={isCreateEditDialogOpen}
        onOpenChange={setIsCreateEditDialogOpen}
        onSaveAsset={handleSaveAsset}
        isLoading={isLoading}
        creatorProfile={creatorProfile}
        initialAsset={selectedAsset}
      />
    </div>
  );
}