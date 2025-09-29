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
      users: {
        Row: any
        Insert: any
        Update: any
      }
      subscription_tiers: {
        Row: any
        Insert: any
        Update: any
      }
      creator_profiles: {
        Row: any
        Insert: any
        Update: any
      }
      usage_events: {
        Row: any
        Insert: any
        Update: any
      }
      usage_meters: {
        Row: any
        Insert: any
        Update: any
      }
      usage_aggregates: {
        Row: any
        Insert: any
        Update: any
      }
      meter_plan_limits: {
        Row: any
        Insert: any
        Update: any
      }
      api_keys: {
        Row: any
        Insert: any
        Update: any
      }
      customer_tier_assignments: {
        Row: any
        Insert: any
        Update: any
      }
      white_labeled_pages: {
        Row: any
        Insert: any
        Update: any
      }
      creator_products: {
        Row: any
        Insert: any
        Update: any
      }
      creator_analytics: {
        Row: any
        Insert: any
        Update: any
      }
    }
    Views: {
      [_ in never]: never  
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
