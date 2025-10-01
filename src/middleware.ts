import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/libs/supabase/supabase-middleware-client';

export async function middleware(request: NextRequest) {
  try {
    // updateSession returns a response object with updated cookies.
    // It's crucial to return this response to the browser to keep the session alive.
    return await updateSession(request);
  } catch (err) {
    // If the session update fails (e.g., Supabase is down),
    // we can still continue with the request, but the user might be logged out.
    console.warn('Supabase session update failed in middleware:', err);

    // Create a new response to continue the request chain
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};