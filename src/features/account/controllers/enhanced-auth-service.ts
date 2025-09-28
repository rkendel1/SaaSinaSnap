import { redirect } from 'next/navigation';

import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
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
 * Enhanced authentication service that determines user role and appropriate redirects
 */
export class EnhancedAuthService {
  /**
   * Determine user role and return redirect information
   */
  static async getUserRoleAndRedirect(): Promise<AuthRedirectResult> {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return {
        shouldRedirect: false,
        userRole: { type: 'unauthenticated' }
      };
    }

    // Check if user is platform owner
    const supabase = await createSupabaseServerClient();
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('owner_id', authenticatedUser.id)
      .single();

    if (platformSettings) {
      return {
        shouldRedirect: true,
        redirectPath: platformSettings.onboarding_completed ? '/dashboard' : '/platform-owner-onboarding', // Redirect to /dashboard
        userRole: {
          type: 'platform_owner',
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          profile: platformSettings,
          onboardingCompleted: platformSettings.onboarding_completed
        }
      };
    }

    // Check if user is creator
    const creatorProfile = await getCreatorProfile(authenticatedUser.id);
    if (creatorProfile) {
      return {
        shouldRedirect: true,
        redirectPath: creatorProfile.onboarding_completed ? '/creator/dashboard' : '/creator/onboarding',
        userRole: {
          type: 'creator',
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          profile: creatorProfile,
          onboardingCompleted: creatorProfile.onboarding_completed
        }
      };
    }

    // Check if user has subscription (regular subscriber)
    const subscription = await getSubscription();
    if (subscription) {
      return {
        shouldRedirect: true,
        redirectPath: '/',
        userRole: {
          type: 'subscriber',
          id: authenticatedUser.id,
          email: authenticatedUser.email
        }
      };
    }

    // New user - redirect to role selection or pricing
    return {
      shouldRedirect: true,
      redirectPath: '/pricing',
      userRole: {
        type: 'subscriber',
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