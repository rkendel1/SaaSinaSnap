'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';
import { getEnvVar } from '@/utils/get-env-var';
import { getURL } from '@/utils/get-url';
import { createServerClient } from '@supabase/ssr';

export async function signInWithOAuth(provider: 'github' | 'google'): Promise<ActionResponse> {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return redirect(data.url);
}

export async function signInWithEmail(email: string): Promise<ActionResponse> {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return { data: null };
}

export async function signInWithEmailAndPassword(email: string, password: string): Promise<ActionResponse> {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  // On successful login, redirect to the appropriate dashboard
  // Pass the user from the fresh session to avoid race conditions
  const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect(
    data.user ? { id: data.user.id, email: data.user.email } : undefined
  );
  return redirect(redirectPath || '/');
}

export async function signUpWithEmailAndPassword(email: string, password: string): Promise<ActionResponse> {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  // After successful signup, the user is automatically logged in by Supabase.
  // We can now redirect them to the appropriate onboarding flow or dashboard.
  // Pass the user from the fresh session to avoid race conditions
  const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect(
    data.user ? { id: data.user.id, email: data.user.email } : undefined
  );
  return redirect(redirectPath || '/');
}

export async function checkEmailExists(email: string): Promise<ActionResponse<{ exists: boolean; hasPassword: boolean }>> {
  try {
    const { createSupabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    const supabaseAdmin = await createSupabaseAdminClient();
    
    // Check if user exists in the users table by looking up their auth user
    // First, we need to check auth.users since that's where emails are stored
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!authUser) {
      return { 
        data: { 
          exists: false,
          hasPassword: false 
        } 
      };
    }
    
    // Check if user exists in our users table
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
      console.error('Error checking email:', error);
      return { error: 'Failed to check email. Please try again.' };
    }

    const userExists = !!user;
    
    // For now, assume if user exists they might have a password
    // We can't easily check this without admin auth API
    // So we'll show both options (password and magic link) for existing users
    const hasPassword = userExists;

    return { 
      data: { 
        exists: userExists,
        hasPassword 
      } 
    };
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    return { error: 'Failed to check email. Please try again.' };
  }
}

export async function signOut(): Promise<ActionResponse> {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return { data: null };
}