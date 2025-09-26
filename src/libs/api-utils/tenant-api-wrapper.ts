/**
 * Tenant-Aware API Wrapper
 * Automatically handles tenant context for API routes
 */

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../supabase/supabase-admin';
import { createSupabaseServerClient } from '../supabase/supabase-server-client';
import { setTenantContext } from '../supabase/tenant-context';
import { AuditLogger } from '../audit/audit-logger';
import { TenantAnalytics } from '../analytics/tenant-analytics';

export interface TenantApiContext {
  tenantId: string;
  tenantName: string;
  user?: any;
  supabase: any;
}

export type TenantApiHandler = (
  request: NextRequest,
  context: TenantApiContext
) => Promise<NextResponse>;

/**
 * Wrapper for API routes that require tenant context
 */
export function withTenantContext(handler: TenantApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract tenant ID from headers (set by middleware)
      const tenantId = headers().get('x-tenant-id');
      const tenantName = headers().get('x-tenant-name') || 'Unknown';
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant context not found' },
          { status: 400 }
        );
      }
      
      // Set tenant context for the admin client
      const supabaseAdmin = await createSupabaseAdminClient(tenantId);
      
      // Create Supabase client for user authentication (can be server client)
      const supabase = await createSupabaseServerClient();
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
      }
      
      // Create context object
      const context: TenantApiContext = {
        tenantId,
        tenantName,
        user: user || undefined,
        supabase: supabaseAdmin // Pass the tenant-aware admin client
      };
      
      // Log API access for audit
      try {
        await AuditLogger.logApiAccess(
          request.url,
          request.method,
          user?.id,
          undefined,
          {
            tenant_id: tenantId,
            user_agent: request.headers.get('user-agent'),
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          }
        );
      } catch (auditError) {
        console.error('Failed to log API access:', auditError);
        // Don't fail the request due to audit logging issues
      }
      
      // Track analytics
      try {
        const distinctId = user?.id || request.headers.get('x-forwarded-for') || 'anonymous';
        await TenantAnalytics.trackApiCall(
          distinctId,
          new URL(request.url).pathname,
          request.method,
          undefined,
          undefined,
          user?.id
        );
      } catch (analyticsError) {
        console.error('Failed to track analytics:', analyticsError);
        // Don't fail the request due to analytics issues
      }
      
      // Execute the handler
      const startTime = Date.now();
      const response = await handler(request, context);
      const responseTime = Date.now() - startTime;
      
      // Update analytics with response time and status
      try {
        const distinctId = user?.id || request.headers.get('x-forwarded-for') || 'anonymous';
        await TenantAnalytics.trackApiCall(
          distinctId,
          new URL(request.url).pathname,
          request.method,
          responseTime,
          response.status,
          user?.id
        );
      } catch (analyticsError) {
        console.error('Failed to update analytics:', analyticsError);
      }
      
      return response;
      
    } catch (error) {
      console.error('Tenant API wrapper error:', error);
      
      // Track error
      try {
        const distinctId = headers().get('x-forwarded-for') || 'anonymous';
        await TenantAnalytics.trackError(
          distinctId,
          'api_error',
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error.stack : undefined
        );
      } catch (analyticsError) {
        console.error('Failed to track error:', analyticsError);
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for API routes that require authentication
 */
export function withTenantAuth(handler: TenantApiHandler) {
  return withTenantContext(async (request, context) => {
    if (!context.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(request, context);
  });
}

/**
 * Wrapper for admin-only API routes
 */
export function withTenantAdmin(handler: TenantApiHandler) {
  return withTenantAuth(async (request, context) => {
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
 * Helper to extract request data safely
 */
export async function getRequestData(request: NextRequest): Promise<any> {
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      return Object.fromEntries(url.searchParams.entries());
    }
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await request.json();
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      return Object.fromEntries(formData.entries());
    }
    
    return {};
  } catch (error) {
    console.error('Failed to parse request data:', error);
    return {};
  }
}

/**
 * Helper to create standardized API responses
 */
export class ApiResponse {
  static success(data: any, status: number = 200) {
    return NextResponse.json({ success: true, data }, { status });
  }
  
  static error(message: string, status: number = 400, details?: any) {
    return NextResponse.json({ 
      success: false, 
      error: message,
      ...(details && { details })
    }, { status });
  }
  
  static validation(errors: Record<string, string | string[] | undefined>) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      validation_errors: errors
    }, { status: 422 });
  }
  
  static unauthorized(message: string = 'Authentication required') {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 401 });
  }
  
  static forbidden(message: string = 'Access denied') {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 403 });
  }
  
  static notFound(message: string = 'Resource not found') {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 404 });
  }
}