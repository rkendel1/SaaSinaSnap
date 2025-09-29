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

    try {
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
          redirectPath: platformSettings.platform_owner_onboarding_completed ? '/platform/dashboard' : '/platform-owner-onboarding',
          userRole: {
            type: 'platform_owner',
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            profile: platformSettings,
            onboardingCompleted: platformSettings.platform_owner_onboarding_completed ?? false
          }
        };
      }

      // Check if this should be the platform owner (first user scenario)
      const shouldBePlatformOwner = await this.checkIfShouldBePlatformOwner(authenticatedUser.id);
      if (shouldBePlatformOwner) {
        // Auto-create platform owner settings for first user
        const { getOrCreatePlatformSettings } = await import('@/features/platform-owner-onboarding/controllers/platform-settings');
        await getOrCreatePlatformSettings(authenticatedUser.id);
        
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
            onboardingCompleted: creatorProfile.onboarding_completed ?? false
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
            email: authenticatedUser.email,
            profile: subscription
          }
        };
      }

      // New user - automatically make them a creator (not platform owner)
      // Auto-create creator profile for new users
      try {
        const { createCreatorProfile } = await import('@/features/creator-onboarding/controllers/creator-profile');
        await createCreatorProfile({
          id: authenticatedUser.id,
          email: authenticatedUser.email || '',
          first_name: authenticatedUser.user_metadata?.first_name || '',
          last_name: authenticatedUser.user_metadata?.last_name || '',
          onboarding_completed: false
        });
      } catch (creatorProfileError) {
        console.error('Error creating creator profile for new user:', creatorProfileError);
        // Continue anyway - they can still go through onboarding
      }

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
    } catch (error) {
      console.error('Error in getUserRoleAndRedirect:', error);
      // Fallback to creator onboarding on error, but try to create creator profile
      try {
        const { createCreatorProfile } = await import('@/features/creator-onboarding/controllers/creator-profile');
        await createCreatorProfile({
          id: authenticatedUser.id,
          email: authenticatedUser.email || '',
          first_name: authenticatedUser.user_metadata?.first_name || '',
          last_name: authenticatedUser.user_metadata?.last_name || '',
          onboarding_completed: false
        });
      } catch (creatorProfileError) {
        console.error('Error creating creator profile in fallback:', creatorProfileError);
      }
      
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

  /**
   * Check if user should be platform owner (first user on the platform)
   */
  static async checkIfShouldBePlatformOwner(userId: string): Promise<boolean> {
    try {
      const supabase = await createSupabaseServerClient();
      
      // Check if any platform settings exist (meaning a platform owner already exists)
      const { data: existingPlatformSettings, error: settingsError } = await supabase
        .from('platform_settings')
        .select('owner_id')
        .limit(1)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error checking existing platform settings:', settingsError);
        return false;
      }

      // If platform settings exist, there's already a platform owner
      if (existingPlatformSettings) {
        return false;
      }

      // Check if there are any users with platform_owner role
      const { data: existingPlatformOwners, error: ownersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'platform_owner')
        .limit(1)
        .maybeSingle();

      if (ownersError && ownersError.code !== 'PGRST116') {
        console.error('Error checking existing platform owners:', ownersError);
        return false;
      }

      // If there are existing platform owners, this user shouldn't be one
      if (existingPlatformOwners) {
        return false;
      }

      // Check total user count to determine if this is truly the first user
      const { count: userCount, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error counting users:', countError);
        return false;
      }

      // If this is the first or very few users, make them platform owner
      // Allow up to 2 users to account for any timing issues
      return (userCount ?? 0) <= 2;
    } catch (error) {
      console.error('Error in checkIfShouldBePlatformOwner:', error);
      return false;
    }
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