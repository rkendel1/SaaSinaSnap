/**
 * Lemon Squeezy API Client
 * 
 * This client provides a typed interface to the Lemon Squeezy API,
 * handling authentication, rate limiting, and error handling.
 */

import {
  LemonSqueezyApiResponse,
  Store,
  Product,
  CreateProductRequest,
  Variant,
  CreateVariantRequest,
  Customer,
  CreateCustomerRequest,
  Subscription,
  CreateSubscriptionRequest,
  Order,
  UsageRecord,
  LemonSqueezyApiError,
  LemonSqueezyError,
} from './types';

export class LemonSqueezyClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(apiKey: string, testMode: boolean = false) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.lemonsqueezy.com/v1';
    this.defaultHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    };
  }

  /**
   * Make a request to the Lemon Squeezy API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new LemonSqueezyApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  }

  // Store Management
  /**
   * Get all stores for the authenticated user
   */
  async getStores(): Promise<LemonSqueezyApiResponse<Store[]>> {
    return this.makeRequest<LemonSqueezyApiResponse<Store[]>>('/stores');
  }

  /**
   * Get a specific store by ID
   */
  async getStore(storeId: string): Promise<LemonSqueezyApiResponse<Store>> {
    return this.makeRequest<LemonSqueezyApiResponse<Store>>(`/stores/${storeId}`);
  }

  // Product Management
  /**
   * Get all products for a store
   */
  async getProducts(storeId: string): Promise<LemonSqueezyApiResponse<Product[]>> {
    return this.makeRequest<LemonSqueezyApiResponse<Product[]>>(
      `/products?filter[store_id]=${storeId}`
    );
  }

  /**
   * Get a specific product by ID
   */
  async getProduct(productId: string): Promise<LemonSqueezyApiResponse<Product>> {
    return this.makeRequest<LemonSqueezyApiResponse<Product>>(`/products/${productId}`);
  }

  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductRequest): Promise<LemonSqueezyApiResponse<Product>> {
    return this.makeRequest<LemonSqueezyApiResponse<Product>>('/products', {
      method: 'POST',
      body: JSON.stringify({ data: productData }),
    });
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    updates: Partial<CreateProductRequest['attributes']>
  ): Promise<LemonSqueezyApiResponse<Product>> {
    return this.makeRequest<LemonSqueezyApiResponse<Product>>(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'products',
          id: productId,
          attributes: updates,
        },
      }),
    });
  }

  // Variant Management
  /**
   * Get all variants for a product
   */
  async getVariants(productId: string): Promise<LemonSqueezyApiResponse<Variant[]>> {
    return this.makeRequest<LemonSqueezyApiResponse<Variant[]>>(
      `/variants?filter[product_id]=${productId}`
    );
  }

  /**
   * Get a specific variant by ID
   */
  async getVariant(variantId: string): Promise<LemonSqueezyApiResponse<Variant>> {
    return this.makeRequest<LemonSqueezyApiResponse<Variant>>(`/variants/${variantId}`);
  }

  /**
   * Create a new variant
   */
  async createVariant(variantData: CreateVariantRequest): Promise<LemonSqueezyApiResponse<Variant>> {
    return this.makeRequest<LemonSqueezyApiResponse<Variant>>('/variants', {
      method: 'POST',
      body: JSON.stringify({ data: variantData }),
    });
  }

  /**
   * Update an existing variant
   */
  async updateVariant(
    variantId: string,
    updates: Partial<CreateVariantRequest['attributes']>
  ): Promise<LemonSqueezyApiResponse<Variant>> {
    return this.makeRequest<LemonSqueezyApiResponse<Variant>>(`/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'variants',
          id: variantId,
          attributes: updates,
        },
      }),
    });
  }

  // Customer Management
  /**
   * Get all customers for a store
   */
  async getCustomers(storeId: string): Promise<LemonSqueezyApiResponse<Customer[]>> {
    return this.makeRequest<LemonSqueezyApiResponse<Customer[]>>(
      `/customers?filter[store_id]=${storeId}`
    );
  }

  /**
   * Get a specific customer by ID
   */
  async getCustomer(customerId: string): Promise<LemonSqueezyApiResponse<Customer>> {
    return this.makeRequest<LemonSqueezyApiResponse<Customer>>(`/customers/${customerId}`);
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: CreateCustomerRequest): Promise<LemonSqueezyApiResponse<Customer>> {
    return this.makeRequest<LemonSqueezyApiResponse<Customer>>('/customers', {
      method: 'POST',
      body: JSON.stringify({ data: customerData }),
    });
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(
    customerId: string,
    updates: Partial<CreateCustomerRequest['attributes']>
  ): Promise<LemonSqueezyApiResponse<Customer>> {
    return this.makeRequest<LemonSqueezyApiResponse<Customer>>(`/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'customers',
          id: customerId,
          attributes: updates,
        },
      }),
    });
  }

  // Subscription Management
  /**
   * Get all subscriptions for a store
   */
  async getSubscriptions(storeId: string): Promise<LemonSqueezyApiResponse<Subscription[]>> {
    return this.makeRequest<LemonSqueezyApiResponse<Subscription[]>>(
      `/subscriptions?filter[store_id]=${storeId}`
    );
  }

  /**
   * Get a specific subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<LemonSqueezyApiResponse<Subscription>> {
    return this.makeRequest<LemonSqueezyApiResponse<Subscription>>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Create a checkout session for a subscription
   */
  async createCheckout(checkoutData: CreateSubscriptionRequest): Promise<LemonSqueezyApiResponse<any>> {
    return this.makeRequest<LemonSqueezyApiResponse<any>>('/checkouts', {
      method: 'POST',
      body: JSON.stringify({ data: checkoutData }),
    });
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: any
  ): Promise<LemonSqueezyApiResponse<Subscription>> {
    return this.makeRequest<LemonSqueezyApiResponse<Subscription>>(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: updates,
        },
      }),
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<LemonSqueezyApiResponse<Subscription>> {
    return this.updateSubscription(subscriptionId, { cancelled: true });
  }

  /**
   * Resume a subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<LemonSqueezyApiResponse<Subscription>> {
    return this.updateSubscription(subscriptionId, { cancelled: false });
  }

  // Order Management
  /**
   * Get all orders for a store
   */
  async getOrders(storeId: string): Promise<LemonSqueezyApiResponse<Order[]>> {
    return this.makeRequest<LemonSqueezyApiResponse<Order[]>>(
      `/orders?filter[store_id]=${storeId}`
    );
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId: string): Promise<LemonSqueezyApiResponse<Order>> {
    return this.makeRequest<LemonSqueezyApiResponse<Order>>(`/orders/${orderId}`);
  }

  // Usage Reporting (for metered billing)
  /**
   * Report usage for a subscription
   * Note: This is a conceptual implementation - actual API may differ
   */
  async reportUsage(subscriptionId: string, usage: UsageRecord): Promise<void> {
    try {
      await this.makeRequest(`/subscriptions/${subscriptionId}/usage`, {
        method: 'POST',
        body: JSON.stringify({
          data: {
            type: 'usage-records',
            attributes: {
              quantity: usage.quantity,
              timestamp: usage.timestamp?.toISOString() || new Date().toISOString(),
              action: usage.action || 'increment',
            },
          },
        }),
      });
    } catch (error) {
      if (error instanceof LemonSqueezyApiError && error.statusCode === 404) {
        // Usage reporting might not be available for this subscription
        console.warn(`Usage reporting not available for subscription ${subscriptionId}`);
        return;
      }
      throw error;
    }
  }

  // Webhook Management
  /**
   * Get all webhooks for a store
   */
  async getWebhooks(storeId: string): Promise<LemonSqueezyApiResponse<any[]>> {
    return this.makeRequest<LemonSqueezyApiResponse<any[]>>(
      `/webhooks?filter[store_id]=${storeId}`
    );
  }

  /**
   * Create a webhook
   */
  async createWebhook(storeId: string, url: string, events: string[]): Promise<LemonSqueezyApiResponse<any>> {
    return this.makeRequest<LemonSqueezyApiResponse<any>>('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'webhooks',
          attributes: {
            url,
            events,
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
          },
        },
      }),
    });
  }

  // Utility Methods
  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getStores();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate API key and store access
   */
  async validateStoreAccess(storeId: string): Promise<boolean> {
    try {
      await this.getStore(storeId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get rate limit information from response headers
   */
  private extractRateLimitInfo(response: Response): {
    limit: number;
    remaining: number;
    resetTime: Date;
  } | null {
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        resetTime: new Date(parseInt(reset, 10) * 1000),
      };
    }

    return null;
  }
}

