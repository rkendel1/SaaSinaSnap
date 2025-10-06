import { type NextRequest, NextResponse } from 'next/server';

import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { AuthMiddlewareState } from './auth.middleware';

export type UserRoleType = 'platform_owner' | 'creator' | 'subscriber' | 'unauthenticated';

export interface RoleMiddlewareState extends AuthMiddlewareState {
  role?: {
    type: UserRoleType;
    onboardingCompleted?: boolean;
  };
}

/**
 * Checks user role from database and determines appropriate redirects
 */
export async function handleRole(
  request: NextRequest,
  state: AuthMiddlewareState
): Promise<RoleMiddlewareState> {
  console.log('[Auth Debug] handleRole: Starting role determination');

  // If no authenticated user, return unauthenticated state
  if (!state.user) {
    console.log('[Auth Debug] handleRole: No authenticated user, skipping role check');
    return {
      ...state,
      role: {
        type: 'unauthenticated'
      }
    };
  }

  try {
    // Get role from database using admin client
    const supabaseAdmin = await createSupabaseAdminClient();
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', state.user.id)
      .single();

    if (roleError || !userData) {
      console.error('[Auth Debug] handleRole: Error fetching role:', roleError);
      return {
        ...state,
        role: {
          type: 'unauthenticated'
        }
      };
    }

    const userRole = userData.role as UserRoleType;
    console.log(`[Auth Debug] handleRole: Found role "${userRole}" for user ${state.user.id}`);

    // For platform owners, check onboarding status
    if (userRole === 'platform_owner') {
      try {
        const platformSettings = await getPlatformSettings(state.user.id);
        const onboardingCompleted = platformSettings?.platform_owner_onboarding_completed ?? false;
        
        console.log(`[Auth Debug] handleRole: Platform owner onboarding status: ${onboardingCompleted}`);
        
        return {
          ...state,
          role: {
            type: 'platform_owner',
            onboardingCompleted
          }
        };
      } catch (error) {
        console.error('[Auth Debug] handleRole: Error fetching platform settings:', error);
        // Preserve platform_owner role even if settings fetch fails
        return {
          ...state,
          role: {
            type: 'platform_owner',
            onboardingCompleted: false
          }
        };
      }
    }

    // For other roles, just return the role type
    return {
      ...state,
      role: {
        type: userRole
      }
    };
  } catch (error) {
    console.error('[Auth Debug] handleRole: Unexpected error during role check:', error);
    return {
      ...state,
      role: {
        type: 'unauthenticated'
      }
    };
  }
}