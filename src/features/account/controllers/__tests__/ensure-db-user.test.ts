/**
 * Tests for ensureDbUser utility
 * 
 * These tests verify the atomic upsert logic for ensuring users exist in public.users
 */

import { ensureDbUser } from '../ensure-db-user';

// Mock the Supabase admin client
jest.mock('@/libs/supabase/supabase-admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

describe('ensureDbUser', () => {
  let mockSupabaseAdmin: any;
  let mockFrom: jest.Mock;
  let mockUpsert: jest.Mock;
  let mockAuthAdmin: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock chain for supabase.from().upsert()
    mockUpsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom = jest.fn().mockReturnValue({
      upsert: mockUpsert,
    });

    // Setup mock for auth.admin.updateUserById
    mockAuthAdmin = {
      updateUserById: jest.fn().mockResolvedValue({ error: null }),
    };

    mockSupabaseAdmin = {
      from: mockFrom,
      auth: {
        admin: mockAuthAdmin,
      },
    };

    // Mock the createSupabaseAdminClient function
    const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
    (createSupabaseAdminClient as jest.Mock).mockResolvedValue(mockSupabaseAdmin);
  });

  it('should successfully upsert user with platform_owner role', async () => {
    const userId = 'test-user-123';
    const role = 'platform_owner';

    const result = await ensureDbUser(userId, role);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockUpsert).toHaveBeenCalledWith(
      { id: userId, role },
      { onConflict: 'id', ignoreDuplicates: false }
    );
    expect(mockAuthAdmin.updateUserById).toHaveBeenCalledWith(userId, {
      user_metadata: { role },
    });
  });

  it('should successfully upsert user with creator role', async () => {
    const userId = 'test-creator-456';
    const role = 'creator';

    const result = await ensureDbUser(userId, role);

    expect(result.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      { id: userId, role },
      { onConflict: 'id', ignoreDuplicates: false }
    );
  });

  it('should successfully upsert user with subscriber role', async () => {
    const userId = 'test-subscriber-789';
    const role = 'subscriber';

    const result = await ensureDbUser(userId, role);

    expect(result.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      { id: userId, role },
      { onConflict: 'id', ignoreDuplicates: false }
    );
  });

  it('should return error when DB upsert fails', async () => {
    const userId = 'test-user-error';
    const role = 'platform_owner';
    const mockError = { message: 'Database error', code: 'DB_ERROR' };

    mockUpsert.mockResolvedValue({ error: mockError });

    const result = await ensureDbUser(userId, role);

    expect(result.success).toBe(false);
    expect(result.error).toEqual(mockError);
  });

  it('should still succeed when metadata update fails (non-fatal)', async () => {
    const userId = 'test-user-metadata-fail';
    const role = 'creator';
    const mockMetadataError = { message: 'Metadata update failed' };

    mockAuthAdmin.updateUserById.mockResolvedValue({ error: mockMetadataError });

    const result = await ensureDbUser(userId, role);

    // Should still succeed because DB update worked
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should handle exceptions gracefully', async () => {
    const userId = 'test-user-exception';
    const role = 'platform_owner';
    const mockException = new Error('Unexpected error');

    mockUpsert.mockRejectedValue(mockException);

    const result = await ensureDbUser(userId, role);

    expect(result.success).toBe(false);
    expect(result.error).toEqual(mockException);
  });

  it('should handle missing admin client gracefully', async () => {
    const userId = 'test-user-no-client';
    const role = 'creator';

    const { createSupabaseAdminClient } = require('@/libs/supabase/supabase-admin');
    (createSupabaseAdminClient as jest.Mock).mockRejectedValue(new Error('Client unavailable'));

    const result = await ensureDbUser(userId, role);

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
