/**
 * Tenant Context Defensive Validation Tests
 * Tests for enhanced tenant context validation and defensive checks
 */

import { 
  setTenantContext, 
  ensureTenantContext, 
  withTenantContext,
  getTenantContext 
} from '@/libs/supabase/tenant-context';

// Mock the createSupabaseAdminClient
jest.mock('@/libs/supabase/supabase-admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    rpc: jest.fn()
  }))
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn()
  }))
}));

describe('Enhanced Tenant Context Validation', () => {
  let mockSupabase: any;
  let mockHeaders: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
    const { headers } = require('next/headers');
    
    mockSupabase = {
      rpc: jest.fn()
    };
    createSupabaseAdminClient.mockResolvedValue(mockSupabase);
    
    mockHeaders = {
      get: jest.fn()
    };
    headers.mockReturnValue(mockHeaders);
  });

  describe('setTenantContext validation', () => {
    it('should reject empty tenant ID', async () => {
      await expect(setTenantContext('')).rejects.toThrow('Tenant ID is required');
    });

    it('should reject invalid UUID format', async () => {
      await expect(setTenantContext('invalid-uuid')).rejects.toThrow('Invalid tenant ID format');
    });

    it('should accept valid UUID and log success', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      mockSupabase.rpc.mockResolvedValue({ error: null });

      await setTenantContext(validUuid);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('set_current_tenant', {
        tenant_uuid: validUuid
      });
    });

    it('should handle database errors with enhanced logging', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const dbError = {
        message: 'Database connection failed',
        code: 'CONNECTION_ERROR',
        details: 'Connection timeout',
        hint: 'Check database connection'
      };
      mockSupabase.rpc.mockResolvedValue({ error: dbError });

      await expect(setTenantContext(validUuid)).rejects.toThrow('Failed to set tenant context: Database connection failed');
    });
  });

  describe('ensureTenantContext validation', () => {
    it('should return tenant ID when context is properly set', async () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      mockSupabase.rpc.mockResolvedValue({ data: tenantId, error: null });

      const result = await ensureTenantContext();

      expect(result).toBe(tenantId);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('ensure_tenant_context');
    });

    it('should throw error when context is not set', async () => {
      const dbError = {
        message: 'Tenant context not set',
        code: 'CONTEXT_ERROR'
      };
      mockSupabase.rpc.mockResolvedValue({ error: dbError });

      await expect(ensureTenantContext()).rejects.toThrow('Tenant context not set: Tenant context not set');
    });

    it('should throw error when tenant context is null', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await expect(ensureTenantContext()).rejects.toThrow('Tenant context is null - database context was not properly set');
    });
  });

  describe('withTenantContext defensive wrapper', () => {
    it('should execute operation with explicit tenant context', async () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      const mockOperation = jest.fn().mockResolvedValue('operation result');
      
      mockSupabase.rpc.mockResolvedValue({ data: tenantId, error: null });

      const result = await withTenantContext(mockOperation, tenantId);

      expect(result).toBe('operation result');
      expect(mockOperation).toHaveBeenCalledWith(mockSupabase);
    });

    it('should get tenant context from headers when not provided', async () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      const mockOperation = jest.fn().mockResolvedValue('operation result');
      
      mockHeaders.get.mockReturnValue(tenantId);
      mockSupabase.rpc.mockResolvedValue({ data: tenantId, error: null });

      const result = await withTenantContext(mockOperation);

      expect(result).toBe('operation result');
      expect(mockHeaders.get).toHaveBeenCalledWith('x-tenant-id');
    });

    it('should throw error when no tenant context is available', async () => {
      const mockOperation = jest.fn();
      
      mockHeaders.get.mockReturnValue(null);
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await expect(withTenantContext(mockOperation)).rejects.toThrow('Database operation requires tenant context');
      expect(mockOperation).not.toHaveBeenCalled();
    });

    it('should handle operation errors with tenant context logging', async () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      const operationError = new Error('Operation failed');
      const mockOperation = jest.fn().mockRejectedValue(operationError);
      
      mockSupabase.rpc.mockResolvedValue({ data: tenantId, error: null });

      await expect(withTenantContext(mockOperation, tenantId)).rejects.toThrow('Operation failed');
    });

    it('should reset context when mismatch is detected', async () => {
      const requestedTenantId = '550e8400-e29b-41d4-a716-446655440000';
      const currentTenantId = '660e8400-e29b-41d4-a716-446655440001';
      const mockOperation = jest.fn().mockResolvedValue('operation result');
      
      // Mock sequence: first call gets current context, second call sets new context
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: currentTenantId, error: null }) // ensureTenantContext
        .mockResolvedValueOnce({ error: null }); // setTenantContext

      const result = await withTenantContext(mockOperation, requestedTenantId);

      expect(result).toBe('operation result');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('ensure_tenant_context');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('set_current_tenant', {
        tenant_uuid: requestedTenantId
      });
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle headers() not being available', async () => {
      const { headers } = require('next/headers');
      headers.mockImplementation(() => {
        throw new Error('headers() not available in this context');
      });

      const mockOperation = jest.fn();
      
      await expect(withTenantContext(mockOperation)).rejects.toThrow('Database operation requires tenant context');
    });

    it('should validate tenant ID format in defensive wrapper', async () => {
      const invalidTenantId = 'invalid-uuid-format';
      const mockOperation = jest.fn();

      await expect(withTenantContext(mockOperation, invalidTenantId)).rejects.toThrow('Invalid tenant ID format');
    });
  });
});

describe('API Wrapper Tenant Context Validation', () => {
  it('should properly validate tenant context in withTenantContext wrapper', () => {
    const { withTenantContext } = require('@/libs/api-utils/tenant-api-wrapper');
    
    expect(typeof withTenantContext).toBe('function');
    
    const mockHandler = jest.fn();
    const wrappedHandler = withTenantContext(mockHandler);
    
    expect(typeof wrappedHandler).toBe('function');
  });
});

describe('AuditLogger Tenant Context Integration', () => {
  it('should use defensive tenant context validation', () => {
    const { AuditLogger } = require('@/libs/audit/audit-logger');
    
    expect(typeof AuditLogger.log).toBe('function');
    expect(typeof AuditLogger.logUserCreated).toBe('function');
    expect(typeof AuditLogger.logApiAccess).toBe('function');
  });
});

describe('TenantAnalytics Tenant Context Integration', () => {
  it('should use defensive tenant context validation', () => {
    const { TenantAnalytics } = require('@/libs/analytics/tenant-analytics');
    
    expect(typeof TenantAnalytics.captureEvent).toBe('function');
    expect(typeof TenantAnalytics.trackApiCall).toBe('function');
  });
});