// Helper functions for common operations
export class LemonSqueezyHelpers {
  /**
   * Create a subscription tier variant from Staryer tier data
   */
  static createVariantFromTier(productId: string, tier: any): CreateVariantRequest {
    return {
      type: 'variants',
      attributes: {
        name: tier.name,
        description: tier.description || `${tier.name} subscription tier`,
        price: tier.price * 100, // Convert to cents
        is_subscription: true,
        interval: tier.billing_cycle || 'month',
        interval_count: 1,
        has_usage_limits: tier.usage_limits?.length > 0,
      },
      relationships: {
        product: {
          data: {
            type: 'products',
            id: productId,
          },
        },
      },
    };
  }

  /**
   * Create a customer from Staryer user data
   */
  static createCustomerFromUser(storeId: string, user: any): CreateCustomerRequest {
    return {
      type: 'customers',
      attributes: {
        name: user.full_name || user.email,
        email: user.email,
        country: user.country || 'US',
        region: user.region || '',
        city: user.city || '',
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: storeId,
          },
        },
      },
    };
  }

  /**
   * Format price for display
   */
  static formatPrice(priceInCents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceInCents / 100);
  }

  /**
   * Parse webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementation would use crypto to verify HMAC signature
    // This is a placeholder for the actual implementation
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}