/**
 * Test suite for enhanced Stripe go-live functionality
 */

import { validateProductForDeployment, deployProductToProduction, scheduleProductDeployment } from '../services/stripe-environment-service';
import type { ValidationResult, ProductEnvironmentDeployment } from '../types';

// Mock dependencies
jest.mock('@/libs/supabase/supabase-admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    products: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    prices: {
      create: jest.fn(),
    },
  })),
}));

describe('Enhanced Stripe Go-Live Functionality', () => {
  describe('Product Validation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should validate product successfully', async () => {
      // Mock successful product data
      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
        price: 29.99,
        currency: 'usd',
        stripe_test_product_id: 'prod_test123',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const results = await validateProductForDeployment('tenant-id', 'product-id');

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      
      // Check for required validations
      const nameValidation = results.find(r => r.check === 'product_name');
      expect(nameValidation).toBeDefined();
      expect(nameValidation?.status).toBe('passed');

      const priceValidation = results.find(r => r.check === 'product_price');
      expect(priceValidation).toBeDefined();
      expect(priceValidation?.status).toBe('passed');
    });

    test('should fail validation for invalid product', async () => {
      // Mock invalid product data
      const mockProduct = {
        id: 'test-product-id',
        name: '', // Empty name should fail
        price: 0, // Zero price should fail
        currency: 'usd',
        stripe_test_product_id: null, // Missing Stripe ID should fail
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const results = await validateProductForDeployment('tenant-id', 'product-id');

      const failedResults = results.filter(r => r.status === 'failed');
      expect(failedResults.length).toBeGreaterThan(0);

      // Check specific failed validations
      const nameValidation = results.find(r => r.check === 'product_name');
      expect(nameValidation?.status).toBe('failed');

      const priceValidation = results.find(r => r.check === 'product_price');
      expect(priceValidation?.status).toBe('failed');

      const stripeValidation = results.find(r => r.check === 'stripe_integration');
      expect(stripeValidation?.status).toBe('failed');
    });

    test('should handle validation errors gracefully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Product not found' } 
        }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const results = await validateProductForDeployment('tenant-id', 'product-id');

      expect(results).toBeDefined();
      const errorResult = results.find(r => r.check === 'product_exists');
      expect(errorResult?.status).toBe('failed');
      expect(errorResult?.message).toContain('Product not found');
    });
  });

  describe('Scheduled Deployment', () => {
    test('should schedule deployment successfully', async () => {
      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
        price: 29.99,
        currency: 'usd',
        stripe_test_product_id: 'prod_test123',
      };

      const mockDeployment = {
        id: 'deployment-123',
        tenant_id: 'tenant-id',
        product_id: 'product-id',
        deployment_status: 'scheduled',
        scheduled_for: '2024-12-25T09:00:00Z',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
        insert: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({ data: mockDeployment, error: null }),
      };

      // Mock the insert chain
      mockSupabase.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockDeployment, error: null }),
        }),
      });

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const result = await scheduleProductDeployment(
        'tenant-id',
        'product-id',
        '2024-12-25T09:00:00Z',
        'America/New_York',
        'user-id',
        {
          email_notifications: true,
          reminder_before_minutes: 30,
        }
      );

      expect(result).toBeDefined();
      expect(result.deployment_status).toBe('scheduled');
      expect(result.scheduled_for).toBe('2024-12-25T09:00:00Z');
    });

    test('should prevent scheduling with validation errors', async () => {
      const mockProduct = {
        id: 'test-product-id',
        name: '', // Invalid name
        price: 29.99,
        currency: 'usd',
        stripe_test_product_id: 'prod_test123',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      await expect(
        scheduleProductDeployment(
          'tenant-id',
          'product-id',
          '2024-12-25T09:00:00Z',
          'America/New_York',
          'user-id'
        )
      ).rejects.toThrow('Product validation failed');
    });
  });

  describe('Deployment Process', () => {
    test('should deploy product successfully', async () => {
      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        currency: 'usd',
        stripe_test_product_id: 'prod_test123',
        stripe_test_price_id: 'price_test123',
      };

      const mockDeployment = {
        id: 'deployment-123',
        tenant_id: 'tenant-id',
        product_id: 'product-id',
        deployment_status: 'pending',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };

      // Mock the insert chain for deployment creation
      mockSupabase.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockDeployment, error: null }),
        }),
      });

      // Mock the update chain
      mockSupabase.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      // Mock Stripe clients
      const mockStripeProduct = { id: 'prod_live123' };
      const mockStripePrice = { id: 'price_live123' };

      const mockStripe = {
        products: {
          create: jest.fn().mockResolvedValue(mockStripeProduct),
        },
        prices: {
          create: jest.fn().mockResolvedValue(mockStripePrice),
        },
      };

      // Override the createStripeClient function
      const originalModule = jest.requireActual('../services/stripe-environment-service');
      jest.doMock('../services/stripe-environment-service', () => ({
        ...originalModule,
        createStripeClient: jest.fn().mockResolvedValue(mockStripe),
      }));

      const result = await deployProductToProduction('tenant-id', 'product-id', 'user-id');

      expect(result).toBeDefined();
      expect(result.deployment_status).toBe('completed');
      expect(mockStripe.products.create).toHaveBeenCalledWith({
        name: 'Test Product',
        description: 'Test Description',
        active: true,
        metadata: expect.objectContaining({
          tenant_id: 'tenant-id',
          source_product_id: 'product-id',
          deployed_from: 'test',
        }),
      });
    });

    test('should handle deployment failures gracefully', async () => {
      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
        price: 29.99,
        currency: 'usd',
        stripe_test_product_id: 'prod_test123',
      };

      const mockDeployment = {
        id: 'deployment-123',
        tenant_id: 'tenant-id',
        product_id: 'product-id',
        deployment_status: 'pending',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockDeployment, error: null }),
        }),
      });

      mockSupabase.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      // Mock Stripe failure
      const mockStripe = {
        products: {
          create: jest.fn().mockRejectedValue(new Error('Stripe API Error')),
        },
      };

      const originalModule = jest.requireActual('../services/stripe-environment-service');
      jest.doMock('../services/stripe-environment-service', () => ({
        ...originalModule,
        createStripeClient: jest.fn().mockResolvedValue(mockStripe),
      }));

      await expect(
        deployProductToProduction('tenant-id', 'product-id', 'user-id')
      ).rejects.toThrow('Failed to deploy product to production');

      // Verify error was logged in deployment record
      expect(mockSupabase.update).toHaveBeenCalledWith({
        deployment_status: 'failed',
        error_message: expect.stringContaining('Stripe API Error'),
        progress_percentage: 0,
        progress_message: expect.stringContaining('Deployment failed'),
        updated_at: expect.any(String),
      });
    });
  });

  describe('Progress Tracking', () => {
    test('should track deployment progress correctly', async () => {
      // This would test the updateDeploymentProgress function
      // Implementation depends on actual database schema
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing product gracefully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const results = await validateProductForDeployment('tenant-id', 'nonexistent-product');
      
      const errorResult = results.find(r => r.check === 'product_exists');
      expect(errorResult?.status).toBe('failed');
    });

    test('should handle concurrent deployments', async () => {
      // Test concurrent deployment prevention
      const mockActiveDeployments = [
        { id: 'active-deployment', deployment_status: 'deploying' }
      ];

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockActiveDeployments, error: null }),
        single: jest.fn().mockResolvedValue({ 
          data: { name: 'Test', price: 29.99, stripe_test_product_id: 'prod_test' }, 
          error: null 
        }),
      };

      const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
      createSupabaseAdminClient.mockResolvedValue(mockSupabase);

      const results = await validateProductForDeployment('tenant-id', 'product-id');
      
      const concurrentResult = results.find(r => r.check === 'concurrent_deployment');
      expect(concurrentResult?.status).toBe('warning');
    });
  });
});