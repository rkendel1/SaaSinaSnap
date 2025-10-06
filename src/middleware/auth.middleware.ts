import { type NextRequest, NextResponse } from 'next/server';

import { getEnvVar } from '@/utils/get-env-var';
import { createServerClient } from '@supabase/ssr';

export interface AuthMiddlewareState {
  user?: {
    id: string;
    email?: string;
  } | null;
  response: NextResponse;
}

/**
 * Updates and validates the authentication session.
 * This is the first middleware in the chain.
 */
export async function handleAuth(
  request: NextRequest,
  state?: AuthMiddlewareState
): Promise<AuthMiddlewareState> {
  console.log('[Auth Debug] handleAuth: Starting authentication check');
  
  // Initialize response using existing one or creating new
  const response = state?.response || NextResponse.next({ request });

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  try {
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log(
      user
        ? `[Auth Debug] handleAuth: User authenticated - ID: ${user.id}`
        : '[Auth Debug] handleAuth: No authenticated user'
    );

    // Return updated state
    return {
      user,
      response,
    };
  } catch (error) {
    console.error('[Auth Debug] handleAuth: Authentication error:', error);
    
    // On error, clear user but maintain response for cookie consistency
    return {
      user: null,
      response,
    };
  }
}