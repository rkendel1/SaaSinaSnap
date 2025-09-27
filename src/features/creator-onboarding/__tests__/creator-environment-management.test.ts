/**
 * Test suite for creator environment management functionality
 */

import {
  getCreatorEnvironmentStatus,
  getProductDeploymentPreview,
  validateProductForCreatorDeployment,
  deployCreatorProductToProduction,
  getCreatorDeploymentSummary,
  getEnvironmentEmbedConfig,
} from '../services/creator-environment-service';

// Mock dependencies
jest.mock('@/libs/supabase/supabase-admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/libs/stripe/stripe-admin', () => ({
  createStripeClient: jest.fn(),
}));

describe('Creator Environment Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment Status', () => {
    test('should get creator environment status', async () => {
      const mockCreatorProfile = {
        stripe_account_id: 'acct_test123',
        stripe_access_token: 'sk_test_123',
        stripe_test_enabled: true,
        stripe_production_enabled: false,
      };

      const mockProducts = [
        { stripe_test_product_id: 'prod_test1', stripe_production_product_id: null },
        { stripe_test_product_id: 'prod_test2', stripe_production_product_id: 'prod_live1' },
      ];

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatorProfile, error: null }),
      };

      // Mock the products query
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'creator_products') {
          return {
            ...mockSupabase,
            single: undefined,
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
            }),
          };
        }
        return mockSupabase;
      });

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const status = await getCreatorEnvironmentStatus('creator-123');

      expect(status).toBeDefined();
      expect(status.currentEnvironment).toBe('test');
      expect(status.testConfigured).toBe(true);
      expect(status.productionConfigured).toBe(false);
      expect(status.productsInTest).toBe(2);
      expect(status.productsInProduction).toBe(1);
    });

    test('should handle creator not found', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      await expect(getCreatorEnvironmentStatus('nonexistent-creator')).rejects.toThrow('Creator not found');
    });
  });

  describe('Product Validation', () => {
    test('should validate product successfully', async () => {
      const mockProduct = {
        name: 'Test Product',
        description: 'A comprehensive test product with detailed description',
        price: 29.99,
        currency: 'usd',
        stripe_test_product_id: 'prod_test123',
      };

      const results = await validateProductForCreatorDeployment(mockProduct);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Check that all validations passed
      const failedChecks = results.filter(r => r.status === 'failed');
      expect(failedChecks).toHaveLength(0);

      // Verify specific checks
      const nameCheck = results.find(r => r.check === 'product_name');
      expect(nameCheck?.status).toBe('passed');

      const priceCheck = results.find(r => r.check === 'product_price');
      expect(priceCheck?.status).toBe('passed');

      const stripeCheck = results.find(r => r.check === 'stripe_test_integration');
      expect(stripeCheck?.status).toBe('passed');
    });

    test('should fail validation for invalid product', async () => {
      const mockProduct = {
        name: '',
        description: 'Short',
        price: 0,
        currency: '',
        stripe_test_product_id: null,
      };

      const results = await validateProductForCreatorDeployment(mockProduct);

      const failedChecks = results.filter(r => r.status === 'failed');
      expect(failedChecks.length).toBeGreaterThan(0);

      // Check specific failures
      const nameCheck = results.find(r => r.check === 'product_name');
      expect(nameCheck?.status).toBe('failed');

      const priceCheck = results.find(r => r.check === 'product_price');
      expect(priceCheck?.status).toBe('failed');

      const stripeCheck = results.find(r => r.check === 'stripe_test_integration');
      expect(stripeCheck?.status).toBe('failed');
    });
  });

  describe('Product Deployment', () => {
    test('should deploy product to production successfully', async () => {
      const mockCreatorProfile = {
        stripe_account_id: 'acct_test123',
        stripe_access_token: 'sk_test_123',
      };

      const mockProduct = {
        id: 'product-123',
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        currency: 'usd',
        product_type: 'subscription',
        stripe_test_product_id: 'prod_test123',
        stripe_test_price_id: 'price_test123',
      };

      const mockDeployment = {
        id: 'deployment-123',
        creator_id: 'creator-123',
        product_id: 'product-123',
        deployment_status: 'deploying',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatorProfile, error: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };

      // Mock different responses for different tables
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'creator_products') {
          return {
            ...mockSupabase,
            single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
          };
        }
        if (table === 'product_environment_deployments') {
          return {
            ...mockSupabase,
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockDeployment, error: null }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return mockSupabase;
      });

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      // Mock Stripe client
      const mockStripeProduct = { id: 'prod_live123' };
      const mockStripePrice = { id: 'price_live123' };

      const mockStripeClient = {
        products: {
          create: jest.fn().mockResolvedValue(mockStripeProduct),
        },
        prices: {
          create: jest.fn().mockResolvedValue(mockStripePrice),
        },
      };

      const { createStripeClient } = require('@/libs/stripe/stripe-admin');
      createStripeClient.mockReturnValue(mockStripeClient);

      const result = await deployCreatorProductToProduction('creator-123', 'product-123');

      expect(result.success).toBe(true);
      expect(result.deploymentId).toBe('deployment-123');
      expect(result.productionProductId).toBe('prod_live123');
      expect(result.productionPriceId).toBe('price_live123');

      // Verify Stripe calls
      expect(mockStripeClient.products.create).toHaveBeenCalledWith({
        name: 'Test Product',
        description: 'Test Description',
        active: true,
        metadata: expect.objectContaining({
          creator_id: 'creator-123',
          source_product_id: 'product-123',
          deployed_from: 'test',
          deployment_id: 'deployment-123',
        }),
      });

      expect(mockStripeClient.prices.create).toHaveBeenCalledWith({
        product: 'prod_live123',
        unit_amount: 2999, // 29.99 * 100
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: expect.objectContaining({
          creator_id: 'creator-123',
          source_price_id: 'price_test123',
          deployment_id: 'deployment-123',
        }),
      });
    });

    test('should handle deployment failures gracefully', async () => {
      const mockCreatorProfile = {
        stripe_account_id: 'acct_test123',
        stripe_access_token: 'sk_test_123',
      };

      const mockProduct = {
        name: '', // Invalid product
        price: 0,
        stripe_test_product_id: null,
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'creator_profiles') {
            return Promise.resolve({ data: mockCreatorProfile, error: null });
          } else {
            return Promise.resolve({ data: mockProduct, error: null });
          }
        }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const result = await deployCreatorProductToProduction('creator-123', 'product-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing Stripe credentials', async () => {
      const mockCreatorProfile = {
        stripe_account_id: null,
        stripe_access_token: null,
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatorProfile, error: null }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const result = await deployCreatorProductToProduction('creator-123', 'product-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Stripe account not connected');
    });

    test('should handle Stripe API errors during deployment', async () => {
      const mockCreatorProfile = {
        stripe_account_id: 'acct_test123',
        stripe_access_token: 'sk_test_123',
      };

      const mockProduct = {
        name: 'Test Product',
        price: 29.99,
        stripe_test_product_id: 'prod_test123',
      };

      const mockDeployment = {
        id: 'deployment-123',
        creator_id: 'creator-123',
        product_id: 'product-123',
        deployment_status: 'deploying',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'creator_profiles') {
            return Promise.resolve({ data: mockCreatorProfile, error: null });
          } else {
            return Promise.resolve({ data: mockProduct, error: null });
          }
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockDeployment, error: null }),
          }),
        }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      // Mock Stripe client to throw an error
      const mockStripeClient = {
        products: {
          create: jest.fn().mockRejectedValue(new Error('Stripe API Error')),
        },
      };

      const { createStripeClient } = require('@/libs/stripe/stripe-admin');
      createStripeClient.mockReturnValue(mockStripeClient);

      const result = await deployCreatorProductToProduction('creator-123', 'product-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Stripe API Error');
    });
  });
});