export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_customization_sessions: {
        Row: {
          created_at: string
          creator_id: string
          current_options: Json
          embed_type: string
          id: string
          messages: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          current_options: Json
          embed_type: string
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          current_options?: Json
          embed_type?: string
          id?: string
          messages?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          distinct_id: string
          event_name: string
          event_properties: Json | null
          id: string
          metadata: Json | null
          posthog_event_id: string | null
          sent_to_posthog: boolean | null
          session_id: string | null
          tenant_id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          distinct_id: string
          event_name: string
          event_properties?: Json | null
          id?: string
          metadata?: Json | null
          posthog_event_id?: string | null
          sent_to_posthog?: boolean | null
          session_id?: string | null
          tenant_id: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          distinct_id?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          metadata?: Json | null
          posthog_event_id?: string | null
          sent_to_posthog?: boolean | null
          session_id?: string | null
          tenant_id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_events: {
        Row: {
          connector_type: string
          created_at: string
          error_message: string | null
          event_data: Json
          event_type: string
          external_id: string | null
          id: string
          metadata: Json | null
          retry_count: number | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          connector_type: string
          created_at?: string
          error_message?: string | null
          event_data: Json
          event_type: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          retry_count?: number | null
          status: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          connector_type?: string
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          retry_count?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connector_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_analytics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "creator_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          extracted_branding_data: Json | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          page_slug: string
          stripe_access_token: string | null
          stripe_account_enabled: boolean | null
          stripe_account_id: string | null
          stripe_refresh_token: string | null
          tenant_id: string | null
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
          extracted_branding_data?: Json | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          page_slug: string
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          tenant_id?: string | null
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
          extracted_branding_data?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          page_slug?: string
          stripe_access_token?: string | null
          stripe_account_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_refresh_token?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "creator_webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tier_assignments: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          creator_id: string
          current_period_end: string
          current_period_start: string
          customer_id: string
          id: string
          status: string
          stripe_subscription_id: string | null
          tenant_id: string | null
          tier_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          creator_id: string
          current_period_end?: string
          current_period_start?: string
          customer_id: string
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          tenant_id?: string | null
          tier_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          creator_id?: string
          current_period_end?: string
          current_period_start?: string
          customer_id?: string
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          tenant_id?: string | null
          tier_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tier_assignments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tier_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tier_assignments_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
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
      meter_plan_limits: {
        Row: {
          created_at: string
          hard_cap: boolean | null
          id: string
          limit_value: number | null
          meter_id: string
          overage_price: number | null
          plan_name: string
          soft_limit_threshold: number | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hard_cap?: boolean | null
          id?: string
          limit_value?: number | null
          meter_id: string
          overage_price?: number | null
          plan_name: string
          soft_limit_threshold?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hard_cap?: boolean | null
          id?: string
          limit_value?: number | null
          meter_id?: string
          overage_price?: number | null
          plan_name?: string
          soft_limit_threshold?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_plan_limits_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_plan_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      subscribed_products: {
        Row: {
          creator_product_id: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          price: number | null
          product_type: string | null
          subscribed_at: string | null
          subscription_id: string | null
        }
        Insert: {
          creator_product_id?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          price?: number | null
          product_type?: string | null
          subscribed_at?: string | null
          subscription_id?: string | null
        }
        Update: {
          creator_product_id?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          price?: number | null
          product_type?: string | null
          subscribed_at?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribed_products_creator_product_id_fkey"
            columns: ["creator_product_id"]
            isOneToOne: false
            referencedRelation: "creator_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscribed_products_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          active: boolean | null
          billing_cycle: string
          created_at: string
          creator_id: string
          currency: string | null
          description: string | null
          feature_entitlements: Json | null
          id: string
          is_default: boolean | null
          name: string
          price: number
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tenant_id: string | null
          trial_period_days: number | null
          updated_at: string
          usage_caps: Json | null
        }
        Insert: {
          active?: boolean | null
          billing_cycle?: string
          created_at?: string
          creator_id: string
          currency?: string | null
          description?: string | null
          feature_entitlements?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          price: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tenant_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
          usage_caps?: Json | null
        }
        Update: {
          active?: boolean | null
          billing_cycle?: string
          created_at?: string
          creator_id?: string
          currency?: string | null
          description?: string | null
          feature_entitlements?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tenant_id?: string | null
          trial_period_days?: number | null
          updated_at?: string
          usage_caps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_tiers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_tiers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      tenants: {
        Row: {
          active: boolean | null
          created_at: string
          custom_domain: string | null
          id: string
          name: string
          settings: Json | null
          subdomain: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          name: string
          settings?: Json | null
          subdomain?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          name?: string
          settings?: Json | null
          subdomain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tier_analytics: {
        Row: {
          active_customers: number | null
          average_usage_percentage: number | null
          churned_customers: number | null
          created_at: string
          creator_id: string
          id: string
          new_customers: number | null
          overage_revenue: number | null
          period_end: string
          period_start: string
          period_type: string
          tenant_id: string | null
          tier_id: string
          total_revenue: number | null
          updated_at: string
          usage_metrics: Json | null
        }
        Insert: {
          active_customers?: number | null
          average_usage_percentage?: number | null
          churned_customers?: number | null
          created_at?: string
          creator_id: string
          id?: string
          new_customers?: number | null
          overage_revenue?: number | null
          period_end: string
          period_start: string
          period_type: string
          tenant_id?: string | null
          tier_id: string
          total_revenue?: number | null
          updated_at?: string
          usage_metrics?: Json | null
        }
        Update: {
          active_customers?: number | null
          average_usage_percentage?: number | null
          churned_customers?: number | null
          created_at?: string
          creator_id?: string
          id?: string
          new_customers?: number | null
          overage_revenue?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          tenant_id?: string | null
          tier_id?: string
          total_revenue?: number | null
          updated_at?: string
          usage_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_analytics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_analytics_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_usage_overages: {
        Row: {
          actual_usage: number
          billed: boolean | null
          billed_at: string | null
          billing_period: string
          created_at: string
          creator_id: string
          customer_id: string
          id: string
          limit_value: number
          meter_id: string
          overage_amount: number
          overage_cost: number
          overage_price: number
          stripe_invoice_item_id: string | null
          tenant_id: string | null
          tier_id: string
          updated_at: string
        }
        Insert: {
          actual_usage: number
          billed?: boolean | null
          billed_at?: string | null
          billing_period: string
          created_at?: string
          creator_id: string
          customer_id: string
          id?: string
          limit_value: number
          meter_id: string
          overage_amount: number
          overage_cost: number
          overage_price: number
          stripe_invoice_item_id?: string | null
          tenant_id?: string | null
          tier_id: string
          updated_at?: string
        }
        Update: {
          actual_usage?: number
          billed?: boolean | null
          billed_at?: string | null
          billing_period?: string
          created_at?: string
          creator_id?: string
          customer_id?: string
          id?: string
          limit_value?: number
          meter_id?: string
          overage_amount?: number
          overage_cost?: number
          overage_price?: number
          stripe_invoice_item_id?: string | null
          tenant_id?: string | null
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_usage_overages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_usage_overages_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_usage_overages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_usage_overages_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_aggregates: {
        Row: {
          aggregate_value: number
          billing_period: string | null
          created_at: string
          event_count: number
          id: string
          meter_id: string
          period_end: string
          period_start: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aggregate_value: number
          billing_period?: string | null
          created_at?: string
          event_count?: number
          id?: string
          meter_id: string
          period_end: string
          period_start: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aggregate_value?: number
          billing_period?: string | null
          created_at?: string
          event_count?: number
          id?: string
          meter_id?: string
          period_end?: string
          period_start?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_aggregates_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_aggregates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          current_usage: number
          id: string
          limit_value: number | null
          meter_id: string
          plan_name: string
          tenant_id: string | null
          threshold_percentage: number | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          current_usage: number
          id?: string
          limit_value?: number | null
          meter_id: string
          plan_name: string
          tenant_id?: string | null
          threshold_percentage?: number | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          current_usage?: number
          id?: string
          limit_value?: number | null
          meter_id?: string
          plan_name?: string
          tenant_id?: string | null
          threshold_percentage?: number | null
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_alerts_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_billing_sync: {
        Row: {
          billing_period: string
          billing_status: string | null
          created_at: string
          id: string
          last_sync_attempt: string | null
          meter_id: string
          overage_quantity: number | null
          stripe_subscription_item_id: string | null
          stripe_usage_record_id: string | null
          sync_attempts: number | null
          sync_error: string | null
          tenant_id: string | null
          updated_at: string
          usage_quantity: number
          user_id: string
        }
        Insert: {
          billing_period: string
          billing_status?: string | null
          created_at?: string
          id?: string
          last_sync_attempt?: string | null
          meter_id: string
          overage_quantity?: number | null
          stripe_subscription_item_id?: string | null
          stripe_usage_record_id?: string | null
          sync_attempts?: number | null
          sync_error?: string | null
          tenant_id?: string | null
          updated_at?: string
          usage_quantity: number
          user_id: string
        }
        Update: {
          billing_period?: string
          billing_status?: string | null
          created_at?: string
          id?: string
          last_sync_attempt?: string | null
          meter_id?: string
          overage_quantity?: number | null
          stripe_subscription_item_id?: string | null
          stripe_usage_record_id?: string | null
          sync_attempts?: number | null
          sync_error?: string | null
          tenant_id?: string | null
          updated_at?: string
          usage_quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_billing_sync_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_billing_sync_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          event_timestamp: string
          event_value: number
          id: string
          meter_id: string
          properties: Json | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_timestamp?: string
          event_value?: number
          id?: string
          meter_id: string
          properties?: Json | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_timestamp?: string
          event_value?: number
          id?: string
          meter_id?: string
          properties?: Json | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "usage_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_meters: {
        Row: {
          active: boolean | null
          aggregation_type: string
          billing_model: string
          created_at: string
          creator_id: string
          description: string | null
          display_name: string
          event_name: string
          id: string
          tenant_id: string | null
          unit_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          aggregation_type: string
          billing_model?: string
          created_at?: string
          creator_id: string
          description?: string | null
          display_name: string
          event_name: string
          id?: string
          tenant_id?: string | null
          unit_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          aggregation_type?: string
          billing_model?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          display_name?: string
          event_name?: string
          id?: string
          tenant_id?: string | null
          unit_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_meters_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_meters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "white_labeled_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_audit_log: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_new_value?: Json
          p_old_value?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      create_tenant: {
        Args: {
          tenant_name: string
          tenant_settings?: Json
          tenant_subdomain?: string
        }
        Returns: string
      }
      customer_has_feature_access: {
        Args: {
          p_creator_id: string
          p_customer_id: string
          p_feature_name: string
        }
        Returns: boolean
      }
      delete_user_full: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      ensure_tenant_context: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_creator_dashboard_stats: {
        Args: { creator_uuid: string }
        Returns: {
          active_products: number
          recent_sales_count: number
          total_revenue: number
          total_sales: number
        }[]
      }
      get_current_tenant: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_current_tier: {
        Args: { p_creator_id: string; p_customer_id: string }
        Returns: {
          billing_cycle: string
          current_period_end: string
          feature_entitlements: Json
          status: string
          tier_id: string
          tier_name: string
          tier_price: number
          usage_caps: Json
        }[]
      }
      get_customer_feature_limit: {
        Args: {
          p_creator_id: string
          p_customer_id: string
          p_feature_name: string
        }
        Returns: number
      }
      increment_product_sales: {
        Args: { amount: number; product_id: string }
        Returns: undefined
      }
      set_current_tenant: {
        Args: { tenant_uuid: string }
        Returns: undefined
      }
      wipe_user_public_tables: {
        Args: { p_user_id: string }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
      user_role: ["platform_owner", "creator", "subscriber", "user"],
    },
  },
} as const
