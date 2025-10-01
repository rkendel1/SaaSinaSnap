/**
 * Standard API Wrapper

 */

import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '../supabase/supabase-server-client';

export interface ApiContext {
  user?: any;
  supabase: any;
}

export type ApiHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse>;

/**
 * Wrapper for API routes that require authentication
 */
export function withAuth(handler: ApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Create Supabase client for user authentication
      const supabase = await createSupabaseServerClient();
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Create context object
      const context: ApiContext = {
        user,
        supabase,
      };
      
      return handler(request, context);
      
    } catch (error) {
      console.error('API wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for admin-only API routes
 */
export function withAdmin(handler: ApiHandler) {
  return withAuth(async (request, context) => {
    // Check if user has admin role or is platform owner
    if (context.user?.user_metadata?.role !== 'platform_owner' && 
        context.user?.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(request, context);
  });
}

/**
 * API Response helper functions
 */
export class ApiResponse {
  static success(data: any, status: number = 200): NextResponse {
    return NextResponse.json({ data }, { status });
  }
  
  static error(message: string, status: number = 500): NextResponse {
    return NextResponse.json({ error: message }, { status });
  }
  
  static validation(errors: Record<string, string>): NextResponse {
    return NextResponse.json({ errors }, { status: 400 });
  }
  
  static forbidden(message: string = 'Access forbidden'): NextResponse {
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

/**
 * Helper to get request data
 */
export async function getRequestData(request: NextRequest): Promise<any> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}