import { unstable_noStore as noStore } from 'next/cache'; // Use unstable_noStore from next/cache
import { redirect } from 'next/navigation';

import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { getAuthenticatedUser } from './get-authenticated-user';
import { getSubscription } from './get-subscription';

export interface UserRole {
  type: 'platform_owner' | 'creator' | 'subscriber' | 'unauthenticated';
  id?: string;
  email?: string;
  profile?: any;
  onboardingCompleted?: boolean;
}

export interface AuthRedirectResult {
  shouldRedirect: boolean;
  redirectPath?: string;
  userRole: UserRole;
}

/**
 * Enhanced authentication service that determines user role from user_metadata.role only.
 * Role assignment happens via backend/server actions (ensureDbUser, createCreatorProfile, etc.)
 */
export class EnhancedAuthService {
  /**
   * Get the user's role from user_metadata.role only
   */
  private static async getUserRoleFromMetadata(userId: string): Promise<UserRole['type']> {
    const supabase = await createSupabaseServerClient();
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return 'unauthenticated';
      }
      
      const role = user.user_metadata?.role;
      
      // Validate role is one of the expected values
      if (role === 'platform_owner' || role === 'creator' || role === 'subscriber') {
        return role;
      }
      
      return 'unauthenticated';
    } catch (error) {
      console.error('[EnhancedAuthService] Error fetching user metadata:', error);
      return 'unauthenticated';
    }
  }

  /**
   * Determine user role and return redirect information
   */
  static async getUserRoleAndRedirect(): Promise<AuthRedirectResult> {
    noStore(); // Ensure this function always fetches fresh data

    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return {
        shouldRedirect: false,
        userRole: { type: 'unauthenticated' }
      };
    }

    // Get role from user_metadata only
    const userRoleType = await this.getUserRoleFromMetadata(authenticatedUser.id);

    // Check if user is platform owner
    if (userRoleType === 'platform_owner') {
      try {
        const platformSettings = await getPlatformSettings(authenticatedUser.id);
        const onboardingCompleted = platformSettings?.platform_owner_onboarding_completed ?? false;
        const redirectPath = onboardingCompleted ? '/dashboard' : '/platform-owner-onboarding';
        
        return {
          shouldRedirect: true,
          redirectPath: redirectPath,
          userRole: {
            type: 'platform_owner',
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            profile: platformSettings,
            onboardingCompleted: onboardingCompleted
          }
        };
      } catch (error) {
        console.error('[EnhancedAuthService] Error fetching platform settings:', error);
        return {
          shouldRedirect: true,
          redirectPath: '/platform-owner-onboarding',
          userRole: {
            type: 'platform_owner',
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            onboardingCompleted: false
          }
        };
      }
    }

    // Check if user is creator
    if (userRoleType === 'creator') {
      try {
        const creatorProfile = await getCreatorProfile(authenticatedUser.id);
        const onboardingCompleted = creatorProfile?.onboarding_completed ?? false;
        const redirectPath = onboardingCompleted ? '/creator/dashboard' : '/creator/onboarding';
        
        return {
          shouldRedirect: true,
          redirectPath: redirectPath,
          userRole: {
            type: 'creator',
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            profile: creatorProfile,
            onboardingCompleted: onboardingCompleted
          }
        };
      } catch (error) {
        console.error('[EnhancedAuthService] Error fetching creator profile:', error);
        return {
          shouldRedirect: true,
          redirectPath: '/creator/onboarding',
          userRole: {
            type: 'creator',
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            onboardingCompleted: false
          }
        };
      }
    }

    // Check if user has subscription (regular subscriber)
    if (userRoleType === 'subscriber') {
      try {
        const subscription = await getSubscription();
        
        if (subscription) {
          return {
            shouldRedirect: true,
            redirectPath: '/',
            userRole: {
              type: 'subscriber',
              id: authenticatedUser.id,
              email: authenticatedUser.email,
              onboardingCompleted: true
            }
          };
        }
      } catch (error) {
        console.error('[EnhancedAuthService] Error fetching subscription:', error);
      }
    }

    // User is authenticated but has no specific role
    return {
      shouldRedirect: true,
      redirectPath: '/pricing',
      userRole: {
        type: 'unauthenticated',
        id: authenticatedUser.id,
        email: authenticatedUser.email
      }
    };
  }

  /**
   * Redirect authenticated user to appropriate dashboard
   */
  static async redirectAuthenticatedUser(): Promise<void> {
    const { shouldRedirect, redirectPath } = await this.getUserRoleAndRedirect();
    
    if (shouldRedirect && redirectPath) {
      redirect(redirectPath);
    }
  }

  /**
   * Get current user role without redirecting
   */
  static async getCurrentUserRole(): Promise<UserRole> {
    const { userRole } = await this.getUserRoleAndRedirect();
    return userRole;
  }

  /**
   * Check if user has specific permissions
   */
  static async hasPermission(permission: string): Promise<boolean> {
    const userRole = await this.getCurrentUserRole();
    
    switch (userRole.type) {
      case 'platform_owner':
        return true; // Platform owners have all permissions
      case 'creator':
        return ['manage_products', 'manage_embeds', 'view_analytics', 'manage_profile'].includes(permission);
      case 'subscriber':
        return ['view_content', 'manage_account'].includes(permission);
      default:
        return false;
    }
  }

  /**
   * Ensure user has required role, redirect if not
   */
  static async requireRole(requiredRole: UserRole['type'], redirectPath = '/login'): Promise<UserRole> {
    const userRole = await this.getCurrentUserRole();
    
    if (userRole.type === 'unauthenticated') {
      redirect(redirectPath);
    }
    
    if (userRole.type !== requiredRole) {
      // Redirect to appropriate dashboard instead of error
      const { redirectPath: appropriateRedirect } = await this.getUserRoleAndRedirect();
      if (appropriateRedirect) {
        redirect(appropriateRedirect);
      } else {
        redirect('/');
      }
    }
    
    return userRole;
  }

  /**
   * Ensure user is authenticated with proper onboarding
   */
  static async requireAuthenticated(): Promise<UserRole> {
    const userRole = await this.getCurrentUserRole();
    
    if (userRole.type === 'unauthenticated') {
      redirect('/login');
    }
    
    // Check onboarding completion
    if (userRole.onboardingCompleted === false) {
      if (userRole.type === 'creator') {
        redirect('/creator/onboarding');
      } else if (userRole.type === 'platform_owner') {
        redirect('/platform-owner-onboarding');
      }
    }
    
    return userRole;
  }
}