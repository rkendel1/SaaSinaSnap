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
    console.log('DEBUG: EnhancedAuthService - Authenticated User ID:', authenticatedUser?.id);

    if (!authenticatedUser) {
      console.log('DEBUG: EnhancedAuthService - User not authenticated, no redirect.');
      return {
        shouldRedirect: false,
        userRole: { type: 'unauthenticated' }
      };
    }

    // Check if user is platform owner
    const supabase = await createSupabaseServerClient();
    const { data: platformSettings, error: platformSettingsError } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('owner_id', authenticatedUser.id)
      .single();

    if (platformSettingsError && platformSettingsError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('DEBUG: EnhancedAuthService - Error fetching platform settings:', platformSettingsError);
    }
    console.log('DEBUG: EnhancedAuthService - Platform Settings found:', !!platformSettings);
    if (platformSettings) {
      const redirectPath = platformSettings.platform_owner_onboarding_completed ? '/dashboard' : '/platform-owner-onboarding';
      console.log('DEBUG: EnhancedAuthService - User is Platform Owner. Redirecting to:', redirectPath);
      return {
        shouldRedirect: true,
        redirectPath: redirectPath,
        userRole: {
          type: 'platform_owner',
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          profile: platformSettings,
          onboardingCompleted: platformSettings.platform_owner_onboarding_completed ?? false
        }
      };
    }

    // Check if user is creator
    const creatorProfile = await getCreatorProfile(authenticatedUser.id);
    console.log('DEBUG: EnhancedAuthService - Creator Profile found:', !!creatorProfile);
    if (creatorProfile) {
      const redirectPath = creatorProfile.onboarding_completed ? '/creator/dashboard' : '/creator/onboarding';
      console.log('DEBUG: EnhancedAuthService - User is Creator. Redirecting to:', redirectPath);
      return {
        shouldRedirect: true,
        redirectPath: redirectPath,
        userRole: {
          type: 'creator',
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          profile: creatorProfile,
          onboardingCompleted: creatorProfile.onboarding_completed ?? false
        }
      };
    }

    // Check if user has subscription (regular subscriber)
    const subscription = await getSubscription();
    console.log('DEBUG: EnhancedAuthService - Subscription found:', !!subscription);
    if (subscription) {
      console.log('DEBUG: EnhancedAuthService - User is Subscriber. Redirecting to: /');
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
    console.log('DEBUG: EnhancedAuthService - New user (no specific role/subscription). Redirecting to: /pricing');
    return {
      shouldRedirect: true,
      redirectPath: '/pricing',
      userRole: {
        type: 'subscriber', // Default to subscriber for new users
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