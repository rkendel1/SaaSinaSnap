export type EmbedAssetType = 'product_card' | 'checkout_button' | 'pricing_table' | 'custom';

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
  
  // Layout properties
  width?: string;
  height?: string;
  padding?: string;
  margin?: string;
  
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
  
  // Custom properties (for custom type)
  customHtml?: string;
  customCss?: string;
  customJs?: string;
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