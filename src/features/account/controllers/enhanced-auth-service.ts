import { unstable_noStore as noStore } from 'next/cache'; // Use unstable_noStore from next/cache
import { redirect } from 'next/navigation';

import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { getAuthenticatedUser } from './get-authenticated-user';
import { getSubscription } from './get-subscription';

/**
 * Super-debug logging utility for role detection
 */
class RoleDetectionLogger {
  private static prefix = '[RoleDetection:SUPER-DEBUG]';
  
  static log(message: string, data?: any) {
    if (data !== undefined) {
      console.log(`${this.prefix} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`${this.prefix} ${message}`);
    }
  }
  
  static error(message: string, error?: any) {
    console.error(`${this.prefix} ERROR: ${message}`, error);
  }
  
  static section(title: string) {
    console.log(`\n${this.prefix} ${'='.repeat(60)}`);
    console.log(`${this.prefix} ${title}`);
    console.log(`${this.prefix} ${'='.repeat(60)}`);
  }
}

/**
 * Role detection result with all source information
 */
interface RoleDetectionResult {
  finalRole: UserRole['type'];
  sources: {
    dbRole: string | null;
    metadataRole: string | null;
    hasPlatformSettings: boolean;
    hasCreatorProfile: boolean;
  };
  checks: {
    dbRoleCheck: boolean;
    metadataRoleCheck: boolean;
    platformSettingsCheck: boolean;
    creatorProfileCheck: boolean;
  };
}

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
   * Perform multi-source role detection with comprehensive logging
   */
  private static async detectUserRole(userId: string): Promise<RoleDetectionResult> {
    RoleDetectionLogger.section(`Multi-Source Role Detection for User: ${userId}`);
    
    const supabase = await createSupabaseServerClient();
    
    // Initialize result
    const result: RoleDetectionResult = {
      finalRole: 'unauthenticated',
      sources: {
        dbRole: null,
        metadataRole: null,
        hasPlatformSettings: false,
        hasCreatorProfile: false,
      },
      checks: {
        dbRoleCheck: false,
        metadataRoleCheck: false,
        platformSettingsCheck: false,
        creatorProfileCheck: false,
      }
    };
    
    // SOURCE 1: Database (public.users table)
    RoleDetectionLogger.log('SOURCE 1: Checking public.users table for role...');
    try {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      result.checks.dbRoleCheck = true;
      
      if (userProfileError && userProfileError.code !== 'PGRST116') {
        RoleDetectionLogger.error('Error fetching role from public.users', userProfileError);
      } else if (userProfile) {
        result.sources.dbRole = userProfile.role;
        RoleDetectionLogger.log('DB Role found:', { role: userProfile.role });
      } else {
        RoleDetectionLogger.log('No DB role found (user not in public.users table)');
      }
    } catch (error) {
      RoleDetectionLogger.error('Exception checking DB role', error);
    }
    
    // SOURCE 2: Metadata (auth.users user_metadata)
    RoleDetectionLogger.log('SOURCE 2: Checking auth.users user_metadata for role...');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      result.checks.metadataRoleCheck = true;
      
      if (authError) {
        RoleDetectionLogger.error('Error fetching user metadata', authError);
      } else if (user?.user_metadata?.role) {
        result.sources.metadataRole = user.user_metadata.role;
        RoleDetectionLogger.log('Metadata role found:', { role: user.user_metadata.role });
      } else {
        RoleDetectionLogger.log('No metadata role found');
      }
    } catch (error) {
      RoleDetectionLogger.error('Exception checking metadata role', error);
    }
    
    // SOURCE 3: Platform Settings (platform_settings table)
    RoleDetectionLogger.log('SOURCE 3: Checking platform_settings table...');
    try {
      const platformSettings = await getPlatformSettings(userId);
      result.checks.platformSettingsCheck = true;
      result.sources.hasPlatformSettings = !!platformSettings;
      
      if (platformSettings) {
        RoleDetectionLogger.log('Platform settings found for user - User is platform_owner', {
          owner_id: platformSettings.owner_id,
          onboarding_completed: platformSettings.platform_owner_onboarding_completed
        });
      } else {
        RoleDetectionLogger.log('No platform settings found for user');
      }
    } catch (error) {
      RoleDetectionLogger.error('Exception checking platform settings', error);
    }
    
    // SOURCE 4: Creator Profile (creator_profiles table)
    RoleDetectionLogger.log('SOURCE 4: Checking creator_profiles table...');
    try {
      const creatorProfile = await getCreatorProfile(userId);
      result.checks.creatorProfileCheck = true;
      result.sources.hasCreatorProfile = !!creatorProfile;
      
      if (creatorProfile) {
        RoleDetectionLogger.log('Creator profile found for user - User is creator', {
          id: creatorProfile.id,
          onboarding_completed: creatorProfile.onboarding_completed
        });
      } else {
        RoleDetectionLogger.log('No creator profile found for user');
      }
    } catch (error) {
      RoleDetectionLogger.error('Exception checking creator profile', error);
    }
    
    // DECISION LOGIC: Determine final role based on all sources
    RoleDetectionLogger.section('Role Decision Logic');
    
    // Priority 1: Platform Settings existence (most definitive)
    if (result.sources.hasPlatformSettings) {
      result.finalRole = 'platform_owner';
      RoleDetectionLogger.log('DECISION: platform_owner (has platform_settings record)');
    }
    // Priority 2: Creator Profile existence
    else if (result.sources.hasCreatorProfile) {
      result.finalRole = 'creator';
      RoleDetectionLogger.log('DECISION: creator (has creator_profile record)');
    }
    // Priority 3: Database role
    else if (result.sources.dbRole === 'platform_owner') {
      result.finalRole = 'platform_owner';
      RoleDetectionLogger.log('DECISION: platform_owner (DB role matches)');
    }
    else if (result.sources.dbRole === 'creator') {
      result.finalRole = 'creator';
      RoleDetectionLogger.log('DECISION: creator (DB role matches)');
    }
    else if (result.sources.dbRole === 'subscriber') {
      result.finalRole = 'subscriber';
      RoleDetectionLogger.log('DECISION: subscriber (DB role matches)');
    }
    // Priority 4: Metadata role (as fallback)
    else if (result.sources.metadataRole === 'platform_owner') {
      result.finalRole = 'platform_owner';
      RoleDetectionLogger.log('DECISION: platform_owner (metadata role matches, DB role not set)');
    }
    else if (result.sources.metadataRole === 'creator') {
      result.finalRole = 'creator';
      RoleDetectionLogger.log('DECISION: creator (metadata role matches, DB role not set)');
    }
    else if (result.sources.metadataRole === 'subscriber') {
      result.finalRole = 'subscriber';
      RoleDetectionLogger.log('DECISION: subscriber (metadata role matches, DB role not set)');
    }
    // Default: unauthenticated (no definitive role found)
    else {
      result.finalRole = 'unauthenticated';
      RoleDetectionLogger.log('DECISION: unauthenticated (no definitive role found in any source)');
    }
    
    // Log consistency check
    RoleDetectionLogger.section('Consistency Check');
    const roleConsistency = {
      dbVsMetadata: result.sources.dbRole === result.sources.metadataRole || 
                     result.sources.dbRole === null || 
                     result.sources.metadataRole === null,
      dbVsPlatformSettings: !result.sources.hasPlatformSettings || result.sources.dbRole === 'platform_owner',
      dbVsCreatorProfile: !result.sources.hasCreatorProfile || result.sources.dbRole === 'creator',
    };
    
    RoleDetectionLogger.log('Role consistency across sources:', roleConsistency);
    
    if (!roleConsistency.dbVsMetadata) {
      RoleDetectionLogger.log('WARNING: DB role and metadata role are inconsistent!', {
        dbRole: result.sources.dbRole,
        metadataRole: result.sources.metadataRole
      });
    }
    
    if (!roleConsistency.dbVsPlatformSettings) {
      RoleDetectionLogger.log('WARNING: Has platform_settings but DB role is not platform_owner!', {
        dbRole: result.sources.dbRole,
        hasPlatformSettings: result.sources.hasPlatformSettings
      });
    }
    
    if (!roleConsistency.dbVsCreatorProfile) {
      RoleDetectionLogger.log('WARNING: Has creator_profile but DB role is not creator!', {
        dbRole: result.sources.dbRole,
        hasCreatorProfile: result.sources.hasCreatorProfile
      });
    }
    
    RoleDetectionLogger.section(`Final Role Determined: ${result.finalRole}`);
    RoleDetectionLogger.log('Detection result summary:', result);
    
    return result;
  }

  /**
   * Determine user role and return redirect information
   */
  static async getUserRoleAndRedirect(): Promise<AuthRedirectResult> {
    noStore(); // Ensure this function always fetches fresh data

    RoleDetectionLogger.section('getUserRoleAndRedirect called');
    
    const authenticatedUser = await getAuthenticatedUser();
    RoleDetectionLogger.log('Authenticated User:', authenticatedUser?.id ? { id: authenticatedUser.id, email: authenticatedUser.email } : 'Not authenticated');

    if (!authenticatedUser) {
      RoleDetectionLogger.log('User not authenticated, returning unauthenticated role');
      return {
        shouldRedirect: false,
        userRole: { type: 'unauthenticated' }
      };
    }

    // Perform multi-source role detection
    const detectionResult = await this.detectUserRole(authenticatedUser.id);
    const userRoleType = detectionResult.finalRole;
    
    RoleDetectionLogger.log('Detected user role type:', userRoleType);

    // Check if user is platform owner
    if (userRoleType === 'platform_owner') {
      try {
        const platformSettings = await getPlatformSettings(authenticatedUser.id);
        const onboardingCompleted = platformSettings?.platform_owner_onboarding_completed ?? false;
        const redirectPath = onboardingCompleted ? '/dashboard' : '/platform-owner-onboarding';
        
        RoleDetectionLogger.log('User is Platform Owner', {
          onboarding_completed: onboardingCompleted,
          redirect_path: redirectPath
        });
        
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
        RoleDetectionLogger.error('Error fetching platform settings', error);
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
        
        RoleDetectionLogger.log('User is Creator', {
          onboarding_completed: onboardingCompleted,
          redirect_path: redirectPath
        });
        
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
        RoleDetectionLogger.error('Error fetching creator profile', error);
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
        RoleDetectionLogger.log('User is Subscriber', { has_subscription: !!subscription });
        
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
        RoleDetectionLogger.error('Error fetching subscription', error);
      }
    }

    // User is authenticated but has no specific role
    RoleDetectionLogger.log('New user (no specific role/subscription), redirecting to pricing');
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
   * Atomically set user role in both DB (public.users) and metadata (auth.users)
   * This ensures consistency across all sources
   */
  static async setUserRoleAtomic(userId: string, role: 'platform_owner' | 'creator' | 'subscriber'): Promise<boolean> {
    RoleDetectionLogger.section(`Atomic Role Setting for User: ${userId}`);
    RoleDetectionLogger.log('Setting role to:', role);
    
    const supabase = await createSupabaseServerClient();
    let dbSuccess = false;
    let metadataSuccess = false;
    
    // Step 1: Update role in public.users table
    RoleDetectionLogger.log('STEP 1: Updating role in public.users table...');
    try {
      const { error: dbError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
      
      if (dbError) {
        RoleDetectionLogger.error('Failed to update role in public.users', dbError);
      } else {
        dbSuccess = true;
        RoleDetectionLogger.log('Successfully updated role in public.users');
      }
    } catch (error) {
      RoleDetectionLogger.error('Exception updating role in public.users', error);
    }
    
    // Step 2: Update role in auth.users user_metadata
    // Note: This requires admin client, so we'll need to call this from server actions
    RoleDetectionLogger.log('STEP 2: Updating role in auth.users user_metadata...');
    try {
      // We need to use the admin client for this
      const { createSupabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
      const supabaseAdmin = await createSupabaseAdminClient();
      
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role },
      });
      
      if (metadataError) {
        RoleDetectionLogger.error('Failed to update role in auth.users metadata', metadataError);
      } else {
        metadataSuccess = true;
        RoleDetectionLogger.log('Successfully updated role in auth.users metadata');
      }
    } catch (error) {
      RoleDetectionLogger.error('Exception updating role in auth.users metadata', error);
    }
    
    const success = dbSuccess && metadataSuccess;
    RoleDetectionLogger.log('Atomic role setting result:', {
      dbSuccess,
      metadataSuccess,
      overallSuccess: success
    });
    
    if (!success) {
      RoleDetectionLogger.log('WARNING: Role was not set atomically in all sources!');
    }
    
    return success;
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