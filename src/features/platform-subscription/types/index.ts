export interface PlatformPricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly' | 'one_time';
  stripe_price_id?: string;
  stripe_product_id?: string;
  features: string[];
  limits: {
    max_customers?: number;
    max_products?: number;
    max_pages?: number;
  };
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformSubscription {
  id: string;
  creator_id: string;
  tier_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionCheckoutSession {
  id: string;
  url: string;
  subscription_id?: string;
  customer_id?: string;
  status: 'open' | 'complete' | 'expired';
  expires_at: string;
}