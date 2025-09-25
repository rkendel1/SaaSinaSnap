export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      asset_sharing_logs: {
        Row: {
          accessed_at: string
          accessed_by_ip: string | null
          accessed_by_user_agent: string | null
          asset_id: string
          id: string
          referrer_url: string | null
        }
        Insert: {
          accessed_at?: string
          accessed_by_ip?: string | null
          accessed_by_user_agent?: string | null
          asset_id: string
          id?: string
          referrer_url?: string | null
        }
        Update: {
          accessed_at?: string
          accessed_by_ip?: string | null
          accessed_by_user_agent?: string | null
          asset_id?: string
          id?: string
          referrer_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_sharing_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "embed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_analytics: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          metric_data: Json | null
          metric_name: string
          metric_value: number | null
          period_end: string
          period_start: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          metric_data?: Json | null
          metric_name: string
          metric_value?: number | null
          period_end: string
          period_start: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          metric_data?: Json | null
          metric_name?: string
          metric_value?: number | null
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_analytics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_products: {
        Row: {
          active: boolean | null
          created_at: string
          creator_id: string
          currency: string | null
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          price: number | null
          product_type: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          creator_id: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          price?: number | null
          product_type?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          creator_id?: string
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          price?: number | null
          product_type?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          billing_address: Json | null
          billing_email: string | null
          billing_phone: string | null
          brand_color: string | null
          brand_gradient: Json | null
          brand_pattern: Json | null
          branding_extracted_at: string | null
          branding_extraction_error: string | null
          branding_extraction_status: string | null
          business_description: string | null
          business_logo_url: string | null
          business_name: string | null
          business_website: string | null
          created_at: string
          custom_domain: string | null
          extracted_branding_data: Json | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          stripe_access_token: string | null
          stripe_account_enabled: boolean | null
          stripe_account_id: string | null
          stripe_refresh_token: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          billing_email?: string | null
          billing_phone?: string | null
          brand_color?: string | null
          brand_gradient?: Json | null
          brand_pattern?: Json | null
          branding_extracted_at?: string | null
          branding_extraction_error?: string | null
          branding_extraction_status?: string | null
          business_description?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_website?: string | null
          created_at?: string
          custom_domain?: string | null
          extracted_branding_data?: Json | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          billing_email?: string | null
          billing_phone?: string | null
          brand_color?: string | null
          brand_gradient?: Json | null
          brand_pattern?: Json | null
          branding_extracted_at?: string | null
          branding_extraction_error?: string | null
          branding_extraction_status?: string | null
          business_description?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_website?: string | null
          created_at?: string
          custom_domain?: string | null
          extracted_branding_data?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_webhooks: {
        Row: {
          active: boolean | null
          created_at: string
          creator_id: string
          endpoint_url: string
          events: string[]
          id: string
          secret_key: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          creator_id: string
          endpoint_url: string
          events: string[]
          id?: string
          secret_key?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          creator_id?: string
          endpoint_url?: string
          events?: string[]
          id?: string
          secret_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_webhooks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      embed_assets: {
        Row: {
          active: boolean | null
          asset_type: string
          created_at: string
          creator_id: string
          description: string | null
          embed_config: Json
          featured: boolean | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          preview_url: string | null
          share_enabled: boolean | null
          share_token: string | null
          tags: string[] | null
          updated_at: string
          usage_count: number | null
          view_count: number | null
        }
        Insert: {
          active?: boolean | null
          asset_type: string
          created_at?: string
          creator_id: string
          description?: string | null
          embed_config: Json
          featured?: boolean | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          preview_url?: string | null
          share_enabled?: boolean | null
          share_token?: string | null
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
          view_count?: number | null
        }
        Update: {
          active?: boolean | null
          asset_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          embed_config?: Json
          featured?: boolean | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          preview_url?: string | null
          share_enabled?: boolean | null
          share_token?: string | null
          tags?: string[] | null
          updated_at?: string
          usage_count?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "embed_assets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          default_creator_brand_color: string | null
          default_creator_gradient: Json | null
          default_creator_pattern: Json | null
          default_white_labeled_page_config: Json | null
          id: string
          onboarding_step: number | null
          owner_id: string | null
          platform_owner_onboarding_completed: boolean | null
          stripe_access_token: string | null
          stripe_account_enabled: boolean | null
          stripe_account_id: string | null
          stripe_refresh_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_creator_brand_color?: string | null
          default_creator_gradient?: Json | null
          default_creator_pattern?: Json | null
          default_white_labeled_page_config?: Json | null
          id?: string
          onboarding_step?: number | null
          owner_id?: string | null
          platform_owner_onboarding_completed?: boolean | null
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_creator_brand_color?: string | null
          default_creator_gradient?: Json | null
          default_creator_pattern?: Json | null
          default_white_labeled_page_config?: Json | null
          id?: string
          onboarding_step?: number | null
          owner_id?: string | null
          platform_owner_onboarding_completed?: boolean | null
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          id: string
          payment_method: Json | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      white_labeled_pages: {
        Row: {
          active: boolean | null
          created_at: string
          creator_id: string
          custom_css: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          page_config: Json | null
          page_description: string | null
          page_slug: string
          page_title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          creator_id: string
          custom_css?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          page_config?: Json | null
          page_description?: string | null
          page_slug: string
          page_title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          creator_id?: string
          custom_css?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          page_config?: Json | null
          page_description?: string | null
          page_slug?: string
          page_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "white_labeled_pages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_creator_dashboard_stats: {
        Args: { creator_uuid: string }
        Returns: {
          active_products: number
          recent_sales_count: number
          total_revenue: number
          total_sales: number
        }[]
      }
      increment_product_sales: {
        Args: { amount: number; product_id: string }
        Returns: undefined
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
      user_role: "platform_owner" | "creator" | "subscriber" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never