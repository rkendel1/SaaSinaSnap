/**
 * Lemon Squeezy API Types and Interfaces
 * 
 * These types define the structure of Lemon Squeezy API requests and responses
 * to ensure type safety throughout the integration.
 */

// Base Lemon Squeezy API Response Structure
export interface LemonSqueezyApiResponse<T> {
  data: T;
  meta?: {
    page?: {
      currentPage: number;
      from: number;
      lastPage: number;
      perPage: number;
      to: number;
      total: number;
    };
  };
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

// Store Management
export interface Store {
  id: string;
  type: 'stores';
  attributes: {
    name: string;
    slug: string;
    domain: string;
    url: string;
    avatar_url: string | null;
    plan: string;
    country: string;
    country_nicename: string;
    currency: string;
    total_sales: number;
    total_revenue: number;
    thirty_day_sales: number;
    thirty_day_revenue: number;
    created_at: string;
    updated_at: string;
  };
}

// Product Management
export interface Product {
  id: string;
  type: 'products';
  attributes: {
    store_id: number;
    name: string;
    slug: string;
    description: string;
    status: 'draft' | 'published';
    status_formatted: string;
    thumb_url: string | null;
    large_thumb_url: string | null;
    price: number;
    price_formatted: string;
    from_price: number | null;
    to_price: number | null;
    pay_what_you_want: boolean;
    buy_now_url: string;
    created_at: string;
    updated_at: string;
  };
  relationships: {
    store: {
      links: {
        related: string;
        self: string;
      };
    };
    variants: {
      links: {
        related: string;
        self: string;
      };
    };
  };
}

export interface CreateProductRequest {
  type: 'products';
  attributes: {
    name: string;
    description?: string;
    status?: 'draft' | 'published';
    price?: number;
    pay_what_you_want?: boolean;
  };
  relationships: {
    store: {
      data: {
        type: 'stores';
        id: string;
      };
    };
  };
}

// Variant Management (for subscription tiers)
export interface Variant {
  id: string;
  type: 'variants';
  attributes: {
    product_id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    is_subscription: boolean;
    interval: 'day' | 'week' | 'month' | 'year' | null;
    interval_count: number;
    has_free_trial: boolean;
    trial_interval: 'day' | 'week' | 'month' | 'year' | null;
    trial_interval_count: number;
    pay_what_you_want: boolean;
    min_price: number;
    suggested_price: number;
    has_license_keys: boolean;
    license_activation_limit: number;
    is_license_limit_unlimited: boolean;
    license_length_value: number;
    license_length_unit: 'days' | 'months' | 'years';
    is_license_length_unlimited: boolean;
    sort: number;
    status: 'pending' | 'draft' | 'published';
    status_formatted: string;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateVariantRequest {
  type: 'variants';
  attributes: {
    name: string;
    description?: string;
    price: number;
    is_subscription?: boolean;
    interval?: 'day' | 'week' | 'month' | 'year';
    interval_count?: number;
    has_usage_limits?: boolean;
  };
  relationships: {
    product: {
      data: {
        type: 'products';
        id: string;
      };
    };
  };
}

// Customer Management
export interface Customer {
  id: string;
  type: 'customers';
  attributes: {
    store_id: number;
    name: string;
    email: string;
    status: 'active' | 'archived';
    country: string;
    region: string;
    city: string;
    total_revenue_currency: string;
    mrr: number;
    status_formatted: string;
    country_formatted: string;
    total_revenue_currency_formatted: string;
    mrr_formatted: string;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateCustomerRequest {
  type: 'customers';
  attributes: {
    name: string;
    email: string;
    country?: string;
    region?: string;
    city?: string;
  };
  relationships: {
    store: {
      data: {
        type: 'stores';
        id: string;
      };
    };
  };
}

// Subscription Management
export interface Subscription {
  id: string;
  type: 'subscriptions';
  attributes: {
    store_id: number;
    customer_id: number;
    order_id: number;
    order_item_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    user_name: string;
    user_email: string;
    status: 'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired';
    status_formatted: string;
    card_brand: string;
    card_last_four: string;
    pause: any | null;
    cancelled: boolean;
    trial_ends_at: string | null;
    billing_anchor: number;
    urls: {
      update_payment_method: string;
      customer_portal: string;
    };
    renews_at: string;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateSubscriptionRequest {
  type: 'subscriptions';
  attributes: {
    product_options?: {
      name?: string;
      description?: string;
      media?: string;
      redirect_url?: string;
      receipt_button_text?: string;
      receipt_link_url?: string;
      receipt_thank_you_note?: string;
      enabled_variants?: number[];
    };
    checkout_options?: {
      embed?: boolean;
      media?: boolean;
      logo?: boolean;
      desc?: boolean;
      discount?: boolean;
      dark?: boolean;
      subscription_preview?: boolean;
      button_color?: string;
    };
    checkout_data?: {
      email?: string;
      name?: string;
      billing_address?: {
        country?: string;
        zip?: string;
      };
      tax_number?: string;
      discount_code?: string;
      custom?: Record<string, any>;
    };
    expires_at?: string;
    preview?: boolean;
    test_mode?: boolean;
  };
  relationships: {
    store: {
      data: {
        type: 'stores';
        id: string;
      };
    };
    variant: {
      data: {
        type: 'variants';
        id: string;
      };
    };
  };
}

// Order Management
export interface Order {
  id: string;
  type: 'orders';
  attributes: {
    store_id: number;
    customer_id: number;
    identifier: string;
    order_number: number;
    user_name: string;
    user_email: string;
    currency: string;
    currency_rate: string;
    subtotal: number;
    discount_total: number;
    tax: number;
    total: number;
    subtotal_usd: number;
    discount_total_usd: number;
    tax_usd: number;
    total_usd: number;
    tax_name: string | null;
    tax_rate: string;
    status: 'pending' | 'paid' | 'void' | 'refunded' | 'partial_refund';
    status_formatted: string;
    refunded: boolean;
    refunded_at: string | null;
    subtotal_formatted: string;
    discount_total_formatted: string;
    tax_formatted: string;
    total_formatted: string;
    urls: {
      receipt: string;
    };
    created_at: string;
    updated_at: string;
  };
}

// Usage Reporting (for metered billing)
export interface UsageRecord {
  quantity: number;
  timestamp?: Date;
  action?: 'increment' | 'set';
}

// Webhook Event Types
export interface WebhookEvent {
  meta: {
    event_name: string;
    webhook_id: string;
  };
  data: any; // Specific to event type
}

// Configuration for Staryer Integration
export interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  webhookSecret?: string;
  testMode?: boolean;
}

// Integration Status Tracking
export interface LemonSqueezyIntegration {
  id: string;
  creatorId: string;
  storeId: string;
  apiKey: string; // encrypted
  webhookSecret?: string; // encrypted
  enabled: boolean;
  testMode: boolean;
  lastSync?: string;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Product Mapping between Staryer and Lemon Squeezy
export interface ProductMapping {
  id: string;
  creatorId: string;
  staryerTierId: string;
  lemonSqueezyProductId: string;
  lemonSqueezyVariantId: string;
  syncStatus: 'pending' | 'synced' | 'error';
  lastSyncedAt?: string;
}

// Subscription Mapping
export interface SubscriptionMapping {
  id: string;
  creatorId: string;
  userId: string;
  lemonSqueezySubscriptionId: string;
  lemonSqueezyCustomerId: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

// Error Types
export class LemonSqueezyError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LemonSqueezyError';
  }
}

export class LemonSqueezyApiError extends LemonSqueezyError {
  constructor(message: string, statusCode: number, response?: any) {
    super(message, statusCode, 'API_ERROR', response);
    this.name = 'LemonSqueezyApiError';
  }
}

export class LemonSqueezyWebhookError extends LemonSqueezyError {
  constructor(message: string, eventType?: string, payload?: any) {
    super(message, undefined, 'WEBHOOK_ERROR', { eventType, payload });
    this.name = 'LemonSqueezyWebhookError';
  }
}