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
        console.log('[Auth Debug] getUserRoleFromMetadata: No user or auth error, returning unauthenticated');
        return 'unauthenticated';
      }
      
      const role = user.user_metadata?.role;
      console.log(`[Auth Debug] getUserRoleFromMetadata: User ID ${userId}, metadata role: ${role}`);
      
      // Validate role is one of the expected values
      if (role === 'platform_owner' || role === 'creator' || role === 'subscriber') {
        return role;
      }
      
      console.log('[Auth Debug] getUserRoleFromMetadata: Invalid or no specific role in metadata, returning unauthenticated');
      return 'unauthenticated';
    } catch (error) {
      console.error('[Auth Debug] getUserRoleFromMetadata: Error fetching user metadata:', error);
      return 'unauthenticated';
    }
  }

  /**
   * Determine user role and return redirect information
   */
  static async getUserRoleAndRedirect(): Promise<AuthRedirectResult> {
    noStore(); // Ensure this function always fetches fresh data
    console.log('[Auth Debug] getUserRoleAndRedirect: Starting role determination');

    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      console.log('[Auth Debug] getUserRoleAndRedirect: No authenticated user, returning unauthenticated result');
      return {
        shouldRedirect: false, // No redirect needed from here, caller handles login
        userRole: { type: 'unauthenticated' }
      };
    }

    console.log(`[Auth Debug] getUserRoleAndRedirect: Authenticated user ID: ${authenticatedUser.id}`);
    // Get role from user_metadata only
    const userRoleType = await this.getUserRoleFromMetadata(authenticatedUser.id);
    console.log(`[Auth Debug] getUserRoleAndRedirect: Derived userRoleType from metadata: ${userRoleType}`);

    // Check if user is platform owner
    if (userRoleType === 'platform_owner') {
      try {
        const platformSettings = await getPlatformSettings(authenticatedUser.id);
        const onboardingCompleted = platformSettings?.platform_owner_onboarding_completed ?? false;
        const redirectPath = onboardingCompleted ? '/dashboard' : '/platform-owner-onboarding';
        console.log(`[Auth Debug] getUserRoleAndRedirect: Platform owner detected. Onboarding completed: ${onboardingCompleted}, Redirect path: ${redirectPath}`);
        
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
        console.error('[Auth Debug] getUserRoleAndRedirect: Error fetching platform settings for platform_owner:', error);
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
        console.log(`[Auth Debug] getUserRoleAndRedirect: Creator detected. Onboarding completed: ${onboardingCompleted}, Redirect path: ${redirectPath}`);
        
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
        console.error('[Auth Debug] getUserRoleAndRedirect: Error fetching creator profile for creator:', error);
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
          console.log('[Auth Debug] getUserRoleAndRedirect: Subscriber detected with active subscription, Redirect path: /');
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
        console.error('[Auth Debug] getUserRoleAndRedirect: Error fetching subscription for subscriber:', error);
      }
    }

    // User is authenticated but has no specific role or subscription, redirect to pricing
    console.log('[Auth Debug] getUserRoleAndRedirect: Authenticated user with no specific role/subscription, Redirect path: /pricing');
    return {
      shouldRedirect: true,
      redirectPath: '/pricing',
      userRole: {
        type: 'unauthenticated', // Still unauthenticated from a role perspective
        id: authenticatedUser.id,
        email: authenticatedUser.email
      }
    };
  }

  /**
   * Redirect authenticated user to appropriate dashboard
   */
  static async redirectAuthenticatedUser(): Promise<void> {
    console.log('[Auth Debug] redirectAuthenticatedUser: Checking for redirect...');
    const { shouldRedirect, redirectPath } = await this.getUserRoleAndRedirect();
    
    if (shouldRedirect && redirectPath) {
      console.log(`[Auth Debug] redirectAuthenticatedUser: Redirecting to ${redirectPath}`);
      redirect(redirectPath);
    } else {
      console.log('[Auth Debug] redirectAuthenticatedUser: No redirect needed or user is unauthenticated.');
    }
  }

  /**
   * Get current user role without redirecting
   */
  static async getCurrentUserRole(): Promise<UserRole> {
    console.log('[Auth Debug] getCurrentUserRole: Getting current user role...');
    const { userRole } = await this.getUserRoleAndRedirect();
    console.log(`[Auth Debug] getCurrentUserRole: Current role is ${userRole.type}`);
    return userRole;
  }

  /**
   * Check if user has specific permissions
   */
  static async hasPermission(permission: string): Promise<boolean> {
    const userRole = await this.getCurrentUserRole();
    console.log(`[Auth Debug] hasPermission: Checking permission '${permission}' for role ${userRole.type}`);
    
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
    console.log(`[Auth Debug] requireRole: Requiring role '${requiredRole}'`);
    const userRole = await this.getCurrentUserRole();
    
    if (userRole.type === 'unauthenticated') {
      console.log(`[Auth Debug] requireRole: User unauthenticated, redirecting to ${redirectPath}`);
      redirect(redirectPath);
    }
    
    if (userRole.type !== requiredRole) {
      console.log(`[Auth Debug] requireRole: User role '${userRole.type}' does not match required role '${requiredRole}'`);
      // Redirect to appropriate dashboard instead of error
      const { redirectPath: appropriateRedirect } = await this.getUserRoleAndRedirect();
      if (appropriateRedirect) {
        console.log(`[Auth Debug] requireRole: Redirecting to appropriate dashboard: ${appropriateRedirect}`);
        redirect(appropriateRedirect);
      } else {
        console.log('[Auth Debug] requireRole: No appropriate redirect found, redirecting to /');
        redirect('/');
      }
    }
    
    console.log(`[Auth Debug] requireRole: User has required role '${requiredRole}'`);
    return userRole;
  }

  /**
   * Ensure user is authenticated with proper onboarding
   */
  static async requireAuthenticated(): Promise<UserRole> {
    console.log('[Auth Debug] requireAuthenticated: Ensuring user is authenticated and onboarded...');
    const userRole = await this.getCurrentUserRole();
    
    if (userRole.type === 'unauthenticated') {
      console.log('[Auth Debug] requireAuthenticated: User unauthenticated, redirecting to /login');
      redirect('/login');
    }
    
    // Check onboarding completion
    if (userRole.onboardingCompleted === false) {
      console.log(`[Auth Debug] requireAuthenticated: User authenticated but onboarding not completed for role ${userRole.type}`);
      if (userRole.type === 'creator') {
        console.log('[Auth Debug] requireAuthenticated: Redirecting creator to /creator/onboarding');
        redirect('/creator/onboarding');
      } else if (userRole.type === 'platform_owner') {
        console.log('[Auth Debug] requireAuthenticated: Redirecting platform_owner to /platform-owner-onboarding');
        redirect('/platform-owner-onboarding');
      }
    }
    
    console.log('[Auth Debug] requireAuthenticated: User authenticated and onboarded.');
    return userRole;
  }
}