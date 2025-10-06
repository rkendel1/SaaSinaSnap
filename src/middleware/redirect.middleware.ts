import { type NextRequest, NextResponse } from 'next/server';

import type { RoleMiddlewareState } from './role.middleware';

interface RouteConfig {
  path: string;
  allowedRoles: string[];
  redirectTo?: string;
}

// Define protected routes and their requirements
const PROTECTED_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    allowedRoles: ['platform_owner'],
    redirectTo: '/login'
  },
  {
    path: '/creator/dashboard',
    allowedRoles: ['creator'],
    redirectTo: '/login'
  },
  {
    path: '/platform-owner-onboarding',
    allowedRoles: ['platform_owner'],
    redirectTo: '/login'
  },
  {
    path: '/creator/onboarding',
    allowedRoles: ['creator'],
    redirectTo: '/login'
  },
  {
    path: '/dashboard/embed-preview',
    allowedRoles: ['platform_owner'],
    redirectTo: '/login'
  },
  {
    path: '/creator/embed-preview',
    allowedRoles: ['creator'],
    redirectTo: '/login'
  }
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/api/health',
  '/_next',
  '/static',
  '/favicon.ico'
];

/**
 * Handles role-based routing and redirects
 */
export async function handleRedirect(
  request: NextRequest,
  state: RoleMiddlewareState
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  console.log(`[Auth Debug] handleRedirect: Checking route "${pathname}"`);

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    console.log('[Auth Debug] handleRedirect: Public route, allowing access');
    return state.response;
  }

  // Check if current path is protected
  const protectedRoute = PROTECTED_ROUTES.find(route => pathname.startsWith(route.path));
  
  if (protectedRoute) {
    console.log(`[Auth Debug] handleRedirect: Protected route "${pathname}" found`);
    
    // If no role or unauthenticated, redirect to login
    if (!state.role || state.role.type === 'unauthenticated') {
      console.log('[Auth Debug] handleRedirect: No role or unauthenticated, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has permission for this route
    if (!protectedRoute.allowedRoles.includes(state.role.type)) {
      console.log(`[Auth Debug] handleRedirect: User role "${state.role.type}" not allowed for this route`);
      
      // Redirect based on role
      if (state.role.type === 'platform_owner') {
        const redirectUrl = state.role.onboardingCompleted ? '/dashboard' : '/platform-owner-onboarding';
        console.log(`[Auth Debug] handleRedirect: Redirecting platform owner to ${redirectUrl}`);
        const url = new URL(redirectUrl, request.url);
        return NextResponse.redirect(url);
      }
      
      if (state.role.type === 'creator') {
        const redirectUrl = state.role.onboardingCompleted ? '/creator/dashboard' : '/creator/onboarding';
        console.log(`[Auth Debug] handleRedirect: Redirecting creator to ${redirectUrl}`);
        const url = new URL(redirectUrl, request.url);
        return NextResponse.redirect(url);
      }

      // Default redirect for other roles
      console.log('[Auth Debug] handleRedirect: Redirecting to home');
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // For non-protected routes with authenticated users, handle role-specific redirects
  if (state.role?.type === 'platform_owner' && !state.role.onboardingCompleted && !pathname.startsWith('/platform-owner-onboarding')) {
    console.log('[Auth Debug] handleRedirect: Redirecting incomplete platform owner to onboarding');
    const url = new URL('/platform-owner-onboarding', request.url);
    return NextResponse.redirect(url);
  }

  if (state.role?.type === 'creator' && !state.role.onboardingCompleted && !pathname.startsWith('/creator/onboarding')) {
    console.log('[Auth Debug] handleRedirect: Redirecting incomplete creator to onboarding');
    const url = new URL('/creator/onboarding', request.url);
    return NextResponse.redirect(url);
  }

  // Allow access to the route
  console.log('[Auth Debug] handleRedirect: Allowing access to route');
  return state.response;
}