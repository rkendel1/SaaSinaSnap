import { type NextRequest, NextResponse } from 'next/server';

import { handleAuth } from './middleware/auth.middleware';
import { handleRedirect } from './middleware/redirect.middleware';
import { handleRole } from './middleware/role.middleware';

export async function middleware(request: NextRequest) {
  try {
    console.log(`[Auth Debug] middleware: Processing ${request.method} ${request.nextUrl.pathname}`);

    // Step 1: Handle authentication and session
    const authState = await handleAuth(request);
    
    // Step 2: Check and validate user role
    const roleState = await handleRole(request, authState);
    
    // Step 3: Handle redirects based on auth and role state
    const response = await handleRedirect(request, roleState);
    
    return response;
  } catch (error) {
    console.error('[Auth Debug] middleware: Unexpected error:', error);
    
    // On error, redirect to login while maintaining a valid response object
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    
    // Copy over any cookies from the error state to maintain session
    const currentResponse = NextResponse.next({ request });
    const cookies = currentResponse.cookies.getAll();
    cookies.forEach(cookie => {
      // Set each cookie with its specific properties
      response.cookies.set(cookie.name, cookie.value, {
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure
      });
    });
    
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Protected routes that need authentication/authorization:
     * - Dashboard routes
     * - Creator routes
     * - Platform owner routes
     * - Account management routes
     */
    '/dashboard/:path*',
    '/creator/:path*',
    '/platform-owner-onboarding/:path*',
    '/account/:path*',
  ],
};