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
 * Enhanced authentication service that determines user role and appropriate redirects
 * This function is designed to be "rock solid" by always querying the database for the definitive role.
 */
export class EnhancedAuthService {
  /**
   * Determine user role and return redirect information
   */
  static async getUserRoleAndRedirect(): Promise<AuthRedirectResult> {
    noStore(); // Ensure this function always fetches fresh data

    const authenticatedUser = await getAuthenticatedUser();
    console.log('[EnhancedAuthService] Authenticated User ID:', authenticatedUser?.id);

    if (!authenticatedUser) {
      console.log('[EnhancedAuthService] User not authenticated, no redirect.');
      return {
        shouldRedirect: false,
        userRole: { type: 'unauthenticated' }
      };
    }

    // ALWAYS fetch the user's role directly from the 'users' table in the database.
    // This is the most reliable source of truth, bypassing any potential JWT staleness.
    const supabase = await createSupabaseServerClient();
    const { data: userProfile, error: userProfileError } = await supabase
      .from('users')
      .select('role') // Only select the role for efficiency
      .eq('id', authenticatedUser.id)
      .single();

    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.error('[EnhancedAuthService] Error fetching user profile role from DB:', userProfileError);
      // On error, we can't determine role reliably, so treat as unauthenticated
      return {
        shouldRedirect: true,
        redirectPath: '/login',
        userRole: { type: 'unauthenticated' }
      };
    }

    // Determine role type - default to unauthenticated if no role is set
    const userRoleType: UserRole['type'] = userProfile?.role || 'unauthenticated';
    console.log('[EnhancedAuthService] Fetched User Role Type from DB:', userRoleType);

    // Check if user is platform owner
    if (userRoleType === 'platform_owner') {
      try {
        const platformSettings = await getPlatformSettings(authenticatedUser.id); // Fetch settings for this specific owner
        console.log('[EnhancedAuthService] Platform Settings found:', !!platformSettings);
        
        const onboardingCompleted = platformSettings?.platform_owner_onboarding_completed ?? false;
        const redirectPath = onboardingCompleted ? '/dashboard' : '/platform-owner-onboarding';
        
        console.log('[EnhancedAuthService] User is Platform Owner. Onboarding completed:', onboardingCompleted, 'Redirecting to:', redirectPath);
        
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
        // If we can't fetch settings but user has platform_owner role, redirect to onboarding
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
        console.log('[EnhancedAuthService] Creator Profile found:', !!creatorProfile);
        
        const onboardingCompleted = creatorProfile?.onboarding_completed ?? false;
        const redirectPath = onboardingCompleted ? '/creator/dashboard' : '/creator/onboarding';
        
        console.log('[EnhancedAuthService] User is Creator. Onboarding completed:', onboardingCompleted, 'Redirecting to:', redirectPath);
        
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
        // If we can't fetch profile but user has creator role, redirect to onboarding
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
        console.log('[EnhancedAuthService] Subscription found:', !!subscription);
        
        if (subscription) {
          console.log('[EnhancedAuthService] User is Subscriber. Redirecting to: /');
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

    // User is authenticated but has no specific role or role is 'unauthenticated'
    // This means they're a new user - redirect to role selection or pricing
    console.log('[EnhancedAuthService] New user (no specific role/subscription). Redirecting to: /pricing');
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