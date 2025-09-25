import { Database, Json } from '@/libs/supabase/types';

export type EmbedAssetType = 
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

export interface EmbedAssetConfig {
  // Common properties
  productId?: string;
  productName?: string;
  price?: string;
  currency?: string;
  
  // Styling properties
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderRadius?: string;
  colors?: string[]; // Enhanced: support multiple colors
  fonts?: string[]; // Enhanced: support custom fonts
  
  // Layout properties
  width?: string;
  height?: string;
  padding?: string;
  margin?: string;
  
  // Voice and tone properties (Enhanced)
  voiceAndTone?: {
    tone: string; // Relaxed to string
    voice: string; // Relaxed to string
  };
  
  // Content properties (Enhanced)
  content?: {
    title?: string;
    description?: string;
    features?: string[];
    testimonials?: Array<{
      text: string;
      author: string;
      role?: string;
    }>;
    ctaText?: string;
  };
  
  // Button properties (for checkout_button type)
  buttonText?: string;
  buttonStyle?: 'solid' | 'outline' | 'ghost';
  
  // Card properties (for product_card type)
  showImage?: boolean;
  showDescription?: boolean;
  showPrice?: boolean;
  imageUrl?: string;
  
  // Table properties (for pricing_table type)
  features?: string[];
  highlighted?: boolean;
  
  // Header properties (for header type)
  showLogo?: boolean;
  navigationItems?: Array<{ label: string; url: string }>;
  
  // Hero section properties (for hero_section type)
  heroTitle?: string;
  heroSubtitle?: string;
  backgroundImage?: string;
  
  // Testimonial properties (for testimonial_section type)
  testimonials?: Array<{
    text: string;
    author: string;
    role?: string;
    rating?: number;
  }>;
  
  // Footer properties (for footer type)
  showSocialLinks?: boolean;
  copyrightText?: string;
  
  // Trial embed properties (for trial_embed type)
  trialDurationDays?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  expiredCallToAction?: {
    title: string;
    description: string;
    buttonText: string;
    subscriptionUrl: string;
  };
  trialFeatures?: string[];
  
  // AI customization properties (Enhanced)
  aiSession?: {
    sessionId: string;
    lastPrompt?: string;
    customizations: string[];
  };
  
  // Brand alignment score (Enhanced)
  brandAlignment?: number;
  
  // Custom properties (for custom type)
  customHtml?: string;
  customCss?: string;
  customJs?: string;
  
  // Generated HTML/CSS/Embed Code (Enhanced)
  generatedHtml?: string;
  generatedCss?: string;
  embedCode?: string;
}

export interface EmbedAsset {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  asset_type: EmbedAssetType;
  embed_config: EmbedAssetConfig;
  preview_url?: string;
  active: boolean;
  is_public: boolean;
  featured: boolean;
  share_token?: string;
  share_enabled: boolean;
  view_count: number;
  usage_count: number;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AssetSharingLog {
  id: string;
  asset_id: string;
  accessed_by_ip?: string;
  accessed_by_user_agent?: string;
  referrer_url?: string;
  accessed_at: string;
}

export interface CreateEmbedAssetRequest {
  name: string;
  description?: string;
  asset_type: EmbedAssetType;
  embed_config: EmbedAssetConfig;
  tags?: string[];
  is_public?: boolean;
  featured?: boolean;
}

export interface UpdateEmbedAssetRequest {
  name?: string;
  description?: string;
  embed_config?: EmbedAssetConfig;
  tags?: string[];
  active?: boolean;
  is_public?: boolean;
  featured?: boolean;
  share_enabled?: boolean;
}

// Explicit types for Supabase operations
export type EmbedAssetRow = Database['public']['Tables']['embed_assets']['Row'];
export type EmbedAssetInsert = Database['public']['Tables']['embed_assets']['Insert'];
export type EmbedAssetUpdate = Database['public']['Tables']['embed_assets']['Update'